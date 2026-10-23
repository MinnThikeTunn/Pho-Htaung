/** Phaser 3's XML declaration mentions IE's removed COM type. This game never
 * invokes that fallback; keep full library checking without installing IE APIs. */
interface ActiveXObject { readonly __unsupportedLegacyCOM?: never }
