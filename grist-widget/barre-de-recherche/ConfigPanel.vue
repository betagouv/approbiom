<script setup lang="ts">
import { ref, computed } from "vue";
import type { ColumnInfo } from "@shared/utils/grist";

interface TagFilter {
  colId: string;
  value: string;
  colType: "Choice" | "ChoiceList";
}

const props = defineProps<{
  choiceColumns: ColumnInfo[];
  savedFilters: TagFilter[];
  savedPlaceholder: string;
}>();

const emit = defineEmits<{
  save: [filters: TagFilter[], placeholder: string];
  cancel: [];
}>();

const draftFilters = ref<TagFilter[]>([...props.savedFilters]);
const draftPlaceholder = ref(props.savedPlaceholder);
const selectedColId = ref("");
const selectedValue = ref("");

const columnOptions = computed(() => [
  { value: "", text: "— Sélectionner —" },
  ...props.choiceColumns.map((c) => ({ value: c.colId, text: c.label })),
]);

const valueOptions = computed(() => {
  const col = props.choiceColumns.find((c) => c.colId === selectedColId.value);
  const choices = col?.choices ?? [];
  return [{ value: "", text: "— Sélectionner —" }, ...choices.map((v) => ({ value: v, text: v }))];
});

function colTypeFor(colId: string): "Choice" | "ChoiceList" {
  const col = props.choiceColumns.find((c) => c.colId === colId);
  return col?.type === "ChoiceList" ? "ChoiceList" : "Choice";
}

function labelFor(colId: string): string {
  return props.choiceColumns.find((c) => c.colId === colId)?.label ?? colId;
}

function onColChange(colId: string) {
  selectedColId.value = colId;
  selectedValue.value = "";
}

function addFilter() {
  if (!selectedColId.value || !selectedValue.value) return;
  draftFilters.value.push({
    colId: selectedColId.value,
    value: selectedValue.value,
    colType: colTypeFor(selectedColId.value),
  });
  selectedColId.value = "";
  selectedValue.value = "";
}

function removeFilter(i: number) {
  draftFilters.value.splice(i, 1);
}

function save() {
  emit(
    "save",
    draftFilters.value.map((f) => ({ colId: f.colId, value: f.value, colType: f.colType })),
    draftPlaceholder.value.trim(),
  );
}
</script>

<template>
  <div class="config-panel">
    <form class="config-panel__content" novalidate @submit.prevent="save">
      <h2 class="fr-h5 config-panel__heading">Panneau de configuration</h2>

      <DsfrInputGroup
        label="Texte d'aide (placeholder)"
        label-visible
        hint="Texte affiché dans la barre de recherche lorsqu'elle est vide."
        :model-value="draftPlaceholder"
        placeholder="Rechercher…"
        @update:model-value="draftPlaceholder = String($event)"
      />

      <p class="fr-text--sm config-panel__description">
        Les filtres s'appliquent aux colonnes de type <strong>Choix</strong> ou
        <strong>Liste de choix</strong> sélectionnées dans <em>Colonnes à filtrer par tag</em>.
        Configurez d'abord cette colonne dans les paramètres du widget, puis revenez ici pour
        ajouter des filtres.
      </p>

      <div v-if="draftFilters.length > 0" class="config-panel__filters">
        <p class="fr-label">Filtres configurés</p>
        <ul class="fr-tags-group">
          <li v-for="(f, i) in draftFilters" :key="i">
            <button type="button" class="fr-tag fr-tag--dismiss" @click="removeFilter(i)">
              {{ labelFor(f.colId) }} : {{ f.value }}
            </button>
          </li>
        </ul>
      </div>

      <DsfrAlert
        v-if="choiceColumns.length === 0"
        type="info"
        :small="true"
        description="Aucune colonne de type Choix ou Liste de choix parmi les colonnes à filtrer. Mappez une colonne dans « Colonnes à filtrer par tag » dans les paramètres du widget."
      />
      <template v-else>
        <DsfrSelect
          label="Colonne"
          label-visible
          :options="columnOptions"
          :model-value="selectedColId"
          @update:model-value="onColChange(String($event))"
        />
        <DsfrSelect
          label="Valeur"
          label-visible
          :options="valueOptions"
          :model-value="selectedValue"
          :disabled="!selectedColId"
          @update:model-value="selectedValue = String($event)"
        />
        <DsfrButton
          label="Ajouter ce filtre"
          type="button"
          secondary
          :disabled="!selectedColId || !selectedValue"
          @click="addFilter"
        />
      </template>

      <div class="config-panel__actions">
        <DsfrButton label="Annuler" secondary type="button" @click="emit('cancel')" />
        <DsfrButton label="Enregistrer" type="submit" />
      </div>
    </form>
  </div>
</template>

<style scoped>
.config-panel {
  display: flex;
  justify-content: center;
  min-height: 100vh;
  padding: 1rem;
}

.config-panel__content {
  width: 100%;
  max-width: 480px;
}

.config-panel__heading {
  margin-bottom: 0.5rem;
}

.config-panel__description {
  margin-bottom: 1rem;
  color: var(--text-mention-grey, #666);
}

.config-panel__filters {
  margin-bottom: 1rem;
}

.config-panel__actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1.5rem;
  justify-content: flex-end;
}
</style>
