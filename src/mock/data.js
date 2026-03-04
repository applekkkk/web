export const marketData = [
  {
    id: 1,
    name: "社交网络关系图谱",
    info: "展示社交网络中的节点关系与连接结构，适用于复杂网络分析。",
    category: "复杂网络",
    tags: "graph,social",
    price: 320,
    size: "2.1GB",
    seller: "DataLab",
    uploadDate: "2024-04-05",
    likes: 56,
    liked: true,
    stars: 23,
    favorited: true,
    downloads: 244,
    shares: 11,
    nodeCount: 12979,
    edgeCount: 39018,
    density: 0.000232,
    references: [
      "Eash, R., et al. Equilibrium traffic assignment on an aggregated highway network for sketch planning.",
      "Boyce, David E., et al. Combined models of urban travel and location on a sketch planning network."
    ],
    sourceUrl: "https://downloads.skewed.de/mirror/konect.cc/files/download.tsv.tntp-ChicagoRegional.tar.bz2"
  },
  {
    id: 2,
    name: "电商评论情感数据",
    info: "包含多行业商品评论与情感标签，可用于文本分类与情感分析任务。",
    category: "文本",
    tags: "nlp,reviews",
    price: 120,
    size: "560MB",
    seller: "InsightAI",
    uploadDate: "2024-05-18",
    likes: 42,
    liked: false,
    stars: 18,
    favorited: true,
    downloads: 179,
    shares: 9,
    nodeCount: 8421,
    edgeCount: 26540,
    density: 0.000391,
    references: [
      "Pang, B., and Lee, L. Opinion Mining and Sentiment Analysis.",
      "Liu, B. Sentiment Analysis and Opinion Mining."
    ],
    sourceUrl: "https://example.com/dataset/ecommerce-sentiment"
  },
  {
    id: 3,
    name: "城市交通轨迹样本",
    info: "城市道路交通轨迹样本，覆盖高峰与平峰时段，适用于时空建模。",
    category: "时空",
    tags: "mobility,gps",
    price: 260,
    size: "1.3GB",
    seller: "CityOpen",
    uploadDate: "2024-06-09",
    likes: 35,
    liked: false,
    stars: 16,
    favorited: false,
    downloads: 132,
    shares: 7,
    nodeCount: 10436,
    edgeCount: 28701,
    density: 0.000264,
    references: [
      "Zheng, Y. Trajectory Data Mining: An Overview.",
      "Yuan, J., et al. T-Drive: Driving Directions based on Taxi Trajectories."
    ],
    sourceUrl: "https://example.com/dataset/city-traffic-trajectory"
  }
];

export const pendingReviews = [
  {
    id: "R-1008",
    dataset: "短视频传播网络样本",
    owner: "node-lee",
    submittedAt: "2026-02-24 14:20",
    status: "待审核"
  },
  {
    id: "R-1009",
    dataset: "跨平台评论语义数据",
    owner: "nlp-wang",
    submittedAt: "2026-02-25 09:40",
    status: "待审核"
  }
];

export const orderList = [
  {
    id: "O20260226001",
    dataset: "社交网络关系图谱",
    amount: 320,
    status: "已支付",
    createdAt: "2026-02-26 18:20"
  },
  {
    id: "O20260225017",
    dataset: "城市交通轨迹样本",
    amount: 260,
    status: "处理中",
    createdAt: "2026-02-25 10:12"
  }
];

export const customNeeds = [
  {
    id: "CUST-001",
    title: "短视频平台用户互动图",
    budget: 800,
    deadline: "2026-03-15",
    status: "招募中"
  },
  {
    id: "CUST-002",
    title: "学术合作关系网络",
    budget: 1200,
    deadline: "2026-03-20",
    status: "已承接"
  }
];
