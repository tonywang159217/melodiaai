import { lemonSqueezySetup, createCheckout, getStore, getProduct, getPrice } from "@lemonsqueezy/lemonsqueezy.js";

/**
 * Lemon Squeezy SDK 设置（仅服务端用）
 * 所有操作都走服务器，避免 API key 暴露。
 * 使用方式：先调用 initializeLemonSqueezy() 确保已配置，然后直接用
 * 导入的 createCheckout / getStore 等函数即可。
 */
let initialized = false;

export function initializeLemonSqueezy() {
  if (initialized) return;
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
  if (!apiKey) {
    throw new Error("LEMON_SQUEEZY_API_KEY is not set. Please add it to .env.local");
  }
  lemonSqueezySetup({ apiKey });
  initialized = true;
}

export { createCheckout, getStore, getProduct, getPrice };

export const LEMON_SQUEEZY_STORE_ID =
  process.env.LEMON_SQUEEZY_STORE_ID ?? "";
export const LEMON_SQUEEZY_WEBHOOK_SECRET =
  process.env.LEMON_SQUEEZY_WEBHOOK_SECRET ?? "";