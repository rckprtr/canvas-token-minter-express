export type CreateToken = {
    name: string;
    symbol: string;
    description: string;
    decimals: number;
    supply: number;
    revokeUpdate: boolean;
    revokeFreeze: boolean;
    revokeMint: boolean;
    creatorWallet: string;
  };
  
  export type CreateTokenMetadata = {
    name: string;
    symbol: string;
    description: string;
  };
  
  export type TokenMetadata = {
    name: string;
    symbol: string;
    description: string;
    image: string;
  };
  