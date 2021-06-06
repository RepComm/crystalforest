
const stdlib: typeof import("@grakkit/server") = require("@grakkit/server");

const Paths = stdlib.type("java.nio.file.Paths");
const File = stdlib.type("java.io.File");
// const FileOutputStream = stdlib.type("java.io.FileOutputStream");

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

import { FileHelper } from "./filehelper.js";

export class Persist {
  private
  static SINGLETON: Persist;
  static get(): Persist {
    if (!Persist.SINGLETON) Persist.SINGLETON = new Persist();
    return Persist.SINGLETON;
  }
  private constructor() {

  }
  resolve(fpath: string): string {
    return Paths.get(
        stdlib.plugin.getDataFolder().getAbsolutePath(),
        "persist",
        fpath + ".json"
      ).toString();
  }
  async setData(fpath: string, data: Uint8Array): Promise<boolean> {
    return new Promise(async (_resolve, _reject) => {
      console.log("fpath", fpath);

      fpath = this.resolve(fpath);
      console.log("abs fpath", fpath);

      let helper = FileHelper.get();

      await helper.create(fpath);
      console.log("create abs fpath");

      console.log("Writting buf");

      await helper.write(fpath, data);
      console.log("wrote buf");

    });
  }
  async setString(fpath: string, data: string): Promise<boolean> {
    return new Promise(async (_resolve, _reject) => {
      _resolve(this.setData(fpath, stringToUint8Array(data)));
    });
  }
  async setJson<T>(fpath: string, data: T): Promise<boolean> {
    return new Promise(async (_resolve, _reject) => {
      _resolve(this.setString(fpath, JSON.stringify(data)));
    });
  }
  async getData(fpath: string): Promise<Uint8Array> {
    return new Promise(async (_resolve, _reject) => {
      fpath = this.resolve(fpath);

      let helper = FileHelper.get();

      await helper.create(fpath);
      let data = await helper.read(fpath);

      _resolve(data);
    });
  }
  async getString(fpath: string): Promise<string> {
    return new Promise(async (_resolve, _reject) => {
      let data = await this.getData(fpath);
      _resolve(stringFromUint8Array(data));
    });
  }
  async getJson<T>(fpath: string): Promise<T> {
    return new Promise(async (_resolve, _reject) => {
      let str = await this.getString(fpath);
      let result: T;

      try {
        result = JSON.parse(str);
      } catch (ex) {
        _reject(ex);
        return;
      }
      _resolve(result);
    });
  }
}
