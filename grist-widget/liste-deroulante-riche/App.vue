<script setup lang="ts">
import { ref, onMounted } from "vue";
import { DsfrAlert } from "@gouvminint/vue-dsfr";
import ListeDeroulanteRiche from "./ListeDeroulanteRiche.vue";
import ConfigPanel from "./ConfigPanel.vue";

type Option = { id: number; label: string };

const DEFAULT_LABEL = "Libqsdqsellé";
const DEFAULT_DESCRIPTION = "";
const DEFAULT_PLACEHOLDER = "Sélectionner une option";
const DEFAULT_ENABLE_MULTIPLE_SELECTION = false;

const options = ref<Option[]>([]);
const selectedIds = ref<number[]>([]);
const label = ref(DEFAULT_LABEL);
const description = ref(DEFAULT_DESCRIPTION);
const placeholder = ref(DEFAULT_PLACEHOLDER);
const enableMultipleSelection = ref(DEFAULT_ENABLE_MULTIPLE_SELECTION);
const isConfiguring = ref(false);

onMounted(() => {
  grist.ready({
    requiredAccess: "read table",
    columns: [{ name: "label", type: "Text", title: "Libellé" }],
    allowSelectBy: true,
    onEditOptions() {
      isConfiguring.value = true;
    },
  });
});

grist.onRecords((records, mappings) => {
  const col = mappings?.label ?? null;
  if (!col || typeof col !== "string") {
    options.value = [];
    return;
  }
  options.value = records.map((r) => ({
    id: r.id,
    label: String(r[col] ?? ""),
  }));
});

grist.onRecord((record) => {
  if (record && !enableMultipleSelection.value) {
    selectedIds.value = [record.id];
  }
});

grist.onOptions((opts) => {
  label.value = opts?.label ?? DEFAULT_LABEL;
  description.value = opts?.description ?? DEFAULT_DESCRIPTION;
  placeholder.value = opts?.placeholder ?? DEFAULT_PLACEHOLDER;
  enableMultipleSelection.value =
    opts?.enableMultipleSelection ?? DEFAULT_ENABLE_MULTIPLE_SELECTION;
});

async function onSelect(ids: number[]) {
  selectedIds.value = ids;
  const rowId = ids[0];
  if (rowId !== undefined) {
    await (grist as any).setCursorPos({ rowId });
  }
}

async function saveConfig(
  newLabel: string,
  newDescription: string,
  newPlaceholder: string,
  newEnableMultipleSelection: boolean,
) {
  await grist.setOption("label", newLabel);
  await grist.setOption("description", newDescription);
  await grist.setOption("placeholder", newPlaceholder);
  await grist.setOption("enableMultipleSelection", newEnableMultipleSelection);
  if (!newEnableMultipleSelection && selectedIds.value.length > 1) {
    selectedIds.value = [selectedIds.value[0]!];
    const rowId = selectedIds.value[0];
    if (rowId !== undefined) await (grist as any).setCursorPos({ rowId });
  }
  isConfiguring.value = false;
}
</script>

<template>
  <ConfigPanel
    v-if="isConfiguring"
    :label="label"
    :description="description"
    :placeholder="placeholder"
    :enable-multiple-selection="enableMultipleSelection"
    @save="saveConfig"
    @cancel="isConfiguring = false"
  />

  <DsfrAlert
    v-else-if="options.length === 0"
    type="info"
    :small="true"
    description="Aucune donnée à afficher."
  />
  <ListeDeroulanteRiche
    v-else-if="options.length > 0"
    :options="options"
    :label="label"
    :description="description"
    :placeholder="placeholder"
    :selected-ids="selectedIds"
    :enable-multiple-selection="enableMultipleSelection"
    @select="onSelect"
  />
</template>
