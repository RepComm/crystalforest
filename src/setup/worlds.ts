
import { Message } from "../utils/message.js";
import { Persist } from "../utils/persist.js";
import { PseudoCmd } from "../pseudocmd.js";
import { Depend } from "../tools/depend.js";

const stdlib: typeof import("@grakkit/server") = require("@grakkit/server");

const WorldCreator = stdlib.type("org.bukkit.WorldCreator");
const GameMode = stdlib.type("org.bukkit.GameMode");

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
  gamemode: string;
}

interface WorldsJson {
  [key: string]: WorldJson;
}

function loadWorld (worldName: string) {
  try {
    let creator = new WorldCreator(worldName);
    creator.createWorld();
    Message.terminal(`Loaded world "${worldName}"`);
  
    //Let dependencies know we loaded a world
    Depend.get().satisfy( resolveDependWorldKey(worldName) );
  } catch (ex) {
    Message.terminal(`Could not load world ${worldName} due to`, ex);
  }
}

async function main () {
  Message.terminal("Loading world persistence");
  
  Persist.get().getJson<WorldsJson>( WORLDS_PERSIST_PATH ).then((cfg)=>{
    Message.terminal("Checking which worlds to load");
    Message.terminal("cfg =>", JSON.stringify(cfg));

    let worldNames = Object.keys(cfg);
    let world: WorldJson;
  
    Message.terminal("Loading worlds", worldNames.join(","), "a total of", worldNames.length);
  
    for (let worldName of worldNames) {
      world = cfg[worldName];
  
      if (world.enabled) {
        loadWorld(worldName);
      }
    }
    
    stdlib.event("org.bukkit.event.player.PlayerChangedWorldEvent", (evt)=>{
      let player = evt.getPlayer();
      if (!player) return;
      let loc = player.getLocation();
      if (!loc) return;
      let world = loc.getWorld();
      if (!world) return;

      let joinedWorldName = world.getName();

      if (cfg[joinedWorldName]) {
        switch (cfg[joinedWorldName].gamemode) {
          case "creative":
            player.setGameMode(GameMode.CREATIVE);
            break;
          case "survival":
            player.setGameMode(GameMode.SURVIVAL);
            break;
          case "adventure":
            player.setGameMode(GameMode.ADVENTURE);
            break;
          default:
            break;
        }
      }
      
    });
    
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
