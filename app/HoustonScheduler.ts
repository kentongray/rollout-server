import * as moment from "moment";
import {Moment} from "moment";
import * as _ from "lodash";
import axios, { AxiosResponse } from "axios";
import {HOLIDAYS} from "./HoustonHolidays";
import {EventInfo, PickupDay, Scheduler} from "./Scheduler";

//interfaces for different coordinate types, prefer latitude longitude
export interface PosCoords {
  latitude: number,longitude: number
}

/**
 *
 * Handles pickup schedules for Houston.
 *
 * Takes ArcGIS data and translates it to human json
 *
 * Example ArcGIS calls for citymap
 * trash
 * http://mycity.houstontx.gov/cohgis/rest/services/SWD/SolidWaste_wm/MapServer/6/query?&geometry=%7B%22y%22%3A%2229.7982722%22%2C%22x%22%3A%22-95.3736702%22%2C%22spatialReference%22%3A%7B%22wkid%22%3A4326%7D%7D&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&returnGeometry=false&outSR=102100&f=json&outFields=DAY
 *
 * heavy/junk
 * http://mycity.houstontx.gov/cohgis/rest/services/SWD/SolidWaste_wm/MapServer/5/query?&geometry=%7B%22y%22%3A%2229.7982722%22%2C%22x%22%3A%22-95.3736702%22%2C%22spatialReference%22%3A%7B%22wkid%22%3A4326%7D%7D&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&returnGeometry=false&outSR=102100&f=json&outFields=SERVICE_DA
 * recycling
 * http://mycity.houstontx.gov/cohgis/rest/services/SWD/SolidWaste_wm/MapServer/4/query?&geometry=%7B%22y%22%3A%2229.7982722%22%2C%22x%22%3A%22-95.3736702%22%2C%22spatialReference%22%3A%7B%22wkid%22%3A4326%7D%7D&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&returnGeometry=false&outSR=102100&f=json&outFields=SERVICE_DAY
 **/
export class HoustonScheduler implements Scheduler {
  numberOfDays: number;
  pickupDays: PickupDay;
  holidays = HOLIDAYS;
  whenLoaded: Promise<void>;

  static getDayIndex(dayStr) {
    return moment(dayStr, 'dddd').day()
  }

  readonly mapNumbers = [3];

  readonly mapServer = 'https://mycity2.houstontx.gov/pubgis01/rest/services/EGIS/HOUSTON_CITYINFO/MapServer/3';

  /**
   * Initializes the obj with event data
   * @param pos
   * @param numberOfDays
   */
  constructor(pos: PosCoords, numberOfDays: number = 60) {
    this.numberOfDays = numberOfDays;
    const esriPos = {y: (<PosCoords> pos).latitude, x: (<PosCoords> pos).longitude, spatialReference: {'wkid': 4326}};


    const params = {
      geometry: JSON.stringify(esriPos),
      geometryType: 'esriGeometryPoint',
      spatialRel: 'esriSpatialRelIntersects',
      returnGeometry: 'false',
      f: 'json',
    };

    //https://mycity2.houstontx.gov/pubgis01/rest/services/EGIS/HOUSTON_CITYINFO/MapServer/3/query?&geometry=%7B%22y%22%3A%2229.7982722%22%2C%22x%22%3A%22-95.3736702%22%2C%22spatialReference%22%3A%7B%22wkid%22%3A4326%7D%7D&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=SWDGarbageDay%2CSWDRecyclingDAY%2CSWDHeavyTrashDAY&returnGeometry=false&f=pjson

    const paramStr = Object.keys(params).reduce((paramStr, key) => `${paramStr}&${key}=${encodeURIComponent(params[key])}`, '?');


    const url = `${this.mapServer}/query${paramStr}&outFields=SWDGarbageDay,SWDRecyclingDAY,SWDHeavyTrashDAY`;
    console.log(url);
    const request = axios.request({method: 'GET', url, timeout: 15000, responseType: 'json'});

    //get all relevant data
    this.whenLoaded = request.then((results) => {
      this.parseData(results);
    });
  }

  /**
   * Take results from COH API and turn them into something we can work with
   * @param wasteData
   * @param junkData
   * @param recyclingData
   * @returns {Array<any>}
   */
  parseData(results:AxiosResponse) {
    //waste is one day a week
    let wasteDay = -1;
    //heavy trash pickup is in the form of #rd WEEKDAY
    let junkWeekOfMonth = -1;
    let junkDay = -1;
    //recycling pickup is alternating weeks
    let recyclingDay = -1;
    let recyclingOnEvenWeeks = false;
    
    console.log(results.data);
    if (this.isValidData(results.data)) {
      const attributes = results.data.features[0].attributes;
      wasteDay = HoustonScheduler.getDayIndex(attributes.SWDGarbageDay);
      let junkPattern = attributes.SWDHeavyTrashDAY;
      junkWeekOfMonth = parseInt(junkPattern.substr(0, 1));
      junkDay = HoustonScheduler.getDayIndex(junkPattern.substr(junkPattern.indexOf(' ')));
      let recyclingSchedule = attributes.SWDRecyclingDAY;
      recyclingDay = HoustonScheduler.getDayIndex(recyclingSchedule.split('-')[0]);
      // on even years A schedule is on odd weeks, vice versa on odd years
      //http://www.houstontx.gov/solidwaste/Recycle_Cal.pdf
      const aSchedule = recyclingSchedule.includes('-A');
      recyclingOnEvenWeeks = !aSchedule;
    }


    this.pickupDays = {wasteDay, junkWeekOfMonth, junkDay, recyclingDay, recyclingOnEvenWeeks};
  }

  isValidData(data) {
    return data && data.features && data.features.length && data.features[0].attributes;
  }

  isWasteDay(day) {
    return day.day() == this.pickupDays.wasteDay;
  }

  //used for both trash/and junk days
  isHeavyDay(day) {
    let dayInMonth = day.clone().startOf('month');
    let occurances = 0;
    while (occurances < this.pickupDays.junkWeekOfMonth) {
      if (dayInMonth.day() == this.pickupDays.junkDay) {
        occurances++;
      }
      dayInMonth.add(1, 'days');
    }
    //offset the last day added (ew)
    dayInMonth.add(-1, 'days');
    return dayInMonth.isSame(day, 'day');
  }

  isTreeDay(day) {
    return !this.isEvenMonth(day) && this.isHeavyDay(day);
  }

  isJunkDay(day) {
    return this.isEvenMonth(day) && this.isHeavyDay(day);
  }

  isEvenMonth(day) {
    return (day.month() + 1) % 2 == 0;
  }

  isRecyclingDay(day) {
    //recycling schedule A occurs every other week (starting at second week)
    let isEvenWeek = day.weeks() % 2 == 1;
    let isThisWeek = (this.pickupDays.recyclingOnEvenWeeks && isEvenWeek) || (!this.pickupDays.recyclingOnEvenWeeks && !isEvenWeek);
    return isThisWeek && day.day() == this.pickupDays.recyclingDay;
  }

  isPossibleHoliday(day) {
    return _.some(this.holidays, (d) => d.isSame(day, 'day'))
  }

  getCategoriesForDay(day) {
    let eventsForDay = {
      waste: this.isWasteDay(day),
      junk: this.isJunkDay(day),
      tree: this.isTreeDay(day),
      recycling: this.isRecyclingDay(day)
    };
    //group filter out empty days
    return _.toPairs(eventsForDay).filter((category) => category[1]).map((category) => category[0]);
  }

  getUpcomingEvents(numberOfDays = 60): Promise<EventInfo[]> {
    return this.whenLoaded.then(() => {
      let day: Moment = moment().startOf('day');
      let groupEvents: (day) => EventInfo = (day) => {
        return {
          day: day, categories: this.getCategoriesForDay(day), possibleHoliday: this.isPossibleHoliday(day)
        }
      };
      return _.range(0, numberOfDays).map((i) => day.clone().add(i, 'days')).map(groupEvents)
        .filter((event) => event.categories.length)
    });
  }


}
