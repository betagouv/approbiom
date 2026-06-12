<script setup lang="ts">
import { ref } from "vue";
import type { ColumnInfo } from "@shared/utils/grist";

const props = defineProps<{
  columns: ColumnInfo[];
  refTableColumns: ColumnInfo[];
  selectLabel: string;
  savedRefColumnId: string;
  savedDisplayColumnId: string;
}>();

const emit = defineEmits<{
  save: [payload: { refColumnId: string; displayColumnId: string; selectLabel: string }];
  cancel: [];
  refColumnChange: [colId: string];
}>();

const selectedRefColId = ref(props.savedRefColumnId);
const selectedDisplayColId = ref(props.savedDisplayColumnId);
const configSelectLabel = ref(props.selectLabel);

function onRefColChange(colId: string) {
  selectedRefColId.value = colId;
  selectedDisplayColId.value = "";
  emit("refColumnChange", colId);
}

function save() {
  if (!selectedRefColId.value || !selectedDisplayColId.value) return;
  emit("save", {
    refColumnId: selectedRefColId.value,
    displayColumnId: selectedDisplayColId.value,
    selectLabel: configSelectLabel.value,
  });
}
</script>

<template>
  <div class="config-panel">
    <form class="config-panel__content" novalidate @submit.prevent="save">
      <h2 class="fr-h5 config-panel__heading">Configuration du widget</h2>

      <DsfrAlert
        v-if="columns.length === 0"
        type="error"
        :small="true"
        description="Aucune colonne de référence multiple dans cette table."
      />
      <template v-else>
        <DsfrSelect
          label="Colonne de référence multiple à modifier"
          label-visible
          :options="[{ value: '', text: '— Sélectionner —' }, ...columns.map((c) => ({ value: c.colId, text: c.label }))]"
          :model-value="selectedRefColId"
          @update:model-value="onRefColChange(String($event))"
        />
        <DsfrSelect
          label="Colonne à afficher comme libellé"
          label-visible
          :options="[{ value: '', text: '— Sélectionner —' }, ...refTableColumns.map((c) => ({ value: c.colId, text: c.label }))]"
          :model-value="selectedDisplayColId"
          :disabled="refTableColumns.length === 0"
          @update:model-value="selectedDisplayColId = String($event)"
        />
        <DsfrInputGroup
          label="Libellé du sélecteur"
          label-visible
          :model-value="configSelectLabel"
          placeholder="Valeurs de référence"
          @update:model-value="configSelectLabel = String($event)"
        />
      </template>

      <div class="config-panel__actions">
        <DsfrButton label="Annuler" secondary type="button" @click="emit('cancel')" />
        <DsfrButton
          label="Enregistrer"
          type="submit"
          :disabled="columns.length === 0 || refTableColumns.length === 0"
        />
      </div>
    </form>
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

.config-panel__actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1.5rem;
  justify-content: flex-end;
}
</style>
