<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { DsfrInputGroup, DsfrButton } from "@gouvminint/vue-dsfr";
import VueTableau from "./VueTableau.vue";
import type { RowRecord } from "grist/GristData";

const DEFAULT_TITLE = "Données du tableau";

const records = ref<RowRecord[]>([]);
const title = ref(DEFAULT_TITLE);
const isConfiguring = ref(false);
const configTitle = ref("");

const headers = computed(() =>
  records.value.length > 0 && records.value[0]
    ? Object.keys(records.value[0]).filter((k) => k !== "id")
    : [],
);

const rows = computed(() => records.value.map((r) => headers.value.map((h) => String(r[h] ?? ""))));

onMounted(() => {
  grist.ready({
    requiredAccess: "read table",
    onEditOptions() {
      configTitle.value = title.value;
      isConfiguring.value = true;
    },
  });
});

grist.onRecords((data) => {
  records.value = data;
});

grist.onOptions((options) => {
  title.value = options?.title || DEFAULT_TITLE;
});

async function saveConfig() {
  await grist.setOption("title", configTitle.value || DEFAULT_TITLE);
  isConfiguring.value = false;
}

function cancelConfig() {
  isConfiguring.value = false;
}
</script>

<template>
  <div v-if="isConfiguring" class="config-panel">
    <div class="config-panel__content">
      <h2 class="fr-h5 config-panel__heading">Configuration du tableau</h2>
      <DsfrInputGroup
        label="Titre du tableau"
        :model-value="configTitle"
        :placeholder="DEFAULT_TITLE"
        @update:model-value="configTitle = String($event)"
      />
      <div class="config-panel__actions">
        <DsfrButton label="Annuler" secondary @click="cancelConfig" />
        <DsfrButton label="Enregistrer" @click="saveConfig" />
      </div>
    </div>
  </div>
  <VueTableau v-else :headers="headers" :rows="rows" :title="title" />
</template>

<style scoped>
.config-panel {
  display: flex;
  justify-content: center;
  min-height: 100vh;
  padding: 1rem;
}

.config-panel__content {
  width: 100%;
  max-width: 480px;
}

.config-panel__heading {
  margin-bottom: 1rem;
}

.config-panel__actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  justify-content: flex-end;
}
</style>
