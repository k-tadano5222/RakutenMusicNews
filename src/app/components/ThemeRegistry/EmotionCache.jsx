// app/components/ThemeRegistry/EmotionCache.jsx
// クライアントコンポーネントとしてマークします
"use client";

import * as React from "react";
import createCache from "@emotion/cache";
import { CacheProvider as DefaultCacheProvider } from "@emotion/react";

// Emotion のキャッシュインスタンスを作成する関数
// 'key' を設定し、'prepend: true' でスタイルがDOMのheadの最初に追加されるようにします。
function createEmotionCache() {
  return createCache({ key: "mui-style", prepend: true });
}

// EmotionCacheProvider コンポーネント
// options と CacheProvider を受け取ります。
export default function EmotionCacheProvider(props) {
  const { options, CacheProvider = DefaultCacheProvider, children } = props;

  // Emotion キャッシュを一度だけ作成し、再レンダー時に再作成されないようにします。
  const [emotionCache] = React.useState(() => createEmotionCache());

  return <CacheProvider value={emotionCache}>{children}</CacheProvider>;
}
