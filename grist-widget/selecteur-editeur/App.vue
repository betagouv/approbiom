<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { RowRecord } from "grist/GristData";
import {
  fetchAllTables,
  fetchAllColumns,
  getTableNumericalId,
  getColumnsFromTable,
  getRefColumns,
  getRefTableId,
  fetchTableRows,
  buildSelectOptions,
  type ColumnInfo,
} from "@shared/utils/grist";
import ConfigPanel from "./ConfigPanel.vue";

const isConfiguring = ref(false);
const currentRecord = ref<RowRecord | null>(null);
const refColumnId = ref<string | null>(null);
const displayColumnId = ref<string | null>(null);
const refColumns = ref<ColumnInfo[]>([]);
const refTableColumns = ref<ColumnInfo[]>([]);
const selectOptions = ref<{ value: number | string; text: string }[]>([]);
const selectLabel = ref("Valeur de référence");

onMounted(() => {
  grist.ready({
    requiredAccess: "full",
    onEditOptions() {
      isConfiguring.value = true;
    },
  });
});

grist.onRecord((record) => {
  currentRecord.value = record;
});

grist.onOptions(async (opts) => {
  refColumnId.value = typeof opts?.refColumnId === "string" ? opts.refColumnId : null;
  displayColumnId.value = typeof opts?.displayColumnId === "string" ? opts.displayColumnId : null;
  selectLabel.value =
    typeof opts?.selectLabel === "string" ? opts.selectLabel : "Valeur de référence";

  refColumns.value = await loadCurrentTableRefColumns();

  if (!refColumnId.value) return;
  const refCol = refColumns.value.find((c) => c.colId === refColumnId.value);
  if (!refCol) return;

  refTableColumns.value = await loadColumnsOfRefTable(refCol);

  if (!displayColumnId.value) return;
  selectOptions.value = await buildOptionsFromRefTable(refCol, displayColumnId.value);
});

// Fetches the Ref-type columns from the table currently linked to the widget
async function loadCurrentTableRefColumns(): Promise<ColumnInfo[]> {
  const [allTables, selectedTableId, allColumnsData] = await Promise.all([
    fetchAllTables(),
    grist.getSelectedTableId(),
    fetchAllColumns(),
  ]);
  const tableNumericalId = getTableNumericalId(allTables, selectedTableId);
  const allCols = getColumnsFromTable(allColumnsData, tableNumericalId);
  return getRefColumns(allCols);
}

// Fetches the columns of the table pointed to by a Ref column.
// Uses fetchTableRows to avoid a second system-table join.
async function loadColumnsOfRefTable(refCol: ColumnInfo): Promise<ColumnInfo[]> {
  const refTableId = getRefTableId(refCol.type);
  const rows = await fetchTableRows(refTableId);
  return Object.keys(rows)
    .filter((k) => k !== "id" && k !== "manualSort" && !k.startsWith("gristHelper_"))
    .map((colId) => ({ colId, label: colId, type: "Any" }));
}

// Fetches rows of the referenced table and builds the { value, text } select options
async function buildOptionsFromRefTable(
  refCol: ColumnInfo,
  displayColId: string,
): Promise<{ value: number; text: string }[]> {
  const refTableId = getRefTableId(refCol.type);
  const rows = await fetchTableRows(refTableId);
  return buildSelectOptions(rows, displayColId);
}

// Called by ConfigPanel when the user switches the Ref column — reloads the label options
async function onConfigRefColumnChange(colId: string) {
  const refCol = refColumns.value.find((c) => c.colId === colId);
  if (!refCol) return;
  refTableColumns.value = await loadColumnsOfRefTable(refCol);
}

async function saveConfig(payload: {
  refColumnId: string;
  displayColumnId: string;
  selectLabel: string;
}) {
  await grist.setOptions({
    refColumnId: payload.refColumnId,
    displayColumnId: payload.displayColumnId,
    selectLabel: payload.selectLabel,
  });
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
    :columns="refColumns"
    :ref-table-columns="refTableColumns"
    :select-label="selectLabel"
    :saved-ref-column-id="refColumnId ?? ''"
    :saved-display-column-id="displayColumnId ?? ''"
    @save="saveConfig"
    @cancel="isConfiguring = false"
    @ref-column-change="onConfigRefColumnChange"
  />
  <template v-else>
    <DsfrAlert
      v-if="!refColumnId"
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
        :label="selectLabel"
        :options="[{ value: '', text: '— Sélectionner —' }, ...selectOptions]"
        :model-value="currentRecord[refColumnId] ? String(currentRecord[refColumnId]) : ''"
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
