

// import * as stdlib from "@grakkit/server";
const stdlib = require('@grakkit/server');

const ILocation = stdlib.type("org.bukkit.Location");
type LocationT = InstanceType<typeof ILocation>;

const IItemFrame = stdlib.type("org.bukkit.entity.ItemFrame");
type ItemFrameT = InstanceType<typeof IItemFrame>;

const IEntityType = stdlib.type("org.bukkit.entity.EntityType");

const IBlockFace = stdlib.type("org.bukkit.block.BlockFace");
type BlockFaceT = InstanceType<typeof IBlockFace>;

const IPlayer = stdlib.type("org.bukkit.entity.Player");
type PlayerT = InstanceType<typeof IPlayer>;

import { getEntitiesAt } from "../utils.js";

export interface ButtonFramePressCallback {
  (player: PlayerT, button: ButtonFrame, itemFrame: ItemFrameT);
}

const AllButtonFrames: Set<ButtonFrame> = new Set();

export class ButtonFrame {
  private itemFrame: ItemFrameT;
  private cb: ButtonFramePressCallback;
  constructor () {
  }
  setCallback (cb: ButtonFramePressCallback): this {
    this.cb = cb;
    return this;
  }
  getCallback (): ButtonFramePressCallback {
    return this.cb;
  }
  setFrame (itemFrame: ItemFrameT): this {
    this.itemFrame = itemFrame;
    return this;
  }
  getFrame (): ItemFrameT {
    return this.itemFrame;
  }
  /**Register an item frame button
   * @param loc Location in a world
   * @param facing facing direction
   * @param cb function that is called when the frame is clicked
   */
  static register (loc: LocationT, facing: BlockFaceT, cb: ButtonFramePressCallback) {
    let ens = getEntitiesAt(loc);
    let frame: ItemFrameT;

    for (let en of ens) {
      if (en instanceof IItemFrame) {
        frame = en;
        break;
      }
    }

    if (!frame) {
      frame = loc.getWorld().spawnEntity(
        loc, IEntityType.ITEM_FRAME
      ) as any;
    }
    frame.setFacingDirection(facing, true);

    let button = new ButtonFrame();
    button.setFrame(frame);
    button.setCallback(cb);
    AllButtonFrames.add(button);
  }
  static getByFrame (itemFrame: ItemFrameT): ButtonFrame {
    for (let btn of AllButtonFrames) {
      if (btn.getFrame().equals(itemFrame)) return btn;
    }
    return null;
  }
}

stdlib.event("org.bukkit.event.player.PlayerInteractAtEntityEvent", (evt)=>{
  let itemFrame = evt.getRightClicked();
  if (itemFrame instanceof IItemFrame) {
    let button = ButtonFrame.getByFrame(itemFrame);
    if (!button) return;
    let cb = button.getCallback();

    cb(evt.getPlayer(), button, itemFrame);
  }
});
