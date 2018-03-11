import GeoJsonHelper from "./GeoJsonHelper";
import {PosCoords} from "./HoustonScheduler";

const stateFinder = new GeoJsonHelper('resources/StateShapes.geojson', (feature) =>
  feature.properties.NAME
);
const isInState: (id: string, pos: PosCoords) => Promise<boolean> = stateFinder.isInRegion.bind(stateFinder);
export {
  isInState
}