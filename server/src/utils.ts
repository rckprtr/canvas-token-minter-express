import {
  createSignerFromKeypair,
  keypairIdentity,
  Umi,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { bundlrUploader } from "@metaplex-foundation/umi-uploader-bundlr";
import base58 from "bs58";

export const buildUmi = (rpcUrl: string, secretKey: string): Umi => {
  const umi = createUmi(rpcUrl).use(
    bundlrUploader({
      providerUrl: rpcUrl,
      timeout: 60000,
    })
  );

  loadUmiKeypair(umi, base58.decode(secretKey));
  return umi;
};

export const loadUmiKeypair = (umi: Umi, secretKey: Uint8Array) => {
  const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
  const signer = createSignerFromKeypair(umi, keypair);
  return umi.use(keypairIdentity(signer));
};
