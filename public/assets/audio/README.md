# Game Audio Directory (.ogg Standard)

All static sound effects and music tracks should be in **`.ogg` (Ogg Vorbis)** format. OGG is the standard for Phaser 3 / HTML5 games because it provides seamless gapless looping and better compression efficiency than MP3.

## Directory Structure

- **`bgm/`**: Background music tracks (`.ogg`)
  - Example: `/assets/audio/bgm/golden_city_theme.ogg`
- **`sfx/`**: Short sound effects (`.ogg`)
  - Example: `/assets/audio/sfx/gear_click.ogg`
- **`ambient/`**: Environmental loops (`.ogg`)
  - Example: `/assets/audio/ambient/cave_drone.ogg`

## Automatic MP3/WAV to OGG Conversion

You can drop any `.mp3` or `.wav` files directly into these folders and convert them automatically using:

```bash
npm run convert:audio
```

This runs [**`scripts/convert-to-ogg.ps1`**](file:///D:/game/scripts/convert-to-ogg.ps1) using the system's `ffmpeg` encoder with Vorbis quality level 4 (`~140 kbps VBR`, optimized for web performance).

To convert and automatically delete the original MP3/WAV files:
```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/convert-to-ogg.ps1 -DeleteOriginals
```

## How to Load & Play in Phaser 3

In [**`PreloadScene.js`**](file:///D:/game/src/scenes/PreloadScene.js):
```javascript
preload() {
  this.load.audio('theme-bgm', '/assets/audio/bgm/golden_city_theme.ogg');
  this.load.audio('sfx-clang', '/assets/audio/sfx/gear_click.ogg');
}
```

In your Scene:
```javascript
create() {
  // Play one-shot SFX
  this.sound.play('sfx-clang', { volume: 0.8 });

  // Seamless looping BGM
  const music = this.sound.add('theme-bgm', { loop: true, volume: 0.6 });
  music.play();
}
```

*(Note: The game also retains its procedural Web Audio engine in [`src/utils/SoundEngine.js`](file:///D:/game/src/utils/SoundEngine.js) for zero-latency dynamic synthesized audio.)*
