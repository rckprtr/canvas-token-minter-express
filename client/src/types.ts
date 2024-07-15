export type CreateToken = {
  name: string;
  symbol: string;
  decimals: number;
  supply: number;
  image: File | null;
  description: string;
  revokeUpdate: boolean;
  revokeFreeze: boolean;
  revokeMint: boolean;
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
