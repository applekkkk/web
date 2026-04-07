import request from "./request";

export const authApi = {
  login: (data) => request.post("/auth/login", data),
  register: (data) => request.post("/auth/register", data),
  sendRegisterEmailCode: (email) => request.post("/auth/register/email/code", null, { params: { email } })
};

export const userApi = {
  getById: (id) => request.get(`/users/${id}`),
  getAll: () => request.get("/users/all"),
  updateProfile: (id, data) => request.put(`/users/${id}`, data),
  updatePoints: (id, points) => request.put(`/users/${id}/points`, null, { params: { points } }),
  changePassword: (id, data) => request.put(`/users/${id}/password`, data),
  sendEmailCode: (id, email) => request.post(`/users/${id}/email/code`, null, { params: { email } }),
  verifyEmail: (id, email, code) => request.post(`/users/${id}/email/verify`, null, { params: { email, code } }),
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
  create: (data) => request.post("/orders", data),
  adminSetPurchaseStatus: (buyerId, productId, purchased) =>
    request.put("/orders/admin/purchase-status", null, { params: { buyerId, productId, purchased } })
};

export const customRequestApi = {
  getList: (params) => request.get("/custom-requests", { params }),
  getAll: () => request.get("/custom-requests/all"),
  getUserList: (userId) => request.get(`/custom-requests/user/${userId}`),
  getById: (id) => request.get(`/custom-requests/${id}`),
  create: (data) => request.post("/custom-requests", data),
  accept: (id, params) => request.put(`/custom-requests/${id}/accept`, null, { params }),
  submitDelivery: (id, params) => request.put(`/custom-requests/${id}/delivery`, null, { params }),
  complete: (id, params) => request.put(`/custom-requests/${id}/complete`, null, { params }),
  reject: (id, params) => request.put(`/custom-requests/${id}/reject`, null, { params }),
  adminUpdateStatus: (id, status) => request.put(`/custom-requests/${id}/admin-status`, null, { params: { status } })
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

export const messageApi = {
  create: (userId, content) => request.post("/messages", null, { params: { userId, content } }),
  getUserList: (userId) => request.get(`/messages/user/${userId}`),
  getAll: () => request.get("/messages/all")
};

export const taskAppealApi = {
  create: (data) => request.post("/task-appeals", data),
  getUserList: (userId) => request.get(`/task-appeals/user/${userId}`),
  getAll: () => request.get("/task-appeals/all"),
  process: (appealId) => request.put(`/task-appeals/${appealId}/process`),
  forceSettle: (appealId) => request.put(`/task-appeals/${appealId}/force-settle`),
  forceRelease: (appealId) => request.put(`/task-appeals/${appealId}/force-release`)
};

export const aiProcessRecordApi = {
  create: (data) => request.post("/ai-process-records", data),
  getByOrderNo: (orderNo, userId) => request.get(`/ai-process-records/${encodeURIComponent(orderNo)}`, { params: { userId } }),
  getUserList: (userId) => request.get(`/ai-process-records/user/${userId}`)
};
