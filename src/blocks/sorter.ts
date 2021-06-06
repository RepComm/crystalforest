
const stdlib: typeof import("@grakkit/server") = require("@grakkit/server");

const InventoryType = stdlib.type("org.bukkit.event.inventory.InventoryType");

const Inventory = stdlib.type("org.bukkit.inventory.Inventory");
type IInventory = InstanceType<typeof Inventory>;

const Material = stdlib.type("org.bukkit.Material");

const ItemStack = stdlib.type("org.bukkit.inventory.ItemStack");
type IItemStack = InstanceType<typeof ItemStack>;

const Hopper = stdlib.type("org.bukkit.block.Hopper");
const BlockInventoryHolder = stdlib.type("org.bukkit.inventory.BlockInventoryHolder");

function isTransferHopper(inventory: IInventory) {
  const holder = inventory.getHolder();
  if (!(holder instanceof Hopper)) return false;
  const sorter = inventory.getItem(4);
  if (!sorter) return false;
  const meta = sorter.getItemMeta();
  if (!meta) return false;
  const name = meta.getDisplayName();
  return name === 'Sorter';
}

stdlib.event("org.bukkit.event.inventory.InventoryMoveItemEvent", (event) => {
  const source = event.getSource();
  if (isTransferHopper(source)) return void event.setCancelled(true);
  const destination = event.getDestination();
  if (!isTransferHopper(destination)) return;
  event.setCancelled(true);
  const item = event.getItem().clone();

  const location = (destination.getHolder() as any).getLocation();
  const sorterN = destination.getItem(0);
  const sorterE = destination.getItem(1);
  const sorterS = destination.getItem(2);
  const sorterW = destination.getItem(3);
  if (sorterN && sorterN.isSimilar(item)) {
    location.setZ(location.getZ() - 1);
  } else if (sorterE && sorterE.isSimilar(item)) {
    location.setX(location.getX() + 1);
  } else if (sorterS && sorterS.isSimilar(item)) {
    location.setZ(location.getZ() + 1);
  } else if (sorterW && sorterW.isSimilar(item)) {
    location.setX(location.getX() - 1);
  } else {
    location.setY(location.getY() - 1);
  }
  const state = location.getBlock().getState();
  if (!(state instanceof BlockInventoryHolder)) return;
  let space = false;
  const inventory = state.getInventory();
  if (inventory.firstEmpty() !== -1) {
    space = true;
  } else if (inventory.containsAtLeast(item, 1)) {
    const contents = inventory.getContents();
    for (const value of contents) {
      if (value && value.getAmount() < value.getMaxStackSize() && value.isSimilar(item)) {
        space = true;
        break;
      }
    }
  }
  if (space) {
    item.setAmount(1);
    console.log(item);
    setTimeout(() => {
      const contents = source.getContents();
      const transfer = source.containsAtLeast(item, 1);
      for (const key in contents) {
        const value = contents[key];
        if (value && value.isSimilar(item)) {
          const amount = value.getAmount() - 1;
          if (amount === 0) {
            contents[key] = null;
          } else {
            value.setAmount(amount);
          }
          break;
        }
      }
      source.setContents(contents);
      transfer && inventory.addItem(item);
    });
  }
});
