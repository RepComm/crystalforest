
interface ResolverFunction {
  (value: void | PromiseLike<void>): void;
}

interface Dependency {
  cb: ResolverFunction;
  keys: Array<string>;
  unsatisfiedCount: number;
}

export class Depend {
  static SINGLETON: Depend;
  static get (): Depend {
    if (!Depend.SINGLETON) Depend.SINGLETON = new Depend();
    return Depend.SINGLETON;
  }

  private satisfieds: Set<string>;
  private dependents: Set<Dependency>;

  private constructor () {
    this.satisfieds = new Set();
  }
  setSatisfied (dep: Dependency): this {
    //call the promise resolve
    dep.cb();

    //remove from list to save memory/cpu
    this.dependents.delete(dep);
    return this;
  }
  satisfy (...keys: string[]): this {
    for (let key of keys) this.satisfieds.add(key);

    //reference counting
    //loop through every satisfied key
    for (let key of this.satisfieds) {

      //check every dependent and decrease reference counter if it relies on this key
      for (let dep of this.dependents) {
        if (dep.keys.includes(key)) {
          dep.unsatisfiedCount --;
        }
      }
    }

    //find dependencies that are satisfied aka reference counter < 1
    for (let dep of this.dependents) {
      if (dep.unsatisfiedCount < 1) {
        this.setSatisfied (dep);
      } else {
        dep.unsatisfiedCount = dep.keys.length;
      }
    }
    return this;
  }
  isValidKey (key: string): boolean {
    //no false-y
    if (!key) return;
  }
  isAlreadySatisfied (...keys: string[]) {
    for (let key of keys) {
      if (this.satisfieds.has(key)) return false;
    }
    return true;
  }
  /**Depend on other namespaced events
   * 
   * Returns a promise that resolves when the specified keys have been satisfied
   * 
   * @param keys 
   * @returns 
   */
  depend (...keys: string[]): Promise<void> {
    return new Promise(async (_resolve, _reject)=>{
      //If already satisfied previously, skip all the hubble-bubble
      if (this.isAlreadySatisfied(...keys)) {
        _resolve();
      } else {
        //otherwise add the dependent to the list
        this.dependents.add({
          cb: _resolve,
          keys: keys,
          unsatisfiedCount: keys.length
        });
      }
    });
  }
}


