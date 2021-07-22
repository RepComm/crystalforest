import { PseudoCmd } from "../pseudocmd.js";
import { Message } from "../utils/message.js";
import { Persist } from "../utils/persist.js";
import { PersonalBossBars } from "./personalbossbar.js";

const stdlib: typeof import("@grakkit/stdlib-paper") = require("@grakkit/stdlib-paper");

const LEVEL_UP_PERSIST_PATH = "levelup";

const JFloat = stdlib.type("java.lang.Float");

const Sound = stdlib.type("org.bukkit.Sound");

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
    let players = server.getOnlinePlayers();
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
    }, 1000*60);

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

    cmdr.register("lvlset", (player, primary, argsAsString)=>{
      if (!player.isOp()) {
        Message.player(player, `Sorry, you are not OP and cannot use this command!`);
        return;
      }
      let playerName = player.getName();

      let amount: number;

      try {
        amount = Number.parseFloat(argsAsString);
      } catch (ex) {
        Message.player(player, `Format of "${argsAsString}" was not found to be a valid floating point number`);
        return;
      }

      this.levelSet(playerName, amount);
    });
  }
  levelSet (playerName: string, levels: number, add: boolean = false) {
    let data = this.playerData.get(playerName);
    if (!data) return;

    let beginLevel = Math.floor(data.level);
    if (add) {
      data.level += levels;
    } else {
      data.level = levels;
    }
    let endLevel = Math.floor(data.level);

    let player = server.getPlayer(playerName);
    if (player.isOnline()) {
      if (beginLevel < endLevel) {
        Message.player(player, `&6Congrats&r, you're now level ${endLevel}!`);
        player.playSound(player.getLocation(), Sound.BLOCK_NOTE_BLOCK_CHIME, 1, 2.0);
      }

      let decimal = data.level - endLevel;

      let bb = PersonalBossBars.getBossBar(playerName);

      bb.setTitle(`Level ${endLevel}`);
      bb.setProgress(decimal);
      bb.addPlayer(player);

      // player.setExp( new JFloat( decimal ) as any );
      // player.setLevel( new JFloat(endLevel) as any );
    }

    this.playerDataSaved = false;
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

      this.playerDataSaved = true;
      await Persist.get().setJson<LevelUpDataJson>(LEVEL_UP_PERSIST_PATH, this.persistJson);

      Message.terminal("Saved LevelUp player data");

      _resolve();
    });
  }
}

LevelUp.get();

