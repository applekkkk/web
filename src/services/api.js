import request from "./request";

export const authApi = {
  login: (data) => request.post("/auth/login", data),
  register: (data) => request.post("/auth/register", data)
};

export const userApi = {
  getById: (id) => request.get(`/users/${id}`),
  updateProfile: (id, data) => request.put(`/users/${id}`, data),
  changePassword: (id, data) => request.put(`/users/${id}/password`, data),
  checkIn: (id) => request.post(`/users/${id}/checkin`)
};

export const productApi = {
  getMarketList: () => request.get("/products"),
  getById: (id, params) => request.get(`/products/${id}`, { params }),
  getUserProducts: (userId) => request.get(`/products/user/${userId}`),
  getFavoriteProducts: (userId) => request.get(`/products/favorites/${userId}`),
  upload: (data) => request.post("/products", data),
  updateStats: (id, data) => request.put(`/products/${id}/stats`, data),
  setLike: (id, userId, liked) => request.put(`/products/${id}/like`, null, { params: { userId, liked } }),
  setFavorite: (id, userId, favorited) =>
    request.put(`/products/${id}/favorite`, null, { params: { userId, favorited } })
};

export const orderApi = {
  getUserList: (userId) => request.get(`/orders/user/${userId}`),
  getAll: () => request.get("/orders/all"),
  create: (data) => request.post("/orders", data)
};

export const customRequestApi = {
  getList: (params) => request.get("/custom-requests", { params }),
  getAll: () => request.get("/custom-requests/all"),
  getUserList: (userId) => request.get(`/custom-requests/user/${userId}`),
  getById: (id) => request.get(`/custom-requests/${id}`),
  create: (data) => request.post("/custom-requests", data),
  accept: (id, params) => request.put(`/custom-requests/${id}/accept`, null, { params }),
  submitDelivery: (id, params) => request.put(`/custom-requests/${id}/delivery`, null, { params }),
  complete: (id, params) => request.put(`/custom-requests/${id}/complete`, null, { params })
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
