<script setup lang="ts">
import { ref, onMounted } from "vue";
import { DsfrAlert } from "@gouvminint/vue-dsfr";
import Dropdown from "./Dropdown.vue";

type Option = { id: number; label: string };

const options = ref<Option[]>([]);
const selectedIds = ref<number[]>([]);
const errorMessage = ref("");

let allRecords: { id: number; [key: string]: unknown }[] = [];

onMounted(() => {
  grist.ready({
    columns: [{ name: "OptionsToSelect", title: "Options to select", type: "Any" }],
    requiredAccess: "read table",
    allowSelectBy: true,
  });
});

grist.onRecords((records) => {
  if (!records || records.length === 0) {
    errorMessage.value = "Aucune donnée reçue.";
    options.value = [];
    allRecords = [];
    return;
  }

  allRecords = records;
  const mapped = grist.mapColumnNames(records);

  const rawOptions = mapped
    .map((r) => r.OptionsToSelect)
    .filter((v) => v !== null && v !== undefined);

  if (rawOptions.length === 0) {
    errorMessage.value = "Aucune option valide trouvée.";
    options.value = [];
    return;
  }

  errorMessage.value = "";
  options.value = rawOptions.map((v, i) => ({ id: i, label: String(v) }));
});

grist.onRecord((record) => {
  if (!record) return;
  const index = allRecords.findIndex((r) => r.id === record.id);
  if (index !== -1) {
    selectedIds.value = [index];
  }
});

async function onSelect(id: number) {
  selectedIds.value = [id];
  const record = allRecords[id];
  if (record) {
    await (grist as any).setCursorPos({ rowId: record.id });
  }
}
</script>

<template>
  <DsfrAlert
    v-if="errorMessage"
    type="error"
    :small="true"
    :description="errorMessage"
  />
  <DsfrAlert
    v-else-if="options.length === 0"
    type="info"
    :small="true"
    description="Aucune donnée à afficher."
  />
  <Dropdown
    v-else
    :options="options"
    :selected-ids="selectedIds"
    @select="onSelect"
  />
</template>
