
const stdlib: typeof import("@grakkit/server") = require("@grakkit/server");

const ISkeleton = stdlib.type("org.bukkit.entity.Skeleton");
type SkeletonT = InstanceType<typeof ISkeleton>;

type SentryEntity = SkeletonT;

export interface SentryJson {
  uuid: string;
  owner: string;
  friendlies: string[];
  range: number;
}

export class Sentry {
  private uuid: string;
  private entity: SentryEntity;

  constructor () {

  }
}

export interface SentryEngineJson {
  all: {
    [uuid: string]: SentryJson;
  };
}

export class SentryEngine {
  static SINGLETON: SentryEngine;
  static get (): SentryEngine {
    if (!SentryEngine.SINGLETON) SentryEngine.SINGLETON = new SentryEngine();
    return SentryEngine.SINGLETON;
  }

  private all: Map<string, Sentry>;

  private constructor () {

  }
  // create (entity: SkeletonT):
}
