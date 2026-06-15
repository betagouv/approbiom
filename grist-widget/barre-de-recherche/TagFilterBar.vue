<script setup lang="ts">
import { computed } from "vue";

interface TagFilter {
  colId: string;
  value: string;
  colType: "Choice" | "ChoiceList";
}

const props = defineProps<{
  filters: TagFilter[];
  activeTags: TagFilter[];
  columnLabels: Record<string, string>;
}>();

const emit = defineEmits<{
  "update:activeTags": [tags: TagFilter[]];
}>();

function filterKey(f: TagFilter): string {
  return `${f.colId}::${f.value}`;
}

const tags = computed(() =>
  props.filters.map((f) => ({
    label: (props.columnLabels[f.colId] ?? f.colId) + " : " + f.value,
    value: filterKey(f),
    selectable: true,
  })),
);

const activeKeys = computed({
  get: () => props.activeTags.map(filterKey),
  set: (keys: unknown[]) => {
    const next = props.filters.filter((f) => (keys as string[]).includes(filterKey(f)));
    emit("update:activeTags", next);
  },
});
</script>

<template>
  <DsfrTags v-if="filters.length > 0" :tags="tags" v-model="activeKeys" />
</template>
