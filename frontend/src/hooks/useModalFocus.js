import { useEffect, useRef } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const visible = (el) => el.getClientRects().length > 0

/**
 * Dialog focus management: on mount, moves focus inside the container (unless
 * something inside — e.g. an autoFocus input — already has it), keeps Tab
 * cycling within it, and returns focus to the previously focused element on
 * unmount. Attach the returned ref to the dialog's outermost element, which
 * should also carry role="dialog" and aria-modal="true".
 */
export function useModalFocus() {
  const ref = useRef(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const previouslyFocused = document.activeElement

    if (!node.contains(document.activeElement)) {
      const first = Array.from(node.querySelectorAll(FOCUSABLE)).find(visible)
      ;(first || node).focus()
    }

    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return
      const items = Array.from(node.querySelectorAll(FOCUSABLE)).filter(visible)
      if (items.length === 0) { e.preventDefault(); return }
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && (document.activeElement === first || !node.contains(document.activeElement))) {
        e.preventDefault(); last.focus()
      } else if (!e.shiftKey && (document.activeElement === last || !node.contains(document.activeElement))) {
        e.preventDefault(); first.focus()
      }
    }
    node.addEventListener('keydown', onKeyDown)
    return () => {
      node.removeEventListener('keydown', onKeyDown)
      previouslyFocused?.focus?.()
    }
  }, [])

  return ref
}
