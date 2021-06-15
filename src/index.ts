
const stdlib: typeof import("@grakkit/server") = require("@grakkit/server");

//--------World loader
import "./setup/worlds.js";

//-------Hub world setup
import "./setup/hub.js";

//--------Warp
import "./tools/warp.js";

//-------Home
import "./setup/home.js";

const GameMode = stdlib.type("org.bukkit.GameMode");

//--------Any player sets day when sleep
import "./anybedday.js";

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
