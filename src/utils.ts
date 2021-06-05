
const stdlib = require("@grakkit/server");
// import * as stdlib from "@grakkit/server";

const ILocation = stdlib.type("org.bukkit.Location");
type LocationT = InstanceType<typeof ILocation>;

const IEntity = stdlib.type("org.bukkit.entity.Entity");
type EntityT = InstanceType<typeof IEntity>;

export function getEntitiesAt(loc: LocationT): Array<EntityT> {
  let results: Array<EntityT> = [];

  let ens = loc.getWorld().getNearbyEntities(loc, 1, 1, 1);
  for (let en of ens) {
    if (!results) results = [];
    results.push(en);
  }

  return results;
}

// const ItemStack = stdlib.type("org.bukkit.inventory.ItemStack");
// const EntityPlayerType = stdlib.type("org.bukkit.entity.Player");
// const Material = stdlib.type("org.bukkit.Material");

// /**
//  * 
//  * @param {InstanceType<EntityPlayerType>} player 
//  */
// function equipElytra(player) {
//   let elytraItem = new ItemStack(Material.ELYTRA);
//   player.getInventory().addItem(elytraItem);
// }


// /**
//  * @param {InstanceType<EntityPlayerType>} player 
//  * @param {string} title
//  * @param {string|undefined} titleColor
//  */
// function title(player, title, subtitle, titleColor, subtitleColor) {
//   if (!title) {
//     //TODO - console warn
//     // return;
//     title = "";
//   }
//   if (subtitle) {
//     if (!subtitleColor) subtitleColor = "gold";
//     stdlib.server.dispatchCommand(
//       player,
//       `title ${player.getName()} subtitle [{\"text\":\"${subtitle}\", \"color\":\"${subtitleColor}\"}]`
//     );
//   }

//   if (!titleColor) titleColor = "gold";
//   stdlib.server.dispatchCommand(player, `title ${player.getName()} title [{\"text\":\"${title}\", \"color\":\"${titleColor}\"}]`);
// }

export function lerp (from, to, by) {
  return from*(1-by)+to*by;
}
