
import { Message } from "../utils/message.js";
import { Persist } from "../utils/persist.js";
import { PseudoCmd } from "../pseudocmd.js";

const stdlib: typeof import("@grakkit/server") = require("@grakkit/server");

const WorldCreator = stdlib.type("org.bukkit.WorldCreator");

const WORLDS_PERSIST_PATH = "world-loader";

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
