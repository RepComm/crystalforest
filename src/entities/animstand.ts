
const stdlib: typeof import("@grakkit/stdlib-paper") = require("@grakkit/stdlib-paper");

import { PseudoCmd } from "../pseudocmd.js";
import { Track, TrackJson } from "../utils/anim.js";
import { Message } from "../utils/message.js";

const IArmorStand = stdlib.type("org.bukkit.entity.ArmorStand");
type ArmorStandT = InstanceType<typeof IArmorStand>;

const IEulerAngle = stdlib.type("org.bukkit.util.EulerAngle");
type EulerAngleT = InstanceType<typeof IEulerAngle>;

const IEntityType = stdlib.type("org.bukkit.entity.EntityType");

const IUUID = stdlib.type("java.util.UUID");

/**Convenience for using tracks for vector animation*/
export interface VectorTrackJson {
  x: TrackJson;
  y: TrackJson;
  z: TrackJson;
}
/**Convenience for using tracks for vector animation*/
export interface VectorTrack {
  x: Track;
  y: Track;
  z: Track;
}

function createVectorTrack (): VectorTrack {
  return {
    x: new Track(),
    y: new Track(),
    z: new Track()
  }
}

/**Map of animstand tracks to their names*/
export type AnimStandTracks = {
  [key in ArmorStandJoint]: VectorTrack;
}

function createAnimStandTracks (): AnimStandTracks {
  return {
    body: createVectorTrack(),
    head: createVectorTrack(),
    l_arm: createVectorTrack(),
    l_leg: createVectorTrack(),
    r_arm: createVectorTrack(),
    r_leg: createVectorTrack(),
  }
}

/**A single animation clip (action) for an armor stand*/
export interface AnimStandClip {
  name: string;
  tracks: AnimStandTracks;
  dirty: boolean;
}

/**The different joints of an armor stand*/
export type ArmorStandJoint = "body" | "head" | "l_arm" | "l_leg" | "r_arm" | "r_leg";
export let ArmorStandJoints: Array<ArmorStandJoint> = ["body", "head", "l_arm", "l_leg", "r_arm", "r_leg"];

/**Represents a pose without using java specific API*/
export type AnimStandState = {
  [key in ArmorStandJoint]: Vector3Json;
}

/**Represents a vector without java specific API (or math libs)*/
export interface Vector3Json {
  x: number;
  y: number;
  z: number;
}
/**Functionality for converting to/from Java poses*/
export class Vector3 {
  static create(x: number = 0, y: number = 0, z: number = 0): Vector3Json {
    return { x: x, y: y, z: z };
  }
  static copyToEulerAngle(vec: Vector3Json, euler: EulerAngleT) {
    euler.setX(vec.x);
    euler.setY(vec.y);
    euler.setZ(vec.z);
  }
  static copyFromEulerAngle(euler: EulerAngleT, vec: Vector3Json) {
    vec.x = euler.getX();
    vec.y = euler.getY();
    vec.z = euler.getZ();
  }
}

type AnimStandPlayState = "playing"|"paused";

/**An actor for rendering armorstand specific animations
 * 
 * Applying animation to individual armorstands is done with pushState() after render(), allowing multiple stands to be animated
 * 
 * You can also pull animation from a stand with pullState(), then reverseRender(), allowing recording of a stand onto the clip
 */
export class AnimStand {
  private clip: AnimStandClip;
  private state: AnimStandState;
  private rotation: EulerAngleT;
  private playState: AnimStandPlayState;

  constructor() {
    this.state = {
      body: Vector3.create(),
      head: Vector3.create(),
      l_arm: Vector3.create(),
      l_leg: Vector3.create(),
      r_arm: Vector3.create(),
      r_leg: Vector3.create()
    };

    this.rotation = new IEulerAngle(0, 0, 0);

    this.playState = "paused";
  }
  /**Copies the current state onto an armorstand entity
   * @param stand 
   */
  pushState(stand: ArmorStandT): this {
    this.rotation = new IEulerAngle(0, 0, 0);
    Vector3.copyToEulerAngle(this.state.body, this.rotation);
    stand.setBodyPose(this.rotation);

    this.rotation = new IEulerAngle(0, 0, 0);
    Vector3.copyToEulerAngle(this.state.head, this.rotation);
    stand.setHeadPose(this.rotation);

    this.rotation = new IEulerAngle(0, 0, 0);
    Vector3.copyToEulerAngle(this.state.l_arm, this.rotation);
    stand.setLeftArmPose(this.rotation);

    this.rotation = new IEulerAngle(0, 0, 0);
    Vector3.copyToEulerAngle(this.state.l_leg, this.rotation);
    stand.setLeftLegPose(this.rotation);

    this.rotation = new IEulerAngle(0, 0, 0);
    Vector3.copyToEulerAngle(this.state.r_arm, this.rotation);
    stand.setRightArmPose(this.rotation);

    this.rotation = new IEulerAngle(0, 0, 0);
    Vector3.copyToEulerAngle(this.state.r_leg, this.rotation);
    stand.setRightLegPose(this.rotation);

    return this;
  }
  /**Copies an armorstand's pose onto the state
   * @param stand 
   * @returns 
   */
  pullState(stand: ArmorStandT): this {
    this.rotation = stand.getBodyPose();
    Vector3.copyFromEulerAngle(this.rotation, this.state.body);

    this.rotation = stand.getHeadPose();
    Vector3.copyFromEulerAngle(this.rotation, this.state.head);

    this.rotation = stand.getLeftArmPose();
    Vector3.copyFromEulerAngle(this.rotation, this.state.l_arm);

    this.rotation = stand.getLeftLegPose();
    Vector3.copyFromEulerAngle(this.rotation, this.state.l_leg);

    this.rotation = stand.getRightArmPose();
    Vector3.copyFromEulerAngle(this.rotation, this.state.r_arm);

    this.rotation = stand.getRightLegPose();
    Vector3.copyFromEulerAngle(this.rotation, this.state.r_leg);

    return this;
  }
  /**Renders the current clip's tracks onto the state for the given keyframe time
   * @param time keyframe time (floats are valid)
   */
  render(time: number): this {
    let track: VectorTrack;
    let jointVector: Vector3Json;

    for (let joint of ArmorStandJoints) {
      track = this.clip.tracks[joint];

      jointVector = this.state[joint];

      jointVector.x = track.x.getValueAtTime(time);
      jointVector.y = track.y.getValueAtTime(time);
      jointVector.z = track.z.getValueAtTime(time);
    }
    return this;
  }
  /**Renders the state onto the tracks of the current clip for the given keyframe time
   */
  reverseRender (time: number, timeTolerance: number = undefined): this {
    let track: VectorTrack;
    let jointVector: Vector3Json;

    for (let joint of ArmorStandJoints) {
      track = this.clip.tracks[joint];
      jointVector = this.state[joint];

      track.x.getKeyframeAt(time, timeTolerance, true).value = jointVector.x;
      track.y.getKeyframeAt(time, timeTolerance, true).value = jointVector.y;
      track.z.getKeyframeAt(time, timeTolerance, true).value = jointVector.z;
    }
    return this;
  }
  getClip (): AnimStandClip {
    return this.clip;
  }
  setClip (clip: AnimStandClip): this {
    this.clip = clip;
    return this;
  }
  hasClip (): boolean {
    return this.clip !== undefined && this.clip !== null;
  }
  setPlayState (state: AnimStandPlayState): this {
    this.playState = state;
    return this;
  }
  getPlayState (): AnimStandPlayState {
    return this.playState;
  }
}

let allAnimStands: Map<string, AnimStand> = new Map();

let allAnimClips: Map<string, AnimStandClip> = new Map();

type AnimStandSubCommand = "clip"|"play"|"stop"|"record"|"delete"|"create"|"randomize";
const AnimStandSubCommands: Array<AnimStandSubCommand> = [
  "clip",   //clip sub commands
  "create", //create an animstand from an armor stand
  "delete", //delete an animstand linked to an armor stand
  "play",   //set animation state active
  "record", //load state onto a frame in the active clip
  "stop",   //set animation state inactive
  "randomize" //randomize the pose of an armor stand
];

type AnimStandClipCommand = "create"|"set"|"rename"|"delete"|"list";
const AnimStandClipCommands: Array<AnimStandClipCommand> = [
  "create", //create a new clip
  "delete", //delete a clip
  "rename", //rename a clip
  "set",    //set which clip is active
  "list"    //list all clips
];

function test () {
  let cmdr = PseudoCmd.get();

  let currentFrameTime = 0;
  let en;

  stdlib.task.interval(()=>{

    currentFrameTime += 0.5;
    if (currentFrameTime > 100) currentFrameTime = 0;

    for (let [uuid, animstand] of allAnimStands) {
      if (animstand.getPlayState() === "paused") continue;

      //@ts-ignore
      en = server.getEntity(IUUID.fromString(uuid));
      if (!en) continue;

      if (!animstand.hasClip()) continue;

      animstand.render(currentFrameTime);

      animstand.pushState(en as any);
    }
  }, 2);

  cmdr.register("animstand", (player, primary, argsAsString)=>{    

    //select the players target
    let armorStand: ArmorStandT = player.getTargetEntity(4) as any;

    //make sure it exists
    if (!armorStand) {
      Message.player(player, "You're not looking at an entity closer than 4 meters away");
      return;
    }

    //make sure its an armor stand
    if (!armorStand.getType().equals(IEntityType.ARMOR_STAND)) {
      Message.player(player, "Target entity must be type ARMOR_STAND");
      return;
    }

    let uuid = armorStand.getUniqueId().toString();

    let animstand: AnimStand;
    if (allAnimStands.has(uuid)){
      animstand = allAnimStands.get(uuid);
    }

    let args = argsAsString.split(" ");

    if (args.length < 1) {
      Message.player(player, "No arguments specified");
      return;
    }

    let subcmd: AnimStandSubCommand = args[0] as any;

    switch (subcmd) {
      case "play":
        if (!animstand) {
          Message.player(player, "Cannot play without first creating an AnimStand, clip, and setting the stand's clip");
          return;
        }
        animstand.setPlayState("playing");
        break;
      case "stop":
        if (!animstand) {
          Message.player(player, "Cannot stop without first creating an AnimStand, clip, and setting the stand's clip");
          return;
        }
        animstand.setPlayState("paused");
        break;
      case "create":
        if (animstand) {
          Message.player(player, "Cannot create AnimStand, one is already present for this entity");
          return;
        }
        animstand = new AnimStand();
        allAnimStands.set(uuid, animstand);
        Message.player(player, "Created AnimStand for entity uuid", uuid);

        break;
      case "delete":
        if (!animstand) {
          Message.player(player, "Cannot delete AnimStand, none is present for the target entity");
          return;
        }
        allAnimStands.delete(uuid);
        Message.player(player, "Delete AnimStand for entity uuid", uuid);
        break;
      case "record":
        if (!animstand) {
          Message.player(player, "Cannot record without creating an AnimStand, clip, and setting the stand's clip");
          return;
        }
        if (args.length < 2) {
          Message.player(player, "Not enough arguments, expected: -animstand record <keyframe>");
          return;
        }
        let timeArg: string = args[1];
        let time: number;
        try {
          time = Number.parseFloat(timeArg);
        } catch (ex) {
          Message.player(player, `Couldn't convert <keyframe> argument "${timeArg}" to javascript number: ${ex}`);
          return;
        }
        if (!animstand.hasClip()) {
          Message.player(player, `Cannot record, No clip is set on the AnimStand for entity uuid ${uuid}. Use -animstand clip set <clipname>`);
          return;
        }
        animstand.pullState(armorStand);
        animstand.reverseRender(time);
        Message.player(player, "Copied armorstand pose to keyframe", time, "on clip", animstand.getClip().name);
        break;
      case "clip":
        let clipCmd: AnimStandClipCommand = args[1] as any;

        let clipName: string;
        if (args.length > 2) {
          clipName = args[2];
        }

        let clip: AnimStandClip;
        if (clipName && allAnimClips.has(clipName)) {
          clip = allAnimClips.get(clipName);
        } 

        switch (clipCmd) {
          case "create":
            if (!clipName) {
              Message.player(player, "Cannot create a clip without a name, expected: -animstand clip create <clipname>");
              return;
            }
            clip = {
              name: clipName,
              tracks: createAnimStandTracks(),
              dirty: false
            };
            allAnimClips.set(clipName, clip);
            Message.player(player, "Created empty AnimStandClip with name", clipName);
            break;
          case "delete":
            if (!clipName) {
              Message.player(player, "Cannot delete a clip without a name, expected: -animstand clip delete <clipname>");
              return;
            }
            if (!clip) {
              Message.player(player, "Cannot delete clip, no clip exists with name", clipName);
              return;
            }
            allAnimClips.delete(clipName);
            clip.name = undefined;
            clip.tracks = undefined;
            clip.dirty = true;
            Message.player(player, "Deleted clip", clipName);
            break;
          case "rename":
            if (!clipName) {
              Message.player(player, "Cannot rename a clip without a name, expected: -animstand clip rename <clipname> <newname>");
              return;
            }
            if (args.length < 4) {
              Message.player(player, "Not enough arguments, expected 4, got 3. You're missing the <newname>");
            }
            let newname = args[3];
            
            if (!clip) {
              Message.player(player, `Cannot rename "${clipName}", it does not exist`);
              return;
            }
            clip.name = newname;
            allAnimClips.set(newname, clip);
            allAnimClips.delete(clipName);

            Message.player(player, "Renamed clip from", clipName, "to", newname);
            break;
          case "set":
            if (!clipName) {
              Message.player(player, "Cannot set a clip without a name, expected: -animstand clip set <clipname>");
              return;
            }
            if (!clip) {
              Message.player(player, `Cannot set clip by name "${clipName}", it doesn't exist`);
              return;
            }
            animstand.setClip(clip);
            Message.player(player, `Set AnimStand for entity uuid ${uuid} to clip named ${clipName}`);
            break;
          case "list":
            let msg = "";
            for (let [k,v] of allAnimClips) {
              msg += k + "\n";
            }
            Message.player(player, "All clip names:", msg);
            break;
          default:
            Message.player(player, "Unknown clip command", clipCmd);
            return;
        }
        break;
      case "randomize":
        let euler_t = new IEulerAngle(Math.random(), Math.random(), Math.random());
        armorStand.setBodyPose(euler_t);

        euler_t = new IEulerAngle(Math.random(), Math.random(), Math.random());
        armorStand.setHeadPose(euler_t);
        
        euler_t = new IEulerAngle(Math.random(), Math.random(), Math.random());
        armorStand.setRightArmPose(euler_t);

        euler_t = new IEulerAngle(Math.random(), Math.random(), Math.random());
        armorStand.setRightLegPose(euler_t);

        euler_t = new IEulerAngle(Math.random(), Math.random(), Math.random());
        armorStand.setLeftArmPose(euler_t);
        
        euler_t = new IEulerAngle(Math.random(), Math.random(), Math.random());
        armorStand.setLeftLegPose(euler_t);
        break;
      default:
        Message.player(player, "Unknown subcommand", subcmd);
        return;
    }
  });
}

test();
