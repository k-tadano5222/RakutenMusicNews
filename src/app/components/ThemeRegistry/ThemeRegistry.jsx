// app/components/ThemeRegistry/ThemeRegistry.jsx
// クライアントコンポーネントとしてマークします
"use client";

import * as React from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
// Emotion のキャッシュプロバイダーをインポート
// 同じディレクトリに EmotionCache.jsx を作成するので、相対パスで指定
import NextAppDirEmotionCacheProvider from "./EmotionCache";

// 作成したMUIテーマをインポート
// あなたのテーマファイルはルート直下ではないので、パスを調整します。
// あなたの構造だと `app/theme.js` になるはずです。
import theme from "../../theme";

// ThemeRegistry コンポーネント
// children を受け取り、MUI の ThemeProvider と EmotionCacheProvider でラップします。
export default function ThemeRegistry({ children }) {
  return (
    <NextAppDirEmotionCacheProvider options={{ key: "mui" }}>
      <ThemeProvider theme={theme}>
        {/* CssBaseline は、MUI が提供する CSS リセットです。
            ブラウザのデフォルトスタイルを統一し、MUI コンポーネントが意図した通りに表示されるようにします。
            テーマで設定したフォントも、これによってbody要素などに適用されます。
        */}
        <CssBaseline />
        {children}
      </ThemeProvider>
    </NextAppDirEmotionCacheProvider>
  );
}
