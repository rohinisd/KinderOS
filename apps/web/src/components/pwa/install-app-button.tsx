'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

function isRunningStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const iosStandalone = typeof (window.navigator as { standalone?: boolean }).standalone === 'boolean'
    ? Boolean((window.navigator as { standalone?: boolean }).standalone)
    : false
  return window.matchMedia('(display-mode: standalone)').matches || iosStandalone
}

function isIosSafari(): boolean {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent.toLowerCase()
  const isIos = /iphone|ipad|ipod/.test(ua)
  const isSafari = /safari/.test(ua) && !/crios|fxios|edgios/.test(ua)
  return isIos && isSafari
}

export function InstallAppButton() {
  const [mounted, setMounted] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    setMounted(true)
    setIsStandalone(isRunningStandalone())

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    const onInstalled = () => {
      setDeferredPrompt(null)
      setIsStandalone(true)
      toast.success('SchoolOS installed successfully')
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const showButton = useMemo(() => {
    if (!mounted || isStandalone) return false
    return Boolean(deferredPrompt) || isIosSafari()
  }, [mounted, isStandalone, deferredPrompt])

  async function onInstallClick() {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice.outcome === 'accepted') {
        toast.success('Install started')
      } else {
        toast.message('Install dismissed')
      }
      setDeferredPrompt(null)
      return
    }

    if (isIosSafari()) {
      toast.message('To install on iPhone: Share -> Add to Home Screen')
    }
  }

  if (!showButton) return null

  return (
    <Button type="button" variant="outline" size="sm" onClick={onInstallClick} className="h-9">
      <Download className="mr-2 h-4 w-4" />
      Install App
    </Button>
  )
}
