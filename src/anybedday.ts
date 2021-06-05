
const stdlib = require("@grakkit/server");
// import * as stdlib from "@grakkit/server";

let isEnabled = false;
/**
 * @param evt 
 */
function onAnyBed (evt) {
  let name = evt.getPlayer().getName();
  stdlib.server.broadcastMessage(`Player ${name} went to sleep, it will be day soon.`);
  let sender = stdlib.server.getConsoleSender();

  stdlib.task.timeout(()=>{
    stdlib.server.dispatchCommand(sender, "time set 23500");
  }, 20*4);
}

export function anybedday (enable: boolean = true) {
  if (!isEnabled) stdlib.event("org.bukkit.event.player.PlayerBedEnterEvent", onAnyBed);
}