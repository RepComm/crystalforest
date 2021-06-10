
/**Linear interpolation between from and to, using 0.0 - 1.0 interpolant `by`*/
export const lerp = (from: number, to: number, by: number): number => {
  return from*(1-by)+to*by;
}

/**Performs the inverse of lerp
 * Will give you the interpolant given the interpolated number and its bounds (to and from)
 */
export const inverseLerp = (from: number, to: number, value: number): number => {
  return (value - from) / (to - from);
}

export interface Keyframe {
  time: number;
  value: number;
}

export function Keyframe_clone (frame: Keyframe): Keyframe {
  return {
    time: frame.time,
    value: frame.value
  }
}

/**Calls lerp, but on keyframe values
 * This does not work with time offset as interpolant, use KeyFrame_lerp_time instead
 *
 * interpolant must be a value between 0.0 and 1.0
 */
function Keyframe_lerp (first: Keyframe, second: Keyframe, interpolant: number): number {
  return lerp(
    first.value,
    second.value,
    interpolant
  );
}

/**Given two keyframes and a current time, interpolate between them
 * Time should be between both first->time and second->time
 * Which are the times of the keyframes as offset in their track
 * 
 * Example:
 * `
 * KeyFrameP first  = KeyFrame_create( 25.0, 0.0  );
 * KeyFrameP second = KeyFrame_create( 75.0, 10.0 );
 * 
 * float currentTime = 50.0;
 * 
 * KeyFrame_lerp_time (first, second, currentTime); //returns 5.0
 * //This is because currentTime was half way between the key frames (25 and 75)
 * //So result is half way between 0 and 10 (keyframe values)
 * `
 */
function Keyframe_lerp_time (first: Keyframe, second: Keyframe, time: number): number {
  return Keyframe_lerp (
    first, second,

    inverseLerp(
      first.time,
      second.time,
      time
    )
  );
}

export interface TrackJson {
  keyframes: Array<Keyframe>;
  duration: number;
}

//========Track
export class Track {
  private keyframes: Set<Keyframe>;
  duration: number;

  constructor () {
    this.keyframes = new Set();
    this.duration = 0;
  }
  static toJson (track: Track): TrackJson {
    let keyframes = new Array<Keyframe>(track.keyframes.size);
    let i=0;
    for (let frame of track.keyframes) {
      keyframes[i] = Keyframe_clone(frame);
      i++;
    }
    return {
      keyframes: keyframes,
      duration: track.duration
    };
  }
  static fromJson (json: TrackJson): Track {
    let result = new Track();

    for (let frame of json.keyframes) {
      result.keyframes.add(Keyframe_clone(frame));
    }
    result.duration = json.duration;

    return result;
  }
  createKeyframe (time: number, value: number) {
    let result: Keyframe = {
      time: time,
      value: value
    };
    this.keyframes.add(result);
    
    if (time > this.duration) this.duration = time;
    return result;
  }
  getValueAtTime (time: number): number {
    if (this.getKeyframeCount() < 1) return 0;

    let start = this.getKeyframeFloor(time);
    let end = this.getKeyframeCeil(time);

    //If no keyframe before time
    if (!start) return 0;
  
    //If no keyframe after, return last known
    if (!end) return start.value;
  
    //Linear interpolate between the frames
    return Keyframe_lerp_time(start, end, time);
  }
  setValueAtTime (time: number, value: number): this {
    let kf = this.getKeyframeAt(time, 0.001, true);
    kf.value = value;
    return this;
  }
  getKeyframeCount (): number {
    return this.keyframes.size;
  }
  hasKeyframes (): boolean {
    return this.keyframes.size > 1;
  }
  getKeyframeFloor (time: number): Keyframe {
    if (this.getKeyframeCount() < 1) return null;

    let latest: Keyframe = undefined;

    for (let frame of this.keyframes) {
      //Make sure we don't return frames after the time
      if (frame.time > time) {
        return latest;
        //Update latest
      } else if (!latest || frame.time > latest.time) {
        latest = frame;
      }
    }
    return latest;
  }
  getKeyframeCeil (time: number): Keyframe {
    if (this.getKeyframeCount() < 1) return null;

    let earliest: Keyframe = undefined;
    for (let frame of this.keyframes) {      
      //Make sure we don't return frames before the time
      if (frame.time < time) {
        //Do nothing
        //Update latest
      } else if (!earliest || frame.time < earliest.time) {
        earliest = frame;
      }
    }
    return earliest;
  }
  getKeyframeAt (time: number, timeTolerance: number = 0.001, createIfNeeded: boolean = true): Keyframe {
    if (!this.hasKeyframes() && createIfNeeded) {
      return this.createKeyframe(time, 0);
    }
    for (let frame of this.keyframes) {
      if (
        (timeTolerance === 0 && frame.time == time) ||
        Math.abs(frame.time - time) <= timeTolerance
      ) {
        return frame;
      }
    }
    if (!createIfNeeded) return null;
    return this.createKeyframe(time, 0);
  }
}
