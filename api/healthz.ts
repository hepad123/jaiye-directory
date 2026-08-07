import { json } from './_utils'

export default function handler(req: any, res: any) {
  json(res, 200, { status: 'ok', ts: Date.now() })
}
