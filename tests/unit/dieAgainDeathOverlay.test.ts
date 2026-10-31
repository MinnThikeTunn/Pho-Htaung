import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { toBurmeseNumeral } from '../../src/utils/toBurmeseNumeral';
import { DieAgainDeathOverlay, DEATH_ROASTS, getChapterDisplayName } from '../../src/ui/DieAgainDeathOverlay';
import { store } from '../../src/services/adventure';

describe('toBurmeseNumeral', () => {
  it('converts basic numbers to Burmese Unicode digits', () => {
    expect(toBurmeseNumeral(0)).toBe('၀');
    expect(toBurmeseNumeral(1)).toBe('၁');
    expect(toBurmeseNumeral(5)).toBe('၅');
    expect(toBurmeseNumeral(9)).toBe('၉');
    expect(toBurmeseNumeral(10)).toBe('၁၀');
    expect(toBurmeseNumeral(42)).toBe('၄၂');
    expect(toBurmeseNumeral(2026)).toBe('၂၀၂၆');
  });

  it('safely handles null and undefined by returning zero digit', () => {
    expect(toBurmeseNumeral(null)).toBe('၀');
    expect(toBurmeseNumeral(undefined)).toBe('၀');
  });

  it('preserves non-digit characters', () => {
    expect(toBurmeseNumeral('15/20')).toBe('၁၅/၂၀');
    expect(toBurmeseNumeral('+3')).toBe('+၃');
  });
});

describe('getChapterDisplayName', () => {
  it('correctly maps all 5 chapter scenes to Burmese & English titles', () => {
    expect(getChapterDisplayName('Chapter1Scene').my).toContain('အခန်း ၁');
    expect(getChapterDisplayName('CHAPTER_2').my).toContain('အခန်း ၂');
    expect(getChapterDisplayName('CHAPTER_3').my).toContain('အခန်း ၃');
    expect(getChapterDisplayName('CHAPTER_4').my).toContain('အခန်း ၄');
    expect(getChapterDisplayName('CHAPTER_5').my).toContain('အခန်း ၅');
  });
});

describe('DieAgainDeathOverlay Comic Roasts', () => {
  it('contains comprehensive comedic roasts for all failure modes across Chapters 1-5', () => {
    const requiredModes = [
      'PIT',
      'SKY_BLOCK',
      'FALLING_BRICK',
      'BEE_STUNG',
      'WINCH_CATAPULT',
      'CRUSH',
      'STONE',
      'BOMB',
      'BOMB_COIN',
      'PENDULUM',
      'SCALE_PIT',
      'HEALTH',
      'GREED_TRAP',
      'TIME',
      'QUIZ',
      'STRIKE',
      'CH5',
      'DEFAULT'
    ];

    for (const mode of requiredModes) {
      expect(DEATH_ROASTS[mode]).toBeDefined();
      expect(typeof DEATH_ROASTS[mode]).toBe('string');
      expect(DEATH_ROASTS[mode]!.length).toBeGreaterThan(10);
    }
  });
});

describe('DieAgainDeathOverlay Lifecycle & Callbacks', () => {
  let mockScene: any;
  let mockContainer: any;
  let createdElements: any[] = [];
  let windowListeners: Record<string, Function[]> = {};

  beforeEach(() => {
    createdElements = [];
    windowListeners = {};

    const createMockElement = (tag: string) => {
      const listeners: Record<string, Function[]> = {};
      const el: any = {
        tagName: tag.toUpperCase(),
        className: '',
        id: '',
        innerHTML: '',
        textContent: '',
        hidden: false,
        appendChild: vi.fn((child: any) => {
          createdElements.push(child);
          return child;
        }),
        remove: vi.fn(() => {
          const idx = createdElements.indexOf(el);
          if (idx !== -1) createdElements.splice(idx, 1);
        }),
        querySelector: vi.fn((selector: string) => {
          if (selector === '#die-again-retry') return retryBtn;
          if (selector === '#die-again-menu') return menuBtn;
          return null;
        }),
        addEventListener: vi.fn((evt: string, cb: Function) => {
          if (!listeners[evt]) listeners[evt] = [];
          listeners[evt].push(cb);
        }),
        click: vi.fn(() => {
          listeners['click']?.forEach(fn => fn({ stopPropagation: vi.fn() }));
        })
      };
      return el;
    };

    const retryBtn = createMockElement('button');
    retryBtn.id = 'die-again-retry';
    const menuBtn = createMockElement('button');
    menuBtn.id = 'die-again-menu';

    mockContainer = createMockElement('div');
    mockContainer.id = 'interface';

    (globalThis as any).document = {
      createElement: vi.fn((tag: string) => createMockElement(tag)),
      querySelector: vi.fn((sel: string) => {
        if (sel === '#interface') return mockContainer;
        return null;
      }),
      body: mockContainer
    };

    (globalThis as any).window = {
      addEventListener: vi.fn((evt: string, cb: Function) => {
        if (!windowListeners[evt]) windowListeners[evt] = [];
        windowListeners[evt].push(cb);
      }),
      removeEventListener: vi.fn((evt: string, cb: Function) => {
        if (windowListeners[evt]) {
          windowListeners[evt] = windowListeners[evt].filter(fn => fn !== cb);
        }
      }),
      setTimeout: (fn: Function, ms: number) => setTimeout(fn, ms),
      clearTimeout: (id: any) => clearTimeout(id)
    };

    store.campaign.deathCount = 7;

    const eventListeners: Record<string, Function[]> = {};
    mockScene = {
      scene: {
        key: 'CHAPTER_2',
        start: vi.fn(),
        restart: vi.fn(),
      },
      events: {
        once: (event: string, fn: Function) => {
          if (!eventListeners[event]) eventListeners[event] = [];
          eventListeners[event].push(fn);
        },
        emit: (event: string) => {
          eventListeners[event]?.forEach(fn => fn());
        }
      }
    };
  });

  afterEach(() => {
    DieAgainDeathOverlay.hideActive();
    delete (globalThis as any).document;
    delete (globalThis as any).window;
    vi.restoreAllMocks();
  });

  it('renders card with death count badge in Burmese numerals', () => {
    DieAgainDeathOverlay.show({
      scene: mockScene,
      reason: 'CRUSH',
      onRetry: () => {},
      targetContainer: mockContainer,
    });

    expect(createdElements.length).toBeGreaterThan(0);
    const cardEl = createdElements[0];
    expect(cardEl.className).toBe('die-again-overlay');
    expect(cardEl.innerHTML).toContain('💀 အသက်ပျောက်သွားပါပြီ!');
    expect(cardEl.innerHTML).toContain('အခန်း ၂');
    expect(cardEl.innerHTML).toContain('TOTAL DEATHS: 7');
    expect(cardEl.innerHTML).toContain('၇');
    expect(cardEl.innerHTML).toContain(DEATH_ROASTS.CRUSH);
  });

  it('triggers onRetry callback upon clicking retry button', () => {
    const onRetrySpy = vi.fn();
    DieAgainDeathOverlay.show({
      scene: mockScene,
      reason: 'PIT',
      onRetry: onRetrySpy,
      targetContainer: mockContainer,
    });

    const overlayEl = createdElements[0];
    const retryBtn = overlayEl.querySelector('#die-again-retry');
    expect(retryBtn).toBeDefined();

    retryBtn.click();
    expect(onRetrySpy).toHaveBeenCalledTimes(1);
  });

  it('triggers onRetry via keyboard shortcuts (R, Space, Enter)', () => {
    const onRetrySpy = vi.fn();
    DieAgainDeathOverlay.show({
      scene: mockScene,
      reason: 'PENDULUM',
      onRetry: onRetrySpy,
      targetContainer: mockContainer,
    });

    const keydownCbs = windowListeners['keydown'];
    expect(keydownCbs).toBeDefined();
    expect(keydownCbs?.length).toBeGreaterThan(0);

    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();
    keydownCbs![0]!({ key: 'r', preventDefault, stopPropagation });

    expect(onRetrySpy).toHaveBeenCalledTimes(1);
    expect(preventDefault).toHaveBeenCalled();
  });

  it('triggers onMenu callback upon clicking menu button', () => {
    const onMenuSpy = vi.fn();
    DieAgainDeathOverlay.show({
      scene: mockScene,
      reason: 'HEALTH',
      onRetry: () => {},
      onMenu: onMenuSpy,
      targetContainer: mockContainer,
    });

    const overlayEl = createdElements[0];
    const menuBtn = overlayEl.querySelector('#die-again-menu');
    expect(menuBtn).toBeDefined();

    menuBtn.click();
    expect(onMenuSpy).toHaveBeenCalledTimes(1);
  });

  it('automatically triggers onRetry when autoRetrySeconds elapses', () => {
    vi.useFakeTimers();
    const onRetrySpy = vi.fn();

    DieAgainDeathOverlay.show({
      scene: mockScene,
      reason: 'BOMB',
      autoRetrySeconds: 2.5,
      onRetry: onRetrySpy,
      targetContainer: mockContainer,
    });

    expect(onRetrySpy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2500);
    expect(onRetrySpy).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('cleans up DOM and listeners when scene shuts down', () => {
    DieAgainDeathOverlay.show({
      scene: mockScene,
      reason: 'SKY_BLOCK',
      onRetry: () => {},
      targetContainer: mockContainer,
    });

    expect(createdElements.length).toBe(1);
    mockScene.events.emit('shutdown');
    expect(createdElements.length).toBe(0);
  });
});
