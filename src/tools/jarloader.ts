
const stdlib: typeof import("@grakkit/server") = require("@grakkit/server");

const File = stdlib.type("java.io.File");

const JURLArray = Java.type("java.net.URL[]");

const JClassLoader = stdlib.type("java.lang.ClassLoader");
type IJClassLoader = InstanceType<typeof JClassLoader>;

const JClass = stdlib.type("java.lang.Class");
type IJClass = InstanceType<typeof JClass>;

const URLClassLoader = stdlib.type("java.net.URLClassLoader");

export const JarLoader = {
  loadClass<T>(loader: IJClassLoader, className: string): IJClass {
    return loader.loadClass(className) as any;
  },
  getClassLoader (fpath: string): IJClassLoader {
    let file = new File(fpath);
    let url = file.toURI().toURL();
    
    let urls = new JURLArray(1);
    urls[0] = url;

    return new URLClassLoader(urls) as any;
  }
};
