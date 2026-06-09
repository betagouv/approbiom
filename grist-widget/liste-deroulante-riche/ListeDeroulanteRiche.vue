<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { DsfrMultiselect } from "@gouvminint/vue-dsfr";

type Option = { id: number; label: string };

const props = defineProps<{
  options: Option[];
  label: string;
  description: string;
  placeholder: string;
  selectedIds: number[];
  enableMultipleSelection: boolean;
}>();

const emit = defineEmits<{
  select: [ids: number[]];
}>();

const buttonLabel = computed(() => {
  if (props.selectedIds.length === 0) return props.placeholder;
  return props.options
    .filter((o) => props.selectedIds.includes(o.id))
    .map((o) => o.label)
    .join(", ");
});

const wrapperRef = ref<HTMLElement | null>(null);

function closeDropdown() {
  const btn = wrapperRef.value?.querySelector<HTMLButtonElement>(
    'button.fr-select[aria-expanded="true"]',
  );
  btn?.click();
}

function onUpdate(values: (string | number)[]) {
  const ids = values.map(Number);
  if (!props.enableMultipleSelection) {
    const newId = ids.find((id) => !props.selectedIds.includes(id));
    emit("select", newId !== undefined ? [newId] : []);
    if (newId !== undefined) nextTick(closeDropdown);
  } else {
    emit("select", ids);
  }
}
</script>

<template>
  <div class="liste-deroulante">
    <div ref="wrapperRef">
      <DsfrMultiselect
        :model-value="selectedIds"
        :options="options"
        :label="label"
        :label-visible="true"
        :hint="description"
        :button-label="buttonLabel"
        :select-all="enableMultipleSelection"
        :search="true"
        id-key="id"
        label-key="label"
        max-overflow-height="40vh"
        @update:model-value="onUpdate"
      />
    </div>
  </div>
</template>

<style scoped>
.liste-deroulante {
  padding: 1rem;
}
</style>
