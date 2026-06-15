<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import type { RowRecord } from "grist/GristData";

const currentRecord = ref<RowRecord | null>(null);
const titleColId = ref<string | null>(null);

const titleValue = computed(() => {
  if (!titleColId.value || !currentRecord.value) return "";
  return String(currentRecord.value[titleColId.value] ?? "");
});

onMounted(() => {
  grist.ready({
    columns: [
      {
        name: "TitreColonne",
        title: "Colonne à afficher",
        type: "Any",
        allowMultiple: false,
      },
    ],
    requiredAccess: "read table",
  });
});

grist.onRecord((record: RowRecord | null, mappings) => {
  currentRecord.value = record;
  const mapped = mappings as Record<string, unknown> | null;
  const colId = mapped?.TitreColonne;
  titleColId.value = typeof colId === "string" ? colId : null;
});
</script>

<style scoped>
.titre-container {
  padding: 1rem;
}
</style>

<template>
  <div class="titre-container">
    <DsfrAlert
      v-if="!titleColId"
      type="info"
      :small="true"
      description="Veuillez sélectionner une colonne à afficher."
    />
    <DsfrAlert
      v-else-if="!currentRecord"
      type="info"
      :small="true"
      description="Sélectionnez une ligne dans Grist."
    />
    <h1 v-else class="fr-h3">{{ titleValue }}</h1>
  </div>
</template>
