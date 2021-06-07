

const stdlib: typeof import("@grakkit/server") = require("@grakkit/server");

const Mob = stdlib.type("org.bukkit.entity.Mob");
const EntityType = stdlib.type("org.bukkit.entity.EntityType");

import { PseudoCmd } from "../pseudocmd.js";
import { Persist } from "../utils/persist.js";
import { Message } from "../utils/message.js";

let cmdr = PseudoCmd.get();
let sender = stdlib.server.getConsoleSender();

interface WarpDef {
  x: number;
  y: number;
  z: number;
  world?: string;
}

interface WarpDefsJson {
  [key:string]: WarpDef;
}

export class Warp {
  private warps: Map<string, WarpDef>;

  private persistencePath: string;
  private absolutePersistencePath: string;

  static SINGLETON: Warp;
  static get(): Warp {
    if (!Warp.SINGLETON) Warp.SINGLETON = new Warp();
    return Warp.SINGLETON;
  }
  private constructor() {
    this.warps = new Map();

    this.persistencePath = "warp";

    this.absolutePersistencePath = Persist.get().resolve(this.persistencePath);

    //Load from persistence
    this.load();
  }
  getDest(id: string): WarpDef {
    return this.warps.get(id);
  }
  hasDest(id: string): boolean {
    return this.warps.has(id);
  }
  async save (): Promise<boolean> {
    let json: WarpDefsJson = {};
    for (let [k,v] of this.warps) {
      json[k] = v;
    }
    console.log("Saved warps to", this.absolutePersistencePath);
    return Persist.get().setJson(this.persistencePath, json);
  }
  async load (): Promise<boolean> {
    return new Promise(async (_resolve, _reject)=>{
      let json = await Persist.get().getJson<WarpDefsJson>(this.persistencePath);
      let keys = Object.keys(json);
      for (let key of keys) {
        this.setDest(key, json[key], false, false);
      }
      console.log("Loaded warps from", this.absolutePersistencePath);
    });
  }
  setDest(id: string, def: WarpDef, safetyCheck: boolean = false, updatePersistence: boolean = true): this {
    if (safetyCheck && this.hasDest(id)) throw "Cannot override warp destination set when safetyCheck enabled";
    this.warps.set(id, def);

    if (updatePersistence) this.save();

    return this;
  }
  getDestList(): string[] {
    let result = new Array<string>(this.warps.size);
    let i = 0;
    for (let [k, v] of this.warps) {
      result[i] = k;
      i++;
    }
    return result;
  }
}

let warp = Warp.get();

//warpset <identifier> [x] [y] [z] [world]
cmdr.register("warpset", (player, primary, argsAsString) => {
  let args = argsAsString.split(" ");

  if (args.length < 1) {
    player.sendRawMessage("Expected : -warpset <identifier> [x] [y] [z] [world]");
    return;
  }

  let identifier = args[0];
  let pLocation = player.getLocation();
  let dest: WarpDef = {
    x: parseFloat( pLocation.getX().toFixed(2) ),
    y: parseFloat( pLocation.getY().toFixed(2) ),
    z: parseFloat( pLocation.getZ().toFixed(2) )
  };

  warp.setDest(identifier, dest, false, true);

  player.sendRawMessage(`Set warp ${identifier} to ${dest.x.toFixed(1)} ${dest.y.toFixed(1)} ${dest.z.toFixed(1)}`);
});

//warp <selector> <destination>
cmdr.register("warp", (player, primary, argsAsString) => {
  let args = argsAsString.split(" ");

  if (args.length < 1) {
    Message.player(player, "Expected : -warp [selector] <destination>");
    return;
  }

  let destination: string;
  let selector: string;

  if (args.length == 1) {
    destination = args[0];
    selector = player.getName();
  } else {
    selector = args[0];
    destination = args[1];
  }


  if (!warp.hasDest(destination)) {
    Message.player(player, "No warp is identified by", destination, ", add it with -warpset", destination);
    return;
  }
  let dest = warp.getDest(destination);

  Message.player(player, "warp to", destination, dest.x, dest.y, dest.z);

  stdlib.task.timeout(()=>{
    stdlib.server.dispatchCommand(sender, `tp ${selector} ${dest.x.toFixed(1)} ${dest.y.toFixed(1)} ${dest.z.toFixed(1)}`);
  }, 1);
});

cmdr.register("warplist", (player, primary, argsAsString)=>{
  let msg = warp.getDestList().join("\n");
  Message.player(player, msg);
});

cmdr.register("name", (player, primary, argsAsString)=>{
  // let args = argsAsString.split(" ");
  // if (args.length < 1) {
  //   Message.player(player, "Expected -name <identifier>");
  //   return;
  // }
  // let name = args[0];
  let name = argsAsString.replaceAll("&", "§");

  let lookAt = player.getTargetEntity(4);
  if (lookAt === null || lookAt === undefined) {
    Message.player(player, "You're not looking at an entity less than 4 meters away");
    return;
  }
  try {
    lookAt.setCustomName(name);
    lookAt.setCustomNameVisible(true);
  } catch (ex) {
    Message.player(player, "Couldn't name entity: ", ex);
    return;
  }
  // stdlib.server.selectEntities(sender, "");
});

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

cmdr.register("unmount", (player, primary, argsAsString)=>{
  let veh = player.getVehicle();
  if (veh === null || veh === undefined) {
    Message.player(player, "No vehicle to eject from");
    return;
  }
  veh.eject();
});

cmdr.register("target", (player, primary, argsAsString)=>{
  let ens = player.getNearbyEntities(100, 25, 100);
  if (ens === null || ens === undefined || ens.size() < 1) {
    Message.player(player, "No entities found");
    return;
  }
  for (let en of ens) {
    if (en instanceof Mob) {
      en.setTarget(player as any);
    }
  }
});
