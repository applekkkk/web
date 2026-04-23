<script setup>
import { ref } from "vue";

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(["open", "like", "favorite", "download"]);
const likeAnimating = ref(false);
const favoriteAnimating = ref(false);

function triggerAnimation(type) {
  const target = type === "like" ? likeAnimating : favoriteAnimating;
  target.value = false;
  requestAnimationFrame(() => {
    target.value = true;
    setTimeout(() => {
      target.value = false;
    }, 460);
  });
}

function onOpen() {
  emit("open", props.item);
}

function onLikeClick() {
  triggerAnimation("like");
  emit("like", props.item);
}

function onFavoriteClick() {
  triggerAnimation("favorite");
  emit("favorite", props.item);
}

function displayAuthor(item) {
  return item?.author || item?.authorName || item?.author_name || item?.seller || "-";
}

function pointsTierClass(price) {
  const value = Number(price ?? 0);
  if (value <= 50) return "tier-low";
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
  <article class="card" @click="onOpen">
    <div class="card-main">
      <div class="card-head">
        <h3>{{ item.name }}</h3>
        <span class="points-badge" :class="pointsTierClass(item.price)">
          <span class="points-value">{{ item.price ?? 0 }} 积分</span>
        </span>
      </div>

      <div class="pill-row">
        <span class="pill type-pill" :class="categoryToneClass(item.category)">{{ item.category }}</span>
        <span v-for="tag in String(item.tags).split(',').filter(Boolean)" :key="`${item.id}-${tag}`" class="pill custom-pill">
          {{ tag.trim() }}
        </span>
      </div>

      <p class="info">{{ item.info }}</p>

      <div class="card-foot">
        <div class="publisher">
          <span>{{ displayAuthor(item) }}</span>
          <span class="dot">|</span>
          <span>{{ item.uploadDate }} 上传</span>
          <span class="dot">|</span>
          <span>{{ item.size }}</span>
        </div>

        <div class="stats" @click.stop>
          <button type="button" class="stat-item" :class="{ 'is-animating': likeAnimating }" @click="onLikeClick">
            <span class="stat-icon-wrap">
              <img class="stat-icon" :src="item.liked ? '/img/liked.png' : '/img/like.png'" alt="点赞" />
            </span>
            <span class="stat-value" :class="{ 'value-pop': likeAnimating }">{{ item.likes ?? 0 }}</span>
          </button>
          <button type="button" class="stat-item" :class="{ 'is-animating': favoriteAnimating }" @click="onFavoriteClick">
            <span class="stat-icon-wrap">
              <img class="stat-icon" :src="item.favorited ? '/img/favorited.png' : '/img/favorite.png'" alt="收藏" />
            </span>
            <span class="stat-value" :class="{ 'value-pop': favoriteAnimating }">{{ item.stars ?? 0 }}</span>
          </button>
          <button type="button" class="stat-item" @click="$emit('download', item)">
            <span class="stat-icon-wrap">
              <img class="stat-icon" src="/img/download.png" alt="下载" />
            </span>
            <span class="stat-value">{{ item.downloads ?? 0 }}</span>
          </button>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.card {
  position: relative;
  overflow: hidden;
  border: 1px solid #eaedf3;
  border-radius: 14px;
  padding: 14px;
  background: #fff;
  cursor: pointer;
  transition: box-shadow 0.28s ease, transform 0.28s ease, border-color 0.28s ease;
  animation: cardCascadeIn 0.54s cubic-bezier(0.2, 0.7, 0, 1) both;
  animation-delay: calc(var(--stagger, 0) * 72ms);
}

.card::before {
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

.card:hover {
  border-color: #d8e6ff;
  box-shadow: 0 14px 28px rgba(38, 76, 128, 0.16);
  transform: translateY(-4px);
}

.card:hover::before {
  transform: scaleX(1);
}

.card-main h3 {
  margin: 0;
  color: #202a36;
  font-family: var(--font-serif);
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.points-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  padding: 5px 12px;
  border: 1px solid transparent;
  white-space: nowrap;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72), 0 2px 8px rgba(17, 24, 39, 0.06);
}

.points-badge.tier-low {
  border-color: #8fddb0;
  background: linear-gradient(180deg, #effcf4, #e1f8ea);
  color: #0f8d48;
}

.points-badge.tier-mid {
  border-color: #ead08a;
  background: linear-gradient(180deg, #fff8e6, #fff2ce);
  color: #936000;
}

.points-badge.tier-high {
  border-color: #f0a3a3;
  background: linear-gradient(180deg, #fff0f0, #ffdede);
  color: #b93a3a;
}

.points-value {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.pill {
  border: 1px solid #e2e7ef;
  border-radius: 8px;
  padding: 3px 9px;
  color: #4e5d70;
  font-size: 12px;
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

.info {
  margin: 9px 0 0;
  color: #515d6d;
  font-size: 14px;
  line-height: 1.6;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-word;
}

.card-foot {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.publisher {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  color: #6a7484;
  font-size: 12px;
}

.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  color: #374151;
  font-size: 11px;
  font-weight: 700;
  background: #eef2f7;
}

.dot {
  color: #c3c8d2;
}

.stats {
  display: flex;
  gap: 6px;
  color: #6b7688;
  font-size: 13px;
  opacity: 1;
  transform: none;
  pointer-events: auto;
}

.stat-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  border-radius: 8px;
  padding: 3px 6px;
  min-width: 74px;
  color: inherit;
  background: transparent;
  cursor: pointer;
}

.stat-item:hover {
  background: #f5f7fb;
}

.stat-item.is-animating .stat-icon-wrap {
  animation: likeBounce 0.42s cubic-bezier(0.2, 0.9, 0.2, 1);
}

.stat-item.is-animating:nth-child(2) .stat-icon-wrap {
  animation-name: favoriteGlow;
}

.stat-icon-wrap {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon {
  width: 20px;
  height: 20px;
  display: block;
  object-fit: contain;
}

.stat-value {
  font-family: var(--font-mono);
  min-width: 26px;
  text-align: left;
  white-space: nowrap;
}

.value-pop {
  animation: valueRise 0.38s ease;
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

@keyframes likeBounce {
  0% {
    transform: scale(1);
  }
  35% {
    transform: scale(1.26);
  }
  70% {
    transform: scale(0.95);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes favoriteGlow {
  0% {
    transform: scale(1);
    filter: drop-shadow(0 0 0 rgba(255, 193, 59, 0));
  }
  35% {
    transform: scale(1.2);
    filter: drop-shadow(0 0 8px rgba(255, 193, 59, 0.52));
  }
  100% {
    transform: scale(1);
    filter: drop-shadow(0 0 0 rgba(255, 193, 59, 0));
  }
}

@keyframes valueRise {
  0% {
    opacity: 0.65;
    transform: translateY(2px);
  }
  45% {
    opacity: 1;
    transform: translateY(-2px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .stat-item.is-animating .stat-icon-wrap,
  .value-pop {
    animation: none;
  }
}

@media (max-width: 900px) {
  .card-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .card-main h3 {
    font-size: 19px;
  }

  .card-foot {
    flex-direction: column;
    align-items: flex-start;
  }

  .stats {
    opacity: 1;
    transform: none;
    pointer-events: auto;
  }
}
</style>
