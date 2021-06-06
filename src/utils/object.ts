
export function objectUnion (to: any, ...objs: any[]): any {
  let result = to || {};
  
  for (let obj of objs) {
    let keys = Object.keys(obj);
    for (let key of keys) {
      result[key] = obj[key];
    }
  }
}
