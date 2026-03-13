<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import DatasetCard from "../../components/DatasetCard.vue";
import NeedCard from "../../components/NeedCard.vue";
import { useAuthStore } from "../../stores/auth";
import { customRequestApi, orderApi, productApi } from "../../services/api";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const tabs = ["收藏", "个人仓库（已购买的数据）", "我的数据（本人上传的）", "我的订单", "发布任务", "承接任务"];
const datasetTabs = ["收藏", "个人仓库（已购买的数据）", "我的数据（本人上传的）"];
const needTabs = ["发布任务", "承接任务"];
const orderTabs = ["我的订单"];

const activeTab = ref(tabs[0]);
const purchasedDatasets = ref([]);
const myDatasets = ref([]);
const favoriteDatasets = ref([]);
const publishedNeeds = ref([]);
const acceptedNeeds = ref([]);
const orders = ref([]);

const datasetLoading = ref(false);
const needsLoading = ref(false);
const ordersLoading = ref(false);

const avatarUrl = computed(() => auth.user?.avatar || "/img/avatar.png");
const userName = computed(() => auth.user?.name || "未命名用户");
const userPoints = computed(() => Number(auth.user?.points ?? 0));
const userId = computed(() => auth.user?.id ?? null);
const userBio = computed(() => auth.user?.bio || "快来介绍一下自己");
const today = computed(() => new Date().toISOString().slice(0, 10));

const tabDatasets = computed(() => {
  if (activeTab.value === "收藏") return favoriteDatasets.value;
  if (activeTab.value === "个人仓库（已购买的数据）") return purchasedDatasets.value;
  if (activeTab.value === "我的数据（本人上传的）") return myDatasets.value;
  return [];
});

const tabNeeds = computed(() => {
  if (activeTab.value === "发布任务") return publishedNeeds.value;
  if (activeTab.value === "承接任务") return acceptedNeeds.value;
  return [];
});

const displayOrders = computed(() => orders.value.map(normalizeOrder));

watch(
  () => route.query.tab,
  (tab) => {
    const value = String(tab || "");
    if (tabs.includes(value)) activeTab.value = value;
  },
  { immediate: true }
);

watch(
  [activeTab, userId],
  async () => {
    await loadTabData();
  },
  { immediate: true }
);

function normalizeProduct(item) {
  return {
    ...item,
    id: item.id,
    name: item.name || "",
    info: item.info || "",
    category: item.category || "其他",
    tags: item.tags || "",
    price: Number(item.price || 0),
    size: item?.size ?? item?.sizeLabel ?? item?.size_label ?? "-",
    author: item?.author ?? item?.authorName ?? item?.author_name ?? item?.seller ?? "",
    uploadDate: item?.uploadDate ?? item?.upload_date ?? "",
    purchased: Boolean(item.purchased),
    likes: Number(item.likes || 0),
    stars: Number(item.stars || 0),
    downloads: Number(item.downloads || 0),
    liked: Boolean(item.liked),
    favorited: Boolean(item.favorited),
    fileName: item.fileName ?? item.file_name ?? ""
  };
}

function normalizeNeed(item) {
  const statusCode = Number(item.needStatus ?? item.need_status ?? 0);
  let statusText = "未承接";
  if (statusCode === 1) statusText = "进行中";
  if (statusCode === 2) statusText = "已完成";
  return {
    id: item.id,
    title: item.title || "",
    description: item.description || "",
    category: item.category || "其他",
    tags: item.tags || "",
    budget: Number(item.budget || 0),
    deadline: item.deadline || "",
    publisher: item.publisherName ?? item.publisher_name ?? "",
    publisherId: item.publisherId ?? item.publisher_id ?? null,
    acceptedBy: item.acceptorName ?? item.acceptor_name ?? "",
    acceptorId: item.acceptorId ?? item.acceptor_id ?? null,
    attachmentName: item.attachmentName ?? item.attachment_name ?? "",
    needStatus: statusText
  };
}

function normalizeOrder(item) {
  const amount = Number(item.amount ?? 0);
  const type = amount >= 0 ? "承接任务" : "购买数据";
  const title = item.productName || (amount >= 0 ? "承接任务" : "购买数据");
  return {
    id: item.id,
    orderNo: item.orderNo,
    productId: item.productId,
    amount,
    type,
    title,
    createdAt: item.createdAt || ""
  };
}

function dedupeProducts(list) {
  const map = new Map();
  list.forEach((item) => {
    if (!item?.id) return;
    if (!map.has(item.id)) map.set(item.id, item);
  });
  return Array.from(map.values());
}

function amountText(amount) {
  return amount > 0 ? `+${amount}` : `${amount}`;
}

function onAvatarError(event) {
  event.target.src = "/img/avatar.png";
}

function goEditProfile() {
  router.push(route.path.startsWith("/admin") ? "/admin/profile/edit" : "/user/profile/edit");
}

function goDatasetDetail(id) {
  if (route.path.startsWith("/admin")) return;
  const url = router.resolve({ path: `/user/market/${id}` }).href;
  window.open(url, "_blank");
}

function goNeedDetail(item) {
  if (route.path.startsWith("/admin")) return;
  const url = router.resolve({ path: `/user/custom-bids/${item.id}` }).href;
  window.open(url, "_blank");
}

function purchasedIdSet(orderList) {
  return new Set(
    orderList
      .filter((item) => Number(item.amount ?? 0) < 0)
      .map((item) => Number(item.productId))
      .filter((id) => Number.isFinite(id) && id > 0)
  );
}

async function fetchOrders(silent = false) {
  if (!userId.value) return [];
  if (!silent) ordersLoading.value = true;
  try {
    const res = await orderApi.getUserList(userId.value);
    if (res?.code !== 200) {
      throw new Error(res?.message || "加载订单失败");
    }
    const list = Array.isArray(res?.data) ? res.data : [];
    orders.value = list;
    return list;
  } catch (e) {
    orders.value = [];
    if (!silent) ElMessage.error(e?.message || "加载订单失败");
    return [];
  } finally {
    if (!silent) ordersLoading.value = false;
  }
}

async function fetchPurchasedDatasets(sourceOrders) {
  const orderList = Array.isArray(sourceOrders) ? sourceOrders : orders.value;
  const ids = Array.from(purchasedIdSet(orderList));
  if (ids.length === 0) {
    purchasedDatasets.value = [];
    return;
  }

  const tasks = ids.map(async (id) => {
    try {
      const res = await productApi.getById(id, { userId: userId.value });
      if (res?.code !== 200 || !res?.data) return null;
      return normalizeProduct({ ...res.data, purchased: true });
    } catch {
      return null;
    }
  });
  const list = await Promise.all(tasks);
  purchasedDatasets.value = dedupeProducts(list.filter(Boolean));
}

async function fetchFavoriteDatasets(silent = false) {
  if (!userId.value) return;
  if (!silent) datasetLoading.value = true;
  try {
    const [favoriteRes, orderList] = await Promise.all([productApi.getFavoriteProducts(userId.value), fetchOrders(true)]);
    if (favoriteRes?.code !== 200) {
      throw new Error(favoriteRes?.message || "加载收藏失败");
    }
    const purchasedSet = purchasedIdSet(orderList);
    const list = Array.isArray(favoriteRes?.data) ? favoriteRes.data : [];
    favoriteDatasets.value = list.map((item) =>
      normalizeProduct({
        ...item,
        purchased: purchasedSet.has(Number(item.id))
      })
    );
  } catch (e) {
    favoriteDatasets.value = [];
    if (!silent) ElMessage.error(e?.message || "加载收藏失败");
  } finally {
    if (!silent) datasetLoading.value = false;
  }
}

async function fetchMyDatasets(silent = false) {
  if (!userId.value) return;
  if (!silent) datasetLoading.value = true;
  try {
    const res = await productApi.getUserProducts(userId.value);
    if (res?.code !== 200) {
      throw new Error(res?.message || "加载我的数据失败");
    }
    const list = Array.isArray(res?.data) ? res.data : [];
    myDatasets.value = list.map((item) => normalizeProduct(item));
  } catch (e) {
    myDatasets.value = [];
    if (!silent) ElMessage.error(e?.message || "加载我的数据失败");
  } finally {
    if (!silent) datasetLoading.value = false;
  }
}

async function fetchNeeds(silent = false) {
  if (!userId.value) return;
  if (!silent) needsLoading.value = true;
  try {
    const [publishedRes, allRes] = await Promise.all([customRequestApi.getUserList(userId.value), customRequestApi.getAll()]);
    if (publishedRes?.code !== 200) {
      throw new Error(publishedRes?.message || "加载任务失败");
    }
    if (allRes?.code !== 200) {
      throw new Error(allRes?.message || "加载任务失败");
    }
    const publishedList = Array.isArray(publishedRes?.data) ? publishedRes.data : [];
    const allList = Array.isArray(allRes?.data) ? allRes.data : [];
    publishedNeeds.value = publishedList.map(normalizeNeed);
    acceptedNeeds.value = allList
      .filter((item) => Number(item.acceptorId ?? item.acceptor_id ?? 0) === Number(userId.value))
      .map(normalizeNeed);
  } catch (e) {
    publishedNeeds.value = [];
    acceptedNeeds.value = [];
    if (!silent) ElMessage.error(e?.message || "加载任务失败");
  } finally {
    if (!silent) needsLoading.value = false;
  }
}

async function loadTabData() {
  if (!userId.value) return;
  if (orderTabs.includes(activeTab.value)) {
    await fetchOrders(false);
    return;
  }
  if (activeTab.value === "个人仓库（已购买的数据）") {
    datasetLoading.value = true;
    const orderList = await fetchOrders(true);
    await fetchPurchasedDatasets(orderList);
    datasetLoading.value = false;
    return;
  }
  if (activeTab.value === "我的数据（本人上传的）") {
    await fetchMyDatasets(false);
    return;
  }
  if (activeTab.value === "收藏") {
    await fetchFavoriteDatasets(false);
    return;
  }
  if (needTabs.includes(activeTab.value)) {
    await fetchNeeds(false);
  }
}

async function toggleLike(item) {
  if (!auth.user?.id) {
    ElMessage.warning("请先登录");
    return;
  }
  try {
    const res = await productApi.setLike(item.id, auth.user.id, !item.liked);
    if (res?.code !== 200 || !res?.data) {
      throw new Error(res?.message || "点赞失败");
    }
    item.likes = Number(res.data.likes ?? 0);
    item.stars = Number(res.data.stars ?? item.stars ?? 0);
    item.liked = Boolean(res.data.liked);
    item.favorited = Boolean(res.data.favorited);
  } catch (e) {
    ElMessage.error(e?.message || "点赞失败");
  }
}

async function toggleFavorite(item) {
  if (!auth.user?.id) {
    ElMessage.warning("请先登录");
    return;
  }
  try {
    const res = await productApi.setFavorite(item.id, auth.user.id, !item.favorited);
    if (res?.code !== 200 || !res?.data) {
      throw new Error(res?.message || "收藏失败");
    }
    item.likes = Number(res.data.likes ?? item.likes ?? 0);
    item.stars = Number(res.data.stars ?? 0);
    item.liked = Boolean(res.data.liked);
    item.favorited = Boolean(res.data.favorited);
    if (activeTab.value === "收藏" && !item.favorited) {
      favoriteDatasets.value = favoriteDatasets.value.filter((dataset) => dataset.id !== item.id);
    }
  } catch (e) {
    ElMessage.error(e?.message || "收藏失败");
  }
}

function handleDownload(item) {
  if (!item.purchased) {
    ElMessage.warning("未购买");
    return;
  }
  item.downloads = (item.downloads ?? 0) + 1;
  ElMessage.success("下载成功");
}
</script>

<template>
  <section class="profile-page">
    <header class="profile-head">
      <img class="avatar" :src="avatarUrl" alt="用户头像" @error="onAvatarError" />
      <div class="head-main">
        <h1>{{ userName }}</h1>
        <p class="intro">{{ userBio }}</p>
      </div>
      <div class="head-right">
        <span class="points">积分：{{ userPoints }}</span>
        <span class="last-login">上次登录时间：{{ today }}</span>
        <button class="edit-btn" @click="goEditProfile">编辑个人资料</button>
      </div>
    </header>

    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab"
        type="button"
        class="tab-btn"
        :class="{ active: activeTab === tab }"
        @click="activeTab = tab"
      >
        {{ tab }}
      </button>
    </div>

    <template v-if="datasetTabs.includes(activeTab)">
      <section v-loading="datasetLoading">
        <section v-if="tabDatasets.length" class="cards-grid">
          <DatasetCard
            v-for="item in tabDatasets"
            :key="item.id"
            :item="item"
            @open="goDatasetDetail(item.id)"
            @like="toggleLike"
            @favorite="toggleFavorite"
            @download="handleDownload"
          />
        </section>
        <p v-else class="empty-text">当前栏目暂无数据。</p>
      </section>
    </template>

    <template v-else-if="needTabs.includes(activeTab)">
      <section v-loading="needsLoading">
        <section v-if="tabNeeds.length" class="cards-grid">
          <NeedCard v-for="item in tabNeeds" :key="item.id" :item="item" :show-action="false" clickable @open="goNeedDetail" />
        </section>
        <p v-else class="empty-text">当前栏目暂无任务。</p>
      </section>
    </template>

    <template v-else-if="orderTabs.includes(activeTab)">
      <section class="orders-card" v-loading="ordersLoading">
        <table>
          <thead>
            <tr>
              <th>订单号</th>
              <th>类型</th>
              <th>内容</th>
              <th>积分变动</th>
              <th>时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in displayOrders" :key="item.id">
              <td>{{ item.orderNo || item.id }}</td>
              <td>{{ item.type }}</td>
              <td>{{ item.title }}</td>
              <td :class="item.amount >= 0 ? 'amount plus' : 'amount minus'">
                {{ amountText(item.amount) }}
              </td>
              <td>{{ item.createdAt }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="!ordersLoading && displayOrders.length === 0" class="empty-text">当前栏目暂无订单。</p>
      </section>
    </template>

    <p v-else class="content-tip">该栏目内容正在建设中。</p>
  </section>
</template>

<style scoped>
.profile-page {
  display: grid;
  gap: 16px;
}

.profile-head {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 18px;
  align-items: center;
  border-radius: 18px;
  padding: 20px 24px;
  background: linear-gradient(145deg, #e8f0fb, #f3f7ff);
  border: 1px solid #d9e4f5;
}

.avatar {
  width: 78px;
  height: 78px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #fff;
}

.head-main h1 {
  margin: 0;
  color: #1f2a37;
  font-size: 40px;
}

.intro {
  margin: 10px 0 0;
  color: #8a96a6;
}

.head-right {
  display: grid;
  justify-items: end;
  gap: 12px;
}

.last-login {
  color: #8091a8;
  font-size: 14px;
}

.points {
  color: #2f578d;
  font-size: 14px;
  font-weight: 600;
}

.edit-btn {
  border: 1px solid #c3d3ee;
  border-radius: 999px;
  padding: 8px 18px;
  color: #2f578d;
  background: #fff;
  cursor: pointer;
}

.tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  border-bottom: 1px solid #e6e9ef;
  padding-bottom: 10px;
}

.tab-btn {
  border: none;
  background: transparent;
  color: #3f4b5c;
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.tab-btn.active {
  color: #2c7cf6;
  border-bottom-color: #2c7cf6;
}

.content-tip {
  margin: 10px 0 0;
  color: #718096;
}

.cards-grid {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.orders-card {
  margin-top: 10px;
  border: 1px solid #e4ebf6;
  border-radius: 16px;
  padding: 14px 16px;
  background: #fff;
  box-shadow: 0 10px 24px rgba(16, 24, 40, 0.05);
}

.orders-card table {
  width: 100%;
  border-collapse: collapse;
}

.orders-card th,
.orders-card td {
  border-bottom: 1px solid #e5ecf7;
  padding: 10px 8px;
  text-align: left;
  font-size: 13px;
}

.amount.plus {
  color: #2a7a3f;
}

.amount.minus {
  color: #a74141;
}

.empty-text {
  color: #7b8797;
}

@media (max-width: 900px) {
  .profile-head {
    grid-template-columns: 1fr;
    justify-items: start;
  }

  .head-right {
    justify-items: start;
  }
}
</style>
