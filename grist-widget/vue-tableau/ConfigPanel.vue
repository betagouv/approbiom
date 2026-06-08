<script setup lang="ts">
import { ref, computed } from "vue";
import { DsfrInputGroup, DsfrButton } from "@gouvminint/vue-dsfr";

const DEFAULT_TITLE = "Données du tableau";

const props = defineProps<{
  title: string;
  availableColumns: string[];
  selectedColumns: string[] | null;
  columnLabels: Record<string, string>;
}>();

// Returns the human-readable label for a column ID, falling back to the ID itself
function label(col: string) {
  return props.columnLabels[col] || col;
}

const emit = defineEmits<{
  save: [title: string, selectedColumns: string[]];
  cancel: [];
}>();

const configTitle = ref(props.title);
const configSelectedColumns = ref<string[]>(
  props.selectedColumns !== null ? [...props.selectedColumns] : [...props.availableColumns],
);

const hiddenColumns = computed(() =>
  props.availableColumns.filter((col) => !configSelectedColumns.value.includes(col)),
);

function addToVisible(col: string) {
  configSelectedColumns.value = [...configSelectedColumns.value, col];
}

function removeFromVisible(idx: number) {
  configSelectedColumns.value = configSelectedColumns.value.filter((_, i) => i !== idx);
}

// Drag and drop reordering
const draggedIndex = ref<number | null>(null);
const dragOverIndex = ref<number | null>(null);

function onDragStart(idx: number) {
  draggedIndex.value = idx;
}

function onDragOver(idx: number) {
  dragOverIndex.value = idx;
}

function onDrop(targetIdx: number) {
  if (draggedIndex.value === null || draggedIndex.value === targetIdx) return;
  const arr = [...configSelectedColumns.value];
  const item = arr.splice(draggedIndex.value, 1)[0]!;
  arr.splice(targetIdx, 0, item);
  configSelectedColumns.value = arr;
}

function onDragEnd() {
  draggedIndex.value = null;
  dragOverIndex.value = null;
}

function save() {
  // Spread into a plain array — postMessage cannot clone Vue reactive Proxy objects
  emit("save", configTitle.value, [...configSelectedColumns.value]);
}
</script>

<template>
  <div class="config-panel">
    <div class="config-panel__content">
      <h2 class="fr-h5 config-panel__heading">Configuration du tableau</h2>
      <DsfrInputGroup
        label="Titre du tableau"
        label-visible
        :model-value="configTitle"
        :placeholder="DEFAULT_TITLE"
        @update:model-value="configTitle = String($event)"
      />

      <div class="config-panel__columns">
        <div class="columns-section">
          <p class="fr-label columns-section__title">Colonnes visibles</p>
          <p v-if="configSelectedColumns.length === 0" class="fr-hint-text">
            Aucune colonne visible.
          </p>
          <div
            v-for="(col, idx) in configSelectedColumns"
            :key="col"
            :data-col="col"
            class="column-item column-item--visible"
            :class="{ 'column-item--drag-over': dragOverIndex === idx }"
            draggable="true"
            @dragstart="onDragStart(idx)"
            @dragover.prevent="onDragOver(idx)"
            @drop.prevent="onDrop(idx)"
            @dragend="onDragEnd"
          >
            <span class="column-item__handle" aria-hidden="true">⠿</span>
            <span class="column-item__name">{{ label(col) }}</span>
            <DsfrButton
              icon="fr-icon-eye-off-line"
              icon-only
              :label="`Masquer ${label(col)}`"
              tertiary
              no-outline
              @click="removeFromVisible(idx)"
            />
          </div>
        </div>

        <div v-if="hiddenColumns.length > 0" class="columns-section">
          <p class="fr-label columns-section__title">Colonnes cachées</p>
          <div v-for="col in hiddenColumns" :key="col" class="column-item column-item--hidden">
            <span class="column-item__name">{{ label(col) }}</span>
            <DsfrButton
              icon="fr-icon-eye-line"
              icon-only
              :label="`Afficher ${label(col)}`"
              tertiary
              no-outline
              @click="addToVisible(col)"
            />
          </div>
        </div>
      </div>

      <div class="config-panel__actions">
        <DsfrButton label="Annuler" secondary @click="emit('cancel')" />
        <DsfrButton label="Enregistrer" @click="save" />
      </div>
    </div>
  </div>
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

.config-panel__columns {
  margin: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.columns-section__title {
  margin-bottom: 0.5rem;
}

.column-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.column-item--visible {
  cursor: grab;
}

.column-item--visible:active {
  cursor: grabbing;
}

.column-item--drag-over {
  outline: 2px solid var(--blue-france-sun-113-625, #000091);
  outline-offset: -2px;
}

.column-item__handle {
  color: var(--text-disabled-grey, #929292);
  font-size: 1.1rem;
  user-select: none;
}

.column-item__name {
  flex: 1;
}

.config-panel__actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  justify-content: flex-end;
}
</style>
