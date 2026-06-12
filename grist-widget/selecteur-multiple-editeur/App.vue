<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { RowRecord } from "grist/GristData";
import {
  fetchAllTables,
  fetchAllColumns,
  getTableNumericalId,
  getColumnsFromTable,
  getRefListColumns,
  getRefTableId,
  fetchTableRows,
  buildMultiselectOptions,
  decodeRefList,
  encodeRefList,
  type ColumnInfo,
} from "@shared/utils/grist";
import ConfigPanel from "./ConfigPanel.vue";
import SelecteurMultiple from "./SelecteurMultiple.vue";

const isConfiguring = ref(false);
const currentRecord = ref<RowRecord | null>(null);
const refColumnId = ref<string | null>(null);
const displayColumnId = ref<string | null>(null);
const refColumns = ref<ColumnInfo[]>([]);
const refTableColumns = ref<ColumnInfo[]>([]);
const multiselectOptions = ref<{ id: number; label: string }[]>([]);
const selectLabel = ref("Valeurs de référence");
const selectedIds = ref<number[]>([]);

// Track the last row ID so we only sync selectedIds when the cursor moves to a NEW row.
// When onRecord fires for the SAME row (Grist's confirmation after our write), we keep the
// optimistic selection instead of resetting it to the pre-update value.
let lastRecordId: number | null = null;

onMounted(() => {
  grist.ready({
    requiredAccess: "full",
    onEditOptions() {
      isConfiguring.value = true;
    },
  });
});

grist.onRecord((record) => {
  const isRowChange = record?.id !== lastRecordId;
  lastRecordId = record?.id ?? null;
  currentRecord.value = record;

  if (isRowChange) {
    selectedIds.value = record && refColumnId.value
      ? decodeRefList(record[refColumnId.value])
      : [];
  }
});

grist.onOptions(async (opts) => {
  refColumnId.value = typeof opts?.refColumnId === "string" ? opts.refColumnId : null;
  displayColumnId.value = typeof opts?.displayColumnId === "string" ? opts.displayColumnId : null;
  selectLabel.value = typeof opts?.selectLabel === "string" ? opts.selectLabel : "Valeurs de référence";

  refColumns.value = await loadCurrentTableRefListColumns();

  if (!refColumnId.value) return;
  const refCol = refColumns.value.find((c) => c.colId === refColumnId.value);
  if (!refCol) return;

  refTableColumns.value = await loadColumnsOfRefTable(refCol);

  if (!displayColumnId.value) return;
  multiselectOptions.value = await buildOptionsFromRefTable(refCol, displayColumnId.value);
});

async function loadCurrentTableRefListColumns(): Promise<ColumnInfo[]> {
  const [allTables, selectedTableId, allColumnsData] = await Promise.all([
    fetchAllTables(),
    grist.getSelectedTableId(),
    fetchAllColumns(),
  ]);
  const tableNumericalId = getTableNumericalId(allTables, selectedTableId);
  const allCols = getColumnsFromTable(allColumnsData, tableNumericalId);
  return getRefListColumns(allCols);
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
): Promise<{ id: number; label: string }[]> {
  const refTableId = getRefTableId(refCol.type);
  const rows = await fetchTableRows(refTableId);
  return buildMultiselectOptions(rows, displayColId);
}

async function onConfigRefColumnChange(colId: string) {
  const refCol = refColumns.value.find((c) => c.colId === colId);
  if (!refCol) return;
  refTableColumns.value = await loadColumnsOfRefTable(refCol);
}

async function saveConfig(payload: { refColumnId: string; displayColumnId: string; selectLabel: string }) {
  await grist.setOptions({ refColumnId: payload.refColumnId, displayColumnId: payload.displayColumnId, selectLabel: payload.selectLabel });
  isConfiguring.value = false;
}

async function onSelect(ids: number[]) {
  if (!currentRecord.value || !refColumnId.value) return;
  selectedIds.value = ids;
  await grist.selectedTable.update({
    id: currentRecord.value.id,
    fields: { [refColumnId.value]: encodeRefList(ids) },
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
    <SelecteurMultiple
      v-else
      :options="multiselectOptions"
      :selected-ids="selectedIds"
      :label="selectLabel"
      @select="onSelect"
    />
  </template>
</template>
