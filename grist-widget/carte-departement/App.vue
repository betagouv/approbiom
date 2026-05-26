<script setup lang="ts">
import CarteDepartement from "./CarteDepartement.vue";

grist.ready({
  requiredAccess: "read table", // Possible values are: none, read table and full. https://support.getgrist.com/widget-custom/#access-level
  columns: [{ name: "DDEP_C_COD", type: "Text", title: "Département" }],
});

grist.onRecord((row, mappings) => {
  if (!mappings) {
    throw new Error("mappings variable is undefined");
  }

  if (typeof mappings["DDEP_C_COD"] !== "string") {
    throw new Error("No mapping for DDEP_C_COD");
  }

  if (row && row[mappings["DDEP_C_COD"]]) {
    const preElement = document.getElementById("out");

    if (preElement) {
      //test display
      preElement.textContent = JSON.stringify(row[mappings["DDEP_C_COD"]]);
    }
  }
});

grist.onOptions((_options, settings) => {
  if (settings.accessLevel !== "none") {
    const readoutElement = document.getElementById("readout");
    if (readoutElement) {
      readoutElement.remove();
    }
  } else {
    //test display
    const preElement = document.getElementById("option");
    if (preElement) {
      preElement.textContent = JSON.stringify(settings, null, 2);
    }
  }
});
</script>

<template>
  <pre id="option">Options...</pre>
  <pre id="out">Row ici</pre>
  <pre id="readout">Waiting for data...</pre>
  <CarteDepartement />
</template>

<style scoped></style>
