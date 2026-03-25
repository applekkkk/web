import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
});

function normalizeError(error) {
  const detail =
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    "请求失败，请稍后重试";
  return new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
}

function buildFileForm(file, extra = {}) {
  const fd = new FormData();
  fd.append("file", file);
  Object.entries(extra).forEach(([k, v]) => {
    fd.append(k, typeof v === "object" ? JSON.stringify(v) : String(v));
  });
  return fd;
}

export async function renderNetworkVisualization({ file, userId, options = {} }) {
  try {
    const fd = buildFileForm(file, {
      ...(userId != null ? { user_id: userId } : {}),
      options,
    });

    const res = await api.post("/visualization/render", fd, {
      headers: { "Content-Type": "multipart/form-data" },
      responseType: "blob",
    });

    const ct = String(res.headers?.["content-type"] || "").toLowerCase();
    const blob = res.data;

    if (ct.startsWith("image/")) {
      return { imageUrl: URL.createObjectURL(blob), isObjectUrl: true, payload: null };
    }

    if (ct.includes("application/json")) {
      const text = await blob.text();
      const payload = JSON.parse(text);
      const imageUrl = extractImageUrl(payload);
      if (!imageUrl) throw new Error(payload?.message || "后端未返回图片");
      return { imageUrl, isObjectUrl: false, payload };
    }

    const fallback = JSON.parse(await blob.text());
    const imageUrl = extractImageUrl(fallback);
    if (imageUrl) return { imageUrl, isObjectUrl: false, payload: fallback };

    throw new Error("后端返回格式不支持");
  } catch (err) {
    throw normalizeError(err);
  }
}

export async function getNetworkStats({ file }) {
  try {
    const fd = buildFileForm(file);
    const res = await api.post("/visualization/stats", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (err) {
    throw normalizeError(err);
  }
}

export async function getNetworkCentrality({ file, top = 15 }) {
  try {
    const fd = buildFileForm(file);
    const res = await api.post(`/visualization/centrality?top=${top}`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (err) {
    throw normalizeError(err);
  }
}

export async function getNetworkCommunities({ file }) {
  try {
    const fd = buildFileForm(file);
    const res = await api.post("/visualization/communities", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (err) {
    throw normalizeError(err);
  }
}

function extractImageUrl(payload) {
  const d = payload?.data ?? payload ?? {};
  if (typeof d.imageUrl === "string" && d.imageUrl.trim()) return d.imageUrl.trim();
  if (typeof d.imageBase64 === "string" && d.imageBase64.trim()) {
    const b = d.imageBase64.trim();
    return b.startsWith("data:image/") ? b : `data:image/png;base64,${b}`;
  }
  return "";
}
