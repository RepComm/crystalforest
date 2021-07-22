
const stdlib: typeof import("@grakkit/stdlib-paper") = require("@grakkit/stdlib-paper");

const ILocation = stdlib.type("org.bukkit.Location");
type LocationT = InstanceType<typeof ILocation>;

const ISkeleton = stdlib.type("org.bukkit.entity.Skeleton");
type SkeletonT = InstanceType<typeof ISkeleton>;

const IEntity = stdlib.type("org.bukkit.entity.Entity");
type EntityT = InstanceType<typeof IEntity>;

const IEntityType = stdlib.type("org.bukkit.entity.EntityType");
type EntityTypeT = InstanceType<typeof IEntityType>;

const IPlayer = stdlib.type("org.bukkit.entity.Player");
type PlayerT = InstanceType<typeof IPlayer>;

const IAttribute = stdlib.type("org.bukkit.attribute.Attribute");

interface LocationJson {
  x: number;
  y: number;
  z: number;
  pitch: number;
  yaw: number;
  world: string;
}
function LocationSerialize (loc: LocationT): LocationJson {
  return {
    x: loc.getX(),
    y: loc.getY(),
    z: loc.getZ(),
    pitch: loc.getPitch(),
    yaw: loc.getYaw(),
    world: loc.getWorld().getName()
  };
}
function LocationDeserialize (json: LocationJson): LocationT {
  return new ILocation(
    stdlib.server.getWorld(json.world),
    json.x, json.y, json.z,
    json.yaw, json.pitch
  );
}

export interface SentryJson {
  location: LocationJson;
  owner: string;
}

function isEntityAn (entity: EntityT, type: EntityTypeT): boolean {
  return entity.getType().equals(type);
}

function isEntityAnyOf (entity: EntityT, types: Array<EntityTypeT>): boolean {
  for (let type of types) {
    if (isEntityAn(entity, type)) return true;
  }
  return false;
}

const SENTRY_TARGETABLE_ENTITIES = [
  IEntityType.PLAYER,
  IEntityType.ZOMBIE,
  IEntityType.SKELETON,
  IEntityType.SPIDER,
  IEntityType.CREEPER,
  IEntityType.PHANTOM
];

export class Sentry {
  private entity: SkeletonT;
  private owner: string;
  private range: number;

  constructor (loc: LocationT) {
    let world = loc.getWorld();
    if (!world) throw `No world found in location, cannot create Sentry`;
    this.entity = (world.spawnEntity(loc, IEntityType.SKELETON) as any);
    this.entity.setCustomName(`[Sentry]`);
    this.entity.setCustomNameVisible(true);
    
    // this.entity.setAI(false);

    this.entity
    .getAttribute(IAttribute.GENERIC_MOVEMENT_SPEED)
    .setBaseValue(0.0);

    this.range = 15;
  }
  setRange (r: number): this {
    this.range = r;
    return this;
  }
  getRange (): number {
    return this.range;
  }
  setOwner (owner: string): this {
    this.owner = owner;
    return this;
  }
  getOwner (): string {
    return this.owner;
  }
  getEntity (): SkeletonT {
    return this.entity;
  }
  static deserialize (json: SentryJson): Sentry {
    let loc = LocationDeserialize(json.location);
    let sentry = new Sentry(loc);
    return sentry;
  }
  serialize (): SentryJson {
    return {
      owner: this.owner,
      location: LocationSerialize(this.getEntity().getLocation())
    };
  }
  getPossibleTargets (): Array<EntityT> {
    let results: Array<EntityT> = new Array();

    let rangedTargets = this.getEntity().getNearbyEntities(
      this.range, this.range, this.range
    );

    for (let en of rangedTargets) {
      if (isEntityAnyOf(en, SENTRY_TARGETABLE_ENTITIES)) {
        //Check if entity is owner, skip if so
        if ( isEntityAn(en, IEntityType.PLAYER) &&
          ((en as any) as PlayerT).getName() == this.getOwner()
        ) continue;

        results.push(en);
      }
    }

    return results;
  }
  clearTarget (): this {
    this.entity.setTarget(null);
    this.entity.setCustomName(`[sentry] scanning for target`);
    return this;
  }
  setTarget (target: EntityT): this {
    this.entity.setTarget(target as any);
    this.entity.setCustomName(`[sentry] target locked`);
    return this;
  }
  getTarget (): EntityT {
    return this.entity.getTarget();
  }
  hasTarget (): boolean {
    let target = this.getTarget();
    if (!target || (target as any).getHealth() == 0) return false;
    return true;
  }
}

export class SentryManager {
  private allSentries: Set<Sentry>;

  constructor () {
    this.allSentries = new Set();
    stdlib.task.interval(()=>{
      this.recalculateTargets();
    }, 20*2);
  }
  create (loc: LocationT, owner: string): Sentry {
    let sentry = new Sentry(loc);
    sentry.setOwner(owner);
    this.allSentries.add(sentry);
    return sentry;
  }
  recalculateTargets () {
    let possibleTargets: Array<EntityT>;

    for (let sentry of this.allSentries) {
      if (!sentry.hasTarget()) {
        possibleTargets = sentry.getPossibleTargets();
        if (possibleTargets.length < 1) {
          sentry.clearTarget();
        }

        let index = Math.floor(Math.random()*possibleTargets.length-1);
        let target = possibleTargets[index] as any;
        if (!target) continue;
        sentry.setTarget(target);
      }
    }
  }
}
