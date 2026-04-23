<script setup>
const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  rightMode: {
    type: String,
    default: "status" // status | points
  },
  showAction: {
    type: Boolean,
    default: true
  },
  clickable: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["accept", "open"]);

function onOpen() {
  if (!props.clickable) return;
  emit("open", props.item);
}

function statusText(item) {
  const raw = item.needStatus;
  if (typeof raw === "number") {
    if (raw === 1) return "进行中";
    if (raw === 2) return "待发布者确认";
    if (raw === 3) return "已完成";
    return "未承接";
  }
  if (typeof raw === "string" && raw.trim()) return raw;
  return item.acceptedBy ? "进行中" : "未承接";
}

function statusClass(item) {
  const status = statusText(item);
  if (status === "进行中") return "in-progress";
  if (status === "已交付") return "delivered";
  if (status === "已完成") return "done";
  return "pending";
}

function rewardText(item) {
  return `${item.budget ?? 0}`;
}

function rewardTierClass(item) {
  const value = Number(item?.budget ?? 0);
  if (value <= 9) return "tier-low";
  if (value <= 99) return "tier-mid";
  return "tier-high";
}

function categoryToneClass(category) {
  const text = String(category || "").toLowerCase();
  if (text.includes("生物") || text.includes("基因") || text.includes("医疗") || text.includes("生命")) return "tone-bio";
  if (text.includes("金融") || text.includes("股票") || text.includes("证券") || text.includes("交易")) return "tone-finance";
  if (text.includes("图数据") || text.includes("图") || text.includes("graph")) return "tone-graph";
  if (text.includes("社会") || text.includes("社交") || text.includes("关系网") || text.includes("网络")) return "tone-social";
  return "tone-default";
}
</script>

<template>
  <article class="need-card" :class="{ clickable }" @click="onOpen">
    <div class="head">
      <h3>{{ item.title }}</h3>
      <span v-if="rightMode === 'points'" class="reward-badge" :class="rewardTierClass(item)">
        <span class="reward-label">积分</span>
        <span class="reward-value">{{ rewardText(item) }}</span>
      </span>
      <span v-else class="status" :class="statusClass(item)">{{ statusText(item) }}</span>
    </div>

    <p class="desc">{{ item.description || "暂无详细任务描述。" }}</p>

    <div class="pill-row">
      <span class="pill type-pill" :class="categoryToneClass(item.category || '其他')">{{ item.category || "其他" }}</span>
      <span
        v-for="tag in String(item.tags || '').split(',').filter(Boolean)"
        :key="`${item.id}-${tag}`"
        class="pill custom-pill"
      >
        {{ tag.trim() }}
      </span>
    </div>

    <div class="meta">
      <span>发布者：{{ item.publisher || "-" }}</span>
      <span>预算：{{ item.budget }} 积分</span>
      <span v-if="item.acceptedBy">承接人：{{ item.acceptedBy }}</span>
    </div>

    <div v-if="showAction" class="actions" @click.stop>
      <button type="button" class="accept-btn" @click="$emit('accept', item)">承接任务</button>
    </div>
  </article>
</template>

<style scoped>
.need-card {
  position: relative;
  overflow: hidden;
  border: 1px solid #e4eaf5;
  border-radius: 14px;
  padding: 14px;
  background: #fff;
  transition: box-shadow 0.28s ease, transform 0.28s ease, border-color 0.28s ease;
  animation: cardCascadeIn 0.54s cubic-bezier(0.2, 0.7, 0, 1) both;
  animation-delay: calc(var(--stagger, 0) * 72ms);
}

.need-card::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 3px;
  transform: scaleX(0);
  transform-origin: left center;
  background: linear-gradient(90deg, #3f8cff, #67b4ff, #8bd3ff);
  transition: transform 0.26s ease;
}

.need-card.clickable {
  cursor: pointer;
}

.need-card:hover {
  border-color: #d8e6ff;
  box-shadow: 0 14px 28px rgba(38, 76, 128, 0.16);
  transform: translateY(-4px);
}

.need-card:hover::before,
.need-card:focus-within::before {
  transform: scaleX(1);
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

h3 {
  margin: 0;
  color: #1f2d40;
  font-family: var(--font-serif);
  font-size: 22px;
  font-weight: 700;
}

.status {
  border-radius: 999px;
  padding: 3px 10px;
  font-family: var(--font-mono);
  font-size: 11px;
  border: 1px solid #d6deeb;
}

.status.pending {
  color: #6f7c90;
  background: #f4f7fb;
}

.status.in-progress {
  color: #245a95;
  background: #eaf2ff;
  border-color: #bfd3f2;
}

.status.delivered {
  color: #946124;
  background: #fff6e7;
  border-color: #ead3ae;
}

.status.done {
  color: #2a7a3f;
  background: #e8f8ee;
  border-color: #bde5c8;
}

.reward-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: 999px;
  padding: 5px 12px;
  border: 1px solid transparent;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72), 0 2px 8px rgba(17, 24, 39, 0.06);
}

.reward-badge.tier-low {
  border-color: #8fddb0;
  background: linear-gradient(180deg, #effcf4, #e1f8ea);
  color: #0f8d48;
}

.reward-badge.tier-mid {
  border-color: #ead08a;
  background: linear-gradient(180deg, #fff8e6, #fff2ce);
  color: #936000;
}

.reward-badge.tier-high {
  border-color: #f0a3a3;
  background: linear-gradient(180deg, #fff0f0, #ffdede);
  color: #b93a3a;
}

.reward-label {
  font-size: 11px;
  opacity: 0.85;
}

.reward-value {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.desc {
  margin: 8px 0 0;
  color: #4d5b70;
  font-size: 14px;
  line-height: 1.6;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-word;
}

.pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 8px;
}

.pill {
  border: 1px solid #dce4f1;
  border-radius: 8px;
  padding: 3px 7px;
  color: #40536f;
  font-size: 11px;
  background: #fff;
}

.type-pill {
  border-color: #bfd4f7;
  color: #3b6ab0;
  background: #edf4ff;
}

.type-pill.tone-bio {
  border-color: #8fdcaf;
  color: #1c7c46;
  background: #ecfbf2;
}

.type-pill.tone-finance {
  border-color: #eccf8f;
  color: #9a6400;
  background: #fff8e8;
}

.type-pill.tone-graph {
  border-color: #cdb3ff;
  color: #6f42c1;
  background: #f5efff;
}

.type-pill.tone-social {
  border-color: #f3b2dc;
  color: #b33b86;
  background: #fff0f9;
}

.custom-pill {
  border-color: #d7dee9;
  color: #5b687a;
  background: transparent;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
  color: #6f7f95;
  font-size: 12px;
}

.actions {
  margin-top: 10px;
}

.accept-btn {
  border: 1px solid #2f5a90;
  border-radius: 8px;
  padding: 6px 11px;
  color: #fff;
  background: #2f5a90;
  cursor: pointer;
}

@keyframes cardCascadeIn {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.985);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
