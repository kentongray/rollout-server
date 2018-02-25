import {Notification} from "./Notifications";
import * as low from 'lowdb';
import * as FileSync from 'lowdb/adapters/FileSync';
import * as shortid from 'shortid';

const adapter = new FileSync('houstonDb.json');
const db:any = low(adapter);

db.defaults({notifications: [], holidays: []}).write();

export function getNotifications(): Notification[] {
  return db.get('notifications').value();
}

export function getNotificationById(id:String): Notification[] {
  return db.get('notifications').getById(id);
}

export function addNotification(notification: Notification): void {
  db.get('notifications').push({...notification, id: shortid.generate()}).write();
}

export function removeNotification(id:String): void {
  db.get('notifications').remove({id}).write();
}
