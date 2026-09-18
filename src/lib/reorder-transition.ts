// Shared Motion transition for any drag-reorderable grid (Roles, Small
// Groups) so a card animates to its new position instead of snapping there.
// A tween with a smooth deceleration curve, not a spring: with live reorder
// re-triggering this on every pointermove during a drag, a spring has to
// keep re-settling mid-bounce and reads as laggy/floaty. A short, fixed-
// duration tween interrupts cleanly and always finishes at the same pace.
export const REORDER_TRANSITION = { duration: 0.25, ease: [0.22, 1, 0.36, 1] } as const;
