<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { CreateToken } from "../types";
import { useCreateToken } from "../composables/use-create-token";
import { CanvasClient } from "@dscvr-one/canvas-client-sdk";

const chainId = "solana:101";
let canvasClient: CanvasClient | undefined;

const form = ref<CreateToken>({
  name: "",
  symbol: "",
  decimals: 6,
  supply: 1,
  image: null,
  description: "",
  revokeUpdate: false,
  revokeFreeze: false,
  revokeMint: false,
});

const imageError = ref("");
const imagePreview = ref("");
const isLoading = ref(false);
const isReady = ref(false);

const { createToken } = useCreateToken();

const start = async () => {
  if (!canvasClient) return;
  await canvasClient.ready();
  isReady.value = canvasClient.isReady;
};

onMounted(() => {
  canvasClient = new CanvasClient();
  start();
});

onUnmounted(() => {
  if (canvasClient) {
    canvasClient.destroy();
  }
});

const handleImageUpload = (event: any) => {
  const file = event.target.files[0];
  if (!file.type.startsWith("image/")) {
    imageError.value = "The file must be an image!.";
    return;
  }

  const img = new Image();
  img.onload = () => {
    if (img.width > 512 || img.height > 512) {
      imageError.value = "The image dimensions must not exceed 512x512 pixels.";
    } else {
      form.value.image = file;
      imageError.value = "";
    }
  };
  img.onerror = () => {
    imageError.value = "Invalid image file.";
  };
  img.src = URL.createObjectURL(file);
  imagePreview.value = img.src;
};

const submitCreateToken = async () => {
  isLoading.value = true;

  const response = await canvasClient?.connectWallet(chainId);

  if (response.untrusted.success == false) {
    isLoading.value = false;
    console.error("Failed to connect wallet", response.untrusted?.error);
    return;
  }

  const vtx = await createToken(form.value, response.untrusted.address);
  const signedTx = await canvasClient!.signAndSendTransaction({
    chainId,
    unsignedTx: vtx,
  });

  if (signedTx.untrusted.success) {
    console.log("Token created successfully!", signedTx.untrusted);
  } else if (signedTx.untrusted.success === false) {
    console.error("Failed to create token", signedTx.untrusted.error);
  }
  isLoading.value = false;
};
</script>

<template>
  <div class="max-w-[600px] mx-auto p-4 relative">
    <h1 class="mb-4 text-2xl font-bold text-center">Solana Token Creator!</h1>
    <form @submit.prevent="submitCreateToken" class="space-y-4">
      <div class="flex w-full gap-4">
        <div class="w-1/2">
          <div class="form-control">
            <div class="label">
              <label for="name" class="label-text">Name:</label>
            </div>
            <input
              id="name"
              v-model="form.name"
              required
              class="w-full input input-bordered"
            />
          </div>

          <div class="form-control">
            <div class="label">
              <label for="decimals" class="label-text">Decimals:</label>
            </div>
            <input
              id="decimals"
              min="0"
              max="9"
              v-model="form.decimals"
              required
              type="number"
              class="w-full input input-bordered"
            />
          </div>
        </div>
        <div class="w-1/2">
          <div class="form-control">
            <div class="label">
              <label for="symbol" class="label-text">Symbol:</label>
            </div>
            <input
              id="symbol"
              :maxlength="32"
              v-model="form.symbol"
              required
              class="w-full input input-bordered"
            />
          </div>

          <div class="form-control">
            <div class="label">
              <label for="supply" class="label-text">Supply:</label>
            </div>
            <input
              id="supply"
              min="1"
              v-model="form.supply"
              required
              type="number"
              class="w-full input input-bordered"
            />
          </div>
        </div>
      </div>
      <div class="form-control">
        <div class="label">
          <label for="image" class="label-text">Image:</label>
        </div>
        <input
          id="image"
          type="file"
          @change="handleImageUpload"
          class="block w-full mt-1 file-input"
        />
        <p v-if="imageError" class="mt-1 text-sm text-red-500">
          {{ imageError }}
        </p>
        <img v-if="imagePreview" :src="imagePreview" class="w-24 h-24 mt-2" />
      </div>

      <div class="form-control">
        <div class="label">
          <span for="description" class="label-text">Description:</span>
        </div>
        <textarea
          id="description"
          v-model="form.description"
          required
          class="w-full h-24 textarea textarea-bordered"
        ></textarea>
      </div>

      <div class="space-y-2 form-control">
        <label class="label-text">Revoke Authorities</label>

        <div class="flex items-center">
          <input
            type="checkbox"
            v-model="form.revokeMint"
            class="mr-2 checkbox checkbox-accent"
          />
          <span>Revoke Mint Authority</span>
        </div>

        <div class="flex items-center">
          <input
            type="checkbox"
            v-model="form.revokeUpdate"
            class="mr-2 checkbox checkbox-accent"
          />
          <span>Revoke Update Authority and make Immutable</span>
        </div>

        <div class="flex items-center">
          <input
            type="checkbox"
            v-model="form.revokeFreeze"
            class="mr-2 checkbox checkbox-accent"
          />
          <span>Revoke Freeze Authority</span>
        </div>
      </div>

      <button type="submit" class="w-full btn btn-primary">Create Token</button>
    </form>
    <div
      v-if="isLoading"
      class="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 bg-opacity-50"
    >
      <div
        class="w-12 h-12 mb-4 border-t-4 border-b-4 border-indigo-600 rounded-full animate-spin"
      ></div>
      <p class="mt-2 font-medium text-black animate-pulse">Creating token...</p>
    </div>
  </div>
</template>
