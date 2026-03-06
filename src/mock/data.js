export const marketData = [
  {
    id: 1,
    name: "幼儿园接触时序网络",
    info: "该数据集记录了儿童与教师之间的时序接触网络，基于2014年发表研究整理。数据文件为制表符分隔格式，记录格式包含时间与接触双方匿名ID，可用于时序互动建模、传播分析与教育场景行为研究。",
    category: "复杂网络",
    tags: "时序网络,接触网络",
    price: 320,
    size: "2.1GB",
    seller: "LinyuanLab",
    author: "李坤",
    uploadDate: "2024-04-05",
    purchased: true,
    likes: 56,
    liked: true,
    stars: 23,
    favorited: true,
    downloads: 244,
    shares: 11,
    summary: [
      { key: "sex", value: "成员性别，F表示女性，M表示男性" },
      { key: "time", value: "接触事件发生时间（秒）" },
      { key: "i", value: "接触者匿名ID" },
      { key: "j", value: "被接触者匿名ID" },
      { key: "Ci", value: "成员i所属班级" },
      { key: "Cj", value: "成员j所属班级" }
    ],
  },
  {
    id: 2,
    name: "电商评论情感数据",
    info: "包含多行业商品评论与情感标签，可用于文本分类、情感分析与用户反馈挖掘任务。",
    category: "文本",
    tags: "情感分析,评论文本",
    price: 120,
    size: "560MB",
    seller: "InsightAI",
    author: "王敏",
    uploadDate: "2024-05-18",
    purchased: false,
    likes: 42,
    liked: false,
    stars: 18,
    favorited: true,
    downloads: 179,
    shares: 9,
    summary: [
      { key: "review_id", value: "评论唯一标识" },
      { key: "content", value: "评论正文文本" },
      { key: "label", value: "情感标签（正向/中性/负向）" },
      { key: "product", value: "商品类别" },
      { key: "time", value: "评论时间戳" }
    ],
  },
  {
    id: 3,
    name: "城市交通轨迹样本",
    info: "城市道路交通轨迹样本，覆盖高峰与平峰时段，适用于时空行为建模与路径分析。",
    category: "时空",
    tags: "轨迹,交通",
    price: 260,
    size: "1.3GB",
    seller: "CityOpen",
    author: "张晨",
    uploadDate: "2024-06-09",
    purchased: false,
    likes: 35,
    liked: false,
    stars: 16,
    favorited: false,
    downloads: 132,
    shares: 7,
    summary: [
      { key: "vehicle_id", value: "车辆匿名编号" },
      { key: "lng", value: "经度坐标" },
      { key: "lat", value: "纬度坐标" },
      { key: "speed", value: "瞬时速度（km/h）" },
      { key: "timestamp", value: "轨迹采样时间" }
    ],
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
    dataset: "幼儿园接触时序网络",
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
