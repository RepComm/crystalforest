
// const stdlib = require("@grakkit/server");
import * as stdlib from "@grakkit/server";

const GameMode = stdlib.type("org.bukkit.GameMode");

//--------Any player sets day when sleep
import {anybedday} from "./anybedday.js";
anybedday();

//--------Build mode
import { BuildModeManager } from "./buildmode.js";
let bmm = new BuildModeManager();
import { PseudoCmd } from "./pseudocmd.js";
let cmdr = new PseudoCmd();
cmdr.register("b", (player, primary, args)=>{
  if (player.getGameMode().equals(GameMode.SURVIVAL)) {
    if (bmm.hasPlayer(player)) {
      bmm.setPlayer(player, false);
    } else {
      bmm.setPlayer(player, true);
    }
  }
});

//--------Icarus
import "./icarus.js";


//--------Sentry
import { SentryManager } from "./sentry.js";
const sentries = new SentryManager();

stdlib.command({
  name: "sentry",
  execute: (sender, ...args)=>{
    let player = sender as any;
    player.sendRawMessage(`Creating sentry ${args.join(" ")}`);
    sentries.create(player.getLocation(), player.getName());
  }
});