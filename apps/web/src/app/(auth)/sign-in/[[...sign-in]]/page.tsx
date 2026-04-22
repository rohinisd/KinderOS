import { SignIn } from '@clerk/nextjs'

function safeAppPath(url: string | string[] | undefined): string | undefined {
  if (!url || Array.isArray(url)) return undefined
  if (!url.startsWith('/') || url.startsWith('//')) return undefined
  return url
}

type Props = { searchParams: Promise<{ redirect_url?: string }> }

export default async function SignInPage({ searchParams }: Props) {
  const { redirect_url: raw } = await searchParams
  const afterSignIn = safeAppPath(raw)

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <SignIn
        forceRedirectUrl={afterSignIn}
        fallbackRedirectUrl={afterSignIn}
      />
    </div>
  )
}
