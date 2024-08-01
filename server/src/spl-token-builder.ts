import base58 from "bs58";
import { CreateToken } from "./types";
import {
  percentAmount,
  signerIdentity,
  Umi,
  publicKey,
  generateSigner,
} from "@metaplex-foundation/umi";
import { buildUmi, umiUseNoopSigner } from "./utils";
import {
  createAndMint,
  mplTokenMetadata,
  TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  AuthorityType,
  setAuthority,
  setComputeUnitPrice,
} from "@metaplex-foundation/mpl-toolbox";

export class SPLTokenBuilder {
  umi: Umi;
  rpcUrl: string;
  constructor(rpcUrl: string) {
    this.rpcUrl = rpcUrl;
    this.umi = buildUmi(rpcUrl, [mplTokenMetadata()]);
  }

  build = async (createToken: CreateToken, metadataUri: string) => {
    const mint = generateSigner(this.umi);

    const creatorNoopSigner = umiUseNoopSigner(createToken.creatorWallet);
    this.umi.use(signerIdentity(creatorNoopSigner));

    const computedSupply =
      createToken.supply * Math.pow(10, createToken.decimals);

    let mintTxBuilder = createAndMint(this.umi, {
      mint,
      authority: this.umi.identity,
      name: createToken.name,
      symbol: createToken.symbol,
      uri: metadataUri,
      sellerFeeBasisPoints: percentAmount(0),
      decimals: createToken.decimals,
      amount: computedSupply,
      tokenOwner: publicKey(createToken.creatorWallet),
      tokenStandard: TokenStandard.Fungible,
      isMutable: !createToken.revokeUpdate,
    }).prepend(
      setComputeUnitPrice(this.umi, {
        microLamports: 10_000,
      })
    );

    if (createToken.revokeMint) {
      mintTxBuilder = mintTxBuilder.add(
        setAuthority(this.umi, {
          owned: mint.publicKey,
          owner: this.umi.identity,
          newAuthority: null,
          authorityType: AuthorityType.MintTokens,
        })
      );
    }

    if (createToken.revokeFreeze) {
      mintTxBuilder = mintTxBuilder.add(
        setAuthority(this.umi, {
          owned: mint.publicKey,
          owner: this.umi.identity,
          newAuthority: null,
          authorityType: AuthorityType.FreezeAccount,
        })
      );
    }

    const tx = await mintTxBuilder.buildAndSign(this.umi);

    return base58.encode(this.umi.transactions.serialize(tx));
  };
}
