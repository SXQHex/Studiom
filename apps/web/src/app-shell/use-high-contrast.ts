import { useState } from "react"

const key = "studiom.contrast"

function stored(): boolean {
  try {
    return localStorage.getItem(key) === "high"
  } catch {
    return false
  }
}

function apply(high: boolean) {
  if (high) document.documentElement.dataset["contrast"] = "high"
  else delete document.documentElement.dataset["contrast"]
}

/** Applies the saved choice before the first paint of the app. */
export function restoreContrast() {
  apply(stored())
}

export function useHighContrast() {
  const [high, setHigh] = useState(stored)

  function change(next: boolean) {
    setHigh(next)
    apply(next)
    try {
      localStorage.setItem(key, next ? "high" : "normal")
    } catch {
      // Without storage the choice lasts until the next reload.
    }
  }

  return [high, change] as const
}
