'use strict';

import * as Hapi from "hapi";
import * as Boom from "boom";
import {getScheduler} from "./Scheduler";
import {Notification} from "./Notifications";
import * as Notifications  from "./Database";
import * as hapiBasicAuth from "hapi-auth-basic";
const server = new Hapi.Server({port: process.env.ROLLOUT_PORT || 80, routes: {cors: true}});

process.on('unhandledRejection', error => {
  console.error('unhandledRejection', error);
});
server.start((err) => {
  if (err) {
    throw err;
  }
  console.log('Server running at:', server.info.uri);
});

server.route({
  method: 'GET',
  path: '/',
  handler: async function (request) {
    return `
<html><body style="background-color:#5bbb88;font-family: helvetica;font-weight: 400;color: white;">
  <h1>Rollout API</h1>
  <a href="/upcoming?latitude=29.7982722&longitude=-95.3736702">Upcoming</a> 
  | 
  <a href="https://github.com/kentongray/rollout-server">Docs</a>
</body></html>
      `
  }
});

server.route({
  method: 'GET',
  path: '/upcoming',
  handler: function (request) {
    const pos = {
      latitude: request.query.latitude, longitude: request.query.longitude
    };

    return getScheduler(pos).then(scheduler => {
      if (scheduler == null) {
        return Boom.gatewayTimeout("Invalid Coordinates Specified. You are not in a supported region.", pos);
      }
      else {
        return scheduler.getUpcomingEvents(request.query.days || 60).then((events) => {
          //convert moment day to friendly string (leaving serialization logic in here for now)
          const jsonEvents: any[] = events.map(event => (<any>Object).assign(event, {day: event.day.format("YYYY-MM-DD")}));

          return JSON.stringify({
            notifications: Notifications.getNotifications(),
            events: jsonEvents,
            schedule: scheduler.pickupDays
          })
        }, (error) => {
          console.error("Unexpected Error Loading Schedule:", request.query, error);
          return Boom.gatewayTimeout("Error Loading Schedule", error)
        }).catch((error) => {
          console.error("Error Loading Schedule:", request.query, error);
          return Boom.gatewayTimeout("Error Loading Schedule", error);
        });
      }
    });


  }
});

server.route({
  method: 'GET',
  path: '/notifications/{city}',
  handler: async function (request) {
    return JSON.stringify(Notifications.getNotifications());
  }
});

server.route({
  method: 'POST',
  path: '/notifications/{city}',
  handler: async function (request, h) {
    Notifications.addNotification(request.payload);
    return h.response(JSON.stringify(Notifications.getNotifications())).header('Content-Type', 'application/json');
  }
});

server.route({
  method: 'GET',
  path: '/notifications/{city}/{id}',
  handler: async function (request, h) {
    return h.response(JSON.stringify(Notifications.getNotificationById(request.params.id))).header('Content-Type', 'application/json');
  }
});

server.route({
  method: 'DElETE',
  path: '/notifications/{city}/{id}',
  handler: async function (request, h) {
    Notifications.removeNotification(request.params.id);
    return h.response(JSON.stringify({result: true})).header('Content-Type', 'application/json');
  }
});
