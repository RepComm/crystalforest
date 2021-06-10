
const stdlib: typeof import("@grakkit/server") = require("@grakkit/server");

import { Track, TrackJson } from "../utils/anim.js";

const IArmorStand = stdlib.type("org.bukkit.entity.ArmorStand");
type ArmorStandT = InstanceType<typeof IArmorStand>;

const IEulerAngle = stdlib.type("org.bukkit.util.EulerAngle");
type EulerAngleT = InstanceType<typeof IEulerAngle>;

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

/**Map of animstand tracks to their names*/
export interface AnimStandTracks {
  [key: string]: VectorTrack;
}

/**A single animation clip (action) for an armor stand*/
export interface AnimStandClip {
  name: string;
  tracks: AnimStandTracks;
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
  }
  /**Copies the current state onto an armorstand entity
   * @param stand 
   */
  pushState(stand: ArmorStandT): this {
    Vector3.copyToEulerAngle(this.state.body, this.rotation);
    stand.setBodyPose(this.rotation);

    Vector3.copyToEulerAngle(this.state.head, this.rotation);
    stand.setHeadPose(this.rotation);

    Vector3.copyToEulerAngle(this.state.l_arm, this.rotation);
    stand.setLeftArmPose(this.rotation);

    Vector3.copyToEulerAngle(this.state.l_leg, this.rotation);
    stand.setLeftLegPose(this.rotation);

    Vector3.copyToEulerAngle(this.state.r_arm, this.rotation);
    stand.setRightArmPose(this.rotation);

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
}