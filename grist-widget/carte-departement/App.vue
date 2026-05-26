<script setup lang="ts">
import CarteDepartement from "./CarteDepartement.vue";

/* READY */
grist.ready({
  requiredAccess: "full",
  allowSelectBy: true,
});

grist.onRecord((row) => {
  try {
    if (row === null) {
      throw new Error("(No data - not on row - please add or select a row)");
    }
    console.log("GOT...", JSON.stringify(row));
  } catch (err) {
    throw new Error(`error : ${err}`);
  }
});
</script>

<template>
  <CarteDepartement />
</template>

<style scoped></style>
