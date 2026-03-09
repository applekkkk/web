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
    status: "审核中"
  },
  {
    id: "R-1009",
    dataset: "跨平台评论语义数据",
    owner: "nlp-wang",
    submittedAt: "2026-02-25 09:40",
    status: "待审核"
  },
  {
    id: "R-1010",
    dataset: "城市交通轨迹样本",
    owner: "city-open",
    submittedAt: "2026-02-25 13:10",
    status: "驳回"
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

export const adminUsers = [
  {
    id: 1001,
    name: "普通用户A",
    role: "user",
    points: 860,
    status: "正常",
    phone: "13800000001",
    email: "usera@example.com",
    joinedAt: "2026-01-12 09:20"
  },
  {
    id: 1002,
    name: "普通用户B",
    role: "user",
    points: 420,
    status: "限制上传",
    phone: "13800000002",
    email: "userb@example.com",
    joinedAt: "2026-01-20 11:40"
  },
  {
    id: 1,
    name: "平台管理员",
    role: "admin",
    points: 9999,
    status: "正常",
    phone: "13800000000",
    email: "admin@example.com",
    joinedAt: "2025-12-01 08:00"
  }
];

export const customNeeds = [
  {
    id: "CUST-001",
    title: "短视频平台用户互动图",
    description: "需要构建用户互动关系网络，包含点赞、评论、转发边，输出可分析的图结构数据。",
    tags: "graph,短视频,互动",
    amount: "120000",
    budget: 800,
    deadline: "2026-03-15",
    category: "图数据",
    publisher: "普通用户",
    publisherId: 1002,
    publisherContact: "user_demo@demo.com",
    attachmentName: "need_example.csv",
    needStatus: "未承接",
    acceptedBy: ""
  },
  {
    id: "CUST-002",
    title: "学术合作关系网络",
    description: "按论文与作者信息构建合作网络，支持时间切片与社区分析。",
    tags: "学术,合作网络",
    amount: "86000",
    budget: 1200,
    deadline: "2026-03-20",
    category: "图数据",
    publisher: "科研中心",
    publisherId: 2001,
    publisherContact: "13800138000",
    attachmentName: "coauthor_sample.csv",
    needStatus: "进行中",
    acceptedBy: "数据工坊A"
  },
  {
    id: "CUST-003",
    title: "城市出租车轨迹清洗任务",
    description: "需要对原始轨迹数据进行去噪、补点和异常值剔除，并输出按天分片的数据文件。",
    tags: "轨迹,清洗,时空",
    amount: "250000",
    budget: 950,
    deadline: "2026-03-25",
    category: "时空",
    publisher: "城市实验室",
    publisherId: 3001,
    publisherContact: "citylab@example.com",
    attachmentName: "taxi_sample.csv",
    needStatus: "已完成",
    acceptedBy: "交付团队B"
  },
  {
    id: "CUST-004",
    title: "校园食堂客流预测数据整理任务",
    description: "需要按周汇总校园食堂客流与时段特征，输出可用于预测建模的训练数据集。",
    tags: "预测,时间序列,客流",
    amount: "48000",
    budget: 680,
    deadline: "2026-03-28",
    category: "时空",
    publisher: "普通用户",
    publisherId: 1001,
    publisherContact: "student_user@example.com",
    attachmentName: "canteen_example.csv",
    needStatus: "未承接",
    acceptedBy: ""
  }
];
