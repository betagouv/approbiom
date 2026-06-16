<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { RowRecord } from "grist/GristData";
import {
  fetchAllTables,
  fetchAllColumns,
  getTableNumericalId,
  getColumnsFromTable,
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
const refColumnInfo = ref<ColumnInfo | null>(null);
const displayColumnId = ref<string | null>(null);
const label = ref("Valeurs de référence");
const refTableColumns = ref<ColumnInfo[]>([]);
const multiselectOptions = ref<{ id: number; label: string }[]>([]);
const selectedIds = ref<number[]>([]);

let lastRecordId: number | null = null;

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
  const isRowChange = record?.id !== lastRecordId;
  lastRecordId = record?.id ?? null;
  currentRecord.value = record;

  const mapped = mappings as Record<string, unknown> | null;
  const colId = typeof mapped?.ColonneRef === "string" ? mapped.ColonneRef : null;

  if (colId !== refColumnId.value) {
    refColumnId.value = colId;
    refColumnInfo.value = null;
    refTableColumns.value = [];
    multiselectOptions.value = [];
    selectedIds.value = [];

    if (!colId) return;

    const info = await fetchCurrentColumnInfo(colId);
    refColumnInfo.value = info;

    if (!info?.type.startsWith("RefList:")) return;

    refTableColumns.value = await loadColumnsOfRefTable(info);
    if (displayColumnId.value) {
      multiselectOptions.value = await buildOptionsFromRefTable(info, displayColumnId.value);
      if (record && refColumnId.value) {
        selectedIds.value = resolveSelectedIds(record[refColumnId.value]);
      }
    }
  } else if (isRowChange) {
    selectedIds.value =
      record && refColumnId.value ? resolveSelectedIds(record[refColumnId.value]) : [];
  }
});

grist.onOptions(async (opts) => {
  displayColumnId.value = typeof opts?.displayColumnId === "string" ? opts.displayColumnId : null;
  label.value = typeof opts?.label === "string" && opts.label ? opts.label : "Valeurs de référence";

  if (!refColumnInfo.value?.type.startsWith("RefList:") || !displayColumnId.value) return;
  multiselectOptions.value = await buildOptionsFromRefTable(
    refColumnInfo.value,
    displayColumnId.value,
  );
  if (currentRecord.value && refColumnId.value) {
    selectedIds.value = resolveSelectedIds(currentRecord.value[refColumnId.value]);
  }
});

// Grist returns display labels (not raw row IDs) for mapped RefList columns.
// Try numeric IDs first; fall back to reverse-lookup by label.
function resolveSelectedIds(rawVal: unknown): number[] {
  // Raw Grist format (without mapping): ["L", id1, id2, ...]
  const numericIds = decodeRefList(rawVal);
  if (numericIds.length > 0) return numericIds;

  if (!Array.isArray(rawVal)) return [];

  // Grist column-mapping format: plain array of numbers [id1, id2, ...]
  const plainIds = (rawVal as unknown[]).filter((v): v is number => typeof v === "number");
  if (plainIds.length > 0) return plainIds;

  // Grist column-mapping format with display labels: ["L", "label1", ...] or ["label1", ...]
  const labels = (rawVal as unknown[])
    .filter((v) => v !== "L")
    .filter((v): v is string => typeof v === "string");
  return labels
    .map((label) => multiselectOptions.value.find((o) => o.label === label)?.id)
    .filter((id): id is number => id !== undefined);
}

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
): Promise<{ id: number; label: string }[]> {
  const refTableId = getRefTableId(refCol.type);
  const rows = await fetchTableRows(refTableId);
  return buildMultiselectOptions(rows, displayColId);
}

async function saveConfig(payload: { displayColumnId: string; label: string }) {
  await grist.setOptions({ displayColumnId: payload.displayColumnId, label: payload.label });
  label.value = payload.label;
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
    :ref-table-columns="refTableColumns"
    :is-ref-mapped="refColumnId !== null"
    :is-ref-valid="refColumnInfo?.type.startsWith('RefList:') ?? false"
    :saved-display-column-id="displayColumnId ?? ''"
    :saved-label="label"
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
      v-else-if="!(refColumnInfo?.type.startsWith('RefList:') ?? false)"
      type="error"
      :small="true"
      description="La colonne sélectionnée doit être de type Liste de références (RefList)."
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
    <SelecteurMultiple
      v-else
      :options="multiselectOptions"
      :selected-ids="selectedIds"
      :label="label"
      @select="onSelect"
    />
  </template>
</template>
