function sleep(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const previewRows = [
  { order_id: "ORD-0041", user_id: "u_2291", price_cny: "¥362.0", tier: "silver" },
  { order_id: "ORD-0042", user_id: "-", price_cny: "-", tier: "-" },
  { order_id: "ORD-0043", user_id: "u_8129", price_cny: "¥5,104.0", tier: "gold" },
  { order_id: "ORD-0044", user_id: "u_0128", price_cny: "¥58.6", tier: "bronze" }
];

export async function getLoadedDatasetInfo() {
  await sleep();
  return {
    fileName: "orders_2024.csv",
    rowCount: 2341
  };
}

export async function runProcessTask(payload) {
  await sleep(900);
  return {
    taskId: `mock-task-${Date.now()}`,
    pointsCost: 10,
    instruction: payload?.instruction || "",
    module: payload?.module || "cleaning"
  };
}

export async function uploadDatasetFile(file) {
  await sleep(500);
  const rawName = file?.name || "uploaded.csv";
  return {
    fileName: rawName,
    rowCount: 2341
  };
}

export async function getProcessPreview() {
  await sleep();
  return {
    addedFieldCount: 3,
    cleanedCount: 1,
    rows: previewRows
  };
}

export async function getFieldAnalysis() {
  await sleep();
  return {
    fieldCount: 6,
    totalRows: 2341,
    validRows: 2187,
    nullRemoved: 154,
    qualityScore: 96
  };
}

export async function getAnalysisReport() {
  await sleep();
  return {
    markdown: `## 数据分析报告

- **数据量**：2,341 行，覆盖 6 个核心字段
- **有效率**：93.4%（2,187 / 2,341）
- **异常处理**：已删除空值与异常记录 154 行
- **质量评分**：96 / 100
- **数据价值**：高（适合用户分层、消费画像与交易预测）

### 建议

1. 保留 \`tier\` 字段用于下游分群。
2. 上传市场前补充字段说明文档，提升可复用性。
3. 推荐同步输出清洗日志，便于审计追踪。`
  };
}

export async function downloadProcessedCsv() {
  await sleep(200);
  return [
    "order_id,user_id,price_cny,tier",
    "ORD-0041,u_2291,362.0,silver",
    "ORD-0043,u_8129,5104.0,gold",
    "ORD-0044,u_0128,58.6,bronze"
  ].join("\n");
}

export async function saveProcessedToMarket() {
  await sleep(500);
  return {
    id: 9527,
    message: "处理结果已保存，可继续上传到市场"
  };
}
