import { CreateToken, CreateTokenResult } from "../types";

const BASE_API_URL = window.location.origin; //import.meta.env.VITE_API_URL;

export const useCreateToken = () => {
  const createToken = async (
    createToken: CreateToken,
    creatorWallet: string
  ) => {
    const { image, ...data } = { ...createToken, creatorWallet };
    let metadataResults = await uploadData(image, data);
    return metadataResults;
  };

  const uploadData = async (
    image: File,
    createData: any
  ) => {
    const formData = new FormData();
    formData.append("file", image);
    formData.append("metadata", JSON.stringify(createData));

    const response = await fetch(`${BASE_API_URL}/api/upload`, {
      method: "post",
      body: formData,
    });

    const data = await response.json();
    return data as CreateTokenResult;
  };

  return {
    createToken,
  };
};
