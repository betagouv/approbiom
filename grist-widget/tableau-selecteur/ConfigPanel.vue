<script setup lang="ts">
import { ref } from "vue";
import { DsfrInputGroup, DsfrButton, DsfrToggleSwitch } from "@gouvminint/vue-dsfr";

const props = defineProps<{
  title: string;
}>();

const emit = defineEmits<{
  save: [title: string];
  cancel: [];
}>();

const configTitle = ref(props.title);

function save() {
  emit("save", configTitle.value);
}
</script>

<template>
  <div class="config-panel">
    <div class="config-panel__content">
      <h2 class="fr-h5 config-panel__heading">Configuration du widget</h2>
      <DsfrInputGroup
        label="Titre du tableau"
        label-visible
        :model-value="configTitle"
        placeholder="Titre"
        @update:model-value="configTitle = String($event)"
      />
      <DsfrToggleSwitch
        label="Sélection d'une ligne"
        hint="Permet de cliquer sur une ligne pour positionner le curseur Grist."
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
  margin-top: 1.5rem;
  justify-content: flex-end;
}
</style>
