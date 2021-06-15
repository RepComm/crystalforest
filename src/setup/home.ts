
const stdlib: typeof import("@grakkit/server") = require("@grakkit/server");

import { Message } from "../utils/message.js";
import { Persist } from "../utils/persist.js";
import { PseudoCmd } from "../pseudocmd.js";
import { LevelUp } from "./levelup.js";
import { FileHelper } from "../utils/filehelper.js";
import { WorldHelper } from "./worlds.js";

const levelUp = LevelUp.get();

const PLAYER_HOME_CREATE_LEVEL_REQUIREMENT = 10;

const fileHelper = FileHelper.get();

const ILocation = stdlib.type("org.bukkit.Location");

export const HomeHelper = {
  homeWorldTemplate: "world-template-player",
  isPlayerAllowedToCreateHome(name: string): boolean {
    let levelData = levelUp.getPlayerData(name);
    return levelData.level >= PLAYER_HOME_CREATE_LEVEL_REQUIREMENT;
  },
  resolvePlayerHomeName(playerName: string): string {
    return `world-player-${playerName}`;
  },
  playerHomeExists(playerName: string): boolean {
    return WorldHelper.worldDirExists(HomeHelper.resolvePlayerHomeName(playerName));
  },
  createHome(playerName: string): Promise<boolean> {
    return new Promise(async (_resolve, _reject) => {
      let playerWorldId = HomeHelper.resolvePlayerHomeName(playerName);

      Message.terminal(`[Home] Creating home for player ${playerName} at world id ${playerWorldId}`);

      WorldHelper.cloneWorld(HomeHelper.homeWorldTemplate, playerWorldId).then((success) => {

        WorldHelper.setWorldAutoLoadData(playerWorldId, {
          enabled: true,
          gamemode: "survival",
          name: playerWorldId,
          playerOwner: playerName
        });

        WorldHelper.autoLoadWorlds();

        _resolve(true);
      });
    });
  }
};

type HomeSubCommand = "help" | "create"|"visit";
const HomeSubCommands: Array<HomeSubCommand> = [
  "help", //command help
  "create", //create a home
  "visit" //go home
];

async function main() {
  let cmdr = PseudoCmd.get();

  cmdr.register("home", (player, primary, argsAsString) => {
    let playerName = player.getName();

    let args = argsAsString.split(" ");

    if (args.length < 1) {
      Message.player(player, `Not enough args, see &6-home help &r for a list of sub commands`);
      return;
    }

    let subcmd: HomeSubCommand = args[0] as any;

    switch (subcmd) {
      case "help":
        Message.player(player, HomeSubCommands.join("\n"));
        return;
      case "create":

        if (!HomeHelper.isPlayerAllowedToCreateHome(playerName)) {
          Message.player(player, `Unable to create home for player "${playerName}", needs to be level ${PLAYER_HOME_CREATE_LEVEL_REQUIREMENT} first`);
          return;
        }

        if (HomeHelper.playerHomeExists(playerName)) {
          Message.player(player, `Your home world already exists. If you cannot access it, please report this issue to a server staff! The server may not be loading your world!`);
          return;
        }

        HomeHelper.createHome(playerName).then((success) => {
          Message.player(player, `Your home has been successfully created!`);
          Message.terminal(`Finished setup for player ${playerName}'s home`);
          return;
        }).catch((ex) => {
          Message.player(player, "There was an issue creating your home.\nA message has been generated for administration in the server terminal as well as OPed players.\nPlease let someone from staff know!");
          let opMsg = `Player "${playerName}" could not create a home with world id "${HomeHelper.resolvePlayerHomeName(playerName)}". Please notify administrator, this is a server issue.\nsee exception: ${ex}`;
          Message.terminal(opMsg);
          Message.ops(opMsg);
          return;
        });

        break;
      case "visit":
        Message.player(player, `Attempting to send you home!`);
        let homeName = HomeHelper.resolvePlayerHomeName(playerName);
        
        let world = stdlib.server.getWorld(homeName);
        if (!world) {
          Message.player(player, `It looks like your world isn't loaded, or possible isn't created yet. If you have a world already, please notify staff!`);
          return;
        }

        let location = new ILocation(world, 0, 33, 0);

        player.teleport(location);

        Message.player(player, "You are now home!");
        break;
      default:
        Message.player(player, `Unknown sub command "${subcmd}", see &6-home help &r for a list of sub commands`);
        return;
    }
  });
}

main();
