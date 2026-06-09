<script setup lang="ts">
import { ref } from "vue";
import { DsfrInputGroup, DsfrButton } from "@gouvminint/vue-dsfr";

const DEFAULT_LABEL = "Libellé";
const DEFAULT_DESCRIPTION = "";

const props = defineProps<{
  label: string;
  description: string;
}>();

const emit = defineEmits<{
  save: [label: string, description: string];
  cancel: [];
}>();

const configLabel = ref(props.label);
const configDescription = ref(props.description);

function save() {
  emit("save", configLabel.value || DEFAULT_LABEL, configDescription.value);
}
</script>

<template>
  <div class="config-panel">
    <div class="config-panel__content">
      <h2 class="fr-h5 config-panel__heading">Configuration du widget</h2>
      <DsfrInputGroup
        label="Libellé"
        label-visible
        :model-value="configLabel"
        :placeholder="DEFAULT_LABEL"
        @update:model-value="configLabel = String($event)"
      />
      <DsfrInputGroup
        label="Description"
        label-visible
        :model-value="configDescription"
        :placeholder="DEFAULT_DESCRIPTION"
        @update:model-value="configDescription = String($event)"
      />
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

.config-panel__actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  justify-content: flex-end;
}
</style>
