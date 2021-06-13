
import { Message } from "../utils/message.js";
import { PseudoCmd } from "../pseudocmd.js";

const stdlib: typeof import("@grakkit/server") = require("@grakkit/server");

let cmdr = PseudoCmd.get();

cmdr.register("name", (player, primary, argsAsString) => {
  // let args = argsAsString.split(" ");
  // if (args.length < 1) {
  //   Message.player(player, "Expected -name <identifier>");
  //   return;
  // }
  // let name = args[0];
  let name = argsAsString.replaceAll("&", "§");

  let lookAt = player.getTargetEntity(4);
  if (lookAt === null || lookAt === undefined) {
    Message.player(player, "You're not looking at an entity less than 4 meters away");
    return;
  }
  try {
    lookAt.setCustomName(name);
    lookAt.setCustomNameVisible(true);
  } catch (ex) {
    Message.player(player, "Couldn't name entity: ", ex);
    return;
  }
  // stdlib.server.selectEntities(sender, "");
});