<script setup lang="ts">
import leaflet from "leaflet";
import { computed, onMounted, onUnmounted, watch } from "vue";
import type { DepartementFeatureCollection } from "./types/departement";
import type { PaysFeatureCollection } from "./types/pays";
import departementsRaw from "./data/departements.geojson";
import paysRaw from "./data/World_Countries_Boundaries.geojson";
import cogIsoRaw from "./data/pays-cog.json";

const departementsData = departementsRaw as DepartementFeatureCollection;
const paysData = paysRaw as PaysFeatureCollection;

const cogToIso: Record<string, string> = Object.fromEntries(
  Object.entries(cogIsoRaw as Record<string, string>).filter(([k]) => !k.startsWith("_")),
);

interface Props {
  codeInputs: string[];
}

const props = defineProps<Props>();

const centerOfFrance = { lat: 47.75, lng: 1.67 };
const initialZoom = 6;

const isCountryCode = (code: string) => /^99\d{3}$/.test(code);

const departmentKnownCodes = new Set(departementsData.features.map((f) => f.properties.DDEP_C_COD));
const countryKnownCodes = new Set(Object.keys(cogToIso));

const territoireValidation = computed(() => {
  if (props.codeInputs.length === 0) {
    return { status: "empty" as const };
  }

  const deptCodes = props.codeInputs.filter((c) => !isCountryCode(c));
  const countryCodes = props.codeInputs.filter(isCountryCode);

  const invalidCodes = [
    ...deptCodes.filter((c) => !departmentKnownCodes.has(c)),
    ...countryCodes.filter((c) => !countryKnownCodes.has(c)),
  ];

  const deptFeatures = departementsData.features.filter((f) =>
    deptCodes.includes(f.properties.DDEP_C_COD),
  );
  const countryFeatures = paysData.features.filter((f) =>
    countryCodes.some((c) => cogToIso[c] === f.properties.ISO2),
  );

  const features = [...deptFeatures, ...countryFeatures];

  if (invalidCodes.length > 0) {
    return { status: "partial" as const, invalidCodes, features };
  }
  return { status: "ok" as const, features };
});

let map: leaflet.Map;
let geoJsonLayer: leaflet.GeoJSON | null = null;
let resizeObserver: ResizeObserver | null = null;

const mapId = "map";

onMounted(() => {
  map = leaflet
    .map(mapId, {
      zoomControl: false,
    })
    .setView(centerOfFrance, initialZoom);

  // Grist loads the widget in an iframe whose size settles after init.
  // Without this, Leaflet caches a stale container size and leaves grey tiles.
  const mapEl = document.getElementById(mapId)!;
  resizeObserver = new ResizeObserver(() => map.invalidateSize());
  resizeObserver.observe(mapEl);

  leaflet
    .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 9,
      minZoom: 2,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    })
    .addTo(map);

  watch(
    territoireValidation,
    (validation) => {
      geoJsonLayer?.remove();
      geoJsonLayer = null;

      if (validation.status === "ok" || validation.status === "partial") {
        if (validation.features.length > 0) {
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
      } else {
        map.setView(centerOfFrance, initialZoom);
      }
    },
    { immediate: true },
  );
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  map?.remove();
});
</script>

<template>
  <div class="wrapper">
    <DsfrAlert
      v-if="territoireValidation.status === 'partial'"
      :title="`Code(s) non reconnu(s) : ${territoireValidation.invalidCodes.join(', ')}`"
      description="Les codes doivent respecter la nomenclature officielle de l'INSEE. Les codes de département à un seul chiffre doivent comporter un zéro initial (ex : 09 et non 9). Les codes pays sont des codes COG à 5 chiffres commençant par 99 (ex : 99109 pour l'Allemagne)."
      type="warning"
    />
    <div :id="mapId"></div>
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
