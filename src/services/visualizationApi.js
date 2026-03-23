import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000";

const visualizationRequest = axios.create({
  baseURL: BASE_URL,
  timeout: 120000
});

function normalizeError(error) {
  const detail =
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.response?.data?.msg ||
    error?.message ||
    "请求失败，请稍后重试";
  return new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
}

async function parseJsonBlob(blob) {
  const text = await blob.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function getImageFromPayload(payload) {
  const data = payload?.data ?? payload ?? {};
  if (typeof data?.imageUrl === "string" && data.imageUrl.trim()) {
    return data.imageUrl.trim();
  }
  if (typeof data?.imageBase64 === "string" && data.imageBase64.trim()) {
    const base64 = data.imageBase64.trim();
    return base64.startsWith("data:image/") ? base64 : `data:image/png;base64,${base64}`;
  }
  return "";
}

export async function renderNetworkVisualization({ file, userId, options = {} }) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    if (userId !== undefined && userId !== null) formData.append("user_id", String(userId));
    formData.append("options", JSON.stringify(options));

    const response = await visualizationRequest.post("/visualization/render", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      responseType: "blob"
    });

    const contentType = String(response?.headers?.["content-type"] || "").toLowerCase();
    const blob = response.data;

    if (contentType.includes("application/json")) {
      const payload = await parseJsonBlob(blob);
      const imageUrl = getImageFromPayload(payload);
      if (!imageUrl) throw new Error(payload?.message || "后端未返回可视化图片地址");
      return { imageUrl, payload, isObjectUrl: false };
    }

    if (contentType.startsWith("image/")) {
      return { imageUrl: URL.createObjectURL(blob), payload: null, isObjectUrl: true };
    }

    const fallbackPayload = await parseJsonBlob(blob);
    const fallbackImage = getImageFromPayload(fallbackPayload);
    if (fallbackImage) return { imageUrl: fallbackImage, payload: fallbackPayload, isObjectUrl: false };

    throw new Error("后端返回格式不支持，请确认接口返回图片或 imageUrl/imageBase64");
  } catch (error) {
    throw normalizeError(error);
  }
}
