<script setup lang="ts">
import leaflet from "leaflet";
import { computed, onMounted, onUnmounted, watch } from "vue";
import type { DepartementFeatureCollection } from "./types/departement";
import departementsRaw from "./data/departements.geojson";

const departementsData = departementsRaw as DepartementFeatureCollection;

interface Props {
  codeDepartmentInputs: string[];
}

const props = defineProps<Props>();

const centerOfFrance = { lat: 47.75, lng: 1.67 };
const initialZoom = 6;

const knownCodes = new Set(departementsData.features.map((f) => f.properties.DDEP_C_COD));

const departmentValidation = computed(() => {
  if (props.codeDepartmentInputs.length === 0) {
    return { status: "error" as const };
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
  map = leaflet
    .map("map", {
      zoomControl: false,
    })
    .setView(centerOfFrance, initialZoom);

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
        // Leaflet cannot read CSS custom properties — resolve the value from the DOM at runtime.
        const blueActive = getComputedStyle(document.documentElement)
          .getPropertyValue("--blue-france-sun-113-625-active")
          .trim();

        geoJsonLayer = leaflet
          .geoJSON(validation.features, {
            style: {
              color: blueActive,
              fillColor: blueActive,
            },
          })
          .addTo(map);
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
    <DsfrAlert
      v-if="departmentValidation.status === 'error'"
      :title="`Département(s) non reconnu(s) : ${departmentValidation?.invalidCodes?.join(',')}`"
      description="Les codes de département doivent respecter la nomenclature officielle de l’INSEE. Les départements à un seul chiffre doivent comporter un zéro initial (ex : 09 et non 9)."
      type="warning"
    />
    <div id="map"></div>
  </div>
</template>

<style scoped>
.wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

#map {
  flex: 1;
  width: 100%;
}
</style>
