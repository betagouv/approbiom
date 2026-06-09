<script setup lang="ts">
import { computed } from "vue";
import { DsfrMultiselect } from "@gouvminint/vue-dsfr";

type Option = { id: number; label: string };

const props = defineProps<{
  options: Option[];
  selectedIds: number[];
  label: string;
  description?: string;
}>();

const emit = defineEmits<{
  select: [ids: number[]];
}>();

const buttonLabel = computed(() => {
  const count = props.selectedIds.length;
  if (count === 0) return "Sélectionner une option";
  if (count === 1) return props.options.find((o) => o.id === props.selectedIds[0])?.label ?? "";
  return `${count} options sélectionnées`;
});

function onUpdate(values: (string | number)[]) {
  emit("select", values.map(Number));
}
</script>

<template>
  <div class="liste-deroulante-riche-selecteur">
    <DsfrMultiselect
      :model-value="selectedIds"
      :options="options"
      :button-label="buttonLabel"
      :select-all="false"
      :search="true"
      :label="label"
      :hint="description"
      id-key="id"
      label-key="label"
      max-overflow-height="40vh"
      @update:model-value="onUpdate"
    />
  </div>
</template>

<style scoped>
.liste-deroulante-riche-selecteur {
  padding: 1rem;
}
</style>
