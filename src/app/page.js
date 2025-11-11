// app/page.js
"use client";

import "./globals.css";

import { useState, useEffect } from "react";

// react-scroll の Element はセクションの区切りとして残す
import { Element } from "react-scroll";

// 作成したHeaderコンポーネントをインポート
import Header from "./components/Header";
import TodayWhatDay from "./components/TodayWhatDay";
import ReadMusicNews from "./components/MusicNews";
import OshirakuNewsList from "./components/OshirakuNewsList";
import Typography from "@mui/material/Typography";
/* Mui */
// Headerコンポーネントに移動したMUIコンポーネントのインポートは不要になる
// import Box from "@mui/material/Box";
// import Typography from "@mui/material/Typography";

import { Container } from "@mui/material";

export default function Home() {
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false); // ローディング状態追加

  useEffect(() => {
    authenticate();
  }, []);

  /* 認証してトークン取得 */
  const authenticate = async () => {
    setLoading(true);
    setError(null); // 新しい認証試行の前にエラーをリセット
    setToken(null); // 新しい認証試行の前にトークンをリセット

    try {
      const response = await fetch("/api/auth");
      if (!response.ok) {
        const errorData = await response.json();
        setError(`認証に失敗しました (HTTP ${response.status}): ${errorData.message || "詳細不明"}`);
        setToken(null);
      } else {
        const data = await response.json();
        if (data.token && data.expires_at) {
          setToken(data.token);
          setError(null);
        } else {
          setError("認証に失敗しました: 不正なレスポンスデータ (トークンまたは有効期限がありません)");
          setToken(null);
        }
      }
    } catch (e) {
      setError(`認証中に予期せぬエラーが発生しました: ${e.message}`);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  // トークンをマスク表示する関数（例：最初6文字 + … + 最後4文字）
  const maskedToken = token ? `${token.slice(0, 6)}...${token.slice(-4)}` : "";

  // クリップボードにコピー
  const copyToken = () => {
    if (token) {
      navigator.clipboard
        .writeText(token)
        .then(() => {
          alert("トークンをコピーしました！");
        })
        .catch((err) => {
          console.error("トークンコピー失敗:", err);
          alert("トークンのコピーに失敗しました。");
        });
    } else {
      alert("コピーするトークンがありません。");
    }
  };

  return (
    <main>
      {/* 認証エラーメッセージの表示 */}
      {error && (
        <div
          style={{
            backgroundColor: "#ffe6e6",
            color: "#cc0000",
            padding: "12px",
            marginBottom: "20px",
            borderRadius: "6px",
            boxShadow: "0 0 5px rgba(204,0,0,0.3)",
          }}
        >
          <strong>認証エラー:</strong> {error}
          <button
            onClick={() => setError(null)}
            style={{
              marginLeft: "12px",
              background: "none",
              border: "none",
              color: "#cc0000",
              fontWeight: "bold",
              cursor: "pointer",
            }}
            aria-label="エラーを閉じる"
          >
            ×
          </button>
        </div>
      )}

      {/* 認証ローディング表示 */}
      {loading && (
        <div
          style={{
            textAlign: "center",
            fontSize: "18px",
            marginBottom: "24px",
          }}
          role="status"
          aria-live="polite"
        >
          認証中… <span className="spinner" />
          <style>
            {`
              .spinner {
                display: inline-block;
                width: 16px;
                height: 16px;
                border: 3px solid rgba(0,0,0,0.2);
                border-top-color: #333;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                vertical-align: middle;
                margin-left: 8px;
              }
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      )}

      {/* トークンがある場合（認証成功）またはローディングが終了している場合（認証失敗でもUI表示） */}
      {!loading && ( // ローディング中はコンテンツを表示しない
        <div>
          <Container maxWidth={false} disableGutters sx={{ backgroundColor: "#f8f8f8" }}>
            {/* Headerコンポーネントを配置 */}
            <Header />

            {/* 各コンポーネントを Element で囲む */}
            {/* accessToken を渡すことで、子コンポーネントが認証状態を判断できるようにする */}
            <Element name="todayWhatDaySection" style={{ width: "100%" }} sx={{ backgroundColor: "#f8f8f8" }}>
              <TodayWhatDay accessToken={token} />
            </Element>

            <Element name="musicNewsSection" style={{ width: "100%" }}>
              <ReadMusicNews accessToken={token} name="todayWhatDay" />
            </Element>

            {/* OshirakuNewsList は認証不要なので常に表示 */}
            <Element name="interviewSection" style={{ width: "100%" }}>
              <OshirakuNewsList />
            </Element>
            <Element name="interviewSection" style={{ padding: "24px" }}>
              <Typography noWrap sx={{ fontSize: "16px", textAlign: "center" }}>
                © Rakuten Group, Inc.
              </Typography>
            </Element>
          </Container>
        </div>
      )}
    </main>
  );
}
