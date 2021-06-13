
const stdlib: typeof import("@grakkit/server") = require("@grakkit/server");

import { PseudoCmd } from "../pseudocmd.js";
import { Message } from "../utils/message.js";

let cmdr = PseudoCmd.get();

cmdr.register("mount", (player, primary, argsAsString)=>{
  let args = argsAsString.split(" ");

  let ridersSelector: string;
  let vehicleSelector: string;
  let riders;
  let vehicles;

  if (args.length > 1) {
    ridersSelector = args[0];
    vehicleSelector = args[1];
    riders = stdlib.server.selectEntities(player as any, ridersSelector);
    vehicles = stdlib.server.selectEntities(player as any, vehicleSelector);
  } else if (args.length == 1) {
    vehicleSelector = args[0];
    vehicles = stdlib.server.selectEntities(player as any, vehicleSelector);
    ridersSelector = player.getName();
    riders = stdlib.server.selectEntities(player as any, ridersSelector);
  } else {
    ridersSelector = player.getName();
    riders = stdlib.server.selectEntities(player as any, ridersSelector);
    vehicles = player.getNearbyEntities(4, 4, 4);
  }

  let minDist = Number.POSITIVE_INFINITY;
  let currentDist = 0;

  let nearestVehicle;
  let firstRider = riders.get(0);

  for (let vehicle of vehicles) {
    currentDist = firstRider.getLocation().distance(vehicle.getLocation());
    if (minDist > currentDist) {
      minDist = currentDist;
      nearestVehicle = vehicle;
    }
  }

  if (nearestVehicle === null || nearestVehicle === undefined) {
    Message.player(player, "No entity found");
    return;
  }

  for (let rider of riders) {
    if (rider.equals(nearestVehicle)) continue;
    nearestVehicle.addPassenger(rider);
  }
});
