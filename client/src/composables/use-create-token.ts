import {
  AuthorityType,
  createAssociatedTokenAccountInstruction,
  createInitializeMint2Instruction,
  createMintToInstruction,
  createSetAuthorityInstruction,
  getAssociatedTokenAddressSync,
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { CreateToken, CreateTokenMetadata } from "../types";
import {
  Connection,
  SystemProgram,
  Transaction,
  PublicKey,
  clusterApiUrl,
  Keypair,
  VersionedTransaction,
  TransactionMessage,
  SendTransactionError,
} from "@solana/web3.js";
import { createCreateMetadataAccountV3Instruction } from "@metaplex-foundation/mpl-token-metadata";

const BASE_API_URL = window.location.origin;//import.meta.env.VITE_API_URL;


export const useCreateToken = () => {

  const createToken = async (createToken: CreateToken, creatorWallet: string) => {
    const connection = new Connection(clusterApiUrl("devnet"));

    const creatorKey = new PublicKey(creatorWallet);

    console.log(createToken.image);

    let metadataResults = await uploadData(createToken.image, {
      name: createToken.name,
      symbol: createToken.symbol,
      description: createToken.description,
    });

    console.log(metadataResults);

    let mint = Keypair.generate();

    let mintIx = await createTokenInstructions(
      connection,
      creatorKey,
      mint.publicKey,
      createToken,
      metadataResults.metadata
    );
    let vtx = await buildVersionedTx(connection, creatorKey, mintIx);

    vtx.sign([mint]);

    try {
      // let sig = await connection.sendTransaction(vtx);
      // console.log(sig);
      // console.log(`https://solscan.io/tx/${sig}?cluster=devnet`);
    } catch (e) {
      console.log(e instanceof SendTransactionError);
      if (e instanceof SendTransactionError) {
        console.log(e.transactionError);
      }
    }
  };

  const createTokenInstructions = async (
    connection: Connection,
    creator: PublicKey,
    mint: PublicKey,
    createToken: CreateToken,
    metadataUri: string,
    tokenProgramId = TOKEN_PROGRAM_ID
  ) => {
    const instructions = await getMintInstructions(
      connection,
      creator,
      mint,
      createToken.decimals,
      tokenProgramId
    );

    instructions.add(
      getCreateTokenMetadataInstructions(creator, mint, createToken, metadataUri)
    );

    let creatorAta = getAssociatedTokenAddressSync(
      mint, // token
      creator, // owner
      false,
      tokenProgramId
    );

    instructions.add(
      createAssociatedTokenAccountInstruction(
        creator,
        creatorAta,
        creator,
        mint,
        tokenProgramId
      ),
      createMintToInstruction(
        mint,
        creatorAta,
        creator,
        createToken.supply,
        [],
        tokenProgramId
      )
    );

    if (createToken.revokeMint) {
      instructions.add(
        createSetAuthorityInstruction(
          mint,
          creator,
          AuthorityType.MintTokens,
          null
        )
      );
    }

    if (createToken.revokeFreeze) {
      instructions.add(
        createSetAuthorityInstruction(
          mint,
          creator,
          AuthorityType.FreezeAccount,
          null
        )
      );
    }

    return instructions;
  };

  const getMintInstructions = async (
    connection: Connection,
    creator: PublicKey,
    mintAddress: PublicKey,
    decimals: number,
    tokenProgramId: PublicKey
  ) => {
    const lamports = await getMinimumBalanceForRentExemptMint(connection);
    const transaction = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: creator,
        newAccountPubkey: mintAddress,
        space: MINT_SIZE,
        lamports,
        programId: tokenProgramId,
      }),
      createInitializeMint2Instruction(
        mintAddress,
        decimals,
        creator,
        creator,
        tokenProgramId
      )
    );
    return transaction;
  };

  const getCreateTokenMetadataInstructions = (
    creator: PublicKey,
    mint: PublicKey,
    createToken: CreateToken,
    metadataUri: string
  ) => {
    const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
      "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
    );

    const [metaDataPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );

    const metadataData = {
      name: createToken.name,
      symbol: createToken.symbol,
      uri: metadataUri,
      sellerFeeBasisPoints: 0,
      creators: null,
      collection: null,
      uses: null,
    };

    const createMetadataAccountInstruction =
      createCreateMetadataAccountV3Instruction(
        {
          metadata: metaDataPDA,
          mint: mint,
          mintAuthority: creator,
          payer: creator,
          updateAuthority: creator,
        },
        {
          createMetadataAccountArgsV3: {
            collectionDetails: null,
            data: metadataData,
            isMutable: !createToken.revokeUpdate,
          },
        }
      );

    return createMetadataAccountInstruction;
  };

  const buildVersionedTx = async (
    connection,
    payer: PublicKey,
    tx: Transaction
  ): Promise<VersionedTransaction> => {
    const blockHash = (await connection.getLatestBlockhash("finalized"))
      .blockhash;

    let messageV0 = new TransactionMessage({
      payerKey: payer,
      recentBlockhash: blockHash,
      instructions: tx.instructions,
    }).compileToV0Message();

    return new VersionedTransaction(messageV0);
  };

  const uploadData = async (image: File, metadata: CreateTokenMetadata) => {
    const formData = new FormData();
    formData.append("file", image);
    formData.append("metadata", JSON.stringify(metadata));

    const response = await fetch(`${BASE_API_URL}/api/upload`, {
      method: "post",
      body: formData,
    });

    const data = await response.json();
    return data;
  };

  return {
    createToken,
  };
};
