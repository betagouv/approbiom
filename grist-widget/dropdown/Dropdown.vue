<script setup lang="ts">
import { computed } from "vue";
import { DsfrMultiselect } from "@gouvminint/vue-dsfr";

type Option = { id: number; label: string };

const props = defineProps<{
  options: Option[];
  selectedIds: number[];
}>();

const emit = defineEmits<{
  select: [id: number];
}>();

const buttonLabel = computed(() => {
  if (props.selectedIds.length === 0) return "Sélectionner une option";
  return props.options.find((o) => o.id === props.selectedIds[0])?.label ?? "Sélectionner une option";
});

function onUpdate(values: (string | number)[]) {
  const ids = values.map(Number);
  const newId = ids.find((id) => !props.selectedIds.includes(id));
  if (newId !== undefined) {
    emit("select", newId);
  }
}
</script>

<template>
  <div class="dropdown">
    <DsfrMultiselect
      :model-value="selectedIds"
      :options="options"
      :button-label="buttonLabel"
      :select-all="false"
      :search="true"
      label=""
      id-key="id"
      label-key="label"
      max-overflow-height="40vh"
      @update:model-value="onUpdate"
    />
  </div>
</template>

<style scoped>
.dropdown {
  padding: 1rem;
}
</style>
