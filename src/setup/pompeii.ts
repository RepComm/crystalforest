
import { PseudoCmd } from "../pseudocmd.js";
import { Message } from "../utils/message.js";
import { HomeHelper } from "./home.js";
import { LevelUp } from "./levelup.js";
import { dependOnWorldLoad, WorldHelper, WORLD_TS_DEPEND_NS } from "./worlds.js";

const stdlib: typeof import("@grakkit/server") = require("@grakkit/server");

const JObject = stdlib.type("java.lang.Object");
type IJObject = InstanceType<typeof JObject>;

const IBlock = stdlib.type("org.bukkit.block.Block");
type BlockT = InstanceType<typeof IBlock>;

const IMaterial = stdlib.type("org.bukkit.Material");
type MaterialT = InstanceType<typeof IMaterial>;

const ILocation = stdlib.type("org.bukkit.Location");
type LocationT = InstanceType<typeof ILocation>;

const EntityType = stdlib.type("org.bukkit.entity.EntityType");

const IFallingBlock = stdlib.type("org.bukkit.entity.FallingBlock");
type FallingBlockT = InstanceType<typeof IFallingBlock>;

const IVector = stdlib.type("org.bukkit.util.Vector");
type VectorT = InstanceType<typeof IVector>;

const WORLD_NAME = "world-pompeii";

function setMapMulti<A, B>(map: Map<A, B>, data: (A | B)[]) {
  let key: any;
  let value: any;
  for (let i = 0; i < data.length; i += 2) {
    key = data[i];
    value = data[i + 1];
    map.set(key, value);
  }
}
const MaterialRarityMap: Map<MaterialT, number> = new Map();
setMapMulti<MaterialT, number>(MaterialRarityMap, [
  IMaterial.LAPIS_BLOCK, 0.9,
  IMaterial.NETHERITE_BLOCK, 0.9,
  IMaterial.GILDED_BLACKSTONE, 0.8,
  IMaterial.GOLD_BLOCK, 0.5,
  IMaterial.EMERALD_BLOCK, 0.3,
  IMaterial.DIAMOND_BLOCK, 0.1,
]);

const MaterialRarityLevelFactor = 0.1;

function getMaterialRarity(material: MaterialT): number {
  let result = MaterialRarityMap.get(material);
  if (!result) result = 0;

  return result;
}

export function getBlockMineReward(block: BlockT): number {
  let type = block.getType();

  let result = type.getHardness() / 250;

  result += getMaterialRarity(type) * 0.1;//MaterialRarityLevelFactor;

  return result;
}

function spawnBrimstone(loc: LocationT, velocity: VectorT) {
  let world = loc.getWorld();
  let type;

  if (Math.random() > 0.5) {
    type = IMaterial.MAGMA_BLOCK;  
  } else {
    type = IMaterial.OBSIDIAN;
  }
  let entity = world.spawnFallingBlock(
    loc, type, 0
  );

  entity.setDropItem(false);

  entity.setHurtEntities(true);
  entity.setVelocity(velocity);

  return entity;
}

async function main() {

  //wait on hub world to load
  await dependOnWorldLoad(WORLD_NAME);

  console.log("Pompeii world was loaded, starting setup");

  let worldPompeii = stdlib.server.getWorld(WORLD_NAME);

  let lvlup = LevelUp.get();

  stdlib.event("org.bukkit.event.block.BlockBreakEvent", (evt) => {
    let block = evt.getBlock();
    let player = evt.getPlayer();
    let playerName = player.getName();

    if (!(block.getWorld() as any).equals(worldPompeii) && !HomeHelper.isPlayerByObjectAtAnyHome(player)) return;

    evt.setDropItems(false);
    let reward = getBlockMineReward(block);

    lvlup.levelSet(playerName, reward, true);

  });

  let volcanoTopLoc = new ILocation(worldPompeii, -79, 147, 62);
  let velocity = new IVector();

  let brimstoneProbability = 0.5;

  let doErupt = false;

  stdlib.task.interval(() => {
    if (!doErupt) return;
    if (Math.random() > brimstoneProbability) {
      velocity.setX((Math.random() * 2 - 1) * 2);
      velocity.setY(2 + Math.random());
      velocity.setZ((Math.random() * 2 - 1) * 2);

      spawnBrimstone(volcanoTopLoc, velocity);
    }

    if (Math.random() > brimstoneProbability) {
      velocity.setX((Math.random() * 2 - 1) * 2);
      velocity.setY(2 + Math.random());
      velocity.setZ((Math.random() * 2 - 1) * 2);

      spawnBrimstone(volcanoTopLoc, velocity);
    }

    if (Math.random() > brimstoneProbability) {
      velocity.setX((Math.random() * 2 - 1) * 2);
      velocity.setY(2 + Math.random());
      velocity.setZ((Math.random() * 2 - 1) * 2);

      spawnBrimstone(volcanoTopLoc, velocity);
    }
  }, 10);

  stdlib.event("org.bukkit.event.entity.EntityChangeBlockEvent", (evt)=>{
    let entity = evt.getEntity();
    let type = entity.getType();
    if (!type.equals(EntityType.FALLING_BLOCK)) return;
  
    let loc = entity.getLocation();
    let world = loc.getWorld();
    if (world !== worldPompeii) return;
    
    evt.setCancelled(true);

    world.createExplosion(loc, 8, false, false);

  });

  let cmdr = PseudoCmd.get();
  cmdr.register("erupt", (player, primary, argsAsString)=>{
    doErupt = !doErupt;
  });
}

main();

