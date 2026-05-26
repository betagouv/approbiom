<script setup lang="ts">
import leaflet from "leaflet";
import { onMounted } from "vue";
import type { DepartementFeature, DepartementFeatureCollection } from "./types/departement";
import departementsRaw from "./data/departements.geojson";

const departementsData = departementsRaw as DepartementFeatureCollection;
const initialDepartement = departementsData.features[64] as DepartementFeature;

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
    .setView(toLatLngExpression(initialDepartement.properties._geopoint), initialZoom);
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
        return feature === initialDepartement;
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
