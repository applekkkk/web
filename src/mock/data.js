export const marketData = [
  { id: 1, name: "社交网络关系图谱", category: "复杂网络", tags: "graph,social", price: 320, size: "2.1GB", seller: "DataLab" },
  { id: 2, name: "电商评论情感数据", category: "文本", tags: "nlp,reviews", price: 120, size: "560MB", seller: "InsightAI" },
  { id: 3, name: "城市交通轨迹样本", category: "时空", tags: "mobility,gps", price: 260, size: "1.3GB", seller: "CityOpen" }
];

export const pendingReviews = [
  { id: "R-1008", dataset: "短视频传播网络样本", owner: "node-lee", submittedAt: "2026-02-24 14:20", status: "待审核" },
  { id: "R-1009", dataset: "跨平台评论语义数据", owner: "nlp-wang", submittedAt: "2026-02-25 09:40", status: "待审核" }
];

export const orderList = [
  { id: "O20260226001", dataset: "社交网络关系图谱", amount: 320, status: "已支付", createdAt: "2026-02-26 18:20" },
  { id: "O20260225017", dataset: "城市交通轨迹样本", amount: 260, status: "处理中", createdAt: "2026-02-25 10:12" }
];

export const customNeeds = [
  { id: "CUST-001", title: "短视频平台用户互动图", budget: 800, deadline: "2026-03-15", status: "招募中" },
  { id: "CUST-002", title: "学术合作关系网络", budget: 1200, deadline: "2026-03-20", status: "已承接" }
];
