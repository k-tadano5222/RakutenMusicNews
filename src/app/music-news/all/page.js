// app/music-news/all/page.js
"use client";
import Header from "../../components/Header";
import React, { useState, useEffect } from "react";
import MusicNewsList from "../MusicNewsList";
import { useRouter } from "next/navigation";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Container, Pagination } from "@mui/material";
import Image from "next/image";

const PAGE_SIZE = 10; // 1ページあたりのニュース数
const LAST_PAGE_KEY = "lastMusicNewsPage"; // localStorage のキー

const AllMusicNewsPage = () => {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1); // 現在のページ番号

  useEffect(() => {
    // localStorage からページ番号を読み込む
    const lastPage = localStorage.getItem(LAST_PAGE_KEY);
    if (lastPage) {
      setCurrentPage(parseInt(lastPage, 10));
    }
  }, []);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    localStorage.setItem(LAST_PAGE_KEY, value.toString()); // ページ変更時に localStorage に保存
  };

  return (
    <div>
      <Header />
      <Container
        sx={{
          position: "relative",
          top: 0,
          left: 0,
          width: "100%",
          borderTop: 1,
          borderColor: "grey.400",
          zIndex: 1000,
          justifyContent: "flex-start",
          alignItems: "center",
          padding: "2px 12px",
          background: "#ffffff",
        }}
      >
        <Stack direction={"row"} spacing={2}>
          <IconButton color="#666666" aria-label="" onClick={() => router.back()}>
            <ArrowBackIosNewIcon />
          </IconButton>
          <Typography
            sx={{
              display: "block",
              fontSize: "14px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "flex", // flexbox を有効化
              alignItems: "center",
            }}
          >
            音楽ニュース一覧
          </Typography>
        </Stack>
      </Container>
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
          style={{ objectFit: "fill" }} // fill={true} の場合は style オブジェクト内で指定
          priority={true}
        />
      </div>
      <Container
        sx={{
          backgroundColor: "#f8f8f8", // 背景色をlightblueに設定
          padding: "12px",
        }}
      >
        <MusicNewsList offset={(currentPage - 1) * PAGE_SIZE} limit={PAGE_SIZE} />
        <Pagination
          count={10} // 100件 / 20件 = 5ページ
          page={currentPage}
          onChange={handlePageChange}
          sx={{
            display: "flex",
            justifyContent: "center",
            mt: 2,
          }}
        />
        <Stack style={{ padding: "24px" }}>
          <Typography noWrap sx={{ fontSize: "16px", textAlign: "center" }}>
            © Rakuten Group, Inc.
          </Typography>
        </Stack>
      </Container>
    </div>
  );
};

export default AllMusicNewsPage;
