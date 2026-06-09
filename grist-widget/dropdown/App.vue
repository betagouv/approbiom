<script setup lang="ts">
import { ref, onMounted } from "vue";
import { DsfrAlert } from "@gouvminint/vue-dsfr";
import Dropdown from "./Dropdown.vue";
import ConfigPanel from "./ConfigPanel.vue";

type Option = { id: number; label: string };

const options = ref<Option[]>([]);
const selectedIds = ref<number[]>([]);
const errorMessage = ref("");
const label = ref("Libellé");
const description = ref("");
const isConfiguring = ref(false);

let allRecords: { id: number; [key: string]: unknown }[] = [];

onMounted(() => {
  grist.ready({
    columns: [{ name: "OptionsToSelect", title: "Option à sélectionner", type: "Any" }],
    requiredAccess: "read table",
    allowSelectBy: true,
    onEditOptions() {
      isConfiguring.value = true;
    },
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

grist.onOptions((opts) => {
  label.value = opts?.label ?? "Libellé";
  description.value = opts?.description ?? "";
});

grist.onRecord((record) => {
  if (!record) return;
  const index = allRecords.findIndex((r) => r.id === record.id);
  if (index !== -1) {
    selectedIds.value = [index];
  }
});

async function onSelect(ids: number[]) {
  const newId = ids.find((id) => !selectedIds.value.includes(id));
  selectedIds.value = ids;
  const targetId = newId ?? ids[ids.length - 1];
  if (targetId !== undefined) {
    const record = allRecords[targetId];
    if (record) await grist.setCursorPos({ rowId: record.id });
  }
}

async function saveConfig(newLabel: string, newDescription: string) {
  await grist.setOption("label", newLabel);
  await grist.setOption("description", newDescription);
  label.value = newLabel;
  description.value = newDescription;
  isConfiguring.value = false;
}
</script>

<template>
  <ConfigPanel
    v-if="isConfiguring"
    :label="label"
    :description="description"
    @save="saveConfig"
    @cancel="isConfiguring = false"
  />
  <template v-else>
    <DsfrAlert v-if="errorMessage" type="error" :small="true" :description="errorMessage" />
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
      :label="label"
      :description="description"
      @select="onSelect"
    />
  </template>
</template>
