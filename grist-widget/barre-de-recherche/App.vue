<script setup lang="ts">
import { ref, onMounted } from "vue";

const searchQuery = ref("");
const columnKey = ref<string | null>(null);
const errorMessage = ref("");

let allRecords: { id: number; [key: string]: unknown }[] = [];

onMounted(() => {
  grist.ready({
    columns: [{ name: "ColonneRecherche", title: "Colonne à rechercher", type: "Any" }],
    requiredAccess: "read table",
    allowSelectBy: true,
  });
});

grist.onRecords((records, mappings) => {
  allRecords = records ?? [];
  const mapped = mappings;
  columnKey.value = typeof mapped?.ColonneRecherche === "string" ? mapped?.ColonneRecherche : null;

  if (allRecords.length === 0) {
    errorMessage.value = "";
    grist.setSelectedRows(null);
    return;
  }

  errorMessage.value = "";
  applyFilter(searchQuery.value);
});

function applyFilter(query: string) {
  if (!columnKey.value) return;

  if (!query.trim()) {
    grist.setSelectedRows(null);
    return;
  }

  const q = query.toLowerCase();
  const key = columnKey.value;
  const ids = allRecords
    .filter((r) =>
      String(r[key] ?? "")
        .toLowerCase()
        .includes(q),
    )
    .map((r) => r.id);

  grist.setSelectedRows(ids);
}
</script>

<template>
  <DsfrAlert v-if="errorMessage" type="error" :small="true" :description="errorMessage" />
  <DsfrAlert
    v-else-if="!columnKey"
    type="info"
    :small="true"
    description="Veuillez configurer la colonne à rechercher."
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
