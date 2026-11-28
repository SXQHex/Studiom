import type { ReactNode } from "react"
import { renderToString } from "react-dom/server"
import { describe, expect, test } from "vitest"

import { Select, SelectItem, SelectList, SelectValue } from "./select"

/** The text the select value shows in a server render. */
function shown(value: ReactNode, selected: string[] = []) {
  const html = renderToString(
    <Select
      aria-label="Salon"
      placeholder="Salon seçin"
      selectionMode="multiple"
      defaultValue={selected}
    >
      {value}
      <SelectList>
        <SelectItem id="a">Salon A</SelectItem>
        <SelectItem id="b">Salon B</SelectItem>
      </SelectList>
    </Select>
  )
  const start = html.indexOf('data-slot="select-value"')
  const end = html.indexOf("</span>", start)
  return html.slice(html.indexOf(">", start) + 1, end)
}

describe("SelectValue", () => {
  test("keeps static children, with or without a selection", () => {
    expect(shown(<SelectValue>Özel etiket</SelectValue>)).toBe("Özel etiket")
    expect(shown(<SelectValue>Özel etiket</SelectValue>, ["a"])).toBe(
      "Özel etiket"
    )
  })

  test("renders function children", () => {
    expect(shown(<SelectValue>{() => "Fonksiyondan"}</SelectValue>)).toBe(
      "Fonksiyondan"
    )
  })

  test("without children shows the placeholder, then the selection", () => {
    expect(shown(<SelectValue />)).toBe("Salon seçin")
    expect(shown(<SelectValue />, ["a", "b"])).toContain("Salon B")
  })
})
