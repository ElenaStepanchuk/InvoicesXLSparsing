import express from "express";
import path from "path";

const router = express.Router();

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);
const indexDir = path.join("./", __dirname, "../../", "public");

router.get("/", async (req, res) => {
  res.sendFile("index.html", {
    root: indexDir,
  });
});

export default router;
