import { systemHealth } from "@workspace/contracts/system"
import { http, HttpResponse } from "msw"

export const handlers = [
  http.post(`*${systemHealth.path}`, () =>
    HttpResponse.json(systemHealth.response.parse({ status: "ok" }))
  ),
]
