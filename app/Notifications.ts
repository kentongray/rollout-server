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
    title: 'Yard and Tree Waste Returns',
    text: 'As of January 2nd yard and tree waste has returned.',
    link: 'http://www.houstontx.gov/solidwaste/',
    urgent: true,
    expiresOn: moment("2018-02-01")
    }
    ]
};

const houstonNotifications = notifications['houston'];

export {
  houstonNotifications,
  notifications
}
