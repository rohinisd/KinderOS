'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  const [helpOpen, setHelpOpen] = useState(false)

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
    return true
  }, [mounted, isStandalone])

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
      setHelpOpen(true)
      return
    }

    setHelpOpen(true)
  }

  if (!showButton) return null

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={onInstallClick} className="h-9">
        <Download className="mr-2 h-4 w-4" />
        Install App
      </Button>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Install SchoolOS</DialogTitle>
            <DialogDescription>
              Browser install popup can be hidden. Use these manual steps.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            {isIosSafari() ? (
              <ol className="list-decimal space-y-1.5 pl-5">
                <li>Open Safari share menu.</li>
                <li>Select <strong>Add to Home Screen</strong>.</li>
                <li>Tap <strong>Add</strong>.</li>
              </ol>
            ) : (
              <ol className="list-decimal space-y-1.5 pl-5">
                <li>Open browser menu (three dots).</li>
                <li>
                  In Chrome, select <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                </li>
                <li>
                  In Edge, go to <strong>Apps</strong> and select <strong>Install this site as an app</strong>.
                </li>
                <li>
                  If install option is still missing, choose <strong>Create shortcut</strong> and enable
                  <strong> Open as window</strong> for app-like mode.
                </li>
              </ol>
            )}
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setHelpOpen(false)}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
