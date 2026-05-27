<script setup lang="ts">
import leaflet from "leaflet";
import { computed, onMounted } from "vue";
import type { DepartementFeature, DepartementFeatureCollection } from "./types/departement";
import departementsRaw from "./data/departements.geojson";

const departementsData = departementsRaw as DepartementFeatureCollection;

interface Props {
  codeDepartmentInputs?: [string, ...string[]] | null;
}

const { codeDepartmentInputs = null } = defineProps<Props>();

const selectedDepartmentFeatures = computed(() => {
  if (codeDepartmentInputs === null) {
    return [];
  }
  const departmentFeaturesFound = departementsData.features.filter((feature) =>
    codeDepartmentInputs.includes(feature.properties.DDEP_C_COD),
  );

  if (departmentFeaturesFound.length === 0) {
    throw new Error(`Les départements fournis n'ont pas été reconnus : ${codeDepartmentInputs}`);
  }
  return departmentFeaturesFound;
});
const firstFeature = selectedDepartmentFeatures.value?.[0];

const initialZoom = 8;

let map: leaflet.Map;

function toLatLngExpression(geopoint: string) {
  const splittedGeopoint = geopoint.split(",");
  if (
    splittedGeopoint.length !== 2 ||
    !(splittedGeopoint[0] && Number(splittedGeopoint[0])) ||
    !(splittedGeopoint[1] && Number(splittedGeopoint[1]))
  ) {
    throw new Error("geopoint should describe a latitude and a longitude");
  }
  const latlng: leaflet.LatLngExpression = [
    Number(splittedGeopoint[0]),
    Number(splittedGeopoint[1]),
  ];
  return latlng;
}

onMounted(() => {
  map = leaflet
    .map("map")
    .setView(
      firstFeature?.properties?._geopoint
        ? toLatLngExpression(firstFeature?.properties?._geopoint)
        : [47.75, 1.67],
      initialZoom,
    );
  leaflet
    .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 9,
      minZoom: 5,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    })
    .addTo(map);

  leaflet
    .geoJSON(departementsData, {
      filter: function (feature) {
        // TypeScript cannot infer that `feature` is a `DepartementFeature` here,
        // so we explicitly assert the type in order to safely compare against the
        // selected department list.
        return selectedDepartmentFeatures.value.includes(feature as DepartementFeature);
      },
    })
    .addTo(map);
});
</script>

<template>
  <div id="map"></div>
</template>

<style scoped>
#map {
  height: 100vh;
  width: 100%;
}
</style>
