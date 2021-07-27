import { PseudoCmd } from "../pseudocmd.js";
import { Message } from "../utils/message.js";

const stdlib: typeof import("@grakkit/stdlib-paper") = require("@grakkit/stdlib-paper");

async function main() {
  function log (...msgs: string[]) {
    console.log("[WSServer - crystaloscillator]", ...msgs);
  }

  var IWSServer: typeof WSServer = Java.type("repcomm.WSServer");

  let wsPort = 10209;
  let wsHost = "localhost";
  let wsServer = new IWSServer(wsPort);
  wsServer.setReuseAddr(true);
  wsServer.start();
  
  log("starting");

  function shutdownWebSocket () {
    log("stopping");
    wsServer.stop(0);  
  }

  Core.hook(() => {
    shutdownWebSocket();
  });

  stdlib.event("org.bukkit.event.server.PluginDisableEvent", (evt)=>{
    shutdownWebSocket();
  });
  
  let cmdr = PseudoCmd.get();
  cmdr.register("osc", (player, primary, argsAsString)=>{
    let args = argsAsString.split(" ");

    if (args.length < 1) {
      Message.player(player, "Not enough arguments, try '-osc link' OR '-osc play T9N_SJqi1JA'");
    }
    let subcmd = args[0];

    switch (subcmd) {
      case "p":
      case "play":
        Message.player(player, "Sending play command");

        if (args.length < 2) {
          Message.player(player, "Not enough arguments, try -osc play T9N_SJqi1JA");
          return;
        }
        let contentId = args[1];

        let data: any = {
          type: "load",
          contentType: "youtube",
          contentId: contentId
        };
    
        let json = JSON.stringify(data);
        wsServer.broadcast(json);
        break;
      case "l":
      case "link":
        Message.player(player, `Link: https://${wsHost}:${wsPort}`);
        break;
    }

  });

  //Update event listeners with events from WSServer, solves cross-thread access
  stdlib.task.interval(()=>{
    wsServer.pollEvents();
  }, 1);
}

main();
