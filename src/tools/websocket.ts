
const stdlib: typeof import("@grakkit/server") = require("@grakkit/server");

declare type WSEventType = "start"|"disconnect"|"connect"|"message-string"|"message-buffer"|"exception"|"stop";

declare class WebSocket {
  
}

declare class ClientHandshake {
  
}

declare class WSEvent {
  static EVENT_TYPE_START: "start";
  static EVENT_TYPE_DISCONNECT: "disconnect";
  static EVENT_TYPE_CONNECT: "connect";
  static EVENT_TYPE_MESSAGE_STRING: "message-string";
  static EVENT_TYPE_MESSAGE_BUFFER: "message-buffer";
  static EVENT_TYPE_EXCEPTION: "exception";
  static EVENT_TYPE_STOP: "stop";
  
  constructor (type: WSEventType);
  
  /**One of EVENT_TYPE_ prefixed constant strings defined statically in WSEvent class*/
  type: WSEventType;
  
  /**The client involved in this event, if any
   * Populated for EVENT_TYPE_CONNECT, EVENT_TYPE_MESSAGE_STRING, EVENT_TYPE_MESSAGE_BUFFER, EVENT_TYPE_EXCEPTION
   */
  client: WebSocket;
  
  /**The client handshake involved in this event, if any
   * Populated for EVENT_TYPE_CONNECT
   */
  handshake: ClientHandshake;
  
  /**The message produced from the remote socket, if any
   * Populated for EVENT_TYPE_MESSAGE_STRING
   */
  messageString: string;
  
  /**The exception involved in this event, if any
   * Populated for EVENT_TYPE_EXCEPTION
   */
  exception: any;
  
  /**Stop code involved in this event, if any
   * Populated for EVENT_TYPE_STOP
   */
  disconnectCode: number;
  
  /**Stop reason involved in this event, if any
   * Populated for EVENT_TYPE_STOP
   */
  disconnectReason: string;
  
  /**Denotes if the client was remote during EVENT_TYPE_STOP event
   * Populated for EVENT_TYPE_STOP
   */
  disconnectWasRemoteClient: boolean;
}

declare interface WSEventListener {
  (evt: WSEvent): void;
}

declare class WSServerT {
  constructor (port: number);
  listen (listener: WSEventListener): this;
  deafen (listener: WSEventListener): this;
  pollEvents (): this;
  start(): void;
  stop(code: number): void;
  pushEvent(evt: WSEvent): this;
  dispatchEvent (evt: WSEvent): this;


  setReuseAddr(reuse: boolean): void;

  broadcast (msg: string): void;
};

const IPlugin = stdlib.type("org.bukkit.plugin.Plugin");
type PluginT = InstanceType<typeof IPlugin>;
const IPluginEnableEvent = stdlib.type("org.bukkit.event.server.PluginEnableEvent");
type PluginEnableEventT = InstanceType<typeof IPluginEnableEvent>;

function dependOnPlugin (id: string): Promise<PluginT> {
  let result: PluginT;

  return new Promise(async (_resolve, _reject)=>{
    result = stdlib.server.getPluginManager().getPlugin(id);
    if (result) {
      _resolve(result);
      return;
    }
    let listener = (evt: PluginEnableEventT)=>{
      result = evt.getPlugin();
      if (result.getName() == id) {
        _resolve(result);
        stdlib.session.event.get('org.bukkit.event.server.PluginEnableEvent').delete(listener)
        return;
      }
    }
    stdlib.event("org.bukkit.event.server.PluginEnableEvent", listener);
  });
}

interface BridgeMessageJson {
  type: "chat";

  chatUser?: string;
  chatMessage?: string;
}

async function main () {
  await dependOnPlugin("wscb-spigot");
  console.log("wscb-spigot loaded, creating a ws server");
  
  const IWSEvent = Java.type("repcomm.WSEvent");
  
  const IWSServer = Java.type("repcomm.WSServer");
  
  let port = 10209;
  let wsServer = new IWSServer(port) as WSServerT;
  
  wsServer.listen((evt)=>{
    if (evt.type === IWSEvent.EVENT_TYPE_CONNECT) {
      console.log("A client connected");

    } else if (evt.type === IWSEvent.EVENT_TYPE_MESSAGE_STRING) {
      console.log("Got message from client", evt.messageString);

      let data: BridgeMessageJson;

      try {
        data = JSON.parse(evt.messageString);
      } catch (ex) {
        console.warn("Invalid json message received from ws", ex, evt.messageString);
        return;
      }

      switch (data.type) {
        case "chat":
          if (!data.chatMessage) return;
          stdlib.server.broadcastMessage(`[D] <${data.chatUser}> ${data.chatMessage}`);
          break;
        default:

          break;
      }
    }
  });
    
  console.log("Starting web socket");
  wsServer.setReuseAddr(true);
  wsServer.start();

  function shutdownWebSocket () {
    console.log("====STOPPING WS SERVER");
    wsServer.stop(0);  
  }

  Core.hook(() => {
    shutdownWebSocket();
  });

  stdlib.event("org.bukkit.event.server.PluginDisableEvent", (evt)=>{
    shutdownWebSocket();
  });
  
  stdlib.event("org.bukkit.event.player.AsyncPlayerChatEvent", (evt)=>{
    if (evt.isCancelled()) return;
    let data: BridgeMessageJson = {
      type: "chat",
      chatUser: evt.getPlayer().getName(),
      chatMessage: evt.getMessage()
    };

    let json = JSON.stringify(data);
    wsServer.broadcast(json);
  });

  //Update event listeners with events from WSServer, solves cross-thread access
  stdlib.task.interval(()=>{
    wsServer.pollEvents();
  }, 1);
}
main();
