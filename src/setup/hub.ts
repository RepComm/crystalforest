
import { dependOnWorldLoad } from "./worlds.js";

const stdlib: typeof import("@grakkit/stdlib-paper") = require("@grakkit/stdlib-paper");

const WORLD_NAME = "world-hub";

async function main () {

  //wait on hub world to load
  await dependOnWorldLoad( WORLD_NAME );

  console.log("Hub world was loaded, starting setup");
}

main();

