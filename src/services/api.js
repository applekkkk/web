import request from "./request";

export const authApi = {
  login: (data) => request.post("/auth/login", data),
  register: (data) => request.post("/auth/register", data),
  checkIn: (userId) => request.post("/auth/check-in", null, { params: { userId } })
};

export const userApi = {
  getById: (id) => request.get(`/users/${id}`),
  updateProfile: (id, data) => request.put(`/users/${id}`, data)
};

export const productApi = {
  getMarketList: () => request.get("/products"),
  getById: (id) => request.get(`/products/${id}`),
  upload: (data) => request.post("/products", data),
  updateStats: (id, data) => request.put(`/products/${id}/stats`, data)
};

export const orderApi = {
  getList: () => request.get("/orders"),
  create: (data) => request.post("/orders", data)
};

export const customRequestApi = {
  getList: (params) => request.get("/custom-requests", { params }),
  getById: (id) => request.get(`/custom-requests/${id}`),
  create: (data) => request.post("/custom-requests", data),
  accept: (id, params) => request.put(`/custom-requests/${id}/accept`, null, { params })
};

export const reviewApi = {
  getPendingList: () => request.get("/products/pending"),
  approve: (id, status = 1) => request.put(`/products/${id}/approve`, null, { params: { status } }),
  reject: (id) => request.put(`/products/${id}/approve`, null, { params: { status: 2 } })
};

export const walletApi = {
  getBalance: (userId) => request.get(`/wallet/${userId}`),
  getTransactions: (userId) => request.get(`/wallet/${userId}/transactions`)
};

export const warehouseApi = {
  getList: (userId) => request.get(`/warehouse/${userId}`)
};
