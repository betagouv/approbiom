<script setup lang="ts">
import CarteDepartement from "./CarteDepartement.vue";

grist.ready({
  requiredAccess: "full",
  allowSelectBy: true,
  columns: [{ name: "Département", type: "Text" }],
});

grist.onRecord((row) => {
  const preElement = document.getElementById("out");
  if (preElement) {
    preElement.textContent = JSON.stringify(row, null, 2);
  }
  try {
    if (row === null) {
      throw new Error("(No data - not on row - please add or select a row)");
    }
  } catch (err) {
    throw new Error(`error : ${err}`);
  }
});

grist.onOptions((_options, settings) => {
  const preElement = document.getElementById("option");
  if (preElement) {
    preElement.textContent = JSON.stringify(settings, null, 2);
  }
});
</script>

<template>
  <pre id="option">Options...</pre>
  <pre id="out">Chargement...</pre>
  <CarteDepartement />
</template>

<style scoped></style>
