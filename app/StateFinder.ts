import GeoJsonHelper from "./GeoJsonHelper";
const stateFinder = new GeoJsonHelper('resources/StateShapes.geojson', (feature) =>
  feature.properties.NAME
);
const isInState = stateFinder.isInRegion.bind(stateFinder);
export {
  isInState
}