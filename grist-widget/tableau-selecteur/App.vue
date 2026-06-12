<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from "vue";
import { DsfrAlert } from "@gouvminint/vue-dsfr";
import ConfigPanel from "./ConfigPanel.vue";

const isConfiguring = ref(false);
const title = ref("Titre du tableau");
const columnKeys = ref<string[]>([]);
const columnLabels = ref<Record<string, string>>({});
const allRecords = ref<{ id: number; [key: string]: unknown }[]>([]);

const selectedRecordId = ref<number | null>(null);
const tableWrapperRef = ref<HTMLElement | null>(null);

const selectedRowKey = computed(() => {
  if (selectedRecordId.value === null) return null;
  const idx = allRecords.value.findIndex((r) => r.id === selectedRecordId.value);
  return idx === -1 ? null : idx + 1;
});

watch(selectedRowKey, async (newKey, oldKey) => {
  await nextTick();
  if (!tableWrapperRef.value) return;
  if (oldKey != null) {
    tableWrapperRef.value
      .querySelector(`tbody tr[data-row-key="${oldKey}"]`)
      ?.classList.remove("fr-tr--selected");
  }
  if (newKey != null) {
    tableWrapperRef.value
      .querySelector(`tbody tr[data-row-key="${newKey}"]`)
      ?.classList.add("fr-tr--selected");
  }
});

function activateRow(tr: HTMLElement) {
  if (!tr.dataset.rowKey) return;
  const rowIdx = parseInt(tr.dataset.rowKey) - 1;
  const record = allRecords.value[rowIdx];
  if (!record) return;
  selectedRecordId.value = record.id;
  grist.setCursorPos({ rowId: record.id });
}

function handleTableClick(event: MouseEvent) {
  const tr = (event.target as HTMLElement).closest("tbody tr") as HTMLElement | null;
  if (!tr) return;
  activateRow(tr);
}

function handleTableKeydown(event: KeyboardEvent) {
  if (event.key !== "Enter" && event.key !== " ") return;
  const tr = (event.target as HTMLElement).closest("tbody tr") as HTMLElement | null;
  if (!tr) return;
  if (event.key === " ") event.preventDefault();
  activateRow(tr);
}

grist.onRecord((record) => {
  if (!record) {
    selectedRecordId.value = null;
    return;
  }
  if (selectedRecordId.value === record.id) return;
  selectedRecordId.value = record.id;
  const rowIdx = allRecords.value.findIndex((r) => r.id === record.id);
  if (rowIdx === -1) return;
  nextTick(() => {
    const td = tableWrapperRef.value?.querySelector(
      `tbody tr[data-row-key="${rowIdx + 1}"] td`,
    ) as HTMLElement | null;
    td?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  });
});

const tableHeader = computed(() =>
  columnKeys.value.map((key) => ({
    key,
    label: columnLabels.value[key] ?? key,
  })),
);

const tableRows = computed(() =>
  allRecords.value.map((r) => columnKeys.value.map((key) => r[key] ?? "")),
);

async function fetchColumnLabels() {
  try {
    const tableId = await grist.getSelectedTableId();
    const tables = await grist.docApi.fetchTable("_grist_Tables");
    const columns = await grist.docApi.fetchTable("_grist_Tables_column");
    const tableRef = tables.id[tables.tableId.indexOf(tableId)];
    const map: Record<string, string> = {};
    for (let i = 0; i < columns.parentId.length; i++) {
      if (columns.parentId[i] === tableRef) {
        const colId = columns.colId[i];
        const label = columns.label[i];
        if (colId && label) map[colId] = label;
      }
    }
    columnLabels.value = map;
  } catch {
    // Grist metadata unavailable (e.g. in tests) — column IDs used as fallback
  }
}

onMounted(() => {
  grist.ready({
    columns: [{ name: "Colonnes", title: "Colonnes à afficher", type: "Any", allowMultiple: true }],
    allowSelectBy: true,
    requiredAccess: "full",
    onEditOptions() {
      isConfiguring.value = true;
    },
  });
});

grist.onRecords((records, mappings) => {
  allRecords.value = records ?? [];
  const mapped = mappings;
  const raw = mapped?.Colonnes;
  columnKeys.value = Array.isArray(raw)
    ? raw.filter((k): k is string => typeof k === "string")
    : typeof raw === "string"
      ? [raw]
      : [];
  fetchColumnLabels();
});

grist.onOptions((opts) => {
  title.value = opts?.title ?? "Titre du tableau";
});

async function saveConfig(newTitle: string) {
  await grist.setOption("title", newTitle);
  isConfiguring.value = false;
}
</script>

<template>
  <ConfigPanel
    v-if="isConfiguring"
    :title="title"
    @save="saveConfig"
    @cancel="isConfiguring = false"
  />
  <template v-else>
    <DsfrAlert
      v-if="columnKeys.length === 0"
      type="info"
      :small="true"
      description="Veuillez configurer les colonnes à afficher."
    />
    <div v-else ref="tableWrapperRef" @click="handleTableClick" @keydown="handleTableKeydown">
      <DsfrDataTable
        :title="title"
        :no-caption="!title"
        :headers-row="tableHeader"
        :rows="tableRows"
      />
    </div>
  </template>
</template>

<style scoped>
:deep(tbody tr) {
  cursor: pointer;
}

:deep(tbody tr.fr-tr--selected td),
:deep(tbody tr.fr-tr--selected th) {
  background-color: var(--blue-france-950-100);
}
</style>
