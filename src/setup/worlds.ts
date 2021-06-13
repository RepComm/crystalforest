
import { Message } from "../utils/message.js";
import { Persist } from "../utils/persist.js";
import { PseudoCmd } from "../pseudocmd.js";
import { Depend } from "../tools/depend.js";

const stdlib: typeof import("@grakkit/server") = require("@grakkit/server");

const WorldCreator = stdlib.type("org.bukkit.WorldCreator");

const WORLDS_PERSIST_PATH = "world-loader";

//A namespace for our world dependencies
export const WORLD_TS_DEPEND_NS = "world-loader";

/**Turn a world name into the dependency key that world.ts will satisfied upon loading*/
export function resolveDependWorldKey (worldName: string): string {
  return `${WORLD_TS_DEPEND_NS}-${worldName}`;
}

/**Wait on a world to load, convenience function*/
export function dependOnWorldLoad (worldName: string): Promise<void> {
  return Depend.get().depend(
    resolveDependWorldKey(worldName)
  );
}

interface WorldJson {
  name: string;
  enabled: boolean;
}

interface WorldsJson {
  [key: string]: WorldJson;
}

function loadWorld (worldName: string) {
  let creator = new WorldCreator(worldName);
  creator.createWorld();
  Message.terminal(`Loaded world "${worldName}"`);

  //Let dependencies know we loaded a world
  Depend.get().satisfy( resolveDependWorldKey(worldName) );
}

async function main () {
  Message.terminal("Loading world persistence");
  
  Persist.get().getJson<WorldsJson>( WORLDS_PERSIST_PATH ).then((cfg)=>{
    Message.terminal("Loaded world persistence");

    let worldNames = Object.keys(cfg);
    let world: WorldJson;
  
    Message.terminal("Loading", worldNames.length, "worlds");
  
    for (let worldName of worldNames) {
      world = cfg[worldName];
  
      if (world.enabled) {
        loadWorld(worldName);
      }
    }
  }, (reason)=>{
    Message.terminal("Couldn't load worlds due to", reason);
  });
  
  let cmdr = PseudoCmd.get();
  cmdr.register("worldlist", (player, primary, argsAsString)=>{
    let msg = "Loaded worlds includes:\n";

    let wList = stdlib.server.getWorlds();
    for (let w of wList) {
      msg += w.getName() + "\n";
    }

    Message.player(player, msg);
  });
}

main();
