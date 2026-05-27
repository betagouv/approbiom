<script setup lang="ts">
import leaflet from "leaflet";
import { computed, onMounted, onUnmounted, watch } from "vue";
import type { DepartementFeatureCollection } from "./types/departement";
import departementsRaw from "./data/departements.geojson";

const departementsData = departementsRaw as DepartementFeatureCollection;

interface Props {
  codeDepartmentInputs: [string, ...string[]] | null;
}

const props = defineProps<Props>();

const centerOfFrance = { lat: 47.75, lng: 1.67 };
const initialZoom = 6;

const knownCodes = new Set(departementsData.features.map((f) => f.properties.DDEP_C_COD));

const departmentValidation = computed(() => {
  if (!props.codeDepartmentInputs) {
    return { status: "empty" as const };
  }
  const invalidCodes = props.codeDepartmentInputs.filter((code) => !knownCodes.has(code));
  if (invalidCodes.length > 0) {
    return { status: "error" as const, invalidCodes };
  }
  const features = departementsData.features.filter((f) =>
    props.codeDepartmentInputs!.includes(f.properties.DDEP_C_COD),
  );
  return { status: "ok" as const, features };
});

let map: leaflet.Map;
let geoJsonLayer: leaflet.GeoJSON | null = null;

onMounted(() => {
  map = leaflet.map("map").setView(centerOfFrance, initialZoom);

  leaflet
    .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 9,
      minZoom: 5,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    })
    .addTo(map);

  watch(
    departmentValidation,
    (validation) => {
      geoJsonLayer?.remove();
      geoJsonLayer = null;

      if (validation.status === "ok") {
        geoJsonLayer = leaflet.geoJSON(validation.features).addTo(map);
        map.fitBounds(geoJsonLayer.getBounds());
      } else {
        map.setView(centerOfFrance, initialZoom);
      }
    },
    { immediate: true },
  );
});

onUnmounted(() => map?.remove());
</script>

<template>
  <div class="wrapper">
    <div v-if="departmentValidation.status === 'error'" class="error-message">
      <strong>
        Département(s) non reconnu(s) : "{{ departmentValidation.invalidCodes.join('", "') }}"
      </strong>
      <br />
      Les codes département sont des chaînes de caractères. Les départements à un seul chiffre
      doivent commencer par zéro (ex : "09" et non "9").
    </div>
    <div id="map"></div>
  </div>
</template>

<style scoped>
.wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.error-message {
  padding: 8px 12px;
  background: #fff3cd;
  border-bottom: 1px solid #ffc107;
  color: #856404;
  font-size: 0.875rem;
  flex-shrink: 0;
}

#map {
  flex: 1;
  width: 100%;
}
</style>
