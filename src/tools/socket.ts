
export interface SocketOptions {
  host: string;
  /**The port representing the client
   * 
   * When isLocalToMachine == true, this represents the port the local machine is connecting to on a remote server (at 'host:port')
   * 
   * When isLocalToMachine == false, this represents the port the local machine accepted a remote client connection from (new port per client, you get the idea)
   */
  port: number;
  timeoutMillis?: number;
  bufferSize?: number;
  /**TLDR: Must be true when you intend to connect this to a remote server
   * 
   * True when the socket was created on this machine to connect to a remote server
   * False when a local SocketServer object created this socket for the sake of keeping track of remote socket connection
   */
  isLocalToMachine?: boolean;
}

export const SocketOptionsDefault: SocketOptions = {
  host: "localhost",
  port: 80,
  timeoutMillis: 8000,
  bufferSize: 1024
};

export type SocketEventType = "connect" | "disconnect" | "data" | "error";

export interface SocketEvent {
  type: SocketEventType;
  socket: Socket;

  data?: Uint8Array;
  disconnectReason?: string;
  errorReason?: string;
}

export interface SocketEventListener {
  (evt: SocketEvent): void;
  type?: SocketEventType;
}

const stdlib: typeof import("@grakkit/stdlib-paper") = require("@grakkit/stdlib-paper");

const IJSocket = stdlib.type("java.net.Socket");
type JSocketT = InstanceType<typeof IJSocket>;
const IJInputStream = stdlib.type("java.io.InputStream");
type JInputStreamT = InstanceType<typeof IJInputStream>;
const IJBufferedReader = stdlib.type("java.io.BufferedReader");
type JBufferedReaderT = InstanceType<typeof IJBufferedReader>;
const IJInputStreamReader = stdlib.type("java.io.InputStreamReader");
const IJOutputStream = stdlib.type("java.io.OutputStream");
type JOutputStreamT = InstanceType<typeof IJOutputStream>;
const IJPrintWriter = stdlib.type("java.io.PrintWriter");
type JPrintWriterT = InstanceType<typeof IJPrintWriter>;

interface SocketJava {
  socket?: JSocketT;
  streamInput?: JInputStreamT;
  reader?: JBufferedReaderT;
  streamOutput?: JOutputStreamT;
  writer?: JPrintWriterT;
}

export class Socket {
  java: SocketJava;

  protected _options: SocketOptions;
  buffer: Uint8Array;

  protected listeners: Set<SocketEventListener>;

  private bufferReadOffset: number;

  constructor(options: SocketOptions) {
    this._options = options;

    if (!this._options.bufferSize) this._options.bufferSize = 1024;
    if (!this._options.isLocalToMachine) this._options.isLocalToMachine = true;
    if (!this._options.port && !this._options.isLocalToMachine) throw `How do you except me to connect without a port?`;
    if (!this._options.timeoutMillis) this._options.timeoutMillis = 1000/6;

    this.listeners = new Set();

    this.buffer = new Uint8Array(this._options.bufferSize);

    this.java = {};

    this.bufferReadOffset = 0;
  }
  getOptions(): SocketOptions {
    return this._options;
  }
  fire(evt: SocketEvent): this {
    for (let cb of this.listeners) {
      if (cb.type === evt.type) cb(evt);
    }
    return this;
  }
  on(type: SocketEventType, callback: SocketEventListener): this {
    if (!this._options.isLocalToMachine) throw `Listening to events on a remote socket doesn't really make sense. Use SocketServer.on instead!`;
    callback.type = type;
    this.listeners.add(callback);
    return this;
  }
  isConnected(): boolean {
    return this.java.socket.isConnected();
  }
  protected destroyJavaResources(): Promise<void> {
    return new Promise(async (_resolve, _reject) => {
      try {
        this.java.socket.close();
      } catch (ex) {
        _reject(ex);
        return;
      }

      try {
        this.java.streamInput.close();
      } catch (ex) {
        _reject(ex);
        return;
      }

      try {
        this.java.reader.close();
      } catch (ex) {
        _reject(ex);
        return;
      }
      _resolve();
    });
  }
  disconnect(): Promise<void> {
    return new Promise(async (_resolve, _reject) => {
      if (this._options.isLocalToMachine) {
        await this.destroyJavaResources();
        _resolve();
      } else {
        if (!this.isConnected()) {
          _reject("Socket was not connected, no need to disconnect. You could theoretically safely swallow this exception.");
          return;
        }
        this.fire({
          type: "disconnect",
          disconnectReason: "local socket closed the connection",
          socket: this
        });
        await this.destroyJavaResources();
        _resolve();
      }
    });
  }
  /**Starts a read loop for the socket, processing chunks of data, and firing events
   * 
   * This is an internal function
   * 
   * @param server only required when a SocketServer is creating a local representation of a remote socket
   * @returns 
   */
  readSocket(server?: SocketServer): this {
    //time for some weird magic resuming of for loop shit
    //fill the buffer and fire a data event
    try {
      for (; this.bufferReadOffset < this.buffer.length; this.bufferReadOffset++) {
        this.buffer[this.bufferReadOffset] = this.java.reader.read();
      }
      if (this.bufferReadOffset >= this.buffer.length) {
        this.bufferReadOffset = 0;

        if (this._options.isLocalToMachine) {
          this.fire({
            socket: this,
            type: "data",
            data: this.buffer
          });
        } else {
          server.fire({
            socket: this,
            type: "data",
            data: this.buffer
          });
        }
      }
    } catch (ex) {
      // console.warn(ex);
      // throw ex;
    }


    return this;
  }

  send(data: Uint8Array): Promise<void> {
    return new Promise(async (_resolve, _reject) => {

      //TODO - probably needs some kind of lock to ensure sending isn't happening on two threads at once..?
      try {
        for (let i = 0; i < this.buffer.length; i++) {
          this.java.writer.write(this.buffer[i]);
        }
        _resolve();
      } catch (ex) {
        _reject(ex);
      }
      _resolve();
    });
  }

  initResources(): Promise<void> {
    return new Promise(async (_resolve, _reject) => {
      this.java.streamInput = this.java.socket.getInputStream();
      this.java.reader = new IJBufferedReader(new IJInputStreamReader(this.java.streamInput));

      this.java.streamOutput = this.java.socket.getOutputStream();
      this.java.writer = new IJPrintWriter(this.java.streamOutput, true);

      _resolve();
    });
  }

  /**Returns a promise that is resolved when the socket is connected
   * @returns 
   */
  connect(): Promise<void> {
    return new Promise<void>(async (_resolve, _reject) => {

      if (!this._options.isLocalToMachine) throw `Connect only has meaning when this socket is local, aka you created it to connect to some server`;

      //this java call blocks until connection or timeout
      try {
        if (this._options.isLocalToMachine) this.java.socket = new IJSocket(this._options.host, this._options.port);
        this.java.socket.setSoTimeout( 5 );

        await this.initResources();
        console.log("Init client resources");

        //reads the socket for data continuously, but doesn't block
        stdlib.task.interval(()=>{
          this.readSocket();
        }, 20/6);

        console.log("Read async");

      } catch (ex) {
        try {
          this.java.socket.close();
          this.java.streamInput.close();
          this.java.reader.close();
        } catch (ex1) {
          console.warn("Issue closing socket after open error", ex1);
        }
        this.fire({
          socket: this,
          type: "error",
          errorReason: ex
        });
      }

      this.fire({
        socket: this,
        type: "connect"
      });
      _resolve();
    });
  }
}

export interface SocketServerOptions {
  host?: string;
  port: number;
  maxConnections?: number;
  bufferSize?: number;
}

const IJSocketServer = stdlib.type("java.net.ServerSocket");
type JSocketServerT = InstanceType<typeof IJSocketServer>;

export interface SocketServerJava {
  socket?: JSocketServerT;
  writer?: JPrintWriterT;
  reader?: JBufferedReaderT;
  streamOutput?: JOutputStreamT;
  streamInput?: JInputStreamT;
}

export class SocketServer {
  private java: SocketServerJava;
  private options: SocketServerOptions;

  private sockets: Set<Socket>;
  private listeners: Set<SocketEventListener>;

  constructor(options: SocketServerOptions) {
    this.options = options;

    this.java = {

    };

    this.listeners = new Set();
  }
  isOpen(): boolean {
    //TODO - make sure this is the right way to check if we can do accept/read/write etc
    return !this.java.socket.isClosed();
  }
  acceptConnection(): this {
    this.java.socket.setSoTimeout(Math.floor(1000 / 6));
    let client: JSocketT;
    try {
      client = this.java.socket.accept();
    } catch (ex) {
      // console.warn(ex);
      return;
    }

    let socket = new Socket({
      isLocalToMachine: false,
      host: this.options.host,
      port: client.getPort(),
      bufferSize: this.options.bufferSize
    });

    //make sure reader/writer are good to go
    socket.initResources();

    this.sockets.add(socket);
    this.fire({
      socket: socket,
      type: "connect"
    });

    //pass in the server so events can be fired
    
    stdlib.task.interval(() => {
      socket.readSocket(this);
    }, 20 / 5);
    return this;
  }

  start(): Promise<void> {
    return new Promise(async (_resolve, _reject) => {
      try {
        //TODO - support passing host param from options (I've never even seen that used..)
        this.java.socket = new IJSocketServer(this.options.port);

      } catch (ex) {
        _reject(ex);
        return;
      }
      //resolve when server is started

      //forever loop, adding connections as they appear, async
      stdlib.task.interval(() => {
        this.acceptConnection();
      }, 20 / 5);

      _resolve();
    });
  }
  fire(evt: SocketEvent): this {
    for (let cb of this.listeners) {
      if (cb.type == evt.type) {
        cb(evt);
      }
    }
    return this;
  }
  on(type: SocketEventType, listener: SocketEventListener): this {
    listener.type = type;
    this.listeners.add(listener);
    return this;
  }
}


async function test() {

  function stringToUint8Array(str: string): Uint8Array {
    let result = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      result[i] = str.charCodeAt(i);
    }
    return result;
  }

  //https://stackoverflow.com/a/22373197
  function stringFromUint8Array(array: Uint8Array) {
    let out, i, len, c;
    let char2, char3;

    out = "";
    len = array.length;
    i = 0;
    while (i < len) {
      c = array[i++];
      switch (c >> 4) {
        case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
          // 0xxxxxxx
          out += String.fromCharCode(c);
          break;
        case 12: case 13:
          // 110x xxxx   10xx xxxx
          char2 = array[i++];
          out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
          break;
        case 14:
          // 1110 xxxx  10xx xxxx  10xx xxxx
          char2 = array[i++];
          char3 = array[i++];
          out += String.fromCharCode(((c & 0x0F) << 12) |
            ((char2 & 0x3F) << 6) |
            ((char3 & 0x3F) << 0));
          break;
      }
    }

    return out;
  }

  console.log("Creating server socket");

  let server = new SocketServer({
    port: 10209,
    bufferSize: 16
  });

  server.on("connect", (evt) => {
    console.log("[Server] Client connected", evt);

    evt.socket.send(stringToUint8Array("Hello client, welcome to server"));
  });
  server.on("data", (evt) => {
    console.log("Got data", stringFromUint8Array(evt.data));
  });

  console.log("Starting server socket");
  server.start();

  console.log("Creating socket, attempting connection");
  let socket = new Socket({
    host: "localhost",
    port: 10209,
    bufferSize: 1024,
    timeoutMillis: 8000
  });

  socket.on("connect", (evt) => {
    console.log("[Socket] Connected to remote host!", socket.getOptions());

    socket.send(stringToUint8Array("Hello server, thanks for letting me join!"));
  });

  socket.on("data", (evt) => {
    console.log("[Client] Got data", stringFromUint8Array(evt.data));
  });


  console.log("Connecting socket to server");
  socket.connect();

}

test();
