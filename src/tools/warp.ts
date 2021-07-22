

const stdlib: typeof import("@grakkit/stdlib-paper") = require("@grakkit/stdlib-paper");

const Mob = stdlib.type("org.bukkit.entity.Mob");
const EntityType = stdlib.type("org.bukkit.entity.EntityType");

const Location = stdlib.type("org.bukkit.Location");
const IWorld = stdlib.type("org.bukkit.World");
type WorldT = InstanceType<typeof IWorld>;

import { PseudoCmd } from "../pseudocmd.js";
import { Persist } from "../utils/persist.js";
import { Message } from "../utils/message.js";

let cmdr = PseudoCmd.get();
let sender = server.getConsoleSender();

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
    Message.player(player, "Expected : -warpset <identifier> [x] [y] [z] [world]");
    return;
  }

  let identifier = args[0];

  if (!identifier) {
    Message.player(player, `Invalid warp name ${identifier}`);
    return;
  }

  let pLocation = player.getLocation();
  let dest: WarpDef = {
    x: parseFloat( pLocation.getX().toFixed(2) ),
    y: parseFloat( pLocation.getY().toFixed(2) ),
    z: parseFloat( pLocation.getZ().toFixed(2) ),
    world: pLocation.getWorld().getName()
  };

  warp.setDest(identifier, dest, false, true);

  Message.player(player, `Set warp ${identifier} to ${dest.x.toFixed(1)} ${dest.y.toFixed(1)} ${dest.z.toFixed(1)}`);
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

  Message.player(player, "warp to", destination, dest.x, dest.y, dest.z, dest.world);

  stdlib.task.timeout(()=>{
    let ens = server.selectEntities(sender, selector);

    if (ens.size() === 0) {
      Message.player(player, "No entities to warp");
      return;
    }

    let world: WorldT;
    if (!dest.world) {
      world = ens.get(0).getWorld();
    } else {
      world = server.getWorld(dest.world);
    }

    if (world === null) {
      Message.player(player, `Could not warp selected entities to destination:\nworld "${dest.world}" is not loaded.\nTell your administrator to add world "${dest.world}" to the persistence world loader JSON file`);
      return;
    }

    let loc = new Location (world, dest.x, dest.y, dest.z);

    for (let en of ens) {
      en.teleport(loc);
    }
  }, 1);
});

cmdr.register("warplist", (player, primary, argsAsString)=>{
  let msg = warp.getDestList().join("\n");
  Message.player(player, msg);
});
