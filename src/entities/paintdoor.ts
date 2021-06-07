
const stdlib: typeof import("@grakkit/server") = require("@grakkit/server");

let sender = stdlib.server.getConsoleSender();

import { Message } from "../utils/message.js";
import { Persist } from "../utils/persist.js";

const IEntity = stdlib.type("org.bukkit.entity.Entity");
type EntityT = InstanceType<typeof IEntity>;

const EntityType = stdlib.type("org.bukkit.entity.EntityType");

const Sound = stdlib.type("org.bukkit.Sound");

const DOOR_CLOSED = true;
const DOOR_OPENED = !DOOR_CLOSED;

function isDoorClosed(door: PaintDoorJson): boolean {
  return door.mode === DOOR_CLOSED;
}

export interface PaintDoorPosJson {
  x: number;
  y: number;
  z: number;
}

export interface PaintDoorJson {
  uuid: string;
  closed: PaintDoorPosJson;
  opened: PaintDoorPosJson;
  mode: boolean;
}

export interface PaintDoorMapJson {
  [key: string]: PaintDoorJson;
}

export interface PaintDoor extends PaintDoorJson {
  entity: EntityT;
}

const allDoors: Map<string, PaintDoor> = new Map();

const PAINTDOOR_PERSIST = "paintdoor";

async function save(): Promise<boolean> {
  return new Promise(async (_resolve, _reject) => {
    Message.terminal("Saving paint door json");
    try {
      let data: PaintDoorMapJson = {

      };

      let doorjson: PaintDoorJson;
      for (let [uuid, door] of allDoors) {
        doorjson = {
          closed: door.closed,
          mode: door.mode,
          opened: door.opened,
          uuid: door.uuid
        };
        data[uuid] = doorjson;
      }

      await Persist.get().setJson<PaintDoorMapJson>(PAINTDOOR_PERSIST, data);
    } catch (ex) {
      _reject(ex);
      return;
    }
    _resolve(true);
  });
}

function load() {
  Message.terminal("Loading paint door json");
  Persist.get().getJson<PaintDoorMapJson>(PAINTDOOR_PERSIST).then((json) => {
    let keys = Object.keys(json);
    let current: PaintDoor;

    for (let key of keys) {
      (current as any) = json[key];
      // current.entity 
      //TODO - make sure entity gets respawned if absent
      allDoors.set(key, current);
    }
  });
}

load();

stdlib.event("org.bukkit.event.hanging.HangingBreakEvent", (evt) => {
  let entityType = evt.getEntity().getType();

  if (!entityType.equals(EntityType.PAINTING)) return;

  let entity = evt.getEntity();

  if (entity === null || entity === undefined) return;

  let uuid = entity.getUniqueId().toString();

  if (!allDoors.has(uuid)) return;

  let door = allDoors.get(uuid);

  if (door === null) {
    allDoors.delete(uuid);
    return;
  }

  //Helpful, not relevant
  if (door.entity === null) door.entity = entity;
  evt.setCancelled(true);
});

import { PseudoCmd } from "../pseudocmd.js";
import { resolve } from "node:path";
let cmdr = PseudoCmd.get();

function doorToogle(door: PaintDoor) {
  let loc = door.entity.getLocation();

  if (isDoorClosed(door)) {
    door.mode = DOOR_OPENED;
    loc.set(door.opened.x, door.opened.y, door.opened.z);
    // Message.player(player, "Opened door");
  } else {
    door.mode = DOOR_CLOSED;
    loc.set(door.closed.x, door.closed.y, door.closed.z);
    // Message.player(player, "Closed door");
  }

  door.entity.teleport(loc);

  let x = loc.getX().toFixed(0);
  let y = loc.getY().toFixed(0);
  let z = loc.getZ().toFixed(0);

  stdlib.server.dispatchCommand(sender, `playsound minecraft:entity.minecart.riding master @a ${x} ${y} ${z} 10 0.2`);
}

cmdr.register("door", (player, primary, args) => {
  let entity = player.getTargetEntity(10);
  if (!entity) {
    Message.player(player, "Door needs to be within 10 meters");
    return;
  }

  let uuid = entity.getUniqueId().toString();
  if (!allDoors.has(uuid)) {
    Message.player(player, "Painting is not a registered door");
    return;
  }
  let door = allDoors.get(uuid);

  if (!door.entity) door.entity = entity;
  doorToogle(door);
});

cmdr.register("doorcreate", (player, primary, args) => {
  let entity = player.getTargetEntity(10);
  if (!entity) {
    Message.player(player, "Painting needs to be within 10 meters");
    return;
  }

  if (!entity.getType().equals(EntityType.PAINTING)) {
    Message.player(player, "Thats not a painting, bitch");
    return;
  }

  let uuid = entity.getUniqueId().toString();
  if (allDoors.has(uuid)) {
    Message.player(player, "Fuck off bitch, my door");
    return;
  }

  let loc = entity.getLocation();
  let x = Math.floor(loc.getX());
  let y = Math.floor(loc.getY());
  let z = Math.floor(loc.getZ());

  let bb = entity.getBoundingBox();
  let height = bb.getHeight();

  let current: PaintDoor = {
    entity: entity,
    closed: {
      x: x,
      y: y,
      z: z
    },
    opened: {
      x: x,
      y: y + Math.floor(height),
      z: z
    },
    mode: DOOR_CLOSED,
    uuid: uuid
  };

  allDoors.set(uuid, current);
  Message.player(player, "Created door");
  save();
});

let interactTimeout;

stdlib.event("org.bukkit.event.player.PlayerInteractAtEntityEvent", (evt) => {
  if (interactTimeout) {
    return;
    // stdlib.task.cancel()
  }
  let player = evt.getPlayer();

  let en = evt.getRightClicked();
  if (!en) return;
  // if (!en.getType().equals(EntityType.PAINTING)) return;
  let uuid = en.getUniqueId().toString();
  if (!allDoors.has(uuid)) return;

  let door = allDoors.get(uuid);
  if (!door.entity) door.entity = en;

  interactTimeout = stdlib.task.timeout(() => {
    doorToogle(door);
    interactTimeout = null;
  }, 10);
});
