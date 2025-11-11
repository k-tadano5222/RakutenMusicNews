// app/components/Header.js
"use client"; // クライアントコンポーネントであることを指定

import React from "react";
import Box from "@mui/material/Box";

import Image from "next/image";
import Link from "next/link";

export default function Header() {
  const logoStyle = {
    width: "160px",
    height: "auto",
  };
  const logoMusic = {
    width: "70px",
    height: "auto",
  };
  return (
    <Box
      sx={{
        height: "auto", // ヘッダーの高さ
        backgroundColor: "white", // 背景色を設定
        display: "flex",
        alignItems: "center",
        px: "0.8rem",
        py: "0.8rem",
        justifyContent: "space-between",
      }}
    >
      <Link href="/" passHref style={{ textDecoration: "none", color: "inherit" }}>
        <Image src="/images/img_logo.png" style={logoStyle} width={154} height={58} alt="logo" />
      </Link>

      <Image src="/images/img_music.png" style={logoMusic} width={56} height={30} quality={100} alt="logo" />

      {/* 必要に応じてここにナビゲーションリンクなどを追加 */}
    </Box>
  );
}
