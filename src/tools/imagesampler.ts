import { PseudoCmd } from "../pseudocmd.js";
import { Message } from "../utils/message.js";

const stdlib: typeof import("@grakkit/server") = require("@grakkit/server");

const IBufferedImage = stdlib.type("java.awt.image.BufferedImage");
type BufferedImageT = InstanceType<typeof IBufferedImage>;

const IImageIO = stdlib.type("javax.imageio.ImageIO");
type ImageIOT = InstanceType<typeof IImageIO>;

const IFile = stdlib.type("java.io.File");
type FileT = InstanceType<typeof IFile>;

const IByteBuffer = stdlib.type("java.nio.ByteBuffer");
type ByteBufferT = InstanceType<typeof IByteBuffer>;

export class ImageSampler {
  private bufferedImage: BufferedImageT;

  constructor() {

  }
  loadFromFilePath(fpath: string): this {
    this.loadFromFile(new IFile(fpath));
    return this;
  }
  loadFromFile(file: FileT): this {
    this.loadFromBufferedImage(IImageIO.read(file));
    return this;
  }
  loadFromBufferedImage(bi: BufferedImageT): this {
    this.bufferedImage = bi;
    return this;
  }
  sample(x: number, y: number): number {
    return this.bufferedImage.getRGB(x, y);
  }
  getWidth(): number {
    return this.bufferedImage.getWidth();
  }
  getHeight(): number {
    return this.bufferedImage.getHeight();
  }
}

export const ColorHelper = {
  buffer: IByteBuffer.allocate(4),
  array: undefined,
  setFromInt (colorInt: number) {
    ColorHelper.buffer.putInt(0, colorInt);
    ColorHelper.array = ColorHelper.buffer.array();
  },
  getAlpha (): number {
    return ColorHelper.array[0];
  },
  getRed (): number {
    return ColorHelper.array[1];
  },
  getGreen (): number {
    return ColorHelper.array[2];
  },
  getBlue (): number {
    return ColorHelper.array[3];
  },
}

async function test() {
  const ILocation = stdlib.type("org.bukkit.Location");
  const IBlock = stdlib.type("org.bukkit.block.Block");
  type BlockT = InstanceType<typeof IBlock>;

  const IMaterial = stdlib.type("org.bukkit.Material");

  let cmdr = PseudoCmd.get();

  let sampler = new ImageSampler();
  try {
    sampler.loadFromFilePath("./plugins/grakkit/resources/map.png");
  } catch (ex) {
    console.log("Unable to load map.png", ex);
  }

  cmdr.register("heightmap", (player, primary, argsAsString) => {
    Message.player(player, "Attempting to write heightmap to your position");

    let location = player.getLocation();
    let world = location.getWorld();

    let currentLocation = location.clone();

    let w = 256;
    let h = 256;
    let d: number;

    let currentBlock: BlockT;

    let counter = 0;

    let scaler = 1;

    for (let x = 0; x < w; x++) {
      for (let z = 0; z < h; z++) {
        ColorHelper.setFromInt(sampler.sample( Math.floor(x*scaler) , Math.floor(z*scaler)));
        d = Math.max(
          ColorHelper.getRed(),
          ColorHelper.getGreen(),
          ColorHelper.getBlue()
         ) * scaler;

        if (d > 255) d = 255;
        d = Math.floor(d);

        for (let y = 0; y < d; y++) {
          counter ++;
          currentLocation.set(x, y, z).add(location);

          currentBlock = world.getBlockAt(currentLocation);

          currentBlock.setType(IMaterial.STONE);
        }
      }
    }

    Message.player(player, `Wrote ${counter} blocks`);

  });
}

test();
