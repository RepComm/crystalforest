
const stdlib: typeof import("@grakkit/stdlib-paper") = require("@grakkit/stdlib-paper");

const Player = stdlib.type("org.bukkit.entity.Player");
type PlayerT = InstanceType<typeof Player>;

interface PseudoCmdCallback {
  (player: PlayerT, primary: string, argsAsString: string);
}

export class PseudoCmd {
  static SINGETON: PseudoCmd;
  private registeredCommands: Map<string, PseudoCmdCallback>;

  static get (): PseudoCmd {
    if (!PseudoCmd.SINGETON) PseudoCmd.SINGETON = new PseudoCmd();
    return PseudoCmd.SINGETON;
  }

  private constructor () {
    this.registeredCommands = new Map();
    stdlib.event("org.bukkit.event.player.AsyncPlayerChatEvent", (evt)=>{
      let player = evt.getPlayer();
      let msg = evt.getMessage();
      if (msg.charAt(0) !== "-") return;

      let term = msg.indexOf(" ");
      if (term == -1) term = msg.length;

      let primary = msg.substring(1, term);
      if (this.hasCommand(primary)) {
        let cb = this.getCommand(primary);
        let argsAsString = msg.substring(term+1);

        //Should fix some async chat actions bs
        stdlib.task.timeout(()=>{
          cb(player, primary, argsAsString);
        }, 1);
        
        evt.setCancelled(true);
      }
    });
  }
  hasCommand (primary: string): boolean {
    return this.registeredCommands.has(primary);
  }
  getCommand (primary: string): PseudoCmdCallback {
    return this.registeredCommands.get(primary);
  }
  register (primary: string, cb: PseudoCmdCallback) {
    if (this.hasCommand(primary)) {
      throw `Cannot register command using "${primary}" as primary, one already exists`;
    }
    this.registeredCommands.set(primary, cb);
  }
}
