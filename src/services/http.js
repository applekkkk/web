import axios from "axios";

const http = axios.create({
  baseURL: "/api",
  timeout: 10000
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("trade-token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const msg = error?.response?.data?.message || "请求失败，请稍后重试";
    return Promise.reject(new Error(msg));
  }
);

export default http;
