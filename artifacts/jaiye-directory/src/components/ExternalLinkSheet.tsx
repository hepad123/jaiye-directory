/**
 * ExternalLinkSheet — bottom sheet that intercepts all external link taps.
 * Usage:
 *   const { openLink } = useExternalLink()
 *   openLink(url, label, { icon: 'instagram', vendorName: 'K Mari' })
 */
import React, { createContext, useCallback, useContext, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Icon = 'instagram' | 'whatsapp' | 'web'

interface LinkMeta {
  icon?: Icon
  vendorName?: string
}

interface SheetState {
  url: string
  label: string
  meta: LinkMeta
}

interface ExternalLinkCtx {
  openLink: (url: string, label: string, meta?: LinkMeta) => void
}

const Ctx = createContext<ExternalLinkCtx>({ openLink: () => {} })

export function useExternalLink() {
  return useContext(Ctx)
}

function IconEl({ icon }: { icon?: Icon }) {
  if (icon === 'instagram') return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#B4690E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  )
  if (icon === 'whatsapp') return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#B4690E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
    </svg>
  )
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#B4690E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  )
}

function iconLabel(icon?: Icon) {
  if (icon === 'instagram') return 'Instagram'
  if (icon === 'whatsapp') return 'WhatsApp'
  return 'Website'
}

export function ExternalLinkProvider({ children }: { children: React.ReactNode }) {
  const [sheet, setSheet] = useState<SheetState | null>(null)

  const openLink = useCallback((url: string, label: string, meta: LinkMeta = {}) => {
    setSheet({ url, label, meta })
  }, [])

  const close = () => setSheet(null)
  const open  = () => { window.open(sheet!.url, '_blank', 'noopener,noreferrer'); close() }

  const font = "'Outfit', sans-serif"

  return (
    <Ctx.Provider value={{ openLink }}>
      {children}

      <AnimatePresence>
        {sheet && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={close}
              style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(26,22,18,0.55)', backdropFilter: 'blur(4px)' }}
            />

            {/* Bottom sheet */}
            <motion.div
              key="sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              style={{
                position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 9001,
                background: '#FDFAF6',
                borderTopLeftRadius: 20, borderTopRightRadius: 20,
                boxShadow: '0 -8px 40px rgba(26,22,18,0.18)',
                padding: '0 0 env(safe-area-inset-bottom, 16px)',
                maxWidth: 480, margin: '0 auto',
              }}
            >
              {/* Drag handle */}
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: '#E5DDD4' }} />
              </div>

              {/* Content */}
              <div style={{ padding: '16px 28px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>

                {/* Icon circle */}
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(180,105,14,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconEl icon={sheet.meta.icon} />
                </div>

                {/* Text */}
                <div>
                  {sheet.meta.vendorName && (
                    <div style={{ fontFamily: font, fontSize: 13, color: '#9C8C7E', marginBottom: 4 }}>
                      {sheet.meta.vendorName}
                    </div>
                  )}
                  <div style={{ fontFamily: font, fontSize: 17, fontWeight: 700, color: '#1A1612', marginBottom: 4 }}>
                    {iconLabel(sheet.meta.icon)}
                  </div>
                  <div style={{ fontFamily: font, fontSize: 12, color: '#9C8C7E', wordBreak: 'break-all' }}>
                    {sheet.label}
                  </div>
                </div>

                {/* Disclaimer */}
                <div style={{ fontFamily: font, fontSize: 11, color: '#B4A898', lineHeight: 1.5 }}>
                  You're leaving Jaiyé — tap Open to continue in a new tab.
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginTop: 4 }}>
                  <button
                    onClick={open}
                    style={{ width: '100%', padding: '14px 0', borderRadius: 12, background: '#B4690E', border: 'none', color: '#FFFFFF', fontFamily: font, fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', cursor: 'pointer' }}
                  >
                    Open {iconLabel(sheet.meta.icon)}
                  </button>
                  <button
                    onClick={close}
                    style={{ width: '100%', padding: '13px 0', borderRadius: 12, background: 'rgba(26,22,18,0.06)', border: 'none', color: '#6B6359', fontFamily: font, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  )
}
