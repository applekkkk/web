import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000";

const analyticsRequest = axios.create({
  baseURL: BASE_URL,
  timeout: 600000
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

export async function runProcessTask({ file, userId, userPrompt }) {
  try {
    const formData = new FormData();
    if (file) formData.append("file", file);
    formData.append("user_id", String(userId));
    formData.append("user_prompt", userPrompt);
    const response = await analyticsRequest.post("/agent/process", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return response?.data?.data ?? response?.data ?? {};
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function downloadProcessedCsv(userId) {
  try {
    const formData = new FormData();
    formData.append("user_id", String(userId));
    const response = await analyticsRequest.post("/download", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      responseType: "blob"
    });
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}