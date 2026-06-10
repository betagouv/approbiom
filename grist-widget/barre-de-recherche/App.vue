<script setup lang="ts">
import { ref, onMounted } from "vue";

const searchQuery = ref("");
const columnKeys = ref<string[]>([]);
const errorMessage = ref("");

let allRecords: { id: number; [key: string]: unknown }[] = [];

onMounted(() => {
  grist.ready({
    columns: [
      { name: "ColonnesRecherche", title: "Colonnes à rechercher", type: "Any", allowMultiple: true },
    ],
    requiredAccess: "read table",
    allowSelectBy: true,
  });
});

grist.onRecords((records, mappings) => {
  allRecords = records ?? [];
  const mapped = mappings as Record<string, unknown> | null;
  const raw = mapped?.ColonnesRecherche;
  columnKeys.value = Array.isArray(raw)
    ? raw.filter((k): k is string => typeof k === "string")
    : typeof raw === "string"
      ? [raw]
      : [];

  if (allRecords.length === 0) {
    errorMessage.value = "";
    grist.setSelectedRows(null);
    return;
  }

  errorMessage.value = "";
  applyFilter(searchQuery.value);
});

function applyFilter(query: string) {
  if (columnKeys.value.length === 0) return;

  if (!query.trim()) {
    grist.setSelectedRows(null);
    return;
  }

  const q = query.toLowerCase();
  const ids = allRecords
    .filter((r) => columnKeys.value.some((key) => String(r[key] ?? "").toLowerCase().includes(q)))
    .map((r) => r.id);

  grist.setSelectedRows(ids);
}
</script>

<template>
  <DsfrAlert v-if="errorMessage" type="error" :small="true" :description="errorMessage" />
  <DsfrAlert
    v-else-if="columnKeys.length === 0"
    type="info"
    :small="true"
    description="Veuillez configurer au moins une colonne à rechercher."
  />
  <DsfrSearchBar
    v-else
    v-model="searchQuery"
    label=""
    placeholder="Rechercher…"
    @search="applyFilter(searchQuery)"
    @update:model-value="applyFilter($event)"
  />
</template>
