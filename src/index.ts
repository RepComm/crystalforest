
const stdlib: typeof import("@grakkit/server") = require("@grakkit/server");

//--------World loader
import "./setup/worlds.js";

//--------Warp
import "./tools/warp.js";

const GameMode = stdlib.type("org.bukkit.GameMode");

//--------Any player sets day when sleep
import "./anybedday.js";

//--------Build mode
import { BuildModeManager } from "./buildmode.js";
let bmm = new BuildModeManager();

import { PseudoCmd } from "./pseudocmd.js";
let cmdr = PseudoCmd.get();

cmdr.register("b", (player, primary, args) => {
  if (player.getGameMode().equals(GameMode.SURVIVAL)) {
    if (bmm.hasPlayer(player)) {
      bmm.setPlayer(player, false);
    } else {
      bmm.setPlayer(player, true);
    }
  } else {
    player.sendRawMessage("Cannot enter build mode while in creative mode");
  }
});

//--------mount
import "./tools/mount.js";

//--------name
import "./tools/name.js";

//--------Icarus
import "./icarus.js";

//--------Sorter Hopper
import "./blocks/sorter.js";

//--------Paint door
import "./entities/paintdoor.js";

//-------AnimStand
import "./entities/animstand.js";
