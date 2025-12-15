// app/api/interview-column/route.js
// このファイルはNext.jsのAPIルートであり、サーバーサイドで実行されます。
// クライアントからのリクエストに応じて、インタビューやコラム記事のデータを返します。

// Next.js のサーバーサイドAPIルートのレスポンスを扱うためのモジュール
import { NextResponse } from "next/server";
// HTTPリクエストを行うためのライブラリ (推し楽APIへのリクエストに使用)
import axios from "axios";
// HTMLをパースして要素を抽出するためのライブラリ (静的記事のスクレイピングに使用)
import * as cheerio from "cheerio";
// ファイルパスを扱うためのNode.js組み込みモジュール
import path from "path";
// ファイルシステム操作のためのNode.js組み込みモジュール (promisified版)
import { promises as fs } from "fs";
// 並列処理数を制限するためのライブラリ
import pLimit from "p-limit";

// --- 設定値 ---
const OSHIRAKU_API_ENDPOINT = "https://rdc-api-catalog-gateway-api.rakuten.co.jp/oshiraku/search/v1/article";
const STATIC_NEWS_CONFIG_PATH = path.join(process.cwd(), "config", "staticNewsUrls.json");
const OSHIRAKU_API_KEY = process.env.OSHIRAKU_API_KEY;

const OSHIRAKU_MAX_PAGE_SIZE = 100;
const OSHIRAKU_FETCH_LIMIT = 300; // 例: 最大300件の記事を取得

const SCRAPING_CONCURRENCY_LIMIT = 5; // 例: 同時に5つまでリクエストを送信

// ★MV特集を判別するためのカテゴリキーワード (Metaタグのcontent属性の値と一致させる)★
// <meta name="category" content="ミュージックビデオ特集"> の content の値
const MV_CATEGORY_TARGET_VALUE = "ミュージックビデオ特集";

const ALLOWED_ORIGIN = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";

// --- キャッシュ関連の変数 ---
const cachedArticlesByUA = new Map();
const CACHE_LIFETIME = 60 * 60 * 1000;

// --- ヘルパー関数 ---

function isMobileUserAgent(userAgent) {
  if (!userAgent) return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Mobi/i.test(userAgent);
}

/**
 * 静的記事のURLからHTMLをフェッチし、解析して記事データを抽出する非同期関数。
 * @param {string} pageUrl - スクレイピング対象の静的記事のURL。
 * @returns {Promise<object|null>} 抽出された記事データオブジェクト、またはエラー時にnull。
 */
async function fetchAndParseStaticNews(pageUrl) {
  let htmlContent = "";
  console.log(`[fetchAndParseStaticNews] Attempting to fetch: ${pageUrl}`);

  try {
    const response = await fetch(pageUrl);
    if (!response.ok) {
      console.warn(`[fetchAndParseStaticNews] Failed to fetch static news ${pageUrl}: HTTP Status ${response.status}`);
      return null;
    }
    htmlContent = await response.text();
    console.log(`[fetchAndParseStaticNews] Successfully fetched HTML for ${pageUrl}, content length: ${htmlContent.length}`);
  } catch (fetchError) {
    console.error(`[fetchAndParseStaticNews] Error fetching static news ${pageUrl}:`, fetchError.message);
    return null;
  }

  const $ = cheerio.load(htmlContent);

  const urlParts = pageUrl.split("/");
  const lastPart = urlParts[urlParts.length - 1];
  const id = lastPart.includes(".") ? lastPart.split(".")[0] : lastPart;

  const title = $("title").text() || $("h1").first().text() || `No Title (${id})`;
  const description = $("p").first().text().substring(0, 100) + "..." || "No description available.";

  let publishDateStr = $('meta[name="date"]').attr("content") || $("time[datetime]").attr("datetime") || null;
  let publishDate = null;
  if (publishDateStr) {
    try {
      publishDate = new Date(publishDateStr);
      if (isNaN(publishDate.getTime())) {
        publishDate = null;
        console.warn(`[fetchAndParseStaticNews] Parsed date is Invalid Date for ${pageUrl}.`);
      }
    } catch (e) {
      console.warn(`[fetchAndParseStaticNews] Could not parse publishDate '${publishDateStr}' for ${pageUrl}:`, e);
      publishDate = null;
    }
  }
  if (!publishDate) {
    console.warn(`[fetchAndParseStaticNews] No valid publish date found for ${pageUrl}. Using default (epoch time).`);
  }

  // --- MV特集判定ロジック (Metaタグ content="ミュージックビデオ特集" で判別) ---
  let isMvFeature = false;
  // <meta name="category" content="ミュージックビデオ特集"> の content 属性を読み取る
  const categoryMetaContent = $('meta[name="category"]').attr("content");

  console.log(`[fetchAndParseStaticNews] <meta name="category"> content for ${pageUrl}: '${categoryMetaContent}'`);

  // 読み取った content 属性が MV_CATEGORY_TARGET_VALUE と完全に一致するかをチェック
  if (categoryMetaContent === MV_CATEGORY_TARGET_VALUE) {
    isMvFeature = true;
    console.log(`[fetchAndParseStaticNews] Identified as MV Feature based on <meta name="category"> for ${pageUrl}.`);
  }
  console.log(`[fetchAndParseStaticNews] Final isMvFeature for ${pageUrl}: ${isMvFeature}`);

  let thumbnailUrl = null;

  // --- サムネイル取得ロジック (OGP優先、フォールバックあり) ---
  const ogImage = $('meta[property="og:image"]').attr("content");
  if (ogImage) {
    try {
      thumbnailUrl = new URL(ogImage, pageUrl).href;
    } catch (ogUrlResolveError) {
      console.warn(`[fetchAndParseStaticNews] Could not resolve OGP image URL ${ogImage} for ${pageUrl}:`, ogUrlResolveError.message);
    }
  }

  if (!thumbnailUrl) {
    const imgTag = $("figure.biography__image img").first();
    if (imgTag.length > 0) {
      const src = imgTag.attr("src");
      if (src) {
        try {
          let effectiveSrc = src;
          if (src.startsWith("//")) {
            effectiveSrc = `https:${src}`;
          }
          thumbnailUrl = new URL(effectiveSrc, pageUrl).href;
        } catch (urlResolveError) {
          console.warn(`[fetchAndParseStaticNews] Could not resolve specific image URL ${src} for ${pageUrl}:`, urlResolveError.message);
        }
      }
    }
  }

  if (!thumbnailUrl) {
    const firstImg = $("img").first();
    if (firstImg.length > 0) {
      const src = firstImg.attr("src");
      if (src) {
        try {
          let effectiveSrc = src;
          if (src.startsWith("//")) {
            effectiveSrc = `https:${src}`;
          }
          thumbnailUrl = new URL(effectiveSrc, pageUrl).href;
        } catch (firstImgResolveError) {
          console.warn(`[fetchAndParseStaticNews] Could not resolve first img tag URL ${src} for ${pageUrl}:`, firstImgResolveError.message);
        }
      }
    }
  }

  if (!thumbnailUrl) {
    console.warn(`[fetchAndParseStaticNews] No thumbnail found for ${pageUrl}.`);
  }

  const sortDate = publishDate || new Date(0);
  const displayDate = publishDate ? publishDate.toLocaleDateString("ja-JP", { year: "numeric", month: "numeric", day: "numeric" }) : "日付不明";

  return {
    id: id,
    type: "static",
    title: title,
    description: description,
    url: pageUrl,
    thumbnailImage: thumbnailUrl ? { url: thumbnailUrl } : null,
    sortDate: sortDate,
    displayDate: displayDate,
    isMvFeature: isMvFeature, // ★MV特集フラグを追加★
  };
}

/**
 * GET リクエストハンドラ。
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);

  if (isNaN(page) || page < 1 || isNaN(pageSize) || pageSize < 1) {
    return NextResponse.json({ error: "Invalid page or pageSize parameters." }, { status: 400 });
  }

  let allCombinedArticles = [];
  let oshirakuFetchError = null;
  let staticFetchError = null;

  const now = Date.now();
  const userAgent = request.headers.get("user-agent");
  const userAgentCategory = isMobileUserAgent(userAgent) ? "mobile" : "pc";

  const cachedData = cachedArticlesByUA.get(userAgentCategory);

  if (cachedData && now - cachedData.timestamp < CACHE_LIFETIME) {
    console.log(`[interview-column API] Using cached data for ${userAgentCategory}. Cache timestamp: ${new Date(cachedData.timestamp).toLocaleString()}.`);
    allCombinedArticles = cachedData.articles;
  } else {
    console.log(`[interview-column API] Cache expired or not found for ${userAgentCategory}. Fetching new data...`);

    // 1. 推し楽記事の取得
    try {
      let currentOshirakuPage = 1;
      let hasMoreOshiraku = true;
      let tempOshirakuArticles = [];
      let totalFetchedOshiraku = 0;

      while (hasMoreOshiraku && totalFetchedOshiraku < OSHIRAKU_FETCH_LIMIT) {
        const currentFetchSize = Math.min(OSHIRAKU_MAX_PAGE_SIZE, OSHIRAKU_FETCH_LIMIT - totalFetchedOshiraku);

        if (currentFetchSize <= 0) {
          hasMoreOshiraku = false;
          break;
        }

        const oshirakuRes = await axios.get(OSHIRAKU_API_ENDPOINT, {
          headers: {
            apikey: OSHIRAKU_API_KEY,
          },
          params: {
            oshTagId: 1,
            page: currentOshirakuPage,
            pageSize: currentFetchSize,
            sortType: "opendate",
            label: "report,interview,exclusive,public_relations",
          },
        });

        const fetchedArticles = (oshirakuRes.data.articles || []).map((article) => ({
          ...article,
          id: article.articleId,
          type: "oshiraku",
          thumbnailImage: article.thumbnailImage || null,
          sortDate: article.openDate ? new Date(article.openDate) : new Date(0),
          displayDate: article.openDate ? new Date(article.openDate).toLocaleDateString("ja-JP", { year: "numeric", month: "numeric", day: "numeric" }) : "日付不明",
          isMvFeature: false, // 推し楽記事にはMV特集フラグをデフォルトでfalseにする
        }));

        tempOshirakuArticles = tempOshirakuArticles.concat(fetchedArticles);
        totalFetchedOshiraku += fetchedArticles.length;

        if (fetchedArticles.length < currentFetchSize || totalFetchedOshiraku >= OSHIRAKU_FETCH_LIMIT) {
          hasMoreOshiraku = false;
        } else {
          currentOshirakuPage++;
        }
      }
      allCombinedArticles = allCombinedArticles.concat(tempOshirakuArticles.slice(0, OSHIRAKU_FETCH_LIMIT));
      console.log(`[interview-column API] Fetched ${allCombinedArticles.filter((a) => a.type === "oshiraku").length} Oshiraku articles (up to limit).`);
    } catch (err) {
      console.error("Failed to fetch Oshiraku articles:", err.message);
      oshirakuFetchError = "推し楽ニュースの取得に失敗しました。";
    }

    // 2. 静的記事の取得
    let EXTERNAL_STATIC_PAGE_URLS = [];

    try {
      const fileContent = await fs.readFile(STATIC_NEWS_CONFIG_PATH, "utf8");
      const staticUrlsConfig = JSON.parse(fileContent);

      console.log(`[interview-column API] Request User-Agent: '${userAgent}', Is Mobile: ${isMobileUserAgent(userAgent)}`);

      if (userAgentCategory === "mobile") {
        EXTERNAL_STATIC_PAGE_URLS = staticUrlsConfig.mobileUrls || [];
        console.log(`[interview-column API] Using mobileUrls: ${EXTERNAL_STATIC_PAGE_URLS.length} URLs.`);
      } else {
        EXTERNAL_STATIC_PAGE_URLS = staticUrlsConfig.pcUrls || [];
        console.log(`[interview-column API] Using pcUrls: ${EXTERNAL_STATIC_PAGE_URLS.length} URLs.`);
      }
    } catch (readError) {
      console.error(`Failed to read or parse static news config file ${STATIC_NEWS_CONFIG_PATH}:`, readError);
      staticFetchError = "静的ニュース設定の読み込みに失敗しました。";
    }

    if (EXTERNAL_STATIC_PAGE_URLS.length > 0) {
      try {
        const limit = pLimit(SCRAPING_CONCURRENCY_LIMIT);
        const staticArticles = await Promise.all(EXTERNAL_STATIC_PAGE_URLS.map((url) => limit(() => fetchAndParseStaticNews(url))));
        allCombinedArticles = allCombinedArticles.concat(staticArticles.filter((item) => item !== null));
        console.log(`[interview-column API] Fetched ${staticArticles.filter((a) => a !== null).length} static articles.`);
      } catch (err) {
        console.error("Failed to fetch and parse static articles:", err.message);
        staticFetchError = "静的ニュース記事の取得に失敗しました。";
      }
    }

    // 3. データの結合、ソート
    allCombinedArticles.sort((a, b) => {
      const dateA = a.sortDate instanceof Date && !isNaN(a.sortDate) ? a.sortDate.getTime() : 0;
      const dateB = b.sortDate instanceof Date && !isNaN(b.sortDate) ? b.sortDate.getTime() : 0;
      return dateB - dateA;
    });
    console.log(`[interview-column API] Total articles after sort: ${allCombinedArticles.length}`);

    // キャッシュに保存
    cachedArticlesByUA.set(userAgentCategory, { articles: allCombinedArticles, timestamp: now });
    console.log(`[interview-column API] Cached data for ${userAgentCategory}.`);
  }

  // 4. ページング処理
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedArticles = allCombinedArticles.slice(startIndex, endIndex);

  // 5. 総件数
  const totalCount = allCombinedArticles.length;

  // 6. エラーメッセージの結合
  const combinedErrorMessage = [oshirakuFetchError, staticFetchError].filter(Boolean).join(" ");

  return new NextResponse(
    JSON.stringify({
      articles: paginatedArticles,
      total_count: totalCount,
      error: combinedErrorMessage || null,
    }),
    {
      status: combinedErrorMessage ? 500 : 200,
      headers: {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}

/**
 * OPTIONS リクエストハンドラ (CORSプリフライトリクエスト対応)。
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
