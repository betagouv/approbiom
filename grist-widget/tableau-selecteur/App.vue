<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from "vue";
import { DsfrAlert } from "@gouvminint/vue-dsfr";
import ConfigPanel from "./ConfigPanel.vue";

const isConfiguring = ref(false);
const title = ref("Titre du tableau");
const columnKeys = ref<string[]>([]);
const columnLabels = ref<Record<string, string>>({});
const allRecords = ref<{ id: number; [key: string]: unknown }[]>([]);

const selectedRecordId = ref<number | null>(null);
const tableWrapperRef = ref<HTMLElement | null>(null);

function activateRow(tr: HTMLElement) {
  if (!tr.dataset.rowKey) return;
  const rowIdx = parseInt(tr.dataset.rowKey) - 1;
  const record = allRecords.value[rowIdx];
  if (!record) return;
  selectedRecordId.value = record.id;
  grist.setCursorPos({ rowId: record.id });
}

function handleTableClick(event: MouseEvent) {
  const tr = (event.target as HTMLElement).closest("tbody tr") as HTMLElement | null;
  if (!tr) return;
  activateRow(tr);
}

function handleTableKeydown(event: KeyboardEvent) {
  if (event.key !== "Enter" && event.key !== " ") return;
  const tr = (event.target as HTMLElement).closest("tbody tr") as HTMLElement | null;
  if (!tr) return;
  if (event.key === " ") event.preventDefault();
  activateRow(tr);
}

grist.onRecord((record) => {
  if (!record) {
    selectedRecordId.value = null;
    return;
  }
  if (selectedRecordId.value === record.id) return;
  selectedRecordId.value = record.id;
  const rowIdx = allRecords.value.findIndex((r) => r.id === record.id);
  if (rowIdx === -1) return;
  nextTick(() => {
    const td = tableWrapperRef.value?.querySelector(
      `tbody tr[data-row-key="${rowIdx + 1}"] td`,
    ) as HTMLElement | null;
    td?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  });
});

const tableHeader = computed(() =>
  columnKeys.value.map((key) => ({
    key,
    label: columnLabels.value[key] ?? key,
  })),
);

async function fetchColumnLabels() {
  try {
    const tableId = await grist.getSelectedTableId();
    const tables = await grist.docApi.fetchTable("_grist_Tables");
    const columns = await grist.docApi.fetchTable("_grist_Tables_column");
    const tableIndex = tables.tableId.indexOf(tableId);
    if (tableIndex === -1) return;
    const tableRef = tables.id[tableIndex];
    const map: Record<string, string> = {};
    for (let i = 0; i < columns.parentId.length; i++) {
      if (columns.parentId[i] === tableRef) {
        const colId = columns.colId[i];
        const label = columns.label[i];
        if (colId && label) map[colId] = label;
      }
    }
    columnLabels.value = map;
  } catch {
    // Grist metadata unavailable (e.g. in tests) — column IDs used as fallback
  }
}

onMounted(() => {
  grist.ready({
    columns: [{ name: "Colonnes", title: "Colonnes à afficher", type: "Any", allowMultiple: true }],
    allowSelectBy: true,
    requiredAccess: "full",
    onEditOptions() {
      isConfiguring.value = true;
    },
  });
});

watch(columnKeys, fetchColumnLabels);

grist.onRecords((records, mappings) => {
  allRecords.value = records ?? [];
  const raw = mappings?.Colonnes;
  const newKeys = Array.isArray(raw)
    ? raw.filter((k): k is string => typeof k === "string")
    : typeof raw === "string"
      ? [raw]
      : [];
  if (newKeys.join(",") !== columnKeys.value.join(",")) {
    columnKeys.value = newKeys;
  }
});

grist.onOptions((opts) => {
  title.value = opts?.title ?? "Titre du tableau";
});

async function saveConfig(newTitle: string) {
  await grist.setOption("title", newTitle);
  isConfiguring.value = false;
}
</script>

<template>
  <ConfigPanel
    v-if="isConfiguring"
    :title="title"
    @save="saveConfig"
    @cancel="isConfiguring = false"
  />
  <template v-else>
    <DsfrAlert
      v-if="columnKeys.length === 0"
      type="info"
      :small="true"
      description="Veuillez configurer les colonnes à afficher."
    />
    <div
      v-else
      class="table-scroll-wrapper"
      ref="tableWrapperRef"
      @click="handleTableClick"
      @keydown="handleTableKeydown"
    >
      <DsfrDataTable
        :title="title"
        :headers-row="tableHeader"
        :multilineTable="true"
        :noCaption="true"
        :noScroll="true"
      >
        <template #thead>
          <tr>
            <th v-for="col in tableHeader" :key="col.key" scope="col">
              {{ col.label }}
            </th>
          </tr>
        </template>
        <template #tbody>
          <tr
            v-for="(record, idx) in allRecords"
            :key="record.id"
            :data-row-key="idx + 1"
            :class="{ 'fr-tr--selected': record.id === selectedRecordId }"
          >
            <td v-for="key in columnKeys" :key="key" tabindex="0">
              {{ record[key] ?? "" }}
            </td>
          </tr>
        </template>
      </DsfrDataTable>
    </div>
  </template>
</template>

<style scoped>
.table-scroll-wrapper {
  width: 100%;
  max-height: 100vh;
  overflow-x: auto;
  overflow-y: auto;
}

.table-scroll-wrapper::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.table-scroll-wrapper::-webkit-scrollbar-track {
  background: #e8e8e8;
}

.table-scroll-wrapper::-webkit-scrollbar-thumb {
  background: #b0b0b0;
  border: 2px solid #e8e8e8;
  border-radius: 6px;
}

.table-scroll-wrapper::-webkit-scrollbar-thumb:hover {
  background: #888;
}

.table-scroll-wrapper::-webkit-scrollbar-corner {
  background: #e8e8e8;
}

.fr-table {
  margin: 0;
}

tbody tr {
  cursor: pointer;
}

tbody tr.fr-tr--selected td,
tbody tr.fr-tr--selected th {
  background-color: var(--blue-france-950-100);
}
</style>
