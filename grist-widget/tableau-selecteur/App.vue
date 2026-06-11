<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { DsfrAlert } from "@gouvminint/vue-dsfr";
import ConfigPanel from "./ConfigPanel.vue";

const isConfiguring = ref(false);
const title = ref("");
const columnKeys = ref<string[]>([]);
const columnLabels = ref<Record<string, string>>({});
let allRecords: { id: number; [key: string]: unknown }[] = [];

const tableHeader = computed(() =>
  columnKeys.value.map((key) => ({
    key,
    label: columnLabels.value[key] ?? key,
  })),
);

const tableRows = computed(() =>
  allRecords.map((r) => columnKeys.value.map((key) => r[key] ?? "")),
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
  allRecords = records ?? [];
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
  title.value = opts?.title ?? "";
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
    <DsfrDataTable
      v-else
      :title="title"
      :no-caption="!title"
      :headers-row="tableHeader"
      :rows="tableRows"
    >
    </DsfrDataTable>
  </template>
</template>
