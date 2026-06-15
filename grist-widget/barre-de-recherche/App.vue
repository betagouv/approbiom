<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import {
  fetchAllTables,
  fetchAllColumns,
  getTableNumericalId,
  getColumnsFromTable,
  getChoiceOrChoiceListColumns,
  type ColumnInfo,
} from "@shared/utils/grist";
import ConfigPanel from "./ConfigPanel.vue";
import TagFilterBar from "./TagFilterBar.vue";

type GristRecord = { id: number; [key: string]: unknown };

interface TagFilter {
  colId: string;
  value: string;
  colType: "Choice" | "ChoiceList";
}

function isTagFilter(v: unknown): v is TagFilter {
  if (typeof v !== "object" || v === null) return false;
  const obj = v as Record<string, unknown>;
  return (
    typeof obj.colId === "string" &&
    typeof obj.value === "string" &&
    (obj.colType === "Choice" || obj.colType === "ChoiceList")
  );
}

function parseTagFilters(raw: unknown): TagFilter[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isTagFilter);
}

const searchQuery = ref("");
const colIds = ref<string[]>([]);
const errorMessage = ref("");
const allRecords = ref<GristRecord[]>([]);

const isConfiguring = ref(false);
const configuredFilters = ref<TagFilter[]>([]);
const activeTags = ref<TagFilter[]>([]);
const choiceColumns = ref<ColumnInfo[]>([]);
const columnLabels = ref<Record<string, string>>({});

onMounted(() => {
  grist.ready({
    columns: [
      {
        name: "ColonnesRecherche",
        title: "Colonnes à rechercher",
        type: "Any",
        allowMultiple: true,
      },
    ],
    requiredAccess: "full",
    allowSelectBy: true,
    onEditOptions() {
      isConfiguring.value = true;
    },
  });
});

grist.onOptions(async (opts) => {
  configuredFilters.value = parseTagFilters(opts?.tagFilters);
  activeTags.value = [...configuredFilters.value];
  choiceColumns.value = await loadChoiceColumns();
});

grist.onRecords((records, mappings) => {
  allRecords.value = records ?? [];
  const mapped = mappings as Record<string, unknown> | null;
  const raw = mapped?.ColonnesRecherche;
  colIds.value = Array.isArray(raw)
    ? raw.filter((k): k is string => typeof k === "string")
    : typeof raw === "string"
      ? [raw]
      : [];
  errorMessage.value = "";
});

watch([searchQuery, activeTags, colIds, allRecords], applyFilter, { immediate: false });

async function loadChoiceColumns(): Promise<ColumnInfo[]> {
  try {
    const [allTables, tableId, allColsData] = await Promise.all([
      fetchAllTables(),
      grist.getSelectedTableId(),
      fetchAllColumns(),
    ]);
    const numId = getTableNumericalId(allTables, tableId);
    const cols = getColumnsFromTable(allColsData, numId);
    columnLabels.value = Object.fromEntries(cols.map((c) => [c.colId, c.label]));
    return getChoiceOrChoiceListColumns(cols);
  } catch {
    return [];
  }
}

function recordMatchesTag(record: GristRecord, tag: TagFilter): boolean {
  const val = record[tag.colId];
  if (tag.colType === "ChoiceList") {
    if (!Array.isArray(val) || val[0] !== "L") return false;
    return (val as unknown[]).slice(1).includes(tag.value);
  }
  return String(val ?? "") === tag.value;
}

function applyFilter() {
  const query = searchQuery.value.trim();
  const hasSearch = query.length > 0;
  const hasActiveTags = activeTags.value.length > 0;

  if (!hasSearch && !hasActiveTags) {
    grist.setSelectedRows(null);
    return;
  }

  const q = query.toLowerCase();
  const ids = allRecords.value
    .filter((r) => {
      const matchesSearch =
        !hasSearch ||
        colIds.value.length === 0 ||
        colIds.value.some((id) =>
          String(r[id] ?? "")
            .toLowerCase()
            .includes(q),
        );
      const matchesTags = activeTags.value.every((tag) => recordMatchesTag(r, tag));
      return matchesSearch && matchesTags;
    })
    .map((r) => r.id);

  grist.setSelectedRows(ids);
}

async function saveConfig(filters: TagFilter[]) {
  await grist.setOptions({ tagFilters: filters });
  configuredFilters.value = filters;
  activeTags.value = [...filters];
  isConfiguring.value = false;
}
</script>

<style scoped>
.search-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1rem;
}

.search-row :deep(.fr-search-bar) {
  flex: 1 1 200px;
  min-width: 0;
  margin-bottom: 0;
}

.search-row :deep(.fr-tags-group) {
  flex: 0 0 auto;
  margin-bottom: 0;
  gap: 0.5rem;
}

.search-row :deep(.fr-tags-group .fr-tag) {
  margin: 0;
}

.search-row :deep(.fr-tags-group > li) {
  line-height: 0;
}
</style>

<template>
  <ConfigPanel
    v-if="isConfiguring"
    :choice-columns="choiceColumns"
    :saved-filters="configuredFilters"
    @save="saveConfig"
    @cancel="isConfiguring = false"
  />
  <template v-else>
    <DsfrAlert v-if="errorMessage" type="error" :small="true" :description="errorMessage" />
    <template v-else>
      <DsfrAlert
        v-if="colIds.length === 0 && configuredFilters.length === 0"
        type="info"
        :small="true"
        description="Veuillez configurer au moins une colonne à rechercher."
      />
      <div v-else class="search-row">
        <DsfrSearchBar
          v-model="searchQuery"
          label=""
          placeholder="Rechercher…"
          @search="applyFilter()"
          @update:model-value="applyFilter()"
        />
        <TagFilterBar
          v-if="configuredFilters.length > 0"
          :filters="configuredFilters"
          :active-tags="activeTags"
          :column-labels="columnLabels"
          @update:active-tags="activeTags = $event"
        />
      </div>
    </template>
  </template>
</template>
