import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000";
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 30 * 60 * 1000;

const analyticsRequest = axios.create({
  baseURL: BASE_URL,
  timeout: 60000
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeError(error) {
  const detail =
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.response?.data?.msg ||
    error?.message ||
    "请求失败，请稍后重试";
  return new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
}

export async function startProcessTask({ file, userId, userPrompt }) {
  try {
    const formData = new FormData();
    if (file) formData.append("file", file);
    formData.append("user_id", String(userId));
    formData.append("user_prompt", userPrompt);

    const response = await analyticsRequest.post("/agent/start", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });

    const payload = response?.data?.data ?? response?.data ?? {};
    const taskId = payload?.taskId || payload?.task_id;
    if (!taskId) throw new Error("未获取到任务 ID");
    return { ...payload, taskId };
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getProcessTaskStatus(taskId) {
  try {
    const response = await analyticsRequest.get(`/agent/status/${encodeURIComponent(taskId)}`);
    return response?.data?.data ?? response?.data ?? {};
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function runProcessTask({ file, userId, userPrompt }) {
  const task = await startProcessTask({ file, userId, userPrompt });
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const statusPayload = await getProcessTaskStatus(task.taskId);
    const status = String(statusPayload?.status || "").toLowerCase();

    if (status === "done") {
      return statusPayload?.result ?? {};
    }
    if (status === "failed") {
      throw new Error(statusPayload?.error || "任务处理失败");
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error("处理超时，请稍后重试");
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
