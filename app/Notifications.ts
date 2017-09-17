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
    title: 'Harvey Updates',
    text: 'Recycling, Heavy and Tree pickup is suspended until further notice. \nFor information about recovery efforts and potential schedule changes tap here to view the latest information.',
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