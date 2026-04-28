import Link from 'next/link'
import { InstallAppButton } from '@/components/pwa/install-app-button'
import {
  GraduationCap,
  Users,
  IndianRupee,
  Megaphone,
  Shield,
  Smartphone,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'

const FEATURES = [
  {
    icon: Users,
    title: 'Students & classes',
    desc: 'Admissions, roll numbers, attendance, and parent links — built for Indian pre-primary and primary.',
  },
  {
    icon: IndianRupee,
    title: 'Fees & receipts',
    desc: 'Fee plans, GST-aware invoices, Razorpay online payments, and receipt tracking.',
  },
  {
    icon: Megaphone,
    title: 'Announcements & gallery',
    desc: 'Reach parents on multiple channels; showcase events with a public gallery.',
  },
  {
    icon: BookOpen,
    title: 'Classroom & progress',
    desc: 'Assignments, attendance, and AI-assisted progress reports for teachers.',
  },
  {
    icon: CalendarCheck,
    title: 'Admissions CRM',
    desc: 'Enquiry to admission pipeline with follow-ups and conversion tracking.',
  },
  {
    icon: Shield,
    title: 'Multi-tenant & secure',
    desc: 'Each school gets isolated data, roles for owner, staff, and parents — and a branded public site.',
  },
  {
    icon: Smartphone,
    title: 'Parent app ready',
    desc: 'Push notifications and parent portal flows so families stay in the loop.',
  },
  {
    icon: Sparkles,
    title: 'Your school website',
    desc: 'Custom landing page, USPs, and blog — map your own domain so families see your brand first.',
  },
]

export function PlatformMarketing() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">
              VP
            </div>
            <span className="text-lg font-bold text-slate-900">VidyaPrabandha</span>
          </div>
          <div className="flex items-center gap-3">
            <InstallAppButton />
            <Link
              href="/sign-in"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-4xl px-4 pb-16 pt-16 text-center sm:pt-20">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-xs font-medium text-brand-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Built for every school across India
        </div>
        <h1 className="text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
          Run your school like a <span className="text-brand-600">modern institution</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-500">
          VidyaPrabandha is the multi-tenant platform for fees, admissions, attendance, parent communication, and a
          beautiful public website for each school — all from one dashboard.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/sign-up"
            className="rounded-lg bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600"
          >
            Start with your school
          </Link>
          <Link
            href="/sign-in?redirect_url=/office/students"
            className="rounded-lg bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600"
          >
            Staff sign in
          </Link>
          <Link
            href="/sign-in?redirect_url=/parent"
            className="rounded-lg bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600"
          >
            Parent sign in
          </Link>
        </div>
        <p className="mx-auto mt-6 max-w-md text-xs text-slate-400">
          Staff access is invite-only. Your platform administrator creates your school and assigns the owner;
          the owner then invites teachers and office staff. Parents sign in with the email linked on their child profile.
        </p>
      </section>

      <section className="border-t border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold text-slate-900">Everything your school needs</h2>
            <p className="mt-2 text-sm text-slate-500">One platform — admissions to graduation readiness</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1.5 font-semibold text-slate-900">{f.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold text-slate-900">How it works</h2>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            {
              step: '1',
              title: 'Platform admin',
              desc: 'Your organisation is onboarded — one owner account per school, with a unique URL and optional custom domain.',
            },
            {
              step: '2',
              title: 'Customize & invite',
              desc: 'The owner sets branding, landing copy, and invites teachers and office staff. Parents are linked per child.',
            },
            {
              step: '3',
              title: 'Run daily operations',
              desc: 'Fees, attendance, announcements, and admissions — with a public site families can trust.',
            },
          ].map((s) => (
            <div key={s.step} className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-lg font-bold text-white">
                {s.step}
              </div>
              <h3 className="mb-2 font-semibold text-slate-900">{s.title}</h3>
              <p className="text-sm text-slate-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-100 bg-brand-600">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <GraduationCap className="mx-auto mb-4 h-10 w-10 text-white/90" />
          <h2 className="mb-3 text-2xl font-bold text-white">Ready to digitise your School?</h2>
          <p className="mb-8 text-brand-100">Talk to your platform admin to provision a school, or sign in if you already have access.</p>
          <Link
            href="/sign-in"
            className="inline-block rounded-lg bg-white px-8 py-3 text-sm font-semibold text-brand-700 shadow-sm transition-colors hover:bg-brand-50"
          >
            Sign in to VidyaPrabandha
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-brand-500 text-xs font-bold text-white">
              VP
            </div>
            <span className="font-medium text-slate-700">VidyaPrabandha</span>
          </div>
          <p className="text-xs text-slate-400">&copy; {new Date().getFullYear()} VidyaPrabandha. School management for India.</p>
        </div>
      </footer>
    </div>
  )
}
