'use strict';

import * as Hapi from "hapi";
import * as Boom from "boom";
import {HoustonScheduler} from "./HoustonScheduler";
import GeoJsonHelper from "./GeoJsonHelper";
import {isInState} from "./StateFinder";
import {getScheduler} from "./Scheduler";


const server = new Hapi.Server();
server.connection({port: 80, routes: {cors: true}});

server.start((err) => {
  if (err) {
    throw err;
  }
  console.log('Server running at:', server.info.uri);
});

server.route({
  method: 'GET',
  path: '/',
  handler: function (request, reply) {
    reply(`
<html><body style="background-color:#5bbb88;font-family: helvetica;font-weight: 400;color: white;">
  <h1>Rollout API</h1>
  <a href="/upcoming?latitude=29.7982722&longitude=-95.3736702">Upcoming</a> 
  | 
  <a href="https://github.com/kentongray/rollout-server">Docs</a>
</body></html>
      `)
  }
});

server.route({
  method: 'GET',
  path: '/upcoming',
  handler: function (request, reply) {

    const pos = {
      latitude: request.query.latitude, longitude: request.query.longitude
    };

    getScheduler(pos).then(scheduler => {
      if(scheduler == null) {
        reply(Boom.gatewayTimeout("Invalid Coordinates Specified. You are not in a supported region.", pos));
      }
      else {
        scheduler.getUpcomingEvents(request.query.days || 60).then((events) => {
          //convert moment day to friendly string (leaving serialization logic in here for now)
          const jsonEvents:any[] = events.map(event => (<any>Object).assign(event, { day: event.day.format("YYYY-MM-DD") }));

          reply(JSON.stringify({
            events: jsonEvents,
            schedule: scheduler.pickupDays
          }))
        }, (error) => {
          console.error("Unexpected Error Loading Schedule:", request.query, error);
          reply(Boom.gatewayTimeout("Error Loading Schedule", error));
        }).catch((error) => {
          console.error("Error Loading Schedule:", request.query, error);
          reply(Boom.gatewayTimeout("Error Loading Schedule", error));
        });
      }
    });


  }
});