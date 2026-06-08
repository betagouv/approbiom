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

const availableColumns = computed(() =>
  records.value.length > 0 && records.value[0]
    ? Object.keys(records.value[0]).filter((k) => k !== "id")
    : [],
);

const headers = computed(() => {
  if (selectedColumns.value === null) return availableColumns.value;
  return selectedColumns.value.filter((col) => availableColumns.value.includes(col));
});

const rows = computed(() => records.value.map((r) => headers.value.map((h) => String(r[h] ?? ""))));

onMounted(() => {
  grist.ready({
    requiredAccess: "read table",
    onEditOptions() {
      isConfiguring.value = true;
    },
  });
});

grist.onRecords((data) => {
  records.value = data;
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
    @save="handleSave"
    @cancel="isConfiguring = false"
  />
  <DsfrAlert
    v-else-if="records.length > 0 && headers.length === 0"
    type="warning"
    :small="true"
    description="Aucune colonne configurée. Cliquez sur « Ouvrir la configuration » pour sélectionner les colonnes à afficher."
  />
  <VueTableau v-else :headers="headers" :rows="rows" :title="title" />
</template>
