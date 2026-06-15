import { createApp } from "vue";
import App from "./App.vue";
import "@gouvfr/dsfr/dist/dsfr.min.css";
import "@gouvfr/dsfr/dist/utility/icons/icons.min.css";
import "@gouvminint/vue-dsfr/styles";
import { DsfrAlert } from "@gouvminint/vue-dsfr";

createApp(App).component("DsfrAlert", DsfrAlert).mount("#app");
