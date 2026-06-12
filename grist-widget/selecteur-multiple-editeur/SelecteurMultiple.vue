<script setup lang="ts">
import { computed } from "vue";
import { DsfrMultiselect } from "@gouvminint/vue-dsfr";

type Option = { id: number; label: string };

const props = defineProps<{
  options: Option[];
  selectedIds: number[];
  label: string;
}>();

const emit = defineEmits<{
  select: [ids: number[]];
}>();

const buttonLabel = computed(() => {
  const count = props.selectedIds.length;
  if (count === 0) return "Sélectionner des valeurs";
  if (count === 1) return props.options.find((o) => o.id === props.selectedIds[0])?.label ?? "";
  return `${count} valeurs sélectionnées`;
});

function onUpdate(values: (string | number)[]) {
  emit("select", values.map(Number));
}
</script>

<template>
  <div class="selecteur-multiple">
    <DsfrMultiselect
      :model-value="selectedIds"
      :options="options"
      :label="label"
      :button-label="buttonLabel"
      id-key="id"
      label-key="label"
      @update:model-value="onUpdate"
    />
  </div>
</template>

<style scoped>
.selecteur-multiple {
  padding: 1rem;
}
</style>
