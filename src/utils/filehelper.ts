
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
  async mkdir(fpath: string): Promise<boolean> {
    return new Promise(async (_resolve, _reject) => {
      try {
        let file = new File(fpath);
        file.mkdirs();
      } catch (ex) {
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
  exists(fpath: string): boolean {
    return new File(fpath).exists();
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
  join(...paths: string[]): string {
    return Paths.get("", ...paths).toString();
  }
  /**Copy files
   * 
   * Does not copy directories, use copy() instead
   * 
   * @param from 
   * @param to 
   * @returns 
   */
  async copyfile(from: string, to: string): Promise<boolean> {
    return new Promise(async (_resolve, _reject) => {
      try {
        Files.copy( Paths.get(from), Paths.get(to) );
      } catch (ex) {
        _reject(ex);
        return;
      }
      _resolve(true);
    });
  }
  /**Copy a directory or file
   * 
   * If 'from' is a directory, its content will be recursively copied to 'to' directory, which will be created if it doesn't exist
   * 
   * Otherwise 'from' file is copied to 'to' file
   * 
   * @param from source dir or file
   * @param to dest dir or file
   * @param recursive when set to true, copies directories recursively. default is false
   * @returns
   */
  async copy (from: string, to: string, recursive: boolean = false): Promise<boolean> {
    return new Promise(async (_resolve, _reject) => {
      let source = new File(from);
      let destination = new File(to);

      if (source.isDirectory()) {
        if (!destination.exists()) {
          try {
            destination.mkdirs();
          } catch (ex) {
            _reject(ex);
            return;
          }
        }

        let files: string[] = source.list();

        for (let file of files) {
          let childSource = FileHelper.SINGLETON.join(from, file);
          let childSourceFile = new File(childSource);

          //if this child file is a dir and we don't want to copy recursively, skip
          if (childSourceFile.isDirectory() && !recursive) continue;

          let childDestination = FileHelper.SINGLETON.join(to, file);

          try {
            await FileHelper.SINGLETON.copy(childSource, childDestination, recursive);
          } catch (ex) {
            _reject(ex);
            return;
          }
        }
      } else {
        try {
          FileHelper.SINGLETON.copyfile(from, to);
        } catch (ex) {
          _reject(ex);
          return;
        }
      }

      _resolve(true);
    });
  }
}
