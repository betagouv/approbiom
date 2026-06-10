import { createApp } from "vue";
import App from "./App.vue";
import "@gouvfr/dsfr/dist/dsfr.min.css";
import "@gouvfr/dsfr/dist/utility/icons/icons.min.css";
import "@gouvminint/vue-dsfr/styles";
import {
  DsfrAlert,
  DsfrDataTable,
  DsfrInputGroup,
  DsfrButton,
  DsfrToggleSwitch,
} from "@gouvminint/vue-dsfr";

createApp(App)
  .component("DsfrAlert", DsfrAlert)
  .component("DsfrDataTable", DsfrDataTable)
  .component("DsfrInputGroup", DsfrInputGroup)
  .component("DsfrButton", DsfrButton)
  .component("DsfrToggleSwitch", DsfrToggleSwitch)
  .mount("#app");
