# BLOCKCRAFT PUZZLE

## Current State
- Block puzzle game with drag-and-drop on a grid
- Line clears already have sparkle particles, sweep lines, and cell-clearing CSS animations
- 23 block shapes including 1x1, diagonal, Tetris shapes
- Block tray cycles through 3 blocks at a time
- Spin system, withdrawal, leaderboard all present

## Requested Changes (Diff)

### Add
- **Bomb block shape**: A special block (3x3 or 5x5 explosion) that appears randomly (roughly 1 in every 10 block picks) in the tray, shown with a 💣 bomb icon or a distinct fiery red/orange color
- **Bomb explosion mechanic**: When a bomb block is placed, it clears all cells in a 3x3 area centered on the placement position (the bomb cell itself + 8 surrounding cells), with a big blast animation
- **Enhanced line clear blast animation**: Make existing line clear animation more impactful -- add a screen shake effect and a bright full-row/col flash before cells disappear, like Candy Crush / Block Blast style crush-and-blast
- **Bomb explosion animation**: Large circular explosion particle burst radiating outward from the bomb placement point, with orange/red/yellow fire colors

### Modify
- `SHAPES` array: Add a BOMB shape (1x1 cell, distinct color, flagged as `isBomb: true`)
- `attemptPlace` function: Detect bomb placement, compute 3x3 blast radius, clear those cells, trigger explosion animation
- `spawnSparkles` / line clear sequence: Enhance with more particles and a stronger visual impact for line clears
- CSS animations: Add `bomb-explosion` keyframe animation, enhance `cell-clearing` to scale down more dramatically

### Remove
- Nothing removed

## Implementation Plan
1. Add BOMB shape to SHAPES array with `isBomb: true` flag and a fiery distinct appearance
2. In `attemptPlace`, after placing the piece: if `piece.isBomb`, compute all cells in 3x3 radius, clear them, spawn a large explosion animation centered on placement
3. Add `bombExplosions` state array for rendering circular blast effects at specific grid positions
4. Spawn extra large sparkles + screen shake CSS class on bomb placement
5. Enhance `spawnSparkles` for line clears to emit more particles with bigger spread
6. Add CSS `@keyframes` for bomb explosion (expanding ring + fade) and screen shake
7. Ensure bomb block appears randomly ~10% of the time in block generation
