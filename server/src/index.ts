import express, { Express, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import multer from "multer";
import { buildUmiUploader, keypairFromPrivateKey, sendTransaction } from "./utils";
import { Uploader } from "./uploader";
import { SPLTokenBuilder } from "./spl-token-builder";
import { Connection, Keypair } from "@solana/web3.js";
import { CreateToken } from "./types";

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

const umi = buildUmiUploader(
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
      return res.send({ message: 'No file uploaded.', success: false });
    }

    let createToken: CreateToken;
    try {
      createToken = JSON.parse(req.body.metadata) as CreateToken;
    } catch (error) {
      return res.send({ message: 'Invalid metadata JSON', success: false });
    }

    if (req.file) {
      let imageUrl = await uploader.uploadImage(req.file?.buffer);

      console.log(imageUrl);

      let metadataUrl = await uploader.uploadJson({
        name: createToken.name,
        symbol: createToken.symbol,
        description: createToken.description,
        image: imageUrl,
      });

      console.log(metadataUrl);

      const connection = new Connection(process.env.SOLANA_RPC_URL || "");
      let tokenBuilder = new SPLTokenBuilder(connection);
      let ix = await tokenBuilder.build(
        createToken,
        metadataUrl
      )

      return res.send({ transaction: ix, success: true });
    }
    return res.send({ message: 'Failed to mint', success: false });
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
