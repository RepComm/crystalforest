# crystalforest
Source code for my [grakkit enabled](https://github.com/grakkit/grakkit) mc server

## Utilities
- Persist - [source](./src/utils/persist.ts) - simple, namespaced persistent storage
- FileHelper - [source](./src/utils/filehelper.ts) - handling string/Uint8Array/Json files without java
- PseudoCmd - [source](./src/pseudocmd.ts) - permissionless, simple runtime chat commands using `-` instead of `/`
- Anim - [source](./src/utils/anim.ts) - number track animation w/ linear interpolation
- Message - [source](./src/utils/message.ts) - `console.log`, but for terminal, players, and broadcast
- Depend - [source](./src/tools/depend.ts) - A simple, namespaced dependency resolver. wait on tasks to finish before running code
- Worlds - [source](./src/setup/worlds.ts) - Helpful code for minecraft worlds (clone, resolve, load, unload, and autoloading on start)

## Blocks
- sorter hopper - [source](./src/blocks/sorter.ts) - [specs](./docs/sorter.ts.md)

## Entities
- paintdoor - [source](./src/entities/paintdoor.ts) - doors made out of paintings
- animstand (wip) - [source](./src/entities/animstand.ts) - leaverage Anim over armorstands, also with tools to perform animation modelling in-game / replay
- sentry (wip) - [source](./src/entities/sentry.ts) - put those skeletons to work

## Feature implementations
- warp - [source](./src/tools/warp.ts) - a global warp plugin utilizing bukkit API and PseudoCmd
- levelup - [source](./src/setup/levelup.ts) - a custom player level system
## Building
Simply run:
`npm install`
then
`npm run build` or `./build.sh`

Source code goes in your `/plugins/grakkit/` directory