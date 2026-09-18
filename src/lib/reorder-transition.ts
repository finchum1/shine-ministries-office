// Shared Motion transition for any drag-reorderable grid (Roles, Small
// Groups) so a card animates to its new position instead of snapping there.
// A tween with a smooth deceleration curve, not a spring: with live reorder
// re-triggering this on every pointermove during a drag, a spring has to
// keep re-settling mid-bounce and reads as laggy/floaty. A short, fixed-
// duration tween interrupts cleanly and always finishes at the same pace.
export const REORDER_TRANSITION = { duration: 0.25, ease: [0.22, 1, 0.36, 1] } as const;

// Two cards animate past each other while a swap is sliding into place, so
// hit-testing the pointer's position with elementFromPoint during that
// window can land on either card as they cross -- which fires another swap
// immediately, which the pointer is still over the crossing point for, which
// fires another... a same-spot ping-pong that looks like frantic switching.
// Gating new swaps to once per animation (rather than once per pointermove)
// lets each slide finish and the layout go still before the next hit test,
// which is what actually stops the thrashing.
export const REORDER_SWAP_COOLDOWN_MS = REORDER_TRANSITION.duration * 1000;
