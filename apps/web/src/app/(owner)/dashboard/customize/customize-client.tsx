'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Palette, Save, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { updateSchoolSettings } from '@/actions/settings'

type SchoolBrand = {
  id: string
  name: string
  slug: string
  brandColor: string
  accentColor: string
  logoUrl: string | null
  heroImageUrl: string | null
  pageConfig: unknown
}

export function CustomizeClient({ school }: { school: SchoolBrand }) {
  const [isPending, startTransition] = useTransition()

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await updateSchoolSettings({
        brandColor: form.get('brandColor') as string,
        accentColor: form.get('accentColor') as string,
      })
      if (result.success) toast.success('Branding updated')
      else toast.error(result.error)
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4" /> Brand Colors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="brandColor">Primary Brand Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="brandColor"
                    name="brandColor"
                    defaultValue={school.brandColor}
                    className="h-10 w-14 cursor-pointer rounded border"
                  />
                  <Input
                    defaultValue={school.brandColor}
                    className="max-w-[120px] font-mono"
                    readOnly
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Used for sidebar, buttons, and key elements
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accentColor">Accent Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="accentColor"
                    name="accentColor"
                    defaultValue={school.accentColor}
                    className="h-10 w-14 cursor-pointer rounded border"
                  />
                  <Input
                    defaultValue={school.accentColor}
                    className="max-w-[120px] font-mono"
                    readOnly
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Used for highlights and secondary elements
                </p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="mb-3 font-semibold">Preview</h3>
              <div className="rounded-lg border p-6">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white"
                    style={{ backgroundColor: school.brandColor }}
                  >
                    {school.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: school.brandColor }}>
                      {school.name}
                    </p>
                    <p className="text-xs text-muted-foreground">Your school&apos;s branding</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <div
                    className="rounded px-4 py-2 text-sm text-white"
                    style={{ backgroundColor: school.brandColor }}
                  >
                    Primary Button
                  </div>
                  <div
                    className="rounded px-4 py-2 text-sm text-white"
                    style={{ backgroundColor: school.accentColor }}
                  >
                    Accent Button
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <a
                href={`/${school.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View public page
              </a>
              <Button type="submit" disabled={isPending}>
                <Save className="mr-2 h-4 w-4" />
                {isPending ? 'Saving...' : 'Save Branding'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
