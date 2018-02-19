import * as moment from "moment";
import {Moment} from "moment";
import * as _ from "lodash";
import axios from "axios";
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
  whenLoaded: Promise<any>;

  static getDayIndex(dayStr) {
    return moment(dayStr, 'dddd').day()
  }

  readonly mapNumbers = [6, 5, 4]; //waste (6), junk (5) and recycling (4)

  readonly mapServer = 'http://mycity.houstontx.gov/cohgis/rest/services/SWD/SolidWaste_wm/MapServer/';
  //the city is cruel and uses different outfields for each day
  readonly scheduleFieldPerMap = {
    6: 'DAY',
    5: 'SERVICE_DA',
    4: 'SERVICE_DAY'
  };

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
      outSR: '102100',
      f: 'json',
    };

    const paramStr = Object.keys(params).reduce((paramStr, key) => `${paramStr}&${key}=${encodeURIComponent(params[key])}`, '?');


    const [wastePromise, junkPromise, recyclingPromise] = this
      .mapNumbers.map(map => `${this.mapServer}${map}/query${paramStr}&outFields=${this.scheduleFieldPerMap[map]}`)
      .map(_ => axios.request({method: 'GET', url: _, timeout: 15000, responseType: 'json'}));

    //get all relevant data
    this.whenLoaded = Promise.all<any>([wastePromise, junkPromise, recyclingPromise]).then((allResults) => {
      const [wasteData, junkData, recyclingData] = allResults.map(r => r.data);
      this.parseData(wasteData, junkData, recyclingData);
      return this;
    });
  }

  /**
   * Take results from COH API and turn them into something we can work with
   * @param wasteData
   * @param junkData
   * @param recyclingData
   * @returns {Array<any>}
   */
  parseData(wasteData, junkData, recyclingData) {
    //waste is one day a week
    let wasteDay = -1;
    if (this.isValidData(wasteData)) {
      wasteDay = HoustonScheduler.getDayIndex(wasteData.features[0].attributes.DAY);
    }

    //heavy trash pickup is in the form of #rd WEEKDAY
    let junkWeekOfMonth = -1;
    let junkDay = -1;
    if (this.isValidData(junkData)) {
      let junkPattern = junkData.features[0].attributes.SERVICE_DA;
      junkWeekOfMonth = parseInt(junkPattern.substr(0, 1));
      junkDay = HoustonScheduler.getDayIndex(junkPattern.substr(junkPattern.indexOf(' ')));
    }

    //recycling pickup is alternating weeks
    let recyclingDay = -1;
    let recyclingOnEvenWeeks = false;
    if (this.isValidData(recyclingData)) {
      let recyclingSchedule = recyclingData.features[0].attributes.SERVICE_DAY;
      recyclingDay = HoustonScheduler.getDayIndex(recyclingSchedule.split('-')[0]);
      // on even years A schedule is on odd weeks, vice versa on odd years
      //http://www.houstontx.gov/solidwaste/Recycle_Cal.pdf
      const aSchedule = recyclingSchedule.includes('-A');
      const isEvenYear = (moment().year() % 2 === 0);
      recyclingOnEvenWeeks = isEvenYear ? !aSchedule : aSchedule;
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
    let isEvenWeek = day.weeks() % 2 == 0;
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
