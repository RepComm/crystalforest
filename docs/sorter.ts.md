# sorter.ts

Source code implemented by [hb432](https://github.com/hb432)

Exerpt from discord:

```
So I'm looking for the most feel-good implementation of an idea I've had for a while.
It's a `Sorter` block. Every item that enters the sorter will be transferred to a storage block on a block face given what type of block it is.

My current idea for implementation:
BAS = Blockface Attached Storage
A hopper is designated as a sorter by placing a special item labelled `Sorter` in the 5th slot (index 4)

Slots 0-3 shall contain items that when matching an incoming hopper item will filter into their designated BAS:

Slot 0 -> North BAS
Slot 1 -> East BAS
Slot 2 -> South BAS
Slot 3 -> West BAS

When the incoming item does not match any of the 4 slots, it will be deposited into the Downward BAS, otherwise it is destroyed.

Thoughts? Optimizations?
@developer
```


