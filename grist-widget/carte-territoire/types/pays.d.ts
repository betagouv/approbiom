import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";

export interface PaysProperties {
  ISO2: string;
  ISO3: string;
  NAME: string;
  VISUALIZATION_NAME: string;
  CONTINENT: string;
  [key: string]: unknown;
}

export type PaysFeature = Feature<Polygon | MultiPolygon, PaysProperties>;
export type PaysFeatureCollection = FeatureCollection<Polygon | MultiPolygon, PaysProperties>;
