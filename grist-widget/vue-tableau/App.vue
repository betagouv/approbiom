<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { DsfrAlert } from "@gouvminint/vue-dsfr";
import VueTableau from "./VueTableau.vue";
import ConfigPanel from "./ConfigPanel.vue";
import type { RowRecord } from "grist/GristData";

const DEFAULT_TITLE = "Données du tableau";

const records = ref<RowRecord[]>([]);
const title = ref(DEFAULT_TITLE);
const isConfiguring = ref(false);

// null = never configured → show all columns (backward compat)
// []   = explicitly empty → show alert
// [...] = selected columns in user-defined order
const selectedColumns = ref<string[] | null>(null);

// Maps colId → human-readable label fetched from Grist metadata
const columnLabels = ref<Record<string, string>>({});

const availableColumns = computed(() =>
  records.value.length > 0 && records.value[0]
    ? Object.keys(records.value[0]).filter((k) => k !== "id")
    : [],
);

const headers = computed(() => {
  if (selectedColumns.value === null) return availableColumns.value;
  return selectedColumns.value.filter((col) => availableColumns.value.includes(col));
});

// Column IDs replaced by their Grist labels for display; falls back to the ID if no label
const displayHeaders = computed(() => headers.value.map((col) => columnLabels.value[col] || col));

const rows = computed(() => records.value.map((r) => headers.value.map((h) => String(r[h] ?? ""))));

// Fetch the colId → label map from Grist internal metadata.
// Requires requiredAccess: "full" because fetchTable reads arbitrary tables.
async function fetchColumnLabels() {
  try {
    const tableId = await grist.getSelectedTableId();
    // _grist_Tables and _grist_Tables_column are Grist internal metadata tables.
    // They return data in columnar format: { id: number[], tableId: string[], ... }
    const tables = await grist.docApi.fetchTable("_grist_Tables");
    const columns = await grist.docApi.fetchTable("_grist_Tables_column");
    const tableRef = tables.id[tables.tableId.indexOf(tableId)];
    const map: Record<string, string> = {};
    for (let i = 0; i < columns.parentId.length; i++) {
      if (columns.parentId[i] === tableRef) {
        const colId = columns.colId[i] as string;
        const label = columns.label[i] as string;
        if (colId && label) map[colId] = label;
      }
    }
    columnLabels.value = map;
  } catch {
    // Grist metadata unavailable (e.g. in tests) — column IDs will be used as fallback
  }
}

onMounted(() => {
  grist.ready({
    requiredAccess: "full", // in reality, we only need read table access only, but in order to have labels we have no choice to use full access
    onEditOptions() {
      isConfiguring.value = true;
    },
  });
});

grist.onRecords((data) => {
  records.value = data;
  fetchColumnLabels();
});

grist.onOptions((options) => {
  title.value = options?.title || DEFAULT_TITLE;
  selectedColumns.value = options?.selectedColumns ?? null;
});

async function handleSave(newTitle: string, newSelectedColumns: string[]) {
  await grist.setOption("title", newTitle || DEFAULT_TITLE);
  await grist.setOption("selectedColumns", newSelectedColumns);
  isConfiguring.value = false;
}
</script>

<template>
  <ConfigPanel
    v-if="isConfiguring"
    :title="title"
    :available-columns="availableColumns"
    :selected-columns="selectedColumns"
    :column-labels="columnLabels"
    @save="handleSave"
    @cancel="isConfiguring = false"
  />
  <DsfrAlert
    v-else-if="records.length > 0 && headers.length === 0"
    type="warning"
    :small="true"
    description="Aucune colonne configurée. Cliquez sur « Ouvrir la configuration » pour sélectionner les colonnes à afficher."
  />
  <VueTableau v-else :headers="displayHeaders" :rows="rows" :title="title" />
</template>
