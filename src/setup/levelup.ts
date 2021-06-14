import { PseudoCmd } from "../pseudocmd.js";
import { Message } from "../utils/message.js";
import { Persist } from "../utils/persist.js";

const stdlib: typeof import("@grakkit/server") = require("@grakkit/server");

const LEVEL_UP_PERSIST_PATH = "levelup";

interface PlayerDataJson {
  level: number;
}

interface LevelUpDataJson {
  [key: string]: PlayerDataJson;
}

export class LevelUp {
  static SINGLETON: LevelUp;
  static get (): LevelUp {
    if (!LevelUp.SINGLETON) LevelUp.SINGLETON = new LevelUp();
    return LevelUp.SINGLETON;
  }

  private persistJson: LevelUpDataJson;
  private playerData: Map<string, PlayerDataJson>;
  private playerDataSaved: boolean;

  private constructor () {
    this.persistJson = {};

    this.playerData = new Map();

    this.playerDataSaved = true;

    this.load().then(()=>{

    });

    //add players on join
    stdlib.event("org.bukkit.event.player.PlayerJoinEvent", (evt)=>{
      let player = evt.getPlayer();
      if (!player) return;
      let name = player.getName();
      if (!name) return;

      if (!this.hasPlayer(name)) {
        this.addPlayer(name);
      }
    });

    //add players on plugin reload
    let players = stdlib.server.getOnlinePlayers();
    for (let player of players) {
      let name = player.getName();
      if (!name) return;

      if (!this.hasPlayer(name)) {
        this.addPlayer(name);
      }
    }

    //save player data if needed every 4 minutes
    setInterval(()=>{
      if (!this.playerDataSaved) {
        this.save();
      }
    }, 1000*60*4);

    let cmdr = PseudoCmd.get();
    cmdr.register("lvl", (player, primary, argsAsString)=>{
      let name = player.getName();
      if (!name) return;

      let data = this.getPlayerData(player.getName());
      
      if (!data) {
        Message.player(player, `Could not find level data for player ${name}`);
        return;
      }
      Message.player(player, `You are level ${data.level}`);
    });
  }
  levelIncrease (name: string, levels: number) {
    let data = this.playerData.get(name);
    if (!data) return;

    data.level += levels;

    let intLevels = Math.floor(levels);

    if (intLevels > 0) {
      let player = stdlib.server.getPlayer(name);
      if (player.isOnline()) {
        Message.player(player, `&6Congrats&r, you're now level ${intLevels}!`);
      }
    }
  }
  setPlayerData (name: string, data: PlayerDataJson) {
    this.playerData.set(name, data);
  }
  getPlayerData (name: string): PlayerDataJson {
    return this.playerData.get(name);
  }
  createPlayerData (): PlayerDataJson {
    return {
      level: 1
    };
  }
  hasPlayer (name: string): boolean {
    return this.playerData.has(name);
  }
  addPlayer (name: string, data?: PlayerDataJson) {
    if (!data) data = this.createPlayerData();
    this.playerData.set(name, data);

    this.playerDataSaved = false;
  }
  removePlayer (name: string) {
    this.playerData.delete(name);
  }
  load (): Promise<void> {
    return new Promise(async (_resolve, _reject)=>{
      Message.terminal("Loading LevelUp player data...");
      this.persistJson = await Persist.get().getJson<LevelUpDataJson>(LEVEL_UP_PERSIST_PATH);

      let names = Object.keys(this.persistJson);
      for (let name of names) {
        this.playerData.set(name, this.persistJson[name]);
      }

      Message.terminal("Loaded LevelUp player data for", names.length, "players");
      _resolve();
    });
  }
  save (): Promise<void> {
    return new Promise(async (_resolve, _reject)=>{

      this.persistJson = {};

      for (let [name, playerJson] of this.playerData) {
        this.persistJson[name] = playerJson;
      }

      Message.terminal("Saving LevelUp player data...");

      await Persist.get().setJson<LevelUpDataJson>(LEVEL_UP_PERSIST_PATH, this.persistJson);
      this.playerDataSaved = true;

      Message.terminal("Saved LevelUp player data");

      _resolve();
    });
  }
}

LevelUp.get();
