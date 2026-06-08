import { useEffect } from 'react'

export function useBodyLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    const prev = document.body.style.cssText
    const scrollY = window.scrollY
    // iOS requires position:fixed to truly stop scroll behind modal
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.cssText = prev
      window.scrollTo(0, scrollY)
    }
  }, [locked])
}
