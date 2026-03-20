import axios from "axios";

const analyticsRequest = axios.create({
  baseURL: "http://127.0.0.1:8000",
  timeout: 120000
});

function unwrap(res) {
  if (res && typeof res === "object" && "data" in res) return res.data;
  return res;
}

function normalizeError(error) {
  const detail =
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
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
    return unwrap(response.data);
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function downloadProcessedCsv(userId) {
  try {
    const formData = new FormData();
    formData.append("user_id", String(userId));
    const response = await analyticsRequest.post(
      "/download",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        responseType: "blob"
      }
    );
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

// 占位：后续接入更完整的分析接口时可复用
export async function getLoadedDatasetInfo() {
  return { fileName: "-", rowCount: 0 };
}

export async function getProcessPreview() {
  return { addedFieldCount: 0, cleanedCount: 0, rows: [] };
}

export async function getFieldAnalysis() {
  return { fieldCount: 0, totalRows: 0, validRows: 0, nullRemoved: 0, qualityScore: 0 };
}

export async function getAnalysisReport() {
  return { markdown: "" };
}

export async function saveProcessedToMarket() {
  return { ok: true };
}
