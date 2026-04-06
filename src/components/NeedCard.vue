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
</script>

<template>
  <article class="need-card" :class="{ clickable }" @click="onOpen">
    <div class="head">
      <h3>{{ item.title }}</h3>
      <span v-if="rightMode === 'points'" class="reward-badge">
        <span class="reward-label">积分</span>
        <span class="reward-value">{{ rewardText(item) }}</span>
      </span>
      <span v-else class="status" :class="statusClass(item)">{{ statusText(item) }}</span>
    </div>

    <p class="desc">{{ item.description || "暂无详细任务描述。" }}</p>

    <div class="pill-row">
      <span class="pill type-pill">{{ item.category || "其他" }}</span>
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
  border: 1px solid #e4eaf5;
  border-radius: 12px;
  padding: 12px;
  background: #fff;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.need-card.clickable {
  cursor: pointer;
}

.need-card.clickable:hover {
  box-shadow: 0 10px 18px rgba(17, 24, 39, 0.08);
  transform: translateY(-1px);
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
  font-size: 17px;
}

.status {
  border-radius: 999px;
  padding: 2px 9px;
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
  padding: 4px 12px;
  background: #e8f8ee;
  border: 1px solid #9ddfb4;
  color: #0e8a43;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.reward-label {
  font-size: 11px;
  opacity: 0.85;
}

.reward-value {
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
  border-color: #b9d6ff;
  color: #2563c9;
  background: #ecf5ff;
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
</style>
