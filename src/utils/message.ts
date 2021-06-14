
const stdlib: typeof import("@grakkit/server") = require("@grakkit/server");

const Player = stdlib.type("org.bukkit.entity.Player");
type IPlayer = InstanceType<typeof Player>;

export interface ToString {
  (obj: any): string;
}

export const DefaultToString: ToString = (obj: any): string => {
  return `${obj}`;
}

export interface StringFilter {
  (msg: string): string;
}

export const DefaultFilter: StringFilter = (msg: string) => {
  return msg.replaceAll("&", "§");
}

/**Thread safe message/logging
 * Internally uses stdlib.task.timeout for async actions
 */
export const Message = {
  filter: DefaultFilter,
  stringify: (msgs: any[], joiner: string = " ", toString: ToString = DefaultToString): string => {
    return msgs.map(value=>toString(value)).join(joiner);
  },
  /**Send a player a message
   * @param player to send to
   * @param msgs objects to encode as a message
   */
  player: (player: IPlayer, ...msgs: any[]): void => {
    stdlib.task.timeout(()=>{
      player.sendRawMessage( Message.filter( Message.stringify(msgs) ) );
    }, 1);
  },
  /**Send an array of players a message
   * @param players to send the message to
   * @param msgs objects to encode as a message
   */
  players: (players: IPlayer[], ...msgs: any[]): void => {
    stdlib.task.timeout(()=>{
      let msg = Message.filter( Message.stringify(msgs) );
      for (let player of players) {
        player.sendRawMessage( msg );
      }
    }, 1);
  },
  /**Tell every connected player a message
   * @param msgs objects to encode as a message
   */
  broadcast: (...msgs: any[]): void => {
    stdlib.task.timeout(()=>{
      stdlib.server.broadcastMessage(Message.filter( Message.stringify( msgs ) ));
    }, 1);
  },
  /**Tells the console a message
   * Internally uses console.log
   * @param msgs 
   */
  terminal: (...msgs: any[]): void => {
    console.log(...msgs);
  },
  /**Broadcast + terminal
   * Kind of spammy, but whatever.
   * @param msgs 
   */
  everywhere: (...msgs: any[]): void => {
    Message.terminal(...msgs);
    Message.broadcast(...msgs);
  }
};

