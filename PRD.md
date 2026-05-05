# VidyaPrabandha — Product Requirements Document (PRD)
## Version 1.0 | Multi-tenant SaaS for pre-primary and primary schools, India
> Internal codename: KinderOS (still used for npm packages and folder names).

---

## 1. Product Overview

**VidyaPrabandha** is a white-label, multi-tenant SaaS platform for pre-primary and primary schools in India. Each school gets a fully branded experience — their own app, website, and back-office — powered by the same infrastructure.

### Core Value Proposition
> "Give every School their own digital school in 30 minutes, for less than ₹6,000/month."

### Target Market
- Primary: Independent Schools & pre-primary schools in Tier 1/2 Indian cities
- Secondary: School franchise chains (EuroKids, Kidzee, ORCHIDS)
- Geographic focus: Karnataka first (Dharwad, Hubli, Bangalore, Mysore)

---

## 2. User Personas

| Persona | Description | Primary Goal | Key Pain Today |
|---------|-------------|--------------|----------------|
| School Owner | Runs 1-3 campuses, 50-300 students | Full operational visibility | WhatsApp groups + Excel sheets |
| Class Teacher | Manages 25-35 kids per class | Reduce admin, focus on teaching | Manual registers, no parent tool |
| Admin Staff | Fee collection, front desk | Fast fee collection & receipts | Paper receipts, no defaulter list |
| Parent | Working parent, mobile-first | Know child's day, pay fees easily | No visibility, bank transfer for fees |
| Super Admin | Platform operator (you) | Tenant management, billing | N/A |

---

## 3. Portals & Feature Matrix

### 3.1 School Owner Dashboard

#### 3.1.1 Overview Dashboard
- KPI cards: total students, staff present, fees collected (month), pending admissions
- Fee collection % by class (progress bars)
- Staff attendance today (present/absent/late)
- Admissions pipeline (mini-kanban)
- Recent activity feed (real-time events)

#### 3.1.2 Student Management
- Student registry with full profiles
- Linked parent contacts (Father + Mother + Guardian)
- Medical records (allergies, blood group, conditions)
- Document vault (Aadhar, birth certificate, TC, photos)
- Attendance history + calendar heatmap
- Fee history + payment records
- Progress reports timeline
- Bulk operations: CSV export, WhatsApp to parents

#### 3.1.3 Staff Management
- Staff profiles (teachers + admin + support)
- Role-based access assignment (maps to portal access)
- Daily attendance marking (or biometric import)
- Monthly attendance summary + export
- Leave request approval workflow
- Salary records (optional Phase 2)
- Clerk-based onboarding invite on staff creation

#### 3.1.4 Fee Management
- Fee plan creation (monthly/quarterly/annual per class)
- Auto invoice generation from fee plans
- Razorpay payment link generation (sends to parent WhatsApp)
- Cash/bank transfer manual recording
- GST-compliant invoices (CGST/SGST for Karnataka, IGST cross-state)
- Automated receipt PDF (Cloudflare R2)
- Defaulter list with bulk WhatsApp reminder
- Monthly fee collection report
- Tally ERP CSV export

#### 3.1.5 Customization Studio
- Brand identity: logo, colors (6 presets + custom hex)
- School name, tagline, bio (rich text)
- Hero banner image upload or gallery pick
- Drag-and-drop section ordering for public page
- Section visibility toggles (About, Gallery, Blog, Facilities, Admissions, Testimonials)
- Custom domain configuration (+ DNS instructions)
- Admission form configuration (fields, heading)
- Publish/draft system with unsaved changes indicator

#### 3.1.6 Announcements & Blog
- Rich text announcements with image attachment
- Target audience: All, Parents only, Teachers only, Specific classes
- Multi-channel delivery: Push + WhatsApp + SMS + In-app
- Schedule for future publish
- Blog post editor for school website (tiptap)
- Tag system for blog posts

#### 3.1.7 Admissions CRM
- Online enquiry form on public website feeds into CRM
- Pipeline stages: New Enquiry → Contacted → Visit Scheduled → Interview Done → Docs Pending → Admitted/Rejected
- Lead timeline with activity log (calls, visits, notes)
- Auto WhatsApp confirmation on new enquiry
- Follow-up reminders
- Conversion: admitted lead → create student record (prefills data)

#### 3.1.8 Timetable & Academic
- Visual weekly timetable per class (drag-and-drop builder)
- Subject mapping with teacher assignment
- Holiday calendar
- Academic year planner with term dates

#### 3.1.9 Analytics
- Monthly enrollment trend
- Fee collection rate trend (MoM)
- Attendance % by class (students + staff)
- Admissions funnel conversion rate
- Class-wise headcount over time

### 3.2 Teacher Dashboard

| Feature | Description |
|---------|-------------|
| My Classroom | Today's timetable, student list, daily summary |
| Attendance | Quick chip-based marking, absent → auto WhatsApp parent |
| Assignments | Create, attach files, track submissions, grade |
| Parent Messaging | 1:1 threads, class broadcast, photo sharing |
| Progress Reports | Fill form → AI generates report → review → send to parent |
| AI Report Generator | Claude-powered, 3-paragraph personalised report in seconds |

### 3.3 Admin Staff Portal

| Feature | Description |
|---------|-------------|
| Fee Collection | View all invoices, mark paid, collect cash |
| Receipt Issue | Generate receipt PDF for cash payment |
| Defaulter List | Overdue invoices with send reminder action |
| Admission Enquiries | View and manage incoming enquiry form submissions |
| Student Search | Quick lookup across all students |
| WhatsApp Blast | Send broadcast message to all/class parents |
| Tally Export | Download GST-ready CSV for Tally import |

### 3.4 Parent Portal (Web + PWA)

| Feature | Description |
|---------|-------------|
| Child's Day Feed | Attendance status, homework, photos, teacher notes |
| Fee Payment | Razorpay checkout (UPI, card), receipt PDF |
| Gallery | School event photos + class albums |
| Announcements | School-level and class-level notices |
| Teacher Chat | Direct message to class teacher |
| Notification Centre | All updates in one feed |

### 3.5 School Public Website

| Section | Description |
|---------|-------------|
| Hero | Branded gradient, logo, name, tagline, CTA |
| Stats | Student count, teacher count, rating |
| About | School bio, established year, location |
| Gallery | Latest event/class photos |
| Announcements | Latest 3 published announcements |
| Blog | Latest blog posts |
| Facilities | Icon + text grid of facilities/programs |
| Contact | Address, phone, Google Maps embed |
| Admission Form | Embedded enquiry form → AdmissionLead in CRM |

### 3.6 Super Admin Panel

| Feature | Description |
|---------|-------------|
| Tenant List | All schools with plan, status, metrics |
| Tenant Create | Create new school + Clerk org |
| Feature Flags | Toggle features per plan or per school |
| Billing | Subscription management, upgrade/downgrade |
| Platform Analytics | MRR, total schools, total students, growth |

---

## 4. Technical Architecture

### 4.1 Multi-tenancy Model
- **Isolation**: Clerk Organization = School Tenant
- **DB**: `schoolId` column on every tenant-scoped table
- **RLS**: Supabase Row Level Security as second layer
- **Public routes**: `[schoolSlug]` path for school website
- **Custom domains**: middleware rewrites to `[schoolSlug]`

### 4.2 Data Models (Key)
See `schema.prisma` for complete schema.

Key relationships:
```
School (tenant)
  ├── Staff (teachers, admin, support)
  ├── Class → Students → Parents
  ├── FeeInvoices → Payments
  ├── Announcements
  ├── BlogPosts
  ├── GalleryAlbums → GalleryPhotos
  └── AdmissionLeads → LeadActivities
```

### 4.3 Indian Compliance
- **Money**: All stored as paise (integer). Never floats.
- **GST**: CGST + SGST (same state) or IGST (cross-state). Karnataka = 29.
- **Dates**: UTC in DB, IST (Asia/Kolkata) in display.
- **Format**: DD/MM/YYYY, ₹ currency, +91 phone prefix.
- **Invoices**: GST-compliant with GSTIN, HSN code, tax breakdown.
- **Tally**: Export in Tally-compatible CSV format.

### 4.4 Integration Stack
| Service | Purpose | SDK |
|---------|---------|-----|
| Supabase | PostgreSQL database | @supabase/supabase-js |
| Clerk | Auth + multi-tenancy | @clerk/nextjs |
| Razorpay | Indian payments | razorpay |
| Twilio | WhatsApp + SMS | twilio |
| Cloudflare R2 | File storage | @aws-sdk/client-s3 |
| Anthropic Claude | AI report generation | @anthropic-ai/sdk |
| Firebase FCM | Push notifications | firebase-admin |
| Resend | Transactional email | resend |

---

## 5. Pricing Model

| Plan | Price/month | Students | Key Features |
|------|-------------|----------|--------------|
| Starter | ₹2,999 | Up to 100 | Core modules, basic WhatsApp (500/mo) |
| Growth | ₹5,999 | Up to 300 | + AI reports, Admissions CRM, custom domain, GST invoicing |
| Academy | ₹10,999 | Unlimited | + Multi-branch, transport, biometric, Tally export, priority support |

**Add-ons** (future):
- Extra WhatsApp messages: ₹0.50/message beyond plan limit
- Extra storage: ₹499/10GB/month
- SMS bundle: ₹499/1000 SMS

---

## 6. Go-to-Market

### Phase 0 (Months 1-3): Dharwad/Hubli Zero Market
- 10 free pilots with local Schools
- Build real case studies with actual usage data
- Iterate on UX based on school owner feedback
- Milestone: 5 paying schools by month 3

### Phase 1 (Months 3-6): Karnataka Rollout
- Partner with Karnataka Private Schools Association
- School management consultants as channel partners
- Google Ads targeting school owner searches in Karnataka
- Milestone: 50 schools, ₹2L MRR

### Phase 2 (Months 6-12): National + Franchise
- Franchise chain partnerships (EuroKids, Kidzee)
- Reseller program for education consultants
- Milestone: 200+ schools, ₹10L MRR

### Growth Flywheel
```
School uses VidyaPrabandha
  → Parents see school's branded app
  → Parents share school's public page on WhatsApp
  → New parents find the school
  → School gets more admissions
  → School owner recommends VidyaPrabandha to peers
```

"Powered by VidyaPrabandha" badge on Starter plan public pages.

---

## 7. MVP Scope (Build First)

Priority order for MVP:
1. ✅ Auth + multi-tenancy (Clerk + Supabase)
2. ✅ Student + staff management
3. ✅ Fee collection + Razorpay integration
4. ✅ Attendance marking + WhatsApp absent alert
5. ✅ School public page (static, from customization config)
6. ✅ Customization Studio (logo, colors, sections)
7. ✅ Announcements + parent notification
8. ✅ Parent portal (fee payment + child's day feed)
9. ✅ AI progress report generator
10. ✅ Admissions CRM

**Defer to Phase 2**: Transport module, biometric integration, mobile app (React Native), blog builder, Tally export, multi-branch.

---

## 8. Success Metrics

| Metric | 3-month target | 6-month target |
|--------|----------------|----------------|
| Paying schools | 5 | 50 |
| Monthly Recurring Revenue | ₹30,000 | ₹3,00,000 |
| Avg fee collection rate improvement | +15% | +20% |
| Teacher time saved per week | 3 hours | 5 hours |
| Parent app DAU rate | 40% | 60% |
| Admissions CRM conversion rate | - | 30%+ |

---

## 9. Non-Functional Requirements

- **Performance**: LCP < 2.5s on 4G Indian networks
- **Availability**: 99.5% uptime SLA
- **Security**: HTTPS everywhere, no PII in logs, Supabase RLS
- **Accessibility**: WCAG 2.1 AA for owner/teacher dashboards
- **Offline**: Parent app PWA with offline-capable feed
- **Data Residency**: Supabase region: ap-south-1 (Mumbai)
- **Backup**: Daily automated DB backups via Supabase

---

*Document version 1.0 — VidyaPrabandha*
*Stack: Next.js 14 · Supabase · Clerk · Prisma · Tailwind · Razorpay · Twilio · Claude API*
