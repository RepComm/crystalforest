import { Message } from "../utils/message.js";

async function main () {
  

const stdlib: typeof import("@grakkit/server") = require("@grakkit/server");

const IMaterial = stdlib.type("org.bukkit.Material");

const IVector = stdlib.type("org.bukkit.util.Vector");
type VectorT = InstanceType<typeof IVector>;

const Particle = stdlib.type("org.bukkit.Particle");

const IAction = stdlib.type("org.bukkit.event.block.Action");

stdlib.event("org.bukkit.event.player.PlayerInteractEvent", (evt)=>{
  if (!evt.getAction().equals(IAction.RIGHT_CLICK_AIR)) return;
  let player = evt.getPlayer();
  if (!player) return;
  if (!player.isGliding()) return;
  let item = evt.getItem();
  if (!item) return;
  
  let type = item.getType();
  if (!type.equals(IMaterial.FIREWORK_ROCKET)) return;
  
  Message.player(player, "Elytra Flare");

  evt.setCancelled(true);
  item.subtract();

  let accelAmountPerUpdate = 0.01;
  let maxAccel = 0.1;
  let currentAccel = 0;

  let accelCallback = stdlib.task.interval(()=>{
    // Message.player(player, "Flare accel");
    if (!player.isGliding()) {
      stdlib.task.cancel(accelCallback);
      return;
    }
    if (currentAccel < maxAccel) currentAccel += accelAmountPerUpdate;

    let velocity = player.getLocation().getDirection();
    velocity.normalize().multiply(currentAccel);

    let nVelocity = new IVector().copy(player.getVelocity());
    nVelocity.add(velocity);

    player.setVelocity(nVelocity);
  }, 4);

  stdlib.task.timeout(()=>{
    stdlib.task.cancel(accelCallback);
  }, 20*20);
});

}
main();