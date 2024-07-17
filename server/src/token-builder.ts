import { createCreateMetadataAccountV3Instruction } from "@metaplex-foundation/mpl-token-metadata";
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
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import base58 from "bs58";
import { CreateToken } from "./types";

export class SPLTokenBuilder {
  connection: Connection;
  constructor(connection: Connection) {
    this.connection = connection;
  }

  build = async (
    createToken: CreateToken,
    metadataUri: string
  ) => {
    const creatorKey = new PublicKey(createToken.creatorWallet);

    let mint = Keypair.generate();

    let mintIx = await this.createTokenInstructions(
      creatorKey,
      mint.publicKey,
      createToken,
      metadataUri
    );
    let vtx = await this.buildVersionedTx(creatorKey, mintIx);

    vtx.sign([mint]);

    return base58.encode(vtx.serialize());
  };

  createTokenInstructions = async (
    creator: PublicKey,
    mint: PublicKey,
    createToken: CreateToken,
    metadataUri: string,
    tokenProgramId = TOKEN_PROGRAM_ID
  ) => {
    const instructions = await this.getMintInstructions(
      creator,
      mint,
      createToken.decimals,
      tokenProgramId
    );

    instructions.add(
      this.getCreateTokenMetadataInstructions(
        creator,
        mint,
        createToken,
        metadataUri
      )
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

  getMintInstructions = async (
    creator: PublicKey,
    mintAddress: PublicKey,
    decimals: number,
    tokenProgramId: PublicKey
  ) => {
    const lamports = await getMinimumBalanceForRentExemptMint(this.connection);
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

  getCreateTokenMetadataInstructions = (
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

  buildVersionedTx = async (
    payer: PublicKey,
    tx: Transaction
  ): Promise<VersionedTransaction> => {
    const blockHash = (await this.connection.getLatestBlockhash("finalized"))
      .blockhash;

    let messageV0 = new TransactionMessage({
      payerKey: payer,
      recentBlockhash: blockHash,
      instructions: tx.instructions,
    }).compileToV0Message();

    return new VersionedTransaction(messageV0);
  };
}
