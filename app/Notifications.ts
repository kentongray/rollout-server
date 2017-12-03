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
    title: 'Recycling is Back!',
    text: 'Normal recycling schedules are back. Tap here for the latest news.',
    link: 'http://www.houstontx.gov/solidwaste/',
    urgent: true,
    expiresOn: moment("2018-01-01")
    }
    ]
};

const houstonNotifications = notifications['houston'];

export {
  houstonNotifications,
  notifications
}
