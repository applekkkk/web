import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { customNeeds as seedNeeds } from "../mock/data";

const NEEDS_STATE_KEY = "trade-needs-state";
const LEGACY_NEEDS_KEY = "trade-needs";
const SEED_MAP = new Map(seedNeeds.map((item) => [String(item.id), item]));

function getSeedById(id) {
  const raw = String(id || "");
  if (!raw) return null;
  return SEED_MAP.get(raw) || SEED_MAP.get(raw.split("-M")[0]) || null;
}

export const useNeedsStore = defineStore("needs", () => {
  const state = ref(loadState());

  const marketNeeds = computed(() => state.value.marketNeeds);
  const acceptedNeeds = computed(() => state.value.acceptedNeeds);
  const allNeeds = computed(() => [...state.value.marketNeeds, ...state.value.acceptedNeeds]);

  function normalizeNeed(item) {
    const seed = getSeedById(item.id) || {};
    const acceptedBy = item.acceptedBy || "";
    const needStatus = item.needStatus || seed.needStatus || (acceptedBy ? "进行中" : "未承接");
    return {
      id: item.id,
      title: item.title || seed.title || "",
      description: item.description || seed.description || "",
      amount: item.amount || seed.amount || "",
      tags: item.tags || seed.tags || "",
      budget: Number(item.budget || seed.budget || 0),
      deadline: item.deadline || seed.deadline || "",
      category: item.category || seed.category || "其他",
      publisher: item.publisher || seed.publisher || "",
      publisherId: item.publisherId ?? seed.publisherId ?? null,
      publisherContact: item.publisherContact || seed.publisherContact || "",
      attachmentName: item.attachmentName || seed.attachmentName || "",
      acceptedBy,
      needStatus,
      deliveryFileName: item.deliveryFileName || seed.deliveryFileName || ""
    };
  }

  function splitByAccepted(list) {
    const market = [];
    const accepted = [];
    list.forEach((item) => {
      const normalized = normalizeNeed(item);
      if (normalized.acceptedBy) accepted.push(normalized);
      else market.push(normalized);
    });
    return { marketNeeds: market, acceptedNeeds: accepted };
  }

  function withSeedIfEmpty(payload) {
    const market = Array.isArray(payload.marketNeeds) ? payload.marketNeeds : [];
    const accepted = Array.isArray(payload.acceptedNeeds) ? payload.acceptedNeeds : [];
    const normalizedMarket = market.map(normalizeNeed);
    const normalizedAccepted = accepted.map(normalizeNeed);
    const existing = new Set([...normalizedMarket, ...normalizedAccepted].map((item) => String(item.id)));
    const seedSplit = splitByAccepted(seedNeeds);
    seedSplit.marketNeeds.forEach((item) => {
      if (!existing.has(String(item.id))) normalizedMarket.push(item);
    });
    seedSplit.acceptedNeeds.forEach((item) => {
      if (!existing.has(String(item.id))) normalizedAccepted.push(item);
    });
    if (!market.length) {
      const usedIds = new Set([...normalizedMarket, ...normalizedAccepted].map((item) => item.id));
      const seedMarket = seedSplit.marketNeeds;
      let fallbackMarket = seedMarket.filter((item) => !usedIds.has(item.id));
      if (!fallbackMarket.length && seedMarket.length) {
        fallbackMarket = seedMarket.map((item, index) => ({
          ...item,
          id: `${item.id}-M${index + 1}`,
          acceptedBy: ""
        }));
      }
      if (fallbackMarket.length) {
        return { marketNeeds: fallbackMarket, acceptedNeeds: normalizedAccepted };
      }
    }
    if (normalizedMarket.length || normalizedAccepted.length) {
      return { marketNeeds: normalizedMarket, acceptedNeeds: normalizedAccepted };
    }
    return seedSplit;
  }

  function loadState() {
    const rawState = localStorage.getItem(NEEDS_STATE_KEY);
    if (rawState) {
      try {
        const parsed = JSON.parse(rawState);
        if (Array.isArray(parsed)) {
          const migratedFromArray = splitByAccepted(parsed);
          const normalized = withSeedIfEmpty(migratedFromArray);
          localStorage.setItem(NEEDS_STATE_KEY, JSON.stringify(normalized));
          return normalized;
        }
        const normalized = withSeedIfEmpty({
          marketNeeds: parsed.marketNeeds || [],
          acceptedNeeds: parsed.acceptedNeeds || []
        });
        localStorage.setItem(NEEDS_STATE_KEY, JSON.stringify(normalized));
        return normalized;
      } catch {
        // ignore
      }
    }

    const legacyRaw = localStorage.getItem(LEGACY_NEEDS_KEY);
    if (legacyRaw) {
      try {
        const legacy = JSON.parse(legacyRaw);
        const market = [];
        const accepted = [];
        legacy.forEach((item) => {
          const normalized = normalizeNeed(item);
          const isAccepted = Boolean(item.acceptedBy);
          if (isAccepted) accepted.push(normalized);
          else market.push(normalized);
        });
        const migrated = withSeedIfEmpty({ marketNeeds: market, acceptedNeeds: accepted });
        localStorage.setItem(NEEDS_STATE_KEY, JSON.stringify(migrated));
        return migrated;
      } catch {
        // ignore
      }
    }

    const initial = splitByAccepted(seedNeeds);
    localStorage.setItem(NEEDS_STATE_KEY, JSON.stringify(initial));
    return initial;
  }

  function persist() {
    localStorage.setItem(NEEDS_STATE_KEY, JSON.stringify(state.value));
  }

  function publishNeed(payload) {
    const nextId = `CUST-${String(allNeeds.value.length + 1).padStart(3, "0")}`;
    const newNeed = normalizeNeed({
      id: nextId,
      title: payload.title,
      description: payload.description,
      amount: payload.amount,
      tags: payload.tags,
      budget: payload.budget,
      deadline: payload.deadline,
      category: payload.category,
      publisher: payload.publisher,
      publisherId: payload.publisherId,
      publisherContact: payload.publisherContact,
      attachmentName: payload.attachmentName,
      acceptedBy: "",
      needStatus: "未承接",
      deliveryFileName: ""
    });

    state.value.marketNeeds.unshift(newNeed);
    persist();
    return newNeed;
  }

  function acceptNeed(id, username) {
    const idx = state.value.marketNeeds.findIndex((item) => item.id === id);
    if (idx === -1) return { ok: false, reason: "not_found" };

    const item = state.value.marketNeeds[idx];
    if (item.publisher === username) return { ok: false, reason: "self" };

    state.value.marketNeeds.splice(idx, 1);
    state.value.acceptedNeeds.unshift({ ...item, acceptedBy: username, needStatus: "进行中" });
    persist();
    return { ok: true };
  }

  function deliverTask(id, username, fileName) {
    const idx = state.value.acceptedNeeds.findIndex((item) => item.id === id);
    if (idx === -1) return { ok: false, reason: "not_found" };
    const target = state.value.acceptedNeeds[idx];
    if (target.acceptedBy !== username) return { ok: false, reason: "forbidden" };
    if (!["进行中", "已交付"].includes(target.needStatus)) return { ok: false, reason: "status" };
    state.value.acceptedNeeds[idx] = {
      ...target,
      needStatus: "已交付",
      deliveryFileName: fileName || target.deliveryFileName || ""
    };
    persist();
    return { ok: true };
  }

  return {
    marketNeeds,
    acceptedNeeds,
    allNeeds,
    publishNeed,
    acceptNeed,
    deliverTask
  };
});
