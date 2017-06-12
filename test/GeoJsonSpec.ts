import GeoJsonHelper from "../app/GeoJsonHelper";
import "mocha";
import * as chai from 'chai';
import * as chaiAsPromised from "chai-as-promised";

before(() => {
  chai.should();
  chai.use(chaiAsPromised);
});


describe('GeoJsonSpec', () => {
  const houston = {latitude: 29.7982722, longitude: -95.3736702};
  const geoJsonHelper = new GeoJsonHelper('resources/StateShapes.geojson', (feature) =>
    feature.properties.NAME
  );

  it('should say houston in in texas', () => {
    return geoJsonHelper.isInRegion("Texas",
      houston).should.eventually.be.true;

  });

  it('should say houston in not in oklahoma', () => {
    return geoJsonHelper.isInRegion("Oklahoma",
      houston).should.eventually.be.false;
  });
});