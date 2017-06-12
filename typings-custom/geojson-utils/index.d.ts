import {MultiPolygon, Point, Polygon} from "geojson";

declare module geoJsonUtils {
  function pointInPolygon(point: Point, polygon: Polygon);
  function pointInMultiPolygon(point: Point, polygon: MultiPolygon);
}
