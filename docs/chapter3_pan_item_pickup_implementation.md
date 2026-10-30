# Chapter 3 Scale Pan Item Pickup Implementation

**Date**: 2026-10-30
**Branch**: main (post-merge from codex/chapter-4-ape-arena)

## Problem

Items placed on the scale pans (LEFT_PAN, RIGHT_PAN) in Chapter 3 were not clickable/interactive. Players could not retrieve items once placed on the pans, making the puzzle unwinnable if they placed the wrong items.

## Solution

### 1. Added Clickable Pan Items in ScaleView

**File**: `src/view/ScaleView.ts`

- Added `onItemClicked` callback property to ScaleView class
- Added `setItemClickHandler(handler)` public method
- Made all item sprites interactive (except 'gate' and 'reference')
- Added pointer event handlers that trigger the callback when items are clicked

```typescript
// Made items clickable (except gate and reference which is fixed)
if (id !== 'gate' && id !== 'reference') {
  img.setInteractive({ useHandCursor: true });
  img.on('pointerdown', (_pointer, _lx, _ly, event) => {
    event?.stopPropagation();
    if (this.onItemClicked) {
      this.onItemClicked(id as ScaleItemId);
    }
  });
}
```

### 2. Wired Up Click Handler in ScaleChapterScene

**File**: `src/scenes/ScaleChapterScene.ts`

- Added click handler setup after ScaleView instantiation
- Handler checks if clicked item is on a pan and triggers pickup via `queue({ kind: 'item', id })`

```typescript
this.view.setItemClickHandler((id: ScaleItemId) => {
  if (this.session.paused || this.finished) return;
  const a = this.session.attempt;
  const loc = a.locations[id];
  
  if (loc === 'LEFT_PAN' || loc === 'PAN' || loc === 'RIGHT_PAN') {
    this.queue({ kind: 'item', id });
  }
});
```

### 3. Added Missing Item Textures

**File**: `src/view/ScaleView.ts`

- Added all Chapter 3 item textures to `PROP_SIZES`:
  - pin, betel_cutter, bamboo_pole, rusty_cog, slingshot
- Added corresponding texture keys to `vectorKeys` map

### 4. Fixed Test Bug

**File**: `tests/integration/scale.test.ts`

- Fixed test "adding an item to left pan increases left weight and requires matching right weight to open gate"
- Removed duplicate `queueScaleCommand` that was trying to place crate before picking it up
- Added proper `pick(a, 'slingshot')` call before placing it on pan

## How It Works

### Complete Item Flow

1. **WORLD → BAG**: 
   - Click item in world → DiegeticGrab triggers pickup animation
   - `interactScale` sets `locations[id] = 'BAG'`
   - Inventory bar refreshes and shows the item

2. **BAG → PAN**:
   - Open bag, select item
   - Click on pan (or use keyboard shortcut)
   - `interactScale` sets `locations[id] = 'PAN'` or `'LEFT_PAN'`
   - Item appears on the scale pan

3. **PAN → BAG**:
   - Click item directly on the pan (NEW!)
   - `ScaleView` click handler triggers
   - `interactScale` sets `locations[id] = 'BAG'`
   - Item returns to inventory

### Fixed Reference Weight

The reference weight (ရှေးဟောင်းအလေးတုံး) is permanently anchored to the left pan:
- `interactScale` rejects pickup attempts (`if (command.id === 'reference') return false;`)
- Sprite is not interactive (no pointer handler added)
- Shows special message when clicked: "ဒီရှေးဟောင်းအလေးတုံးက ချိန်ခွင်ဗန်းမှာ သံမှိုနဲ့ အသေတွဲထားတာကွ!"

## Test Results

All 144 tests pass:
- ✅ Unit tests (domain.test.ts, diegeticGrab.test.ts)
- ✅ Integration tests (scale.test.ts, arena.test.ts, adventure.test.ts, regressions.test.ts, routes.test.ts)
- ✅ TypeScript type checking passes

## Files Modified

1. `src/view/ScaleView.ts` - Added clickable pan items
2. `src/scenes/ScaleChapterScene.ts` - Added click handler setup
3. `tests/integration/scale.test.ts` - Fixed test bug

## Remaining Work

None. Implementation complete and tested.
