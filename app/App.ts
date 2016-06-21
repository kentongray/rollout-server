'use strict';

/// <reference path="../typings/tsd.d.ts" />

import * as Hapi from "hapi";
import {HoustonScheduler} from "./HoustonScheduler";

const server = new Hapi.Server();
server.connection({port: 80});

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
<h1>Rollout API</h1>
<a href="/upcoming?latitude=29.7982722&longitude=-95.3736702">Upcoming</a> 
| 
<a href="https://github.com/kentongray/rollout-server">More info here eventually</a>
      `)
  }
});

server.route({
  method: 'GET',
  path: '/upcoming',
  handler: function (request, reply) {
    var scheduler = new HoustonScheduler({
      coords: {
        latitude: 29.7982722, longitude: -95.3736702
      }
    });
    scheduler.whenLoaded.then((events) => {
      console.log(events);
      reply(JSON.stringify(events))
    });
  }
});