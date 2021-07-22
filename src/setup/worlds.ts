
import { Message } from "../utils/message.js";
import { Persist } from "../utils/persist.js";
import { PseudoCmd } from "../pseudocmd.js";
import { Depend } from "../tools/depend.js";
import { FileHelper } from "../utils/filehelper.js";

const stdlib: typeof import("@grakkit/stdlib-paper") = require("@grakkit/stdlib-paper");

const WorldCreator = stdlib.type("org.bukkit.WorldCreator");
const GameMode = stdlib.type("org.bukkit.GameMode");

const WORLDS_PERSIST_PATH = "world-loader";

//A namespace for our world dependencies
export const WORLD_TS_DEPEND_NS = "world-loader";

/**Turn a world name into the dependency key that world.ts will satisfied upon loading*/
export function resolveDependWorldKey(worldName: string): string {
  return `${WORLD_TS_DEPEND_NS}-${worldName}`;
}

/**Wait on a world to load, convenience function*/
export function dependOnWorldLoad(worldName: string): Promise<void> {
  return Depend.get().depend(
    resolveDependWorldKey(worldName)
  );
}

interface WorldJson {
  name: string;
  enabled: boolean;
  gamemode: string;
  playerOwner?: string;
}

interface WorldsJson {
  [key: string]: WorldJson;
}

const fileHelper = FileHelper.get();

let worldLoaderConfig: WorldsJson = {};

const persit = Persist.get();

export const WorldHelper = {
  containerPath: server.getWorldContainer().toString(),
  resolveWorldPath(worldName: string): string {
    return fileHelper.join(WorldHelper.containerPath, worldName);
  },
  cloneWorld(from: string, to: string): Promise<boolean> {
    let fromFile = WorldHelper.resolveWorldPath(from);
    let toFile = WorldHelper.resolveWorldPath(to);
    return fileHelper.copy(fromFile, toFile, true);
  },
  loadWorld(worldName: string): Promise<boolean> {
    return new Promise(async (_resolve, _reject) => {
      try {
        let creator = new WorldCreator(worldName);
        creator.createWorld();
        Message.terminal(`[Worlds] Loaded world ${worldName}`);
      } catch (ex) {
        _reject(ex);
        return;
      }
      _resolve(true);
    });
  },
  unloadWorld(worldName: string, save: boolean = true): Promise<boolean> {
    return new Promise(async (_resolve, _reject) => {
      try {
        server.unloadWorld(worldName, save);
      } catch (ex) {
        _reject(ex);
        return;
      }
      _resolve(true);
    });
  },
  getLoadedWorldNames(): string[] {
    let worlds = server.getWorlds();

    let result = new Array<string>(worlds.size());

    let i = 0;
    for (let world of worlds) {
      result[i] = world.getName();
      i++;
    }
    return result;
  },
  worldDirExists(worldName: string): boolean {
    return fileHelper.exists(WorldHelper.resolveWorldPath(worldName));
  },
  save(): Promise<boolean> {
    Message.terminal(`Saving world auto-load data`);
    return persit.setJson<WorldsJson>(WORLDS_PERSIST_PATH, worldLoaderConfig);
  },
  load(): Promise<boolean> {
    return new Promise<boolean>(async (_resolve, _reject) => {
      let data: WorldsJson;

      try {
        data = await persit.getJson<WorldsJson>(WORLDS_PERSIST_PATH);
      } catch (ex) {
        _reject(ex);
        return;
      }
      worldLoaderConfig = data;
      _resolve(true);
    });
  },
  isWorldAutoLoadEnabled(worldName: string): boolean {
    return worldLoaderConfig[worldName] && worldLoaderConfig[worldName].enabled;
  },
  setWorldAutoLoadData(worldName: string, worldJson: WorldJson) {
    worldLoaderConfig[worldName] = worldJson;
    WorldHelper.save();
  },
  autoLoadWorlds () {
    let cfg = worldLoaderConfig;

    let worldNames = Object.keys(cfg);
    let world: WorldJson;

    Message.terminal(`[Worlds] Loading ${worldNames.length} worlds: ${worldNames.join(",")}`);

    let loadedWorldNames = WorldHelper.getLoadedWorldNames();

    for (let worldName of worldNames) {
      //don't load a world if its loaded already
      if (loadedWorldNames.includes(worldName)) {
        Message.terminal(`[Worlds] World by id "${worldName}" is already loaded, skipping`);
        continue;
      }
      world = cfg[worldName];

      if (world.enabled) {
        WorldHelper.loadWorld(worldName).then((success)=>{
          //Let dependencies know we loaded a world
          Depend.get().satisfy(resolveDependWorldKey(worldName));
        });
      }
    }
  }
};

async function main() {
  //Load persistence data
  await WorldHelper.load();

  //Ensure all worlds load properly
  WorldHelper.autoLoadWorlds();

  let cfg = worldLoaderConfig;
  
  stdlib.event("org.bukkit.event.player.PlayerChangedWorldEvent", (evt) => {
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

  let cmdr = PseudoCmd.get();
  cmdr.register("worldlist", (player, primary, argsAsString) => {
    let msg = "Loaded worlds includes:\n";

    let wList = server.getWorlds();
    for (let w of wList) {
      msg += w.getName() + "\n";
    }

    Message.player(player, msg);
  });
}

main();
