<script setup lang="ts">
import CarteDepartement from "./CarteDepartement.vue";

/* READY */
grist.ready({
  requiredAccess: "full",
  allowSelectBy: true,
});

grist.onRecord((data) => {
  console.log("data test", data);
});
</script>

<template>
  <CarteDepartement />
</template>

<style scoped></style>
