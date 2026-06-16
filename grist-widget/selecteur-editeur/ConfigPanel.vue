<script setup lang="ts">
import { ref } from "vue";
import { DsfrInputGroup } from "@gouvminint/vue-dsfr";
import type { ColumnInfo } from "@shared/utils/grist";

const DEFAULT_LABEL = "Valeur de référence";

const props = defineProps<{
  refTableColumns: ColumnInfo[];
  isRefMapped: boolean;
  isRefValid: boolean;
  savedDisplayColumnId: string;
  savedLabel?: string;
}>();

const emit = defineEmits<{
  save: [payload: { displayColumnId: string; label: string }];
  cancel: [];
}>();

const selectedDisplayColId = ref(props.savedDisplayColumnId);
const label = ref(props.savedLabel);

function save() {
  if (!selectedDisplayColId.value) return;
  emit("save", {
    displayColumnId: selectedDisplayColId.value,
    label: label.value || DEFAULT_LABEL,
  });
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
      <template v-else>
        <DsfrSelect
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
        <DsfrInputGroup
          label="Libellé"
          label-visible
          :model-value="label"
          :placeholder="DEFAULT_LABEL"
          @update:model-value="label = String($event)"
        />
      </template>

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
