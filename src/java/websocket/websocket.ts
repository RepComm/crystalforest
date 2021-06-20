
const stdlib: typeof import("@grakkit/server") = require("@grakkit/server");

import { JarLoader } from "../../tools/jarloader.js";

const File = stdlib.type("java.io.File");
const Paths = stdlib.type("java.nio.file.Paths");

let rootFile = new File(".").getAbsoluteFile();
let rootPath = rootFile.toPath().toString();

// rootPath = rootPath.substring(0, rootPath.length-2);

console.log(rootPath);

let WebSocketJarFile = new File( Paths.get(rootPath, "plugins", "grakkit", "java", "websocket", "Java-WebSocket-1.5.2.jar").toString() );
let WebSocketJarPath = WebSocketJarFile.toString();

if (!WebSocketJarFile.exists()) {
  throw `Jar file not present at ${WebSocketJarPath}`;
}

console.log("Loading WebSocket jar");
let loader = JarLoader.getClassLoader(WebSocketJarPath);

let WebSocketServer = JarLoader.loadClass(loader, "org.java_websocket.server.WebSocketServer");
console.log("Imported WebSocket server", WebSocketServer);


let WebSocket = JarLoader.loadClass(loader, "org.java_websocket.WebSocket") as any;
type IWebSocket = InstanceType<typeof WebSocket>;
console.log("Imported WebSocket", WebSocket);


let ClientHandshake = JarLoader.loadClass(loader, "org.java_websocket.handshake.ClientHandshake") as any;
type IClientHandshake = InstanceType<typeof ClientHandshake>;
console.log("Imported WebSocket handshake", ClientHandshake);

let ByteBuffer = stdlib.type("java.nio.ByteBuffer");
type IByteBuffer = InstanceType<typeof ByteBuffer>;

let InetSocketAddress = stdlib.type("java.net.InetSocketAddress");
type InetSocketAddressT = InstanceType<typeof InetSocketAddress>;

console.log("Implementing WebSocket server");

const WebSocketServerImpl = Java.extend(WebSocketServer, {

  onOpen(conn: IWebSocket, handshake: IClientHandshake): void {
    conn.send("Welcome to the server!");
    
    let adr = conn.getRemoteSocketAddress().getAddress().getHostAddress();

    console.log(
      adr, "entered the room!"
    );
  },

  onClose(conn: IWebSocket, code: number, reason: string, remote: boolean) {
    let adr = conn.getRemoteSocketAddress().getAddress().getHostAddress();

    console.log(adr, "has left the room!");
  },

  onMessage(conn: IWebSocket, message: string|IByteBuffer) {
    let adr = conn.getRemoteSocketAddress().getAddress().getHostAddress();

    console.log(adr, message);
  }
});


let wss = new WebSocketServerImpl(new InetSocketAddress(10209));
console.log("Instanced WebSocket server", wss);
wss.start();
console.log("Started WSS");
