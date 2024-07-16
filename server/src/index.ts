import express, { Express, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import multer from "multer";
import { buildUmi } from "./utils";
import { Uploader } from "./uploader";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const umi = buildUmi(
  process.env.SOLANA_RPC_URL || "",
  process.env.UPLOADER_WALLET_PRIVATE_KEY || ""
);
const uploader = new Uploader(umi);


// Routes
app.get("/", (req: Request, res: Response) => {
  console.log("GET /");
  res.send("Express + TypeScript Server 2");
});

app.post(
  "/api/upload",
  upload.single("file"),
  async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    let metadata;
    try {
      metadata = JSON.parse(req.body.metadata);
    } catch (error) {
      return res.status(400).json({ error: "Invalid metadata JSON" });
    }

    if (req.file) {
      let imageUrl = await uploader.uploadImage(req.file?.buffer);

      let metadataUrl = await uploader.uploadJson({
        name: metadata.name,
        symbol: metadata.symbol,
        description: metadata.description,
        image: imageUrl,
      });

      console.log(metadataUrl);
      return res.send({ metadata: metadataUrl, success: true });
    }
    return res.send({ success: false });
  }
);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// Start server
app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});

export default app;
