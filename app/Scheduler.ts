import {Moment} from "moment";
import {HoustonScheduler, PosCoords} from "./HoustonScheduler";
import {isInState} from "./StateFinder";
import {NewYorkScheduler} from "./NewYorkScheduler";

//interface for pickup day data, this will likely have to be abstracted further for different metros
export interface PickupDay {
  wasteDay: number; junkWeekOfMonth: number; junkDay: number; recyclingDay: number; recyclingOnEvenWeeks: boolean
}
//event format
export interface EventInfo {
  categories: string[];
  day: Moment;
  possibleHoliday: boolean
}

export interface Scheduler {

  getUpcomingEvents(numberOfDays: number): Promise<EventInfo[]>
  pickupDays: PickupDay
}


const getScheduler: (pos: PosCoords) => Promise<Scheduler> = (pos: PosCoords) => {
  return isInState('Texas', pos).then<Scheduler>(r => {
    if (r) {
      return new HoustonScheduler(pos);
    } else {
      return isInState('New York', pos).then((r) => {
        return r ? new NewYorkScheduler(pos) : null
      })
    }
  })
};

export {
  getScheduler
}

