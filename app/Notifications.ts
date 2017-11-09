import {Moment} from "moment";
import * as moment from 'moment';

export interface Notification {
  title: string;
  text: string,
  link: string,
  expiresOn: Moment;
  urgent: boolean
}

// someday it would be nice to have a backend for
const notifications: { houston: [Notification] } = {
  "houston": [{
    title: 'Recycling is Returning (Soon)!',
    text: 'Normal recycling schedules are coming back Monday, November 13th. Tap here for the latest news.',
    link: 'http://www.houstontx.gov/solidwaste/',
    urgent: true,
    expiresOn: moment("2018-01-01")
    },
    {
    title: 'Harvey Updates',
    text: 'Recycling, Yard, Heavy and Tree pickup is suspended until further notice. \nFor the latest information about recovery efforts and potential schedule changes tap here.',
    link: 'http://www.houstontx.gov/solidwaste/',
    urgent: true,
    expiresOn: moment("2017-11-01")
  }]
};

const houstonNotifications = notifications['houston'];

export {
  houstonNotifications,
  notifications
}
