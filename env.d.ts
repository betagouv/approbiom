/// <reference types="vite/client" />

// CSS side-effect import: no types to export, this declaration tells TypeScript to stop complaining about it.
declare module "@gouvminint/vue-dsfr/styles";

declare module "*.geojson" {
  import type { GeoJSON } from "geojson";
  const value: GeoJSON;
  export default value;
}
