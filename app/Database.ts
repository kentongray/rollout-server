import {Notification} from "./Notifications";
import * as low from 'lowdb';
import * as FileSync from 'lowdb/adapters/FileSync';
import * as shortid from 'shortid';

const adapter = new FileSync('houstonDb.json');
const db:any = low(adapter);

db.defaults({notifications: [], holidays: []}).write();

export function getNotifications(): Notification[] {
  return db.get('notifications').value()
}

export function addNotification(notification: Notification): void {
  const results: any = db.get('notifications');
  results.push({...notification, id: shortid.generate()}).write();
}

