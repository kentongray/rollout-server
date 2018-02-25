import {Moment} from "moment";

export interface Notification {
  id?: string;
  title: string;
  text: string,
  link: string,
  expiresOn: Moment;
  urgent: boolean
}

