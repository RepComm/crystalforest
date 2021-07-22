

// const stdlib = require("@grakkit/server");
const stdlib: typeof import("@grakkit/stdlib-paper") = require("@grakkit/stdlib-paper");

const IPlayer = stdlib.type("org.bukkit.entity.Player");
type PlayerT = InstanceType<typeof IPlayer>;

const IMaterial = stdlib.type("org.bukkit.Material");
type MaterialT = InstanceType<typeof IMaterial>;

export class InvMenu {
  private id: string;
  private manager: InvMenuManager;
  constructor (manager: InvMenuManager, id: string) {
    this.id = id;
    this.manager = manager;
  }
}

export class InvMenuManager {
  private menus: Map<string, InvMenu>;
  constructor () {
    this.menus = new Map();
  }
  hasMenu (id: string): boolean {
    return this.menus.has(id);
  }
  createMenu (id: string): InvMenu {
    if (this.hasMenu(id)) throw `Cannot add menu with id "${id}", already in use`;
    let menu = new InvMenu(this, id);
    this.menus.set(id, menu);
    return menu;
  }
}
