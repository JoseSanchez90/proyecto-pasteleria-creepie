// Utility function to trigger cart update event
export function triggerCartUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cartUpdated"));
  }
}
