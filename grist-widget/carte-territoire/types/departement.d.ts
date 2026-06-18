import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";

export interface DepartementProperties {
  DDEP_C_COD: string;
  DDEP_L_LIB: string;
  DREG_L_LIB: string;
  _rand: number;
  _geopoint: string;
  _i: number;
  _id: string;
}

export type DepartementFeature = Feature<Polygon | MultiPolygon, DepartementProperties>;
export type DepartementFeatureCollection = FeatureCollection<
  Polygon | MultiPolygon,
  DepartementProperties
>;
