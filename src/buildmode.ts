
const stdlib = require("@grakkit/server");
// import * as stdlib from "@grakkit/server";

const Player = stdlib.type("org.bukkit.entity.Player");
const GameMode = stdlib.type("org.bukkit.GameMode");
type PlayerT = InstanceType<typeof Player>;

export class BuildModeManager {
  private buildModePlayers: Set<PlayerT>;

  constructor () {
    this.buildModePlayers = new Set();

    stdlib.event("org.bukkit.event.player.PlayerToggleFlightEvent", (evt)=>{
      let player = evt.getPlayer();
      if (!player) return;

      if (!this.hasPlayer(player)) return;

      if (!player.getAllowFlight()) {
        player.setAllowFlight(true);
      }
    });
  }
  sendPlayerMessage (player: PlayerT, ...msgs: any[]) {
    if (!player) return;
    player.sendRawMessage(`[BuildMode] ${msgs.join(" ")}`);
  }
  hasPlayer (player: PlayerT): boolean {
    return this.buildModePlayers.has(player);
  }
  unsafeAddPlayer (player: PlayerT) {
    this.sendPlayerMessage(player, "enabled");
    this.buildModePlayers.add(player);
    player.setAllowFlight(true);
  }
  unsafeRemovePlayer (player: PlayerT) {
    this.sendPlayerMessage(player, "disabled");
    this.buildModePlayers.delete(player);
    //Do not overwrite other game mode flight rules
    if (player.getGameMode().equals(GameMode.SURVIVAL)) {
      player.setAllowFlight(false);
    }
  }
  setPlayer (player: PlayerT, enabled: boolean = true) {
    if (!player) return;
    if (enabled) {
      if (!this.hasPlayer(player)) {
        this.unsafeAddPlayer(player);
      }
    } else {
      if (this.hasPlayer(player)) {
        this.unsafeRemovePlayer(player);
      }
    }
  }
}
