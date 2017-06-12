import * as _ from "lodash";
import {EventInfo, PickupDay, Scheduler} from "./Scheduler";
import {PosCoords} from "./HoustonScheduler";
import moment = require("moment");
import {Moment} from "moment";
export class NewYorkScheduler implements Scheduler {
  pickupDays: PickupDay = {
    wasteDay: 1,
    junkWeekOfMonth: 1,
    junkDay: 1,
    recyclingDay: 1,
    recyclingOnEvenWeeks: true
  };

  dayMap = {
    0: [],
    1: ['Organics','Paper','Landfill'],
    2: ['Organics','MPGC'],
    3: ['Organics','Paper','Landfill'],
    4: ['Organics','MPGC'],
    5: ['Organics','Paper','Landfill'],
    6: []
  };

  constructor(public pos:PosCoords, numberOfDays: number = 60) {

  }



  getUpcomingEvents(numberOfDays: number): Promise<EventInfo[]> {
    let day: Moment = moment().startOf('day');
    let groupEvents: (day) => EventInfo = (m) => {
      const dayIndex = m.day();
      //data right now is weird, it isn't giving proper day indexes so this logic is really simple
      return {
        day: m, categories:this.dayMap[dayIndex], possibleHoliday: false
      }
    };
    const value = _.range(0, numberOfDays).map((i) => day.clone().add(i, 'days')).map(groupEvents)
      .filter((event) => event.categories.length);
    return Promise.resolve(value);
  }

}