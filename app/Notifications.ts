import * as moment from "moment";
import {Moment} from "moment";

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
    title: 'Tree/Junk Waste Is Coming Back!',
    text: 'Update: Tree/Junk Waste Collection to resume March 1, 2018. Tap here for more information.',
    link: 'http://www.houstontx.gov/solidwaste/',
    urgent: true,
    expiresOn: moment("2018-04-01")
  }, {
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
