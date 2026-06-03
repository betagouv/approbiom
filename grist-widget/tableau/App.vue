<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import Tableau from "./Tableau.vue";

const records = ref<Record<string, unknown>[]>([]);

const headers = computed(() =>
  records.value.length > 0 ? Object.keys(records.value[0]).filter((k) => k !== "id") : [],
);

const rows = computed(() =>
  records.value.map((r) => headers.value.map((h) => String(r[h] ?? ""))),
);

onMounted(() => {
  grist.ready({ requiredAccess: "read table" });
});

grist.onRecords((data) => {
  records.value = (data as Record<string, unknown>[]) ?? [];
});
</script>

<template>
  <Tableau :headers="headers" :rows="rows" />
</template>

<style scoped></style>
