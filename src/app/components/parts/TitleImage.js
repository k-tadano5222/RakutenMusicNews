import * as React from "react";
import Box from "@mui/material/Box";

function TitleImage() {
  return (
    <Box>
      <img
        src="images/gradation-title.png" // 画像のパス
        alt="タイトル画像"
        style={{ width: "9px", height: "auto" }} // スタイリング
      />
    </Box>
  );
}

export default TitleImage;
