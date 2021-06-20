
const stdlib: typeof import("@grakkit/server") = require("@grakkit/server");

//--------World loader
import "./setup/worlds.js";

//-------Hub world setup
import "./setup/hub.js";

import "./setup/pompeii.js";

//--------Warp
import "./tools/warp.js";

//-------Home
import "./setup/home.js";

//--------Any player sets day when sleep
import "./anybedday.js";

//--------mount
//disabled for security for now
// import "./tools/mount.js";

//--------name
import "./tools/name.js";

//--------Icarus
import "./icarus.js";

//--------Flare
import "./items/flare.js";

//--------Sorter Hopper
import "./blocks/sorter.js";

//--------Paint door
import "./entities/paintdoor.js";

//-------AnimStand
// import "./entities/animstand.js";

//-------WebSocket test
//Currently broken
// import "./java/websocket/websocket.js";
