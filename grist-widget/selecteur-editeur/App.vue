<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import type { RowRecord } from "grist/GristData";
import {
  fetchAllTables,
  fetchAllColumns,
  getTableNumericalId,
  getColumnsFromTable,
  getRefTableId,
  fetchTableRows,
  buildSelectOptions,
  type ColumnInfo,
} from "@shared/utils/grist";
import ConfigPanel from "./ConfigPanel.vue";

const isConfiguring = ref(false);
const currentRecord = ref<RowRecord | null>(null);
const refColumnId = ref<string | null>(null);
const refColumnInfo = ref<ColumnInfo | null>(null);
const displayColumnId = ref<string | null>(null);
const refTableColumns = ref<ColumnInfo[]>([]);
const selectOptions = ref<{ value: number | string; text: string }[]>([]);

onMounted(() => {
  grist.ready({
    requiredAccess: "full",
    columns: [{ name: "ColonneRef", title: "Colonne à modifier", type: "Any" }],
    onEditOptions() {
      isConfiguring.value = true;
    },
  });
});

grist.onRecord(async (record, mappings) => {
  currentRecord.value = record;
  const mapped = mappings as Record<string, unknown> | null;
  const colId = typeof mapped?.ColonneRef === "string" ? mapped.ColonneRef : null;

  if (colId === refColumnId.value) return;

  refColumnId.value = colId;
  refColumnInfo.value = null;
  refTableColumns.value = [];
  selectOptions.value = [];

  if (!colId) return;

  const info = await fetchCurrentColumnInfo(colId);
  refColumnInfo.value = info;

  if (!info?.type.startsWith("Ref:")) return;

  refTableColumns.value = await loadColumnsOfRefTable(info);
  if (displayColumnId.value) {
    selectOptions.value = await buildOptionsFromRefTable(info, displayColumnId.value);
  }
});

grist.onOptions(async (opts) => {
  displayColumnId.value = typeof opts?.displayColumnId === "string" ? opts.displayColumnId : null;

  if (!refColumnInfo.value?.type.startsWith("Ref:") || !displayColumnId.value) return;
  selectOptions.value = await buildOptionsFromRefTable(refColumnInfo.value, displayColumnId.value);
});

async function fetchCurrentColumnInfo(colId: string): Promise<ColumnInfo | null> {
  const [allTables, selectedTableId, allColumnsData] = await Promise.all([
    fetchAllTables(),
    grist.getSelectedTableId(),
    fetchAllColumns(),
  ]);
  const tableNumericalId = getTableNumericalId(allTables, selectedTableId);
  const allCols = getColumnsFromTable(allColumnsData, tableNumericalId);
  return allCols.find((c) => c.colId === colId) ?? null;
}

async function loadColumnsOfRefTable(refCol: ColumnInfo): Promise<ColumnInfo[]> {
  const refTableId = getRefTableId(refCol.type);
  const rows = await fetchTableRows(refTableId);
  return Object.keys(rows)
    .filter((k) => k !== "id" && k !== "manualSort" && !k.startsWith("gristHelper_"))
    .map((colId) => ({ colId, label: colId, type: "Any" }));
}

async function buildOptionsFromRefTable(
  refCol: ColumnInfo,
  displayColId: string,
): Promise<{ value: number; text: string }[]> {
  const refTableId = getRefTableId(refCol.type);
  const rows = await fetchTableRows(refTableId);
  return buildSelectOptions(rows, displayColId);
}

// Grist returns the display text (not raw row ID) for mapped Ref columns.
// Reverse-lookup the row ID from the text so DsfrSelect can match the option.
const currentModelValue = computed((): string => {
  if (!currentRecord.value || !refColumnId.value) return "";
  const rawVal = currentRecord.value[refColumnId.value];
  if (rawVal == null || rawVal === 0 || rawVal === "") return "";
  const strVal = String(rawVal);
  // If it already matches a value (raw row ID case), use it directly
  if (selectOptions.value.some((o) => String(o.value) === strVal)) return strVal;
  // Otherwise it's a display text — find the matching row ID
  const match = selectOptions.value.find((o) => String(o.text) === strVal);
  return match ? String(match.value) : "";
});

async function saveConfig(payload: { displayColumnId: string }) {
  await grist.setOptions({ displayColumnId: payload.displayColumnId });
  isConfiguring.value = false;
}

async function handleSelect(newRowId: unknown) {
  if (!currentRecord.value || !refColumnId.value || !newRowId) return;
  await grist.selectedTable.update({
    id: currentRecord.value.id,
    fields: { [refColumnId.value]: Number(newRowId) },
  });
}
</script>

<template>
  <ConfigPanel
    v-if="isConfiguring"
    :ref-table-columns="refTableColumns"
    :is-ref-mapped="refColumnId !== null"
    :is-ref-valid="refColumnInfo?.type.startsWith('Ref:') ?? false"
    :saved-display-column-id="displayColumnId ?? ''"
    @save="saveConfig"
    @cancel="isConfiguring = false"
  />
  <template v-else>
    <DsfrAlert
      v-if="!refColumnId"
      type="info"
      :small="true"
      description="Veuillez sélectionner une colonne via le panneau latéral Grist."
    />
    <DsfrAlert
      v-else-if="!(refColumnInfo?.type.startsWith('Ref:') ?? false)"
      type="error"
      :small="true"
      description="La colonne sélectionnée doit être de type Référence (Ref)."
    />
    <DsfrAlert
      v-else-if="!displayColumnId"
      type="info"
      :small="true"
      description="Configurez le widget via le menu du widget."
    />
    <DsfrAlert
      v-else-if="!currentRecord"
      type="info"
      :small="true"
      description="Sélectionnez une ligne dans Grist."
    />
    <div v-else class="container-select">
      <DsfrSelect
        label="Valeur de référence"
        :options="[
          { value: '', text: '— Sélectionner —' },
          ...selectOptions.map((o) => ({ value: String(o.value), text: o.text })),
        ]"
        :model-value="currentModelValue"
        @update:model-value="handleSelect"
      />
    </div>
  </template>
</template>

<style>
.container-select {
  padding: 1rem;
}
</style>
