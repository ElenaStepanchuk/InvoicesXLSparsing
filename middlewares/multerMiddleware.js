import multer from "multer";
import path from "path";

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

const tempDir = path.join("./", __dirname, "../", "temp");

const multerConfig = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: multerConfig,
});

export default upload;
