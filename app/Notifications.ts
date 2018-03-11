import {Moment} from "moment";

export interface Notification {
  id?: string;
  title: string;
  text: string,
  link: string,
  expiresOn: string; //date in format yyyy-mm-dd
  urgent: boolean
}

