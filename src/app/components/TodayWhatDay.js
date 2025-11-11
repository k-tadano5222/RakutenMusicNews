// src/app/components/TodayWhatDay.js

"use client"; // クライアントサイドのコンポーネントであることを宣言

//css
import "../globals.css";
//コンポーネントパーツ
import TitleImage from "./parts/TitleImage.js";

import { useState, useEffect } from "react"; // ReactのuseStateとuseEffectフックをインポート
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
/* MUI ICON */
import ArticleIcon from "@mui/icons-material/Article";
/* Mui */

import Image from "next/image";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress"; // ローディング表示用に追加
import { Container, Divider, Paper } from "@mui/material";

const TodayWhatDay = ({ accessToken }) => {
  // 状態変数: 記事タイプ、APIデータ、ローディング状態、エラーメッセージ、展開されたアイテムID、今日の日付
  const [selectedArticleType, setSelectedArticleType] = useState(3); // 選択された記事タイプを保持する状態変数（初期値は3）
  const [apiData, setApiData] = useState(null); // APIから取得したデータを保持する状態変数
  const [loading, setLoading] = useState(false); // ローディング状態をtrueに設定
  const [error, setError] = useState(null); // エラーメッセージを保持する状態変数
  // const [expandedItemId, setExpandedItemId] = useState(null); // 展開されたアイテムIDを保持する状態変数 (未使用のためコメントアウト)
  const [todayFormatted, setTodayFormatted] = useState(""); // 今日の日付を "{month}月{day}日" 形式で保持する状態変数
  // const [formattedToday, setFormattedToday] = useState(""); // 重複のためコメントアウト

  useEffect(() => {
    // コンポーネントのマウント時に今日の日付を設定
    const today = new Date();
    const formatted = today.toLocaleDateString("ja-JP", {
      month: "numeric",
      day: "numeric",
    }); // "{month}月{day}日" 形式にフォーマット
    setTodayFormatted(formatted);
  }, []); // 空の依存配列を渡すことで、コンポーネントのマウント時にのみ実行されるようにします。

  useEffect(() => {
    // accessToken が存在する場合のみ API リクエストを実行
    if (accessToken) {
      fetchData(); // データ取得関数を呼び出す
    } else {
      // accessToken がない場合はローディングを終了し、エラーは表示しない（親で認証を待つため）
      setLoading(false);
    }
  }, [accessToken, selectedArticleType]); // accessToken, selectedArticleType が変更された時に実行

  // APIからデータを取得する非同期関数
  const fetchData = async () => {
    setLoading(true); // ローディング状態をtrueに設定
    setError(null); // エラーメッセージをnullに設定

    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0"); // 月を2桁で取得
    const day = String(today.getDate()).padStart(2, "0"); // 日を2桁で取得
    const formattedToday = `${month}${day}`;
    const apiUrl = `/api/today-what-day?day=${formattedToday}&article_type=${selectedArticleType}`; // APIのURLを生成

    try {
      const response = await fetch(apiUrl, {
        // APIリクエストを送信
        headers: {
          Authorization: `Bearer ${accessToken}`, // Authorizationヘッダーにトークンを設定
        },
      });

      if (!response.ok) {
        // レスポンスがエラーの場合
        const errorData = await response.json(); // エラーレスポンスをJSONとして解析
        console.error("APIエラー (HTTPステータス):", response.status, errorData); // エラーログを出力
        // エラーメッセージをセットし、データはnullまたは空にする
        setError(`「今日は何の日」の取得に失敗しました: ${errorData.message || "詳細不明"}`);
        setApiData(null); // データをクリア
      } else {
        const data = await response.json(); // レスポンスをJSONとして解析
        console.log("APIレスポンス:", data); // APIレスポンスをログに出力

        // レスポンスデータの構造をチェック（以前のAPIルートにもあったチェック）
        if (!data.api_name || !data.returned_count || !Array.isArray(data.data)) {
          setError("「今日は何の日」: 不正なレスポンスデータ形式です。");
          setApiData(null);
        } else {
          setApiData(data); // APIデータを状態変数に設定
        }
      }
    } catch (e) {
      // 例外が発生した場合 (ネットワークエラーなど)
      console.error("APIリクエストエラー:", e); // エラーログを出力
      setError(`「今日は何の日」のデータ取得中に予期せぬエラーが発生しました: ${e.message}`); // エラーメッセージを設定
      setApiData(null); // データをクリア
    } finally {
      // 処理の最後にローディング状態をfalseに設定
      setLoading(false);
    }
  };

  // Article Type選択プルダウンのonChangeイベントハンドラ (UIがないため現状は未使用)
  // const handleArticleTypeChange = (e) => {
  //   setSelectedArticleType(parseInt(e.target.value)); // 選択されたArticle Typeを状態変数に設定
  // };

  return (
    // JSX: UIを記述
    <div>
      {/* グラデーションの帯 */}
      <div
        style={{
          width: "100%", // 親要素の幅を100%に
          height: `10px`, // 親要素の高さを固定
          position: "relative", // layout="fill" (または fill={true}) には必須
          overflow: "hidden", // 画像が親要素からはみ出るのを防ぐ
          // border: '1px solid green', // 動作確認用の枠線
        }}
      >
        <Image
          src="/images/gradation-bar.png" // publicフォルダ内の画像パス
          alt="高さ固定、幅100%の画像"
          layout="fill" // 親要素いっぱいに広がる
          // fill={true}             // Next.js 13以降はこちら
          // widthとheightは指定しない（親要素のサイズを使うため）

          // 画像が親要素の領域にどのように収まるかを制御
          // objectFit="cover"   // 親要素を覆うように拡大・縮小し、はみ出しは切り取る (推奨)
          // objectFit="contain" // 親要素内に収まるように拡大・縮小し、余白ができる
          // objectFit="fill"    // 親要素のサイズに合わせて画像を歪ませて表示
          style={{ objectFit: "fill" }} // fill={true} の場合は style オブジェクト内で指定
          priority={true}
        />
      </div>
      <Container maxWidth={false}>
        <Box
          sx={{
            height: "auto", // 必要に応じて調整 (これはビューポートの高さ)
            width: "100%", // 必要に応じて調整
            color: "#000000",
            marginTop: "12px",
            padding: "0px,12px",
          }}
        >
          {/* タイトル部分 */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{
              padding: "0px,12px",
              gap: "12px",
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              sx={{
                paddingLeft: "12px!important",
              }}
            >
              <TitleImage />
              <Stack direction="column" spacing={2} sx={{}}>
                <Typography noWrap sx={{ fontSize: "12px" }}>
                  What day is it today?
                </Typography>
                <hr style={{ marginTop: "0px" }} />
                <Typography noWrap sx={{ marginTop: "0!important", fontSize: "24px", fontWeight: "900" }}>
                  今日は何の日
                </Typography>
              </Stack>
            </Stack>
            <Box sx={{ p: 2 }}>
              <Stack
                spacing={2} // Stackのアイテム間のスペース
                direction="column" // アイテムの配置方向
                sx={{
                  // 背景画像の設定
                  backgroundImage: "url(/images/bg_today.png)", // 画像のパスを指定
                  backgroundSize: "contain", // 背景画像を要素全体に広げる
                  backgroundPosition: "center", // 画像を中央に配置
                  backgroundRepeat: "no-repeat", // 画像を繰り返さない

                  // Stack自体のサイズ設定 (これがないと画像が見えない場合があります)
                  width: "100px",
                  height: 65, // 高さを指定しないと、中身の高さにしかならない
                  // minHeight: 300, // 最小高さを設定することも可能

                  // テキストなど中身のスタイル調整 (必要に応じて)
                  color: "black", // 背景画像の上に表示されるテキストの色

                  display: "flex", // Stackはデフォルトでflexですが、明示的に
                  justifyContent: "center", // 垂直方向中央寄せ
                  alignItems: "center", // 水平方向中央寄せ
                  textAlign: "center",
                }}
              >
                <Typography noWrap sx={{ fontSize: "16px", textAlign: "center", fontWeight: "900" }}>
                  今日は
                </Typography>
                <Typography noWrap sx={{ color: "#bf0000", marginTop: "0!important", fontSize: "24px", fontWeight: "900", textAlign: "center", lineHeight: "100%" }}>
                  {todayFormatted}
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Box>

        {/* 説明文 */}
        <Typography py={1} sx={{ fontSize: "14px", textAlign: "center" }}>
          今日の日付からアーティストにまつわる出来事をピックアップ
        </Typography>

        {/* ローディング状態の表示 */}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100px" }}>
            <CircularProgress />
          </Box>
        )}

        {/* エラーメッセージを警告として表示 */}
        {error && (
          <Box sx={{ p: 1, mb: 2, backgroundColor: "#fff3e0", borderLeft: "4px solid #ff9800", color: "#ff9800" }}>
            <Typography variant="body2">{error}</Typography>
          </Box>
        )}
        <Paper
          variant="outlined"
          sx={{
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          {/* APIデータが存在し、かつデータアイテムがある場合、結果を表示 */}
          {apiData && apiData.data && apiData.data.length > 0 ? (
            <div>
              <Box
                sx={{
                  backgroundColor: "#f8f8f8", // 背景色をlightblueに設定
                  padding: "12px",
                }}
              >
                <Stack spacing={1}>
                  {/* APIデータから取得した各アイテムをアコーディオンリストとして表示 */}
                  {apiData.data.map((item) => (
                    <div key={item.what_day_id} style={{ gap: "4px" }}>
                      {/* タイトルをクリックするとアコーディオンが開閉 */}

                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={`panel-${item.what_day_id}-content`} id={`panel-${item.what_day_id}-header`}>
                          <Typography component="span" style={{ fontWeight: "700" }}>
                            {item.title}
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Divider />
                          <br />
                          <Typography>アーティスト: {item.artist}</Typography>

                          <Typography>記事ノート: {item.article_note}</Typography>
                          {/*  
                          <Typography>記事タイプ: {item.article_type}</Typography>
                          */}
                        </AccordionDetails>
                      </Accordion>
                    </div>
                  ))}
                </Stack>
              </Box>
            </div>
          ) : (
            // データが見つからなかった場合、またはエラーでデータがクリアされた場合
            !loading && <Typography sx={{ p: 2, textAlign: "center", color: "text.secondary" }}>{error ? "データの読み込み中にエラーが発生しました。" : "表示できるデータが見つかりませんでした。"}</Typography>
          )}
        </Paper>
      </Container>
    </div>
  );
};

export default TodayWhatDay;
