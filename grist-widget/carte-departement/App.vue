<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import CarteDepartement from "./CarteDepartement.vue";

const codeInputs = ref<string[]>([]);

const message = ref<string | undefined>();

const displayMessage = computed(() => message!.value !== undefined);

function formatCodeInputs(value: string) {
  const codes = value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return codes;
}

onMounted(() => {
  grist.ready({
    requiredAccess: "read table", //cf https://support.getgrist.com/widget-custom/#access-level
    columns: [{ name: "DDEP_C_COD", type: "Text", title: "Territoire" }],
  });
});

grist.onRecord((row, mappings) => {
  if (!mappings) {
    message.value = "Il y a un problème avec la correspondance des colonnes.";
    return;
  } else if (typeof mappings["DDEP_C_COD"] !== "string") {
    message.value = "Il y a eu un problème avec la correspondance de la colonne Territoire.";
    return;
  } else if (!row) {
    message.value = "Aucune ligne n'a été sélectionnée.";
    return;
  }
  const codesValue = row[mappings["DDEP_C_COD"]];
  if (codesValue !== undefined && typeof codesValue !== "string") {
    message.value = "Le type de la colonne Territoire est incorrect.";
    return;
  }

  message.value = undefined;
  codeInputs.value = codesValue ? formatCodeInputs(codesValue) : [];
});
</script>

<template>
  <DsfrAlert v-if="displayMessage" :small="true" :description="message" type="warning" />
  <CarteDepartement :code-inputs="codeInputs" />
</template>

<style scoped></style>
