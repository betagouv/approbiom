<script setup lang="ts">
defineProps<{
  headers: string[];
  rows: string[][];
}>();
</script>

<template>
  <DsfrAlert
    v-if="rows.length === 0"
    type="info"
    :small="true"
    description="Aucune donnée à afficher."
  />
  <DsfrTable v-else title="Données du tableau" :headers="headers" :rows="rows" />
</template>

<style scoped></style>
