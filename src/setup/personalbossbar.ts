
const stdlib: typeof import("@grakkit/server") = require("@grakkit/server");

const IBossBar = stdlib.type("org.bukkit.boss.BossBar");
type BossBarT = InstanceType<typeof IBossBar>;
const IBossBarColor = stdlib.type("org.bukkit.boss.BarColor");
const IBossBarStyle = stdlib.type("org.bukkit.boss.BarStyle");
const IBossBarFlag = stdlib.type("org.bukkit.boss.BarFlag");
type BossBarFlagT = InstanceType<typeof IBossBarFlag>;

const INamespacedKey = stdlib.type("org.bukkit.NamespacedKey");
type NamespacedKeyT = InstanceType<typeof INamespacedKey>;

const IPlayer = stdlib.type("org.bukkit.entity.Player");
type PlayerT = InstanceType<typeof IPlayer>;

export const PersonalBossBars = {
  allPersonalBossBars: new Map<string, BossBarT>(),
  namespacedKeys: new Map<string, NamespacedKeyT>(),

  /**Makes sure the player specified by playerName, or all online players have their own personal boss bar*/
  populate(playerName: string = undefined) {
    if (playerName) {
      PersonalBossBars.populateSingle(playerName);
    } else {
      let players = stdlib.server.getOnlinePlayers();
      let playerName: string;

      for (let player of players) {
        playerName = player.getName();
        PersonalBossBars.populateSingle(playerName);
      }
    }

  },
  /**Get or create a personal boss bar*/
  getBossBar(playerName: string, create: boolean = true): BossBarT {
    let result = PersonalBossBars.allPersonalBossBars.get(playerName);
    if (!result && create) result = PersonalBossBars.populateSingle(playerName);
    return result;
  },
  /**Get or create a NamespacedKey*/
  getNamespace(playerName: string): NamespacedKeyT {
    let result = PersonalBossBars.namespacedKeys.get(playerName);
    if (!result) {
      result = new INamespacedKey("personal-bossbar", playerName.toLowerCase());
      PersonalBossBars.namespacedKeys.set(playerName, result);
    }
    return result;
  },
  /**Ensure a specific online player has a boss bar setup*/
  populateSingle(playerName: string): BossBarT {
    let player = stdlib.server.getPlayer(playerName);
    if (!player.isOnline()) return;

    if (PersonalBossBars.allPersonalBossBars.has(playerName)) return;

    let bossbar: BossBarT;

    let ns = PersonalBossBars.getNamespace(playerName);

    bossbar = stdlib.server.getBossBar(ns);

    if (!bossbar) {

      let bbColor = IBossBarColor.WHITE;
      let bbStyle = IBossBarStyle.SOLID;
      let bbFlags: BossBarFlagT[] = [];

      bossbar = stdlib.server.createBossBar(ns, playerName, bbColor, bbStyle, ...bbFlags);
    }

    PersonalBossBars.allPersonalBossBars.set(playerName, bossbar);
    return bossbar;
  },
  /**Removes boss bars for player that aren't online*/
  clean() {
    for (let [playerName, bossbar] of PersonalBossBars.allPersonalBossBars) {
      let player = stdlib.server.getPlayer(playerName);
      if (!player || player.isOnline()) {
        PersonalBossBars.removeBossBar(playerName);
      }
    }
  },
  removeBossBar(playerName: string) {
    let bossbar = PersonalBossBars.getBossBar(playerName, false);
    if (!bossbar) return;
    let ns = PersonalBossBars.getNamespace(playerName);
    bossbar.removeAll();
    PersonalBossBars.allPersonalBossBars.delete(playerName);
    bossbar = null;
    stdlib.server.removeBossBar(ns);
  },
  show(...playerNames: string[]) {
    let player: PlayerT;
    for (let playerName of playerNames) {
      player = stdlib.server.getPlayer(playerName);
      if (!player || !player.isOnline()) continue;

      let bossbar = PersonalBossBars.getBossBar(playerName);

      bossbar.addPlayer(stdlib.server.getPlayer(playerName));
    }
  },
  hide(...playerNames: string[]) {
    let player: PlayerT;
    for (let playerName of playerNames) {
      player = stdlib.server.getPlayer(playerName);
      if (!player || !player.isOnline()) continue;

      let bossbar = PersonalBossBars.getBossBar(playerName);

      bossbar.removePlayer(stdlib.server.getPlayer(playerName));
    }
  },
  count(): number {
    return PersonalBossBars.allPersonalBossBars.size;
  }
};

async function main() {
  //Handles plugin reload and js core.reload()
  PersonalBossBars.clean();
  PersonalBossBars.populate();

  //handles player join
  stdlib.event("org.bukkit.event.player.PlayerJoinEvent", (evt) => {
    let player = evt.getPlayer();
    if (!player) return;

    let playerName = player.getName();

    PersonalBossBars.populateSingle(playerName);
  });

  //Handles player leave
  stdlib.event("org.bukkit.event.player.PlayerQuitEvent", (evt) => {
    //Running in a timeout performs less GC in the event that a few players lose connection and immediately rejoin
    stdlib.task.timeout(() => {
      PersonalBossBars.clean();
    }, 20 * 4);
  });
}

main();
