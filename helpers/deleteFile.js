import fs from "fs";
import path from "path";

export const deleteFile = (tempDir) => {
  fs.readdir(tempDir, (err, files) => {
    if (err) {
      console.error("Error reading folder:", err);
      return;
    }
    files.forEach((file) => {
      if (file !== ".gitkeep") {
        const filePath = path.join(tempDir, file);
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`File deletion error ${filePath}:`, err);
          }
        });
      }
    });
  });
};
