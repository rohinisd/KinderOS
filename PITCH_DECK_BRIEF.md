# VidyaPrabandha (KinderOS) — Pitch Brief for NotebookLM

> A complete, NotebookLM-ready document. Drop this whole file in as a source and ask it to generate a pitch deck. Each "Slide" section below maps cleanly to one PPT slide. Speaker notes are written in plain prose so the LLM can lift them into the notes pane.

---

## 0. One-liner

**VidyaPrabandha (codename KinderOS)** is a multi-tenant, white-label school management SaaS built for India's pre-primary and primary schools. Each school gets its own branded portal, public website, parent app, fee collection, attendance, payroll, admissions CRM, and AI-assisted progress reports — all from a single dashboard, in under 30 minutes, for less than ₹6,000/month.

---

## 1. The Problem We're Solving

Most independent and pre-primary schools in India still run on:

- **WhatsApp groups** for announcements and homework — chaotic, unsearchable, easy to miss.
- **Excel sheets and paper registers** for attendance, fees, and admissions — error-prone, slow, no audit trail.
- **Cash and bank transfers** for fees — no GST-compliant receipts, defaulters tracked manually.
- **No public website** — parents can't find or trust the school online.
- **Generic ERPs** built for engineering colleges — too heavy, too expensive, designed for a different workflow.

The pain shows up everywhere:

- Owners have **no real-time visibility** into fee collection, attendance, or admissions pipeline.
- Teachers spend **3–5 hours a week** on admin work instead of teaching.
- Parents have **zero visibility** into their child's day and pay fees with awkward bank transfers.
- Admissions leads from WhatsApp / walk-ins **fall through the cracks** with no follow-up.
- Owners can't tell who paid, who's overdue, who's about to leave, or how the school is actually performing.

Existing platforms (Teachmint, Classplus, Edumarshal) target K-12 / coaching, are expensive, and look like enterprise software. **Nobody is building the "Shopify for pre-primary schools" — beautiful, opinionated, mobile-first, India-native.**

---

## 2. The Solution

VidyaPrabandha is a single multi-tenant SaaS platform with **six integrated portals**, all sharing one database and one source of truth per school:

1. **Owner Dashboard** — full operational visibility (students, staff, fees, attendance, admissions, analytics).
2. **Teacher / Classroom Portal** — daily attendance, assignments, parent messaging, AI progress reports, leave & punch.
3. **Office / Admin Staff Portal** — fee collection, receipts, admissions enquiries, attendance, events.
4. **Parent Portal (PWA)** — child's day feed, fee payment via Razorpay, gallery, leave requests, homework.
5. **School Public Website** — branded landing page (`/{school-slug}` or custom domain), live admission form feeding the CRM.
6. **Super Admin / Platform Console** — multi-tenant management, billing, feature flags, encrypted DB backups.

**Key promise:** _"Give every school their own digital school in 30 minutes, for less than ₹6,000/month."_

---

## 3. Product — What's Actually Built

This is **not a slide deck or a prototype**. It is a working multi-tenant SaaS, deployed on Vercel, with a Postgres production database. The codebase covers 50+ pages across all six portals.

### 3.1 Owner Dashboard (`/dashboard`)

- **Overview:** active student count, active staff, pending fees count, today's attendance %, new admission leads, recent announcements feed, recent students.
- **Students:** registry with class, admission number, status, parent links, medical info, documents.
- **Teachers / Staff:** 17 staff role types (Owner, Principal, Vice Principal, Class Teacher, Subject Teacher, Coordinator, Admin, Accountant, Counselor, Librarian, Nurse, Receptionist, Support Staff, Security Guard, Driver, Transport Manager, Parent).
- **Fees:** invoices, fee plans, GST-aware (CGST/SGST or IGST based on state code 29 = Karnataka), Razorpay integration, defaulter tracking, payment history.
- **Attendance:** student and staff attendance, daily marking, monthly summaries, calendar heatmap.
- **Admissions:** CRM pipeline (NEW_ENQUIRY → CONTACTED → VISIT_SCHEDULED → INTERVIEW_DONE → DOCS_PENDING → ADMITTED / REJECTED / DROPPED), lead activity timeline, conversion to student.
- **Announcements:** rich-text, target audience (All / Parents / Teachers / Specific Classes), multi-channel delivery (Push, WhatsApp, SMS, Email, In-app), draft / scheduled / published.
- **Customization Studio (`/dashboard/customize`):** logo, brand colour, accent colour, hero image, school bio, drag-and-drop public page sections, custom domain configuration.
- **Payroll (`/dashboard/payroll`):** salary structures (CTC, basic %, HRA %, DA %, conveyance), monthly payroll runs, PF / ESI / professional tax / TDS, late-punch deductions, salary advances, custom earnings & deductions, payslip PDF.
- **Leaves:** leave requests, leave balances (CL 12 / SL 7 / EL 15 by default, configurable per school), approve / reject workflow.
- **Analytics:** enrollment trends, fee collection trends, attendance rates, admissions funnel.
- **Settings:** school profile, GSTIN, state code, academic year, leave policy.

### 3.2 Teacher / Classroom Portal (`/classroom`)

- Daily classroom overview with today's timetable.
- Quick-mark attendance for the class — absent students automatically trigger a WhatsApp alert to the parent.
- Assignments and homework with file attachments (Cloudflare R2 storage).
- Parent messaging (1:1 thread per student or class-wide broadcast).
- **AI-assisted progress reports** (Anthropic Claude Sonnet) — teacher fills subject ratings + free-text notes, AI generates a warm 3-paragraph report, teacher reviews and sends to parent as PDF.
- Student leave approval queue.
- Personal leave requests.
- Daily punch-in / punch-out (drives payroll late deductions).
- Personal payroll history.

### 3.3 Office / Admin Staff Portal (`/office`)

- **Students:** quick search and view (admin-side).
- **Fees:** record cash / UPI / bank transfer / cheque payments; generate receipts (RCP-2025-00001 format); send reminders.
- **Receipts:** master log with PDF download.
- **Admissions:** enquiry inbox, follow-ups, conversion.
- **Attendance:** student attendance dashboard.
- **Staff & Punch:** staff punch records, attendance.
- **Leaves & Payroll:** office-side leave management, payroll review, personal payroll.
- **Events & Website:** edit events / event stories, manage public-website spotlights (sent to owner for publish approval).
- **Announcements:** publish to chosen audience.

### 3.4 Parent Portal — PWA (`/parent`)

- Email-based login (Clerk) — the email staff added on the student profile is the parent's login key. Multiple Gmail aliases (dots / +tags) handled gracefully.
- Multi-child support — single parent account for siblings.
- Today's attendance card per child.
- Outstanding fees with one-tap **Razorpay UPI / card / netbanking** checkout.
- Homework feed (Today / This Week / Previous filters).
- Photo gallery (school-wide and class-restricted albums).
- Submit leave requests for the child.
- Installable as a PWA on Android / iOS / desktop.

### 3.5 School Public Website (`/{school-slug}` or custom domain)

- Hero section with brand-colour gradient, logo, school name, tagline.
- "School Spotlights" — staff-drafted USPs that the owner publishes to the live page.
- About section, address, phone, email.
- Blog with per-post pages for SEO.
- Live **admission enquiry form** that drops directly into the Admissions CRM and auto-confirms via WhatsApp.
- **Custom domain** support — middleware detects non-platform hosts and serves the school's branded landing as the apex.

### 3.6 Super Admin / Platform Console (`/admin`)

- **Tenants:** all schools with plan, owner, students count, staff count, status. Create new school + assign owner.
- **Billing:** plan management (Starter / Growth / Academy).
- **Feature Flags:** per-plan and per-school toggles for `ai_reports`, `transport_module`, `admissions_crm`, etc.
- **Backups:** download encrypted Postgres backups generated by GitHub Actions (daily / weekly / monthly).

---

## 4. Tech Stack & Architecture

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Next.js 14 App Router** (TypeScript strict) | Server Components, streaming, edge-friendly |
| Database | **PostgreSQL** (Neon / Supabase) | Reliable, ACID, ap-south-1 / us-east-1 |
| ORM | **Prisma 5** | Type-safe queries, migrations |
| Auth | **Clerk** | Email + Google OAuth, organisations, invites |
| UI | **Tailwind CSS + shadcn/ui** | Clean, fast-loading, accessible |
| Payments | **Razorpay** | Indian gateway — UPI, cards, netbanking, webhook signature verification |
| Messaging | **Twilio WhatsApp + SMS** | Template-based fee reminders, absence alerts, announcements |
| Storage | **Cloudflare R2** | S3-compatible, CDN-served images & receipts |
| Email | **Resend** | Transactional |
| AI | **Anthropic Claude Sonnet** | Progress report generation, attendance insight summaries |
| Push | **Firebase Cloud Messaging** | Parent notifications |
| Hosting | **Vercel** | Preview per PR, prod on `main` |
| Backups | **GitHub Actions** (encrypted, scheduled) | Daily 14d / Weekly 60d / Monthly 90d retention |

### Multi-tenancy model

- **One Postgres database, `schoolId` column on every tenant-scoped table.** Every Prisma query is required by convention to include `schoolId` from the authenticated user's `requireSchoolAuth()`.
- **Clerk** handles the user identity layer; staff are pre-invited (no self-signup), parents log in with their email recorded against the student.
- **Public routes:** `/{schoolSlug}` for path-based sites, or a school's own custom domain rewrites internally to its slug at the page layer (DB-free middleware).
- **Reserved-slug enforcement** prevents school slugs from clashing with `/dashboard`, `/office`, `/admin`, `/parent`, `/sign-in`, etc.

### Indian compliance baked in

- Money stored as **paise integers** (never floats).
- Dates stored UTC, displayed `DD/MM/YYYY` in IST (`Asia/Kolkata`).
- Phone numbers normalised to `+91XXXXXXXXXX`.
- GST: CGST + SGST when school state matches student state (e.g. Karnataka 29), IGST otherwise.
- Academic year format: `2025-26` (April–March).
- Razorpay webhook signature verified with HMAC SHA256.

### Data model highlights (Prisma)

- **School (tenant):** plan, branding, custom domain, GSTIN, state code, leave policy, page config (JSON).
- **Class → Students → Parents → StudentAttendance → ProgressReports.**
- **Staff → StaffAttendance → LeaveRequest → SalaryStructure → PayrollItem (in PayrollRun).**
- **FeePlan → FeeInvoice → Payment** (with Razorpay order/payment/signature fields).
- **Announcement, BlogPost, GalleryAlbum / Photo, SchoolSpotlight, Event.**
- **AdmissionLead → LeadActivity** (full CRM trail).
- **TransportRoute, StudentDocument, FeatureFlag, PlatformAdmin.**

---

## 5. Pricing & Plans

| Plan | Price (₹/month) | Students | Highlights |
|------|----------------|----------|------------|
| **Starter** | 2,999 | up to 100 | Core modules, basic WhatsApp (500/mo), "Powered by VidyaPrabandha" badge |
| **Growth** | 5,999 | up to 300 | + AI progress reports, Admissions CRM, custom domain, GST invoicing |
| **Academy** | 9,999–10,999 | unlimited | + Multi-branch, transport, biometric, Tally export, priority support |

Add-ons: extra WhatsApp messages (₹0.50/msg), extra storage (₹499/10 GB), SMS bundle (₹499/1000).

---

## 6. Market & Go-to-Market

### Market size (TAM)

- ~**1 million** K-12 schools in India; **300,000+** are independent / pre-primary / private schools (the addressable segment).
- Average ARPU target: ₹6,000 / school / month → **₹2.16 Lakh per school per year**.
- Even capturing **1%** of independent schools = 3,000 schools × ₹72k/yr = **₹21.6 Cr ARR**.

### Target customers

| Persona | Why they buy |
|---------|--------------|
| Independent School Owner (1–3 campuses, 50–300 students) | Wants visibility + parent app + fee collection in one place |
| Pre-primary chains (EuroKids, Kidzee, ORCHIDS franchisees) | Wants white-label, multi-branch dashboard |
| School management consultants | Wants a reseller product with margin |

### Geographic phasing

- **Phase 0 (Months 1–3):** 10 free pilots in Dharwad / Hubli / Bangalore / Mysore. 5 paying by month 3.
- **Phase 1 (Months 3–6):** Karnataka rollout via the Karnataka Private Schools Association + Google Ads. Goal: 50 schools, ₹3 L MRR.
- **Phase 2 (Months 6–12):** national + franchise chains. Goal: 200+ schools, ₹10 L MRR.

### Growth flywheel (compounding moat)

```
School uses VidyaPrabandha
  → Parents see school's branded app + custom-domain website
  → Parents share school's public page on WhatsApp
  → New parents discover the school
  → School gets more admissions through the CRM
  → Owner upgrades plan + recommends to peers
```

The "Powered by VidyaPrabandha" badge on Starter plan public pages turns every school into a referral engine.

---

## 7. Why Now

1. **Razorpay + UPI ubiquity** — Indian parents will pay digitally; cash collection is now a friction, not a default.
2. **WhatsApp Business API** is mature — template messaging at scale is finally reliable and cheap.
3. **PWAs** removed the need to build & ship Android / iOS apps to delight parents.
4. **Generative AI** (Claude / GPT) makes "AI progress reports" a real differentiator that no incumbent built natively.
5. **Cursor + modern dev tooling** let a small team ship a 50-page multi-tenant SaaS in months, not years.
6. **Indian Schools are still mostly on WhatsApp + Excel.** Penetration of modern school SaaS in pre-primary is below 5%.

---

## 8. Differentiation

| Competitor approach | VidyaPrabandha approach |
|---------------------|-------------------------|
| One-size-fits-all K-12 ERP | Purpose-built for pre-primary / primary; opinionated workflows |
| Owner dashboard only, parents get email | Beautiful PWA parent portal with multi-child support, gallery, fee payment |
| White-label as expensive add-on | White-label + custom domain in **all plans** |
| AI as marketing buzzword | AI progress reports actually generated by Claude inside the teacher workflow |
| Generic invoices | GST-compliant, CGST/SGST/IGST aware, paise-precise |
| US-style pricing in $ | Indian pricing (₹2,999 entry), Razorpay-first checkout |
| Manual school onboarding by sales | Self-serve school spin-up by a Super Admin in minutes |

---

## 9. Traction Milestones (3-month / 6-month targets)

| Metric | Month 3 | Month 6 |
|--------|---------|---------|
| Paying schools | 5 | 50 |
| Monthly Recurring Revenue | ₹30,000 | ₹3,00,000 |
| Avg fee-collection-rate improvement | +15% | +20% |
| Teacher time saved / week | 3 hours | 5 hours |
| Parent app DAU rate | 40% | 60% |
| Admissions CRM conversion rate | — | 30%+ |

---

## 10. Roadmap

### Shipped ✅
- Multi-tenant auth (Clerk + Postgres + RLS)
- Owner / Teacher / Office / Parent / Public / Super-Admin portals
- Students, classes, staff (17 roles), parents
- Fee plans, GST-aware invoices, Razorpay checkout, cash receipts, defaulter tracking
- Student & staff attendance, daily punch
- Payroll runs (PF / ESI / PT / TDS / late deductions / salary advances)
- Leave management (CL / SL / EL with balances)
- Admissions CRM with full pipeline
- Announcements (multi-channel) + blog + gallery + events + spotlights
- AI progress reports (Claude)
- Customization Studio (logo, colours, hero, sections)
- Custom domains for school sites
- PWA parent portal
- Encrypted DB backups (daily / weekly / monthly)

### Next (Q1)
- Razorpay autopay / mandates for monthly fees
- Tally ERP CSV export
- Biometric integration (ZKTeco + similar)
- Multi-branch under one owner account
- Native React Native shell (only if PWA limits hit)
- Gradebook + printable report cards
- Parent push notifications via Firebase
- Inventory & procurement
- Document expiry reminders + audit logs

---

## 11. Team Ask (Closing Slide)

We are looking for:

1. **10 design partner schools** in Karnataka willing to use VidyaPrabandha free for 90 days in exchange for feedback and case-study rights.
2. **Channel partners** — school management consultants, EduTech resellers, franchise heads.
3. **Strategic advisors** in Indian K-12 / EdTech / WhatsApp Business API / Razorpay partnerships.

Pilot signup → talk to the founder, or visit the platform landing page and request access. The platform admin provisions your school in under 10 minutes.

---

# Appendix A — Suggested Slide Order for the PPT

1. **Title:** VidyaPrabandha — Run your school like a modern institution.
2. **The Problem** — Schools on WhatsApp + Excel + paper. (Section 1)
3. **The Solution** — One platform, six portals. (Section 2)
4. **Product Tour — Owner Dashboard** (Section 3.1)
5. **Product Tour — Teacher Portal + AI Progress Reports** (Section 3.2)
6. **Product Tour — Office Staff Portal** (Section 3.3)
7. **Product Tour — Parent PWA** (Section 3.4)
8. **Product Tour — School's Own Public Website + Custom Domain** (Section 3.5)
9. **Product Tour — Super Admin Console** (Section 3.6)
10. **Tech & Architecture** — multi-tenant, Indian-compliance-first. (Section 4)
11. **Pricing** — 3 plans. (Section 5)
12. **Market & GTM** — Karnataka first, India next. (Section 6)
13. **Why Now** — UPI, WhatsApp, PWAs, AI, dev velocity. (Section 7)
14. **Differentiation vs incumbents** (Section 8)
15. **Traction Targets** (Section 9)
16. **Roadmap — Shipped vs Next** (Section 10)
17. **The Ask** — design partners + advisors + channels. (Section 11)
18. **Thank You / Contact**

---

# Appendix B — One-paragraph elevator pitch (use as-is in any slide)

> VidyaPrabandha is the white-label, multi-tenant operating system for India's 300,000+ pre-primary and primary schools. In one Next.js + Postgres platform we run the school owner's dashboard, the teacher's classroom, the office staff's fee desk, the parent's mobile-first PWA, and the school's own branded public website with a custom domain. Fee collection is GST-compliant and Razorpay-native, attendance triggers WhatsApp alerts, admissions flow through a real CRM, payroll handles PF/ESI/PT/TDS, and progress reports are drafted by Claude. A school owner can be live in 30 minutes for under ₹6,000 a month — and every parent app and public website becomes a referral engine for the next school.

---

# Appendix C — Talking points / FAQs for Q&A

- **"Why pre-primary first?"** It's the most under-served tier. Pre-primary owners care about parent experience and admissions more than gradebooks. Once we win there, primary and middle school fall in naturally with the same data model.
- **"How is data isolated between schools?"** Every tenant-scoped table has a `schoolId`. Every server action calls `requireSchoolAuth()` and uses the authenticated user's school ID — never a client-supplied one. Reserved root-segment list prevents slug collisions with app routes.
- **"What if WhatsApp / Razorpay are down?"** The app degrades gracefully — Twilio runs in dev-mode console-log if not configured; Razorpay payments fall back to cash / UPI / bank transfer recording on the office desk.
- **"How fast can a new school go live?"** Super admin creates the school + owner. Owner uploads logo, sets brand colour, invites teachers, imports a CSV of students. Live in under 30 minutes.
- **"What's defensible long-term?"** The flywheel — every school's parents and public website pull more schools in. Switching cost compounds: fees + payroll + attendance history + admissions pipeline = your operational memory lives here.
- **"AI without lock-in to one provider?"** The AI layer is one file (`lib/claude.ts`); swappable to GPT or open-source models without changing the UX.
- **"Backups & disaster recovery?"** GitHub Actions runs encrypted Postgres dumps daily / weekly / monthly with documented restore drill in `BACKUP_RUNBOOK.md`. Super admin can download backups from `/admin/backups`.

---

*Source-of-truth references for NotebookLM: `PRD.md`, `CURSOR_PLAYBOOK.md`, `FUTURE_ENHANCEMENTS.md`, `BACKUP_RUNBOOK.md`, `.cursorrules`, `packages/db/prisma/schema.prisma`, `apps/web/src/components/landing/platform-marketing.tsx`.*
