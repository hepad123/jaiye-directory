import { createClerkClient } from '@clerk/backend'
import type { Request, Response, NextFunction } from 'express'

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! })

// Augment Express Request type
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}

/**
 * Express middleware that verifies the Clerk Bearer token.
 * Attaches req.userId on success, responds 401 on failure.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    const payload = await clerk.verifyToken(token)
    req.userId = payload.sub
    next()
  } catch {
    res.status(401).json({ error: 'Unauthorized' })
  }
}
