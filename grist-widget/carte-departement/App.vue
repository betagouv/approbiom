<script setup lang="ts">
import { ref, computed } from "vue";
import CarteDepartement from "./CarteDepartement.vue";

const inputValue = ref("64");

const codeDepartmentInputs = computed(() => {
  const codes = inputValue.value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return codes.length > 0 ? codes : null;
});

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
  }
});
</script>

<template>
  <div style="padding: 8px; background: #f0f0f0; display: flex; gap: 8px; align-items: center">
    <label>Départements (séparés par virgule) :</label>
    <input v-model="inputValue" placeholder="ex: 64, 33, 75" style="padding: 4px 8px" />
  </div>
  <pre id="out">Row ici</pre>
  <pre id="readout">Waiting for data...</pre>
  <CarteDepartement :code-department-inputs="codeDepartmentInputs" />
</template>

<style scoped></style>
