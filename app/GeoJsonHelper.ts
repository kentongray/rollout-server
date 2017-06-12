import * as fs from "fs";
import {Feature, FeatureCollection, MultiPolygon, Point, Polygon} from "geojson";

import {PosCoords} from "./HoustonScheduler";

//figure out how to make this an import. grr
const gju = require("geojson-utils/geojson-utils");

type SomeTimeOfPolygon = MultiPolygon | Polygon;

/**
 * Utility for working with the GeoJSON files I've needed so far,
 * (Feature Collections with Polygons/Multipolygons)
 */
export default class GeoJsonHelper {

  data: Promise<FeatureCollection<SomeTimeOfPolygon>>;
  idMap: { [key: string]: Feature<SomeTimeOfPolygon> } = {};

  constructor(data, findKey: (Feature) => string) {
    this.data = new Promise((resolve, reject) => {
      fs.readFile(data, 'utf8', (err, fileData) => {
        if (err) {
          console.error('Could not read file. This is now in an unusable state', fileData);
          reject(err);
        }
        const json: FeatureCollection<SomeTimeOfPolygon> = JSON.parse(fileData);

        json.features.forEach((f) => {
          const key: string = findKey(f);
          this.idMap[key] = f;
        });
        resolve(json);
      });
    })
  }

  isInRegion(id: string, pos: PosCoords): Promise<boolean> {
    const point = {'type': 'Point', 'coordinates': [pos.longitude, pos.latitude]};
    return this.data.then(() => {
      const feature = this.idMap[id];
      let result = false;
      if (feature.geometry.type == 'Polygon') {
        result = gju.pointInPolygon(point, feature.geometry)
      }
      else {
        result = gju.pointInMultiPolygon(point, feature.geometry);
      }
      return result;
    }, console.error)
  }
}