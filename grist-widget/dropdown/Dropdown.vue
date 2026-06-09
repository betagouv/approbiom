<script setup lang="ts">
import { computed } from "vue";
import { DsfrSelect } from "@gouvminint/vue-dsfr";

type Option = { value: string; text: string };

const props = defineProps<{
  options: Option[];
  selectedValue: string;
}>();

const emit = defineEmits<{
  select: [value: string];
}>();

const selectOptions = computed(() => [
  { value: "", text: "Sélectionner une option", disabled: true },
  ...props.options,
]);

function onChange(value: string | number | null) {
  if (value !== null && value !== "") {
    emit("select", String(value));
  }
}
</script>

<template>
  <div class="dropdown">
    <DsfrSelect
      :model-value="selectedValue || ''"
      :options="selectOptions"
      label=""
      @update:model-value="onChange"
    />
  </div>
</template>

<style scoped>
.dropdown {
  padding: 1rem;
}
</style>
