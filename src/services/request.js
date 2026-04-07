import axios from "axios";

const request = axios.create({
  baseURL: "/api",
  timeout: 60000
});

request.interceptors.request.use((config) => {
  const token = localStorage.getItem("trade-token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

request.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error?.code === "ECONNABORTED") {
      return Promise.reject(new Error("请求超时，请稍后重试"));
    }

    let msg = "请求失败，请稍后重试";
    const data = error?.response?.data;

    if (data instanceof Blob) {
      try {
        const text = await data.text();
        const parsed = JSON.parse(text);
        msg = parsed?.message || parsed?.detail || msg;
      } catch {
        // ignore blob parse errors and keep fallback msg
      }
    } else if (typeof data === "string") {
      msg = data || msg;
    } else {
      msg = data?.message || data?.detail || msg;
    }

    return Promise.reject(new Error(msg));
  }
);

export default request;
