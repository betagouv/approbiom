import { createApp } from "vue";
import App from "./App.vue";
import "@gouvfr/dsfr/dist/dsfr.min.css";
import "@gouvfr/dsfr/dist/utility/icons/icons.min.css";
import "@gouvminint/vue-dsfr/styles";
import { DsfrAlert, DsfrButton, DsfrInputGroup, DsfrMultiselect } from "@gouvminint/vue-dsfr";

createApp(App)
  .component("DsfrAlert", DsfrAlert)
  .component("DsfrButton", DsfrButton)
  .component("DsfrInputGroup", DsfrInputGroup)
  .component("DsfrMultiselect", DsfrMultiselect)
  .mount("#app");
