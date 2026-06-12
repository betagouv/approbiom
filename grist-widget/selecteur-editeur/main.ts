import { createApp } from "vue";
import App from "./App.vue";
import "@gouvfr/dsfr/dist/dsfr.min.css";
import "@gouvfr/dsfr/dist/utility/icons/icons.min.css";
import "@gouvminint/vue-dsfr/styles";
import { DsfrAlert, DsfrSelect, DsfrButton, DsfrInputGroup } from "@gouvminint/vue-dsfr";

createApp(App)
  .component("DsfrAlert", DsfrAlert)
  .component("DsfrSelect", DsfrSelect)
  .component("DsfrButton", DsfrButton)
  .component("DsfrInputGroup", DsfrInputGroup)
  .mount("#app");
