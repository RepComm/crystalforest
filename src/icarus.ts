
const stdlib: typeof import("@grakkit/server") = require("@grakkit/server");

import { ButtonFrame } from "./tools/buttonframe.js";

const ILocation = stdlib.type("org.bukkit.Location");
type LocationT = InstanceType<typeof ILocation>;

const IMaterial = stdlib.type("org.bukkit.Material");

const IBlockFace = stdlib.type("org.bukkit.block.BlockFace");

const IParticle = stdlib.type("org.bukkit.Particle");

const bootsIcarusDisplayName = "Boots Of Icarus";

function makeLoc (x: number, y: number, z: number, worldName: string = "world"): LocationT {
  let world = stdlib.server.getWorld(worldName);
  let result = new ILocation(
    world,
    x, y ,z
  );
  return result;
}

// ButtonFrame.register(
//   //Location
//   makeLoc(56, 169, -163),

//   //Facing direction
//   IBlockFace.SOUTH,

//   //Function that executes on frame click
//   (player, button, frame)=>{
//     let item = frame.getItem();
//     if (!item || item.getType().equals(IMaterial.AIR)) return;
//     player.sendRawMessage("Beware the sun, icarus");
//     player.getInventory().addItem(item.clone());
//   }
// );

const MIN_ELYTRA_CLIMB_SPEED = 0.8;
const IcarusBootsParticle = IParticle.SPELL;

stdlib.event("org.bukkit.event.player.PlayerMoveEvent", (evt) => {
  let player = evt.getPlayer();
  let boots = player.getInventory().getBoots();

  if (!boots || !boots.getItemMeta()) return;
  if (boots.getItemMeta().getDisplayName() !== bootsIcarusDisplayName) return;
  if (!player.isGliding()) return;

  let vel = player.getVelocity();
  if (vel.length() < MIN_ELYTRA_CLIMB_SPEED) {
    let glideVel = player.getLocation().getDirection().multiply(0.015);

    player.spawnParticle(IcarusBootsParticle, player.getLocation(), 1);

    vel.add(glideVel);
    player.setVelocity(vel);
  }
});
