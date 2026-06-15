import { createApp } from "vue";
import App from "./App.vue";
import "@gouvfr/dsfr/dist/dsfr.min.css";
import "@gouvfr/dsfr/dist/utility/icons/icons.min.css";
import "@gouvminint/vue-dsfr/styles";
import { DsfrAlert, DsfrSearchBar, DsfrTags, DsfrButton, DsfrSelect } from "@gouvminint/vue-dsfr";

createApp(App)
  .component("DsfrAlert", DsfrAlert)
  .component("DsfrSearchBar", DsfrSearchBar)
  .component("DsfrTags", DsfrTags)
  .component("DsfrButton", DsfrButton)
  .component("DsfrSelect", DsfrSelect)
  .mount("#app");
