<script setup>
const props = defineProps({
  item: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(["open", "like", "favorite", "download"]);

function onOpen() {
  emit("open", props.item);
}
</script>

<template>
  <article class="card" @click="onOpen">
    <div class="card-main">
      <h3>{{ item.name }}</h3>

      <div class="pill-row">
        <span class="pill">{{ item.category }}</span>
        <span v-for="tag in String(item.tags).split(',')" :key="`${item.id}-${tag}`" class="pill">
          {{ tag.trim() }}
        </span>
      </div>

      <p class="info">{{ item.info }}</p>

      <div class="card-foot">
        <div class="publisher">
          <span class="avatar">{{ (item.seller || item.author || "?").charAt(0) }}</span>
          <span>{{ item.seller || item.author || "-" }}</span>
          <span class="dot">|</span>
          <span>{{ item.uploadDate }} 上传</span>
          <span class="dot">|</span>
          <span>{{ item.size }}</span>
          <span class="dot">|</span>
          <span>{{ item.price }} 积分</span>
        </div>

        <div class="stats" @click.stop>
          <button type="button" class="stat-item" @click="$emit('like', item)">
            <span class="stat-icon-wrap">
              <img class="stat-icon" :src="item.liked ? '/img/liked.png' : '/img/like.png'" alt="点赞" />
            </span>
            <span class="stat-value">{{ item.likes ?? 0 }}</span>
          </button>
          <button type="button" class="stat-item" @click="$emit('favorite', item)">
            <span class="stat-icon-wrap">
              <img class="stat-icon" :src="item.favorited ? '/img/favorited.png' : '/img/favorite.png'" alt="收藏" />
            </span>
            <span class="stat-value">{{ item.stars ?? 0 }}</span>
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
  border: 1px solid #eaedf3;
  border-radius: 14px;
  padding: 16px;
  background: #fff;
  cursor: pointer;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.card:hover {
  box-shadow: 0 10px 18px rgba(17, 24, 39, 0.08);
  transform: translateY(-1px);
}

.card-main h3 {
  margin: 0;
  color: #202a36;
  font-size: 30px;
  line-height: 1.2;
}

.pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.pill {
  border: 1px solid #e2e7ef;
  border-radius: 8px;
  padding: 4px 10px;
  color: #4e5d70;
  font-size: 13px;
  background: #fff;
}

.info {
  margin: 12px 0 0;
  color: #515d6d;
  font-size: 15px;
  line-height: 1.75;
}

.card-foot {
  margin-top: 14px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.publisher {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  color: #6a7484;
  font-size: 13px;
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
  gap: 8px;
  color: #6b7688;
  font-size: 14px;
}

.stat-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  border-radius: 8px;
  padding: 4px 6px;
  min-width: 88px;
  color: inherit;
  background: transparent;
  cursor: pointer;
}

.stat-item:hover {
  background: #f5f7fb;
}

.stat-icon-wrap {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon {
  width: 24px;
  height: 24px;
  display: block;
  object-fit: contain;
}

.stat-value {
  min-width: 34px;
  text-align: left;
  white-space: nowrap;
}

@media (max-width: 900px) {
  .card-main h3 {
    font-size: 24px;
  }

  .card-foot {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
