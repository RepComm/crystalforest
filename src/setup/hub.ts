
import { dependOnWorldLoad, WORLD_TS_DEPEND_NS } from "./worlds.js";

const stdlib: typeof import("@grakkit/server") = require("@grakkit/server");

const WORLD_NAME = "hub";

async function main () {

  //wait on hub world to load
  await dependOnWorldLoad( WORLD_NAME );

  console.log("Hub world was loaded, starting setup");
}

main();

