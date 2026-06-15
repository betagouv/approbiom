<script setup lang="ts">
import { ref } from "vue";
import type { ColumnInfo } from "@shared/utils/grist";

const props = defineProps<{
  refTableColumns: ColumnInfo[];
  isRefMapped: boolean;
  isRefValid: boolean;
  savedDisplayColumnId: string;
}>();

const emit = defineEmits<{
  save: [payload: { displayColumnId: string }];
  cancel: [];
}>();

const selectedDisplayColId = ref(props.savedDisplayColumnId);

function save() {
  if (!selectedDisplayColId.value) return;
  emit("save", { displayColumnId: selectedDisplayColId.value });
}
</script>

<template>
  <div class="config-panel">
    <form class="config-panel__content" novalidate @submit.prevent="save">
      <h2 class="fr-h5 config-panel__heading">Configuration du widget</h2>

      <DsfrAlert
        v-if="!isRefMapped"
        type="warning"
        :small="true"
        description="Veuillez d'abord sélectionner une colonne via le panneau latéral Grist."
      />
      <DsfrAlert
        v-else-if="!isRefValid"
        type="error"
        :small="true"
        description="La colonne sélectionnée doit être de type Référence (Ref)."
      />
      <DsfrSelect
        v-else
        label="Colonne à afficher comme libellé"
        label-visible
        :options="[
          { value: '', text: '— Sélectionner —' },
          ...refTableColumns.map((c) => ({ value: c.colId, text: c.label })),
        ]"
        :model-value="selectedDisplayColId"
        :disabled="refTableColumns.length === 0"
        @update:model-value="selectedDisplayColId = String($event)"
      />

      <div class="config-panel__actions">
        <DsfrButton label="Annuler" secondary type="button" @click="emit('cancel')" />
        <DsfrButton
          label="Enregistrer"
          type="submit"
          :disabled="!isRefValid || !selectedDisplayColId"
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
