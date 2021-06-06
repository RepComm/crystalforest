
const stdlib: typeof import("@grakkit/server") = require("@grakkit/server");

const Paths = stdlib.type("java.nio.file.Paths");
const File = stdlib.type("java.io.File");
const Files = stdlib.type("java.nio.file.Files");
const FileOutputStream = stdlib.type("java.io.FileOutputStream");

const JByteArray = Java.type("byte[]");

export class FileHelper {
  static SINGLETON: FileHelper;
  static get(): FileHelper {
    if (!FileHelper.SINGLETON) FileHelper.SINGLETON = new FileHelper();
    return FileHelper.SINGLETON;
  }
  private constructor() {

  }
  async mkdir (fpath: string): Promise<boolean> {
    return new Promise(async (_resolve, _reject)=>{
      try {
        let file = new File(fpath);
        file.mkdirs();
      } catch(ex) {
        _reject(ex);
        return;
      }
      _resolve(true);
    });
  }
  async create(fpath: string, mkdirs: boolean = true): Promise<boolean> {
    return new Promise(async (_resolve, _reject) => {
      try {
        let file = new File(fpath);
        if (mkdirs) file.getParentFile().mkdirs();
        _resolve(file.createNewFile());
      } catch (ex) {
        _reject(ex);
      }
    });
  }
  async exists(fpath: string): Promise<boolean> {
    return new Promise(async (_resolve, _reject) => {
      let file = new File(fpath);
      let result = file.exists();
      file = null;
      _resolve(result);
    });
  }
  async write(fpath: string, data: Uint8Array): Promise<boolean> {
    return new Promise(async (_resolve, _reject) => {
      try {
        console.log("Creating FOS from fpath", fpath);
        let fos = new FileOutputStream(fpath);

        console.log("Created FOS, creating byte array");

        let jba = new JByteArray(data.length);
        console.log("Created jba, populating");
        for (let i = 0; i < data.length; i++) {
          jba[i] = data[i];
        }

        fos.write(jba);

        fos.close();
        jba = null;

        _resolve(true);
      } catch (ex) {
        _reject(ex);
      }
    });
  }
  async read(fpath: string): Promise<Uint8Array> {
    return new Promise(async (_resolve, _reject) => {
      let result: Uint8Array;

      try {
        let data = Files.readAllBytes(Paths.get(fpath));
        result = new Uint8Array(data.length);
        for (let i = 0; i < data.length; i++) {
          result[i] = data[i];
        }
      } catch (ex) {
        _reject(ex);
        return;
      }
      _resolve(result);
    });
  }
}
