# crystalforest
Source code for my [grakkit enabled](https://github.com/grakkit/grakkit) mc server

## Classes
- Persist : persistent storage class
- FileHelper : handling string/Uint8Array/Json files without java
- PseudoCmd : Writing commands that start with `-` to avoid permissions, simplier to prototype, etc

## Building
Simply run:
`npm install`
then
`npm run build` or `./build.sh`

Source code goes in your `/plugins/grakkit/` directory