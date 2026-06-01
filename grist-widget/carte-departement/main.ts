import { createApp } from "vue";
import App from "./App.vue";
import "@gouvfr/dsfr/dist/dsfr.min.css"; // Import des styles du DSFR
import "@gouvminint/vue-dsfr/styles"; // Import des styles globaux propres à VueDSFR //
import { DsfrAlert } from "@gouvminint/vue-dsfr";

createApp(App).component("DsfrAlert", DsfrAlert).mount("#app");
