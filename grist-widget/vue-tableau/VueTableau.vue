<script setup lang="ts">
defineProps<{
  headers: string[];
  rows: string[][];
  title: string;
}>();
</script>

<template>
  <DsfrAlert
    v-if="rows.length === 0"
    type="info"
    :small="true"
    description="Aucune donnée à afficher."
  />
  <DsfrTable v-else :title="title" :headers="headers" :rows="rows" />
</template>

<style>
/* DSFR sets display: block on .fr-table > table for horizontal scrolling, but that breaks
   tbody from filling the full width. display: table restores normal table layout. */
.fr-table table {
  display: table !important;
}
</style>
