import {
  createNoopSigner,
  createSignerFromKeypair,
  keypairIdentity,
  Umi,
  publicKey,
  signerIdentity,
  UmiPlugin
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { bundlrUploader } from "@metaplex-foundation/umi-uploader-bundlr";
import { Connection, Keypair, Signer, VersionedTransaction } from "@solana/web3.js";
import base58 from "bs58";

export const buildUmiUploader = (rpcUrl: string, secretKey: string): Umi => {
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


export const buildUmi = (rpcUrl: string, plugins: UmiPlugin[]) => {
  const umi = createUmi(rpcUrl);
  plugins.forEach((plugin) => umi.use(plugin));
  return umi;
}

export const umiUseNoopSigner = (walletAddress: string) => {
  return createNoopSigner(publicKey(walletAddress));
}

//Testing
export const keypairFromPrivateKey = (secretKey: string) => {
  return Keypair.fromSecretKey(Uint8Array.from(base58.decode(secretKey)));
}

export const sendTransaction = async (
  connection: Connection,
  tx: string,
  signers: Signer[],
) => {
  const txUint8Array = base58.decode(tx);
  let versionedTx = VersionedTransaction.deserialize(txUint8Array)
  versionedTx.sign(signers)
  let sig = await connection.sendTransaction(versionedTx);
  console.log("Transaction sent", sig);
  return await getTxDetails(connection, sig);
};

export const getTxDetails = async (connection: Connection, sig: string) => {
  const latestBlockHash = await connection.getLatestBlockhash("processed");

  await connection.confirmTransaction(
    {
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: sig,
    },
    "confirmed"
  );

  return await connection.getTransaction(sig, {
    maxSupportedTransactionVersion: 0,
    commitment: "confirmed",
  });
};