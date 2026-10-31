import Phaser from 'phaser';

export type TouchControlMode =
  | 'CH1'
  | 'CH2'
  | 'CH3'
  | 'CH4'
  | 'CH5_WALK'
  | 'EXPLORATION'
  | 'COMBAT'
  | 'HIDDEN';

export interface VirtualControlsOptions {
  mode?: TouchControlMode;
  onAction?: () => void;
  onPunch?: () => void;
  onDodge?: () => void;
  onSlingDown?: () => void;
  onSlingUp?: () => void;
  onJump?: () => void;
  onBagToggle?: () => void;
}

export class VirtualTouchControls {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private mode: TouchControlMode;
  private options: VirtualControlsOptions;

  // Touch states
  private leftDown = false;
  private rightDown = false;
  private crawlDown = false;
  private jumpDown = false;
  private actionDown = false;
  private punchDown = false;
  private dodgeDown = false;
  private slingDown = false;

  // Buttons GameObjects
  private leftBtn!: Phaser.GameObjects.Container;
  private rightBtn!: Phaser.GameObjects.Container;
  private crawlBtn!: Phaser.GameObjects.Container;
  private jumpBtn!: Phaser.GameObjects.Container;
  private actionBtn!: Phaser.GameObjects.Container;
  private punchBtn!: Phaser.GameObjects.Container;
  private dodgeBtn!: Phaser.GameObjects.Container;
  private slingBtn!: Phaser.GameObjects.Container;
  private fullscreenBtn!: Phaser.GameObjects.Container;
  private allButtons: Phaser.GameObjects.Container[] = [];

  private isTouchDevice = false;
  private visible = false;

  constructor(scene: Phaser.Scene, options: VirtualControlsOptions = {}) {
    this.scene = scene;
    this.options = options;
    this.mode = options.mode || 'CH1';

    this.isTouchDevice = this.detectMobileOrTouch();
    this.container = this.scene.add.container(0, 0).setDepth(999).setScrollFactor(0);

    this.createControls();
    this.setMode(this.mode);

    // If in desktop view, completely disable and hide the controls!
    if (!this.isTouchDevice) {
      this.hideImmediate();
    } else {
      this.show();
    }

    const updateDeviceMode = () => {
      const isMobile = this.detectMobileOrTouch();
      if (isMobile) {
        this.isTouchDevice = true;
        if (!this.visible && this.mode !== 'HIDDEN') {
          this.show();
        }
      } else {
        this.isTouchDevice = false;
        if (this.visible) {
          this.hideImmediate();
        }
      }
    };

    window.addEventListener('resize', updateDeviceMode);
    window.addEventListener('touchstart', updateDeviceMode, { passive: true });
    window.addEventListener('mousemove', updateDeviceMode, { passive: true });

    this.scene.events.once('shutdown', () => {
      window.removeEventListener('resize', updateDeviceMode);
      window.removeEventListener('touchstart', updateDeviceMode);
      window.removeEventListener('mousemove', updateDeviceMode);
      this.destroy();
    });
  }

  public detectMobileOrTouch(): boolean {
    if (typeof window === 'undefined') return false;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    const isTouchOnly = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    const isTouchScreen = ('ontouchstart' in window || navigator.maxTouchPoints > 0) && window.innerWidth <= 1024;
    const forceTouch =
      typeof window.location !== 'undefined' &&
      window.location.search &&
      window.location.search.includes('touch=1');

    return Boolean(isMobileUA || isTouchOnly || isTouchScreen || forceTouch);
  }

  public show(): void {
    if (this.mode === 'HIDDEN' || !this.detectMobileOrTouch()) {
      this.hideImmediate();
      return;
    }
    this.visible = true;
    this.setMode(this.mode);
    this.enableAllButtons();

    this.scene.tweens.killTweensOf(this.container);
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 180,
      ease: 'Quad.Out'
    });
  }

  public hide(): void {
    this.visible = false;
    this.disableAllButtons();
    this.scene.tweens.killTweensOf(this.container);
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 180,
      ease: 'Quad.In',
      onComplete: () => {
        if (!this.visible) {
          this.container.setVisible(false);
          this.container.setActive(false);
        }
      }
    });
  }

  private hideImmediate(): void {
    this.visible = false;
    this.disableAllButtons();
    this.container.setAlpha(0);
    this.container.setVisible(false);
    this.container.setActive(false);
  }

  private enableAllButtons(): void {
    for (const btn of this.allButtons) {
      if (btn.input && btn.visible) {
        btn.input.enabled = true;
      }
    }
  }

  private disableAllButtons(): void {
    for (const btn of this.allButtons) {
      if (btn.input) {
        btn.input.enabled = false;
      }
    }
  }

  private setBtnVisible(btn: Phaser.GameObjects.Container, visible: boolean): void {
    if (!btn) return;
    btn.setVisible(visible);
    if (btn.input) {
      btn.input.enabled = visible && this.visible;
    }
  }

  public setMode(mode: TouchControlMode): void {
    this.mode = mode;
    if (mode === 'HIDDEN' || !this.visible) {
      this.container.setVisible(false);
      this.container.setActive(false);
      this.disableAllButtons();
      return;
    }
    this.container.setVisible(true);
    this.container.setActive(true);

    const isCh1 = mode === 'CH1' || mode === 'EXPLORATION';
    const isCh2 = mode === 'CH2';
    const isCh3 = mode === 'CH3';
    const isCh4 = mode === 'CH4' || mode === 'COMBAT';
    const isCh5Walk = mode === 'CH5_WALK';

    // 1. Locomotion: Left (◀) and Right (▶) are active across all gameplay modes
    const hasWalk = isCh1 || isCh2 || isCh3 || isCh4 || isCh5Walk;
    this.setBtnVisible(this.leftBtn, hasWalk);
    this.setBtnVisible(this.rightBtn, hasWalk);

    // 2. Vertical Movement: Jump (▲) and Prone Crawl (▼)
    // Present in Chapter 1, 2, 3, 4. In Chapter 5 walk: hidden.
    const hasJump = isCh1 || isCh2 || isCh3 || isCh4;
    const hasCrawl = isCh1 || isCh2 || isCh3 || isCh4;
    this.setBtnVisible(this.jumpBtn, hasJump);
    this.setBtnVisible(this.crawlBtn, hasCrawl);

    // 3. Mouth / Exploration Action (👄 / E):
    // Enabled in Chapter 1, Chapter 2, and Chapter 3 for diegetic grabs and proximity interaction
    const hasAction = isCh1 || isCh2 || isCh3;
    this.setBtnVisible(this.actionBtn, hasAction);

    // 4. Fight Buttons (👊 Punch, 🏹 Slingshot, ⚡ Dodge):
    // ONLY in Chapter 4 Combat! NEVER in any other chapter!
    const isCombat = isCh4;
    this.setBtnVisible(this.punchBtn, isCombat);
    this.setBtnVisible(this.dodgeBtn, isCombat);
    this.setBtnVisible(this.slingBtn, isCombat);

    // 5. Fullscreen toggle button: always available in active modes
    this.setBtnVisible(this.fullscreenBtn, true);
  }

  private createControls(): void {
    this.allButtons = [];

    // =========================================================================
    // 1. Left Thumb Zone: Movement Cluster
    // Left at x: 80, y: 620; Right at x: 190, y: 620; Crawl at x: 135, y: 668
    // =========================================================================
    this.leftBtn = this.createButton({
      x: 80,
      y: 620,
      radius: 38,
      glyph: '◀',
      code: 'KeyA',
      key: 'a',
      onPress: () => {
        this.leftDown = true;
        this.dispatchKey('keydown', 'a', 'KeyA');
      },
      onRelease: () => {
        this.leftDown = false;
        this.dispatchKey('keyup', 'a', 'KeyA');
      }
    });

    this.rightBtn = this.createButton({
      x: 190,
      y: 620,
      radius: 38,
      glyph: '▶',
      code: 'KeyD',
      key: 'd',
      onPress: () => {
        this.rightDown = true;
        this.dispatchKey('keydown', 'd', 'KeyD');
      },
      onRelease: () => {
        this.rightDown = false;
        this.dispatchKey('keyup', 'd', 'KeyD');
      }
    });

    this.crawlBtn = this.createButton({
      x: 135,
      y: 668,
      radius: 30,
      glyph: '▼',
      code: 'KeyS',
      key: 's',
      onPress: () => {
        this.crawlDown = true;
        this.dispatchKey('keydown', 's', 'KeyS');
      },
      onRelease: () => {
        this.crawlDown = false;
        this.dispatchKey('keyup', 's', 'KeyS');
      }
    });

    // =========================================================================
    // 2. Right Thumb Zone: Jump & Action
    // Jump: x: 1195, y: 590, radius: 44
    // Mouth / Interact: x: 1090, y: 625, radius: 36
    // =========================================================================
    this.jumpBtn = this.createButton({
      x: 1195,
      y: 590,
      radius: 44,
      glyph: '▲',
      code: 'Space',
      key: ' ',
      onPress: () => {
        this.jumpDown = true;
        this.dispatchKey('keydown', ' ', 'Space');
        this.dispatchKey('keydown', 'w', 'KeyW');
        this.options.onJump?.();
      },
      onRelease: () => {
        this.jumpDown = false;
        this.dispatchKey('keyup', ' ', 'Space');
        this.dispatchKey('keyup', 'w', 'KeyW');
      }
    });

    this.actionBtn = this.createButton({
      x: 1090,
      y: 625,
      radius: 36,
      glyph: '👄',
      code: 'KeyE',
      key: 'e',
      onPress: () => {
        this.actionDown = true;
        this.dispatchKey('keydown', 'e', 'KeyE');
        this.options.onAction?.();
      },
      onRelease: () => {
        this.actionDown = false;
        this.dispatchKey('keyup', 'e', 'KeyE');
      }
    });

    // =========================================================================
    // 3. Combat Action Cluster (ONLY for Chapter 4 Arena)
    // Punch (J): x: 1090, y: 625, radius: 36
    // Slingshot (K/Q, hold to charge, release to shoot): x: 1195, y: 480, radius: 38
    // Dodge (L): x: 995, y: 635, radius: 32
    // =========================================================================
    this.punchBtn = this.createButton({
      x: 1090,
      y: 625,
      radius: 36,
      glyph: '👊',
      code: 'KeyJ',
      key: 'j',
      onPress: () => {
        this.punchDown = true;
        this.dispatchKey('keydown', 'j', 'KeyJ');
        this.options.onPunch?.();
      },
      onRelease: () => {
        this.punchDown = false;
        this.dispatchKey('keyup', 'j', 'KeyJ');
      }
    });

    this.slingBtn = this.createButton({
      x: 1195,
      y: 480,
      radius: 38,
      glyph: '🏹',
      code: 'KeyK',
      key: 'k',
      onPress: () => {
        this.slingDown = true;
        this.dispatchKey('keydown', 'k', 'KeyK');
        this.dispatchKey('keydown', 'q', 'KeyQ');
        this.options.onSlingDown?.();
      },
      onRelease: () => {
        this.slingDown = false;
        this.dispatchKey('keyup', 'k', 'KeyK');
        this.dispatchKey('keyup', 'q', 'KeyQ');
        this.options.onSlingUp?.();
      }
    });

    this.dodgeBtn = this.createButton({
      x: 995,
      y: 635,
      radius: 32,
      glyph: '⚡',
      code: 'KeyL',
      key: 'l',
      onPress: () => {
        this.dodgeDown = true;
        this.dispatchKey('keydown', 'l', 'KeyL');
        this.options.onDodge?.();
      },
      onRelease: () => {
        this.dodgeDown = false;
        this.dispatchKey('keyup', 'l', 'KeyL');
      }
    });

    // =========================================================================
    // 4. Utility Bar: Fullscreen Toggle (Top-right corner, x: 1240, y: 38)
    // =========================================================================
    this.fullscreenBtn = this.createButton({
      x: 1240,
      y: 38,
      radius: 20,
      glyph: '⛶',
      code: '',
      key: '',
      onPress: () => {
        this.toggleFullscreen();
      },
      onRelease: () => {}
    });

    this.container.add(this.allButtons);
  }

  private createButton(config: {
    x: number;
    y: number;
    radius: number;
    glyph: string;
    code: string;
    key: string;
    onPress: () => void;
    onRelease: () => void;
  }): Phaser.GameObjects.Container {
    const btn = this.scene.add.container(config.x, config.y);
    const r = config.radius;

    // 3-Layer Procedural Vector Inking
    const g = this.scene.add.graphics();

    const drawGraphics = (pressed: boolean) => {
      g.clear();
      // Outer ink border (0x182720)
      g.lineStyle(2.5, 0x182720, pressed ? 0.95 : 0.7);
      // Dark translucent glassmorphic body
      g.fillStyle(pressed ? 0xb45309 : 0x1c1815, pressed ? 0.75 : 0.45);
      g.fillCircle(0, 0, r);
      g.strokeCircle(0, 0, r);

      // Top cream bevel / highlight
      g.lineStyle(1.5, 0xe9dfbd, pressed ? 0.8 : 0.4);
      g.beginPath();
      g.arc(0, 0, r - 2, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(340), false);
      g.strokePath();

      // Bottom subtle shadow
      g.lineStyle(1.5, 0x0c0a08, pressed ? 0.8 : 0.5);
      g.beginPath();
      g.arc(0, 0, r - 2, Phaser.Math.DegToRad(20), Phaser.Math.DegToRad(160), false);
      g.strokePath();
    };

    drawGraphics(false);
    btn.add(g);

    // Text glyph (clean unicode, font-black style)
    const fontSize = r > 32 ? (config.glyph.length > 1 ? 20 : 24) : 17;
    const txt = this.scene.add
      .text(0, 0, config.glyph, {
        fontFamily: 'Noto Sans Myanmar, "Plus Jakarta Sans", system-ui, sans-serif',
        fontSize: `${fontSize}px`,
        color: '#f8f3e7',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    btn.add(txt);

    // Hit area (extended for comfortable finger touch)
    const hitRadius = Math.max(r, 26);
    const circle = new Phaser.Geom.Circle(0, 0, hitRadius);
    btn.setInteractive(circle, Phaser.Geom.Circle.Contains);
    if (btn.input) {
      btn.input.cursor = 'pointer';
    }

    let isDown = false;

    btn.on('pointerdown', () => {
      isDown = true;
      drawGraphics(true);
      btn.setScale(0.92);
      config.onPress();
    });

    const release = () => {
      if (!isDown) return;
      isDown = false;
      drawGraphics(false);
      btn.setScale(1.0);
      config.onRelease();
    };

    btn.on('pointerup', release);
    btn.on('pointerout', release);

    this.allButtons.push(btn);
    return btn;
  }

  private dispatchKey(type: 'keydown' | 'keyup', key: string, code: string): void {
    if (typeof window === 'undefined') return;
    try {
      const event = new KeyboardEvent(type, {
        key,
        code,
        bubbles: true,
        cancelable: true
      });
      window.dispatchEvent(event);
    } catch {}
  }

  private toggleFullscreen(): void {
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  // Getters for direct scene state polling
  public isLeft(): boolean { return this.leftDown; }
  public isRight(): boolean { return this.rightDown; }
  public isCrawl(): boolean { return this.crawlDown; }
  public isJump(): boolean { return this.jumpDown; }
  public isAction(): boolean { return this.actionDown; }
  public isPunch(): boolean { return this.punchDown; }
  public isDodge(): boolean { return this.dodgeDown; }
  public isSling(): boolean { return this.slingDown; }

  public destroy(): void {
    this.disableAllButtons();
    this.container.destroy();
  }
}
