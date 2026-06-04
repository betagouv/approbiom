<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import VueTableau from "./VueTableau.vue";
import type { RowRecord } from "grist/GristData";

const records = ref<RowRecord[]>([]);

const headers = computed(() =>
  records.value.length > 0 && records.value[0]
    ? Object.keys(records.value[0]).filter((k) => k !== "id")
    : [],
);

const rows = computed(() => records.value.map((r) => headers.value.map((h) => String(r[h] ?? ""))));

onMounted(() => {
  grist.ready({ requiredAccess: "read table" });
});

grist.onRecords((data) => {
  records.value = data;
});
</script>

<template>
  <VueTableau :headers="headers" :rows="rows" />
</template>

<style scoped></style>
