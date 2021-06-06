

const stdlib: typeof import("@grakkit/server") = require("@grakkit/server");

import { PseudoCmd } from "../pseudocmd.js";
import { Persist } from "../utils/persist.js";

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

  if (args.length !== 2) {
    player.sendRawMessage("Expected : -warp <selector> <destination>");
    return;
  }

  let selector = args[0];
  let destination = args[1];

  if (!warp.hasDest(destination)) {
    player.sendRawMessage(`No warp is identified by '${destination}', add it with -warpset <name>`);
    return;
  }
  let dest = warp.getDest(destination);

  player.sendRawMessage(`warp to ${destination}: ${dest.x}, ${dest.y}, ${dest.z}`);

  stdlib.task.timeout(()=>{
    stdlib.server.dispatchCommand(sender, `tp ${selector} ${dest.x.toFixed(1)} ${dest.y.toFixed(1)} ${dest.z.toFixed(1)}`);
  }, 1);
});
