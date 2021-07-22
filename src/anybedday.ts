
const stdlib: typeof import("@grakkit/stdlib-paper") = require("@grakkit/stdlib-paper");

let isEnabled = false;
/**
 * @param evt 
 */
function onAnyBed (evt) {
  let name = evt.getPlayer().getName();

  server.broadcastMessage(`Player ${name} went to sleep, it will be day soon.`);
  let sender = server.getConsoleSender();

  stdlib.task.timeout(()=>{
    server.dispatchCommand(sender, "time set 23500");
  }, 20*4);
}

export function anybedday (enable: boolean = true) {
  if (!isEnabled) stdlib.event("org.bukkit.event.player.PlayerBedEnterEvent", onAnyBed);
}