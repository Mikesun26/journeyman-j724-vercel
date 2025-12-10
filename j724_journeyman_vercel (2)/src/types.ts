export type Feature = { type:"Feature"; geometry:{ type:"Point"|"LineString"|"Polygon"; coordinates:any }; properties?:Record<string,any> };
export type FeatureCollection = { type:"FeatureCollection"; features: Feature[] };
