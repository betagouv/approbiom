<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import CarteDepartement from "./CarteDepartement.vue";

const codeDepartmentInputs = ref<string[]>([]);

const message = ref<string | undefined>();

const displayMessage = computed(() => message!.value !== undefined);

function formatCodeDepartmentInputs(value: string) {
  const codes = value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return codes;
}

onMounted(() => {
  grist.ready({
    requiredAccess: "read table", //cf https://support.getgrist.com/widget-custom/#access-level
    columns: [{ name: "DDEP_C_COD", type: "Text", title: "Département" }],
  });
});

grist.onRecord((row, mappings) => {
  if (!mappings) {
    message.value = "Il y a un problème avec la correspondance des colonnes.";
    return;
  } else if (typeof mappings["DDEP_C_COD"] !== "string") {
    message.value = "Il y a eu un problème avec la correspondance de la colonne Département.";
    return;
  } else if (!row) {
    message.value = "Aucune ligne n'a été sélectionnée.";
    return;
  }
  const depCodesValue = row[mappings["DDEP_C_COD"]];
  if (depCodesValue !== undefined && typeof depCodesValue !== "string") {
    message.value = "Le type de la colonne Département est incorrect.";
    return;
  }

  message.value = undefined;
  codeDepartmentInputs.value = depCodesValue ? formatCodeDepartmentInputs(depCodesValue) : [];
});
</script>

<template>
  <div v-if="displayMessage">
    {{ message }}
  </div>
  <CarteDepartement :code-department-inputs="codeDepartmentInputs" />
</template>

<style scoped></style>
