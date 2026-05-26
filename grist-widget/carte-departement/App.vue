<script setup lang="ts">
import CarteDepartement from "./CarteDepartement.vue";

/* READY */
grist.ready({
  requiredAccess: "full",
  allowSelectBy: true,
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
</script>

<template>
  <pre id="out">Chargement...</pre>
  <CarteDepartement />
</template>

<style scoped></style>
