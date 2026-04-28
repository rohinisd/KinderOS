# KinderOS — Cursor Build Playbook
## Step-by-step prompts to build the complete application

> **How to use this playbook**: Copy each prompt block into Cursor Composer (⌘+I) in sequence.
> Complete the verification checklist before moving to the next step.
> Each prompt is self-contained — paste the full block including context.

---

## PRE-FLIGHT: Project Bootstrap

### STEP 0 — Initialize monorepo
```
Create a new pnpm monorepo for KinderOS with the following structure:

kinderos/
├── apps/web/         (Next.js 14 App Router, TypeScript strict)
├── packages/db/      (Prisma schema + client)
├── packages/ui/      (shadcn/ui shared components)
├── packages/utils/   (shared helpers)
├── turbo.json
└── package.json      (pnpm workspace)

Run these setup commands:
1. pnpm create turbo@latest kinderos
2. cd kinderos && pnpm install
3. Install in apps/web:
   - next@14 react react-dom typescript @types/react @types/node
   - @clerk/nextjs
   - prisma @prisma/client
   - tailwindcss postcss autoprefixer
   - shadcn/ui (init with New York style, Stone base color)
   - razorpay
   - twilio
   - @aws-sdk/client-s3 (for Cloudflare R2)
   - @anthropic-ai/sdk
   - resend
   - react-hook-form @hookform/resolvers zod
   - @tanstack/react-table
   - recharts
   - sonner
   - date-fns
   - react-pdf @react-pdf/renderer

Create apps/web with Next.js 14 App Router.
Create turbo.json with build, dev, lint pipelines.
Create pnpm-workspace.yaml.
Generate tsconfig.json with strict mode for all packages.
```

---

## PHASE 1: Foundation

### STEP 1 — Database Setup
```
Using the Prisma schema in schema.prisma (attached), set up the database layer:

1. Copy schema.prisma to packages/db/prisma/schema.prisma
2. Create packages/db/package.json with prisma as dependency
3. Create packages/db/src/index.ts that exports the Prisma client
4. Create apps/web/src/lib/prisma.ts as singleton:
   - Use global variable pattern to prevent hot-reload issues
   - Export as named export 'prisma'

5. Create Supabase project connection:
   - DATABASE_URL = Supabase pooler URL (port 6543)
   - DIRECT_URL = Supabase direct URL (port 5432)

6. Run: pnpm prisma generate && pnpm prisma db push

7. Create seed file packages/db/prisma/seed.ts:
   - Create 1 demo school: "Little Stars School", slug: "little-stars"
   - Create 5 classes: Nursery A, Nursery B, LKG A, LKG B, UKG
   - Create 3 staff members with StaffRole
   - Create 10 students with parents
   - Create sample fee invoices (mix of PAID, PENDING, OVERDUE)
   - Create 2 announcements
```

**Verify**: `pnpm prisma studio` opens and shows all tables with seed data.

---

### STEP 2 — Auth & Middleware
```
Set up Clerk authentication with multi-tenancy for KinderOS.

Requirements:
- Each school = 1 Clerk Organization
- Staff/Owner = org members with roles
- Parents = standalone Clerk users (no org)
- Super admins = special metadata flag

1. Install and configure @clerk/nextjs in apps/web
2. Create apps/web/src/middleware.ts:
   - Protect all /(owner)/*, /(teacher)/*, /(admin)/*, /(parent)/* routes
   - Public routes: /, /[schoolSlug]/*, /sign-in/*, /sign-up/*
   - Redirect based on Clerk org role to correct portal

3. Create apps/web/src/lib/auth.ts with helpers:
   - getSchoolId(): string — throws if no orgId
   - getStaffRole(): StaffRole — maps Clerk org role to StaffRole enum
   - requireOwner(): void — throws if not owner role
   - requireTeacher(): void — throws if not teacher or owner
   - requireAdmin(): void — throws if not admin role
   - isParent(): boolean — no org = parent

4. Create apps/web/src/app/layout.tsx with ClerkProvider
5. Set up role-based redirect in middleware:
   - orgRole: "org:owner" OR "org:admin" → /dashboard
   - orgRole: "org:teacher" → /classroom
   - orgRole: "org:staff" → /office
   - No org → /parent

Environment variables needed:
- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- CLERK_SECRET_KEY
- NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
- NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
```

**Verify**: Sign in redirects correctly based on role.

---

### STEP 3 — Shared Layout Components
```
Create the shared layout system for all three dashboard portals.

Using shadcn/ui + Tailwind CSS, create:

1. apps/web/src/components/layout/Sidebar.tsx
   - Props: navItems[], schoolName, userName, userRole, avatarInitials
   - Collapsible on mobile (sheet from shadcn)
   - Active state based on pathname
   - Brand icon slot at top
   - User chip at bottom with avatar

2. apps/web/src/components/layout/PageHeader.tsx
   - Props: title, subtitle, actions (ReactNode slot)
   - Consistent spacing

3. apps/web/src/components/layout/DashboardLayout.tsx
   - Wraps Sidebar + main content area
   - Handles mobile responsive

4. apps/web/src/components/layout/StatCard.tsx
   - Props: label, value, delta?, deltaType ('positive'|'negative'|'neutral')
   - Used in all KPI rows

5. Create layout.tsx files for each portal:
   - app/(owner)/dashboard/layout.tsx — owner sidebar navItems
   - app/(teacher)/classroom/layout.tsx — teacher sidebar navItems
   - app/(admin)/office/layout.tsx — admin sidebar navItems

Design system:
- Primary: #3C3489 (deep purple)
- Accent: #534AB7
- Use shadcn's gray-based neutral palette
- Font: system-ui (keep it clean and fast-loading)
- All cards: subtle border, no heavy shadows
```

---

## PHASE 2: Owner Dashboard

### STEP 4 — Owner Dashboard Overview
```
Build the Owner Dashboard overview page at app/(owner)/dashboard/page.tsx

This is a React Server Component that fetches all data server-side.

Data to fetch (all filtered by getSchoolId()):
- Total active students count
- Staff present today count (from StaffAttendance, today's date IST)
- Fee collected this month (sum of Payment.amount where paidAt in current month)
- Fee collection rate (collected / total invoiced this month * 100)
- Pending admission leads count
- Recent activity (last 10 events from payments, attendance, announcements, leads)
- Fee collection % by class (for progress bars)

Components to build:
1. KPI cards row (students, staff present, fees collected, pending admissions)
2. FeeByClassChart — horizontal progress bars per class
3. RecentActivityFeed — timeline with colored dots
4. StaffAttendanceToday — table with badge for PRESENT/ABSENT/LATE
5. AdmissionPipelineCard — mini kanban stages with counts

Use Promise.all for parallel data fetching.
All money values: format using formatCurrency() from packages/utils.
All dates: format using toIST() helper, academic year label "2025-26".
```

---

### STEP 5 — Student Management
```
Build the complete student management section at app/(owner)/dashboard/students/

Files to create:
1. page.tsx — Student list with:
   - TanStack Table with columns: Photo, Name, Class, Admission No., Status, Fee Status, Actions
   - Filters: class dropdown, status filter, search by name
   - Bulk actions: export CSV, send WhatsApp to selected parents
   - "Add student" button → opens AddStudentSheet

2. [studentId]/page.tsx — Student profile with:
   - Header: photo, name, class, admission number, status badge
   - Tabs: Overview | Attendance | Fees | Documents | Progress Reports
   - Overview: parent details, medical info, transport info
   - Attendance: calendar heatmap of attendance
   - Fees: invoice history with payment status
   - Documents: uploaded docs with download links
   - Progress Reports: list with AI-generated badge

3. actions/students.ts — Server Actions:
   - createStudent(data) — validates, creates student + links parents
   - updateStudent(id, data) — with revalidatePath
   - updateStudentStatus(id, status)
   - linkParent(studentId, parentData)
   - uploadStudentDocument(studentId, file, type)

4. components/AddStudentSheet.tsx — shadcn Sheet with multi-step form:
   - Step 1: Child details (name, DOB, gender, class, admission number)
   - Step 2: Parent 1 details (name, phone, relation)
   - Step 3: Parent 2 details (optional)
   - Step 4: Medical & transport info
   - All steps: React Hook Form + Zod validation
   - Phone: validate Indian mobile number (+91 format)
```

---

### STEP 6 — Fee Management
```
Build complete fee management at app/(owner)/dashboard/fees/

1. page.tsx — Fee dashboard:
   - KPI cards: Total collected, Pending, Overdue count, Collection rate
   - Monthly trend bar chart (Recharts BarChart)
   - FeeInvoiceTable (TanStack Table):
     Columns: Student, Class, Amount, Due Date, Status, Payment Method, Actions
     Row actions: View details, Send reminder, Mark as paid (cash), Download receipt
   - Filter: status, class, month

2. fee-plans/page.tsx — Fee plan management:
   - List of fee plans with name, amount, frequency, classes applied to
   - CreateFeePlanDialog: name, amount (rupees input → store paise), frequency, target classes

3. defaulters/page.tsx — Defaulter management:
   - Overdue invoices sorted by days overdue
   - Bulk WhatsApp reminder action
   - Individual reminder button

4. actions/fees.ts:
   - createFeeInvoice(data) — GST calculation logic:
     * If school state == student state → CGST 9% + SGST 9%
     * Else → IGST 18%
     * Store all amounts in paise
   - createRazorpayOrder(invoiceId) — creates Razorpay order, returns order_id
   - verifyAndRecordPayment(orderId, paymentId, signature) — webhook handler
   - markAsPaidCash(invoiceId) — record cash payment
   - sendFeeReminder(invoiceId) — Twilio WhatsApp template message
   - generateReceiptPdf(paymentId) — react-pdf receipt → upload to R2 → update receiptUrl
   - bulkSendReminders(invoiceIds[])
   - generateTallyExport(month, year) — CSV in Tally-compatible format

5. api/webhooks/razorpay/route.ts:
   - Verify Razorpay webhook signature (HMAC SHA256)
   - On payment.captured: update FeeInvoice status, create Payment record
   - Send WhatsApp receipt confirmation to parent
   - Revalidate /dashboard/fees cache

GST Rules:
- Store GSTIN on School model
- Karnataka state code = "29"
- Tax-exempt schools: skip GST calculation if no GSTIN
```

---

### STEP 7 — Staff & Attendance Management
```
Build staff management at app/(owner)/dashboard/teachers/ and attendance.

1. app/(owner)/dashboard/teachers/page.tsx:
   - Staff list table: Photo, Name, Role, Class (if teacher), Status, Actions
   - Filter by role (StaffRole enum)
   - "Add staff" button → AddStaffSheet
   - Bulk: Export, Mark leave

2. app/(owner)/dashboard/attendance/page.tsx:
   - Today's attendance dashboard
   - Date picker to view past dates
   - Quick mark buttons: Present / Absent / Late
   - Monthly summary table: staff × days matrix
   - Export: monthly attendance report CSV

3. components/AddStaffSheet.tsx:
   - Personal info: name, phone, email, DOB, gender
   - Employment: role, designation, join date, salary (rupees)
   - Class assignment (if teacher role)
   - After creation: send onboarding invite (Clerk invite to org)

4. actions/staff.ts:
   - createStaff(data) — creates Staff record + Clerk org invite
   - markDailyAttendance(staffId, date, status, checkIn, checkOut)
   - bulkMarkAttendance(records[])
   - createLeaveRequest(staffId, data)
   - approveLeaveRequest(leaveId)

5. Leave management at /dashboard/teachers/leave:
   - Pending leave requests table
   - Approve/Reject with note
   - Calendar view of approved leaves
```

---

### STEP 8 — Customization Studio
```
Build the Customization Studio at app/(owner)/dashboard/customize/

This is the "Shopify editor for schools" — school owners configure
their public-facing brand and website.

1. page.tsx — Studio layout (sidebar + live preview):
   - Left sidebar: navigation for different config sections
   - Right panel: live preview of school public page
   - Top bar: "Preview live site ↗" + "Publish changes" button
   - All changes are drafts until "Publish" is clicked
   - Show unsaved changes indicator

2. Sidebar sections with inline forms:
   a. Colors & Logo:
      - Color picker for brandColor (6 preset + custom hex)
      - Logo upload (drag & drop → upload to R2)
      - School name text input (live updates preview)
      - Tagline text input

   b. Hero Banner:
      - Hero image upload or choose from gallery
      - CTA button text ("Enroll your child", "Learn more", custom)
      - Show/hide admission CTA toggle

   c. School Bio:
      - Rich text editor (use tiptap or simple textarea for MVP)
      - Established year
      - City/location

   d. Page Sections (drag-to-reorder):
      - Sections: About, Gallery, Facilities, Announcements, Blog, Testimonials, Contact
      - Toggle each on/off
      - Drag handle for reordering (use @dnd-kit/sortable)

   e. Admission Form:
      - Toggle: show/hide online admission form on public page
      - Required fields configuration
      - Form heading customization

   f. Custom Domain:
      - Input for custom domain (e.g. littlestarsdhd.com)
      - DNS instructions display
      - Verification status badge

3. actions/customize.ts:
   - saveCustomizationDraft(schoolId, config) — saves to School.pageConfig
   - publishCustomization(schoolId) — marks as live
   - uploadLogo(schoolId, file) — R2 upload → update School.logoUrl

4. Preview component:
   - Renders actual school public page in iframe or styled div
   - Updates in real-time as form values change (use optimistic UI)
```

---

## PHASE 3: Teacher Dashboard

### STEP 9 — Teacher Dashboard & Classroom
```
Build the Teacher Dashboard at app/(teacher)/classroom/

1. page.tsx — Daily classroom overview (RSC):
   - Today's timetable (horizontal timeline)
   - Quick attendance marking for today (student chip grid)
   - Pending assignments count
   - Unread parent messages count
   - Recent activity feed

2. attendance/page.tsx:
   - Student list with present/absent/late toggle chips
   - "Mark all present" bulk action
   - Save attendance → Server Action + auto WhatsApp parents of absent students
   - View past attendance by date

3. assignments/page.tsx:
   - Assignment list: title, subject, due date, submission count, status
   - "Create assignment" → CreateAssignmentSheet:
     * Title, subject, description
     * Due date (date picker)
     * File attachment upload (R2)
     * Target class (teacher's class auto-filled)
   - After create: WhatsApp notification to all class parents

4. parents/page.tsx — Parent communication:
   - Message threads per student/parent
   - Compose: text + optional photo
   - Broadcast to entire class
   - WhatsApp delivery status

5. reports/page.tsx — Progress report generation:
   - Student list with "Generate report" button
   - ProgressReportForm (per student):
     * Subject ratings (1-5 stars for each subject)
     * Behaviour and social skills ratings
     * Teacher's free-text notes
     * "Generate with AI" button → calls Claude API
   - AI-generated report preview (editable)
   - "Approve & Send to Parent" button
   - PDF download

6. actions/attendance.ts:
   - markClassAttendance(classId, date, records[])
   - After marking: filter absent students → send WhatsApp to their parents

7. actions/reports.ts:
   - generateAIReport(studentId, teacherInput) — calls Claude API
   - finaliseAndSendReport(reportId) — generates PDF, uploads to R2, sends to parent
```

---

### STEP 10 — Parent Portal
```
Build the Parent Portal at app/(parent)/parent/

Parents log in with their phone number via Clerk.
After auth, they see only their own children's data.

1. page.tsx — Home (Child's Day Feed):
   - Child selector (if multiple children)
   - Daily attendance status card ("Aarav is present today ✓")
   - Fee due banner (if outstanding amount)
   - Activity feed:
     * Attendance updates
     * New assignments
     * Teacher messages
     * Photos shared
     * Announcements
   - Quick actions: Pay fees, Chat with teacher

2. fees/page.tsx:
   - Outstanding invoices with "Pay Now" button
   - Razorpay checkout integration (client-side)
   - Payment history with receipt PDF download

3. gallery/page.tsx:
   - School albums + class-specific albums
   - Photo grid with lightbox (only see albums they have access to)

4. messages/page.tsx:
   - Thread per child-teacher pair
   - Send message with optional photo

5. Razorpay client-side integration:
   - Load Razorpay checkout.js
   - On success: call verifyAndRecordPayment server action
   - Show success toast + receipt download

Parent auth flow:
- Parents register with phone number
- Clerk phone verification
- After auth, fetch Parent record by Clerk userId
- Show only their children's data (strict student-parent join)
```

---

## PHASE 4: School Public Website

### STEP 11 — Public School Page
```
Build the public school website at app/(public)/[schoolSlug]/

This page is fully public (no auth required) and is the school's
marketing website. Content is driven by the Customization Studio.

1. page.tsx — School landing page (fully SSG where possible):
   - Fetch School by slug with pageConfig
   - Render sections based on pageConfig.sections order and visibility:
     * HeroSection: brand color gradient, logo, name, tagline, CTA buttons
     * StatsSection: student count, teacher count, rating
     * AboutSection: school bio, established year, facilities
     * GallerySection: latest album photos
     * AnnouncementsSection: latest 3 published announcements
     * BlogSection: latest 3 blog posts
     * FacilitiesSection: icon + label grid
     * ContactSection: address, phone, map embed
     * AdmissionFormSection: embedded enquiry form (if enabled)
   - Apply brandColor to hero gradient and accent elements

2. admissions/page.tsx:
   - Full online admission enquiry form
   - Fields: child name, DOB, grade applying, parent name, phone, email, source
   - On submit → creates AdmissionLead → sends WhatsApp confirmation to parent
   - "We'll call you within 24 hours" message

3. blog/[slug]/page.tsx:
   - Individual blog post with SEO metadata
   - School header/nav
   - Back to school page link

4. Metadata:
   - Dynamic generateMetadata based on school name, description
   - OpenGraph image using school logo + name
   - Canonical URL

5. Custom domain support:
   - middleware.ts: check if host matches any School.customDomain
   - If yes: rewrite to /[schoolSlug] internally
```

---

## PHASE 5: Communication Layer

### STEP 12 — WhatsApp & Notifications
```
Build the full notification infrastructure in apps/web/src/lib/

1. lib/twilio.ts — WhatsApp/SMS client:
   ```typescript
   // Template-based WhatsApp messages
   type WhatsAppTemplate = 
     | 'fee_reminder'
     | 'fee_receipt'
     | 'student_absent'
     | 'new_assignment'
     | 'announcement'
     | 'admission_confirmation'
   
   sendWhatsApp(to: string, template: WhatsAppTemplate, variables: Record<string, string>)
   sendSMS(to: string, message: string)
   ```

2. Build these notification triggers:
   - On FeeInvoice created → send fee notification to parent
   - On Payment success → send receipt to parent
   - On StudentAttendance ABSENT → send absent alert to parent
   - On Assignment created → broadcast to class parents
   - On Announcement published → send to target audience
   - On AdmissionLead created → send confirmation to lead's phone
   - On LeaveRequest approved → send to staff

3. lib/firebase-fcm.ts:
   - sendPushNotification(token, title, body, data)
   - sendMulticast(tokens[], title, body)

4. NotificationLog model (add to schema):
   - Track every notification sent (type, recipient, status, template, sentAt)
   - Prevents duplicate sends

5. api/webhooks/razorpay/route.ts (already in STEP 6):
   - After payment: trigger sendWhatsApp(parent.phone, 'fee_receipt', {...})
```

---

## PHASE 6: AI Features

### STEP 13 — AI Progress Report Generator
```
Build the AI-powered progress report generator.

1. lib/claude.ts — Claude API integration:
```typescript
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function generateSchoolReport(input: {
  studentName: string
  gender: 'boy' | 'girl'
  className: string
  term: string
  teacherNotes: string
  subjectRatings: Record<string, number>  // 1-5
  behaviourRating: number
  socialSkillsRating: number
  attendancePercent: number
  teacherName: string
  schoolName: string
}): Promise<string> {
  const prompt = `You are writing a warm, encouraging School progress report 
  for parents in India. Write in clear, simple English that non-native speakers 
  can understand easily. Be positive and supportive.
  
  Student: ${input.studentName} (${input.gender})
  Class: ${input.className}
  Term: ${input.term}
  School: ${input.schoolName}
  Teacher: ${input.teacherName}
  Attendance: ${input.attendancePercent}%
  
  Teacher's notes: ${input.teacherNotes}
  
  Subject ratings (1=needs improvement, 5=excellent):
  ${Object.entries(input.subjectRatings).map(([s, r]) => `${s}: ${r}/5`).join(', ')}
  
  Behaviour: ${input.behaviourRating}/5
  Social skills: ${input.socialSkillsRating}/5
  
  Write a 3-paragraph progress report:
  1. Opening with overall progress and attendance
  2. Academic performance highlights (based on ratings, don't mention numbers)
  3. Social development and closing encouragement to parents
  
  Keep it warm, personal, and specific. 150-200 words.`
  
  const response = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }]
  })
  
  return response.content[0].type === 'text' ? response.content[0].text : ''
}
```

2. app/(teacher)/classroom/reports/generate/[studentId]/page.tsx:
   - Teacher fills structured form
   - "Generate with AI" button (Server Action)
   - Shows generated report in editable textarea
   - "Regenerate" option
   - "Approve & Save" → saves to ProgressReport.aiGeneratedReport

3. actions/reports.ts:
   - generateReport(studentId, teacherInput) — calls claude.ts, saves to DB
   - approveReport(reportId) — marks as finalised
   - sendReportToParent(reportId) — generates PDF + sends WhatsApp to parent

4. PDF generation for reports:
   - react-pdf template with school letterhead (logo, name, colors)
   - Student info, class, term at top
   - Report body
   - Teacher signature line
   - Upload to R2, store URL in ProgressReport.pdfUrl
```

---

## PHASE 7: Super Admin

### STEP 14 — Platform Super Admin
```
Build the Super Admin panel at app/(superadmin)/admin/

This is for you (Girish) to manage all tenant schools.

1. Protect with: special Clerk user metadata { isSuperAdmin: true }
   Middleware: check for this metadata, redirect if not present

2. app/(superadmin)/admin/tenants/page.tsx:
   - All schools table: name, slug, plan, students count, fees this month, status
   - Create tenant: name, slug, owner email → creates Clerk org + School record
   - Deactivate school

3. app/(superadmin)/admin/billing/page.tsx:
   - All subscriptions with plan, amount, renewal date
   - Upgrade/downgrade plan
   - Payment history

4. app/(superadmin)/admin/feature-flags/page.tsx:
   - Toggle features per plan or per school
   - Feature keys from FeatureFlag model

5. app/(superadmin)/admin/analytics/page.tsx:
   - Platform metrics: total schools, total students, MRR
   - Monthly growth chart
   - Top schools by fee volume (engagement signal)
```

---

## PHASE 8: Polish

### STEP 15 — Final Polish & PWA
```
Final polish tasks:

1. PWA configuration for parent portal:
   - next-pwa configuration
   - manifest.json with school dynamic icon (per tenant)
   - Offline page
   - Push notification permission flow

2. SEO for school public pages:
   - Dynamic sitemap.xml per school
   - robots.txt
   - Structured data (LocalBusiness schema)

3. Performance:
   - Image optimization (next/image) everywhere
   - R2 images served via Cloudflare CDN
   - Loading skeletons for all data-heavy components (use shadcn Skeleton)
   - Suspense boundaries on all async RSC

4. Onboarding wizard for new schools:
   - Step 1: School basic info
   - Step 2: Create first class
   - Step 3: Add first teacher
   - Step 4: Customize landing page (preview)
   - Step 5: Invite teachers
   - Checklist on dashboard until complete

5. Mobile responsive:
   - All dashboards must work on tablet (768px)
   - Parent portal: mobile-first (375px min)
   - Test sidebar collapse on mobile

6. Error handling:
   - error.tsx in all route groups
   - not-found.tsx for invalid school slugs
   - Global error boundary

7. Deploy to Vercel:
   - Environment variables in Vercel dashboard
   - Preview deployments for PRs
   - Production on main branch
```

---

## VERIFICATION CHECKLIST (Before Each Step)

- [ ] All DB queries have `schoolId` filter
- [ ] No money stored as float — paise integers only
- [ ] Dates displayed in DD/MM/YYYY IST format
- [ ] No sensitive operations on client components
- [ ] Zod validation on all Server Action inputs
- [ ] revalidatePath called after all mutations
- [ ] Loading states with Suspense/Skeleton
- [ ] Mobile responsive (test at 375px and 768px)
- [ ] TypeScript strict — no `any` types
- [ ] Environment variables not hardcoded

---

## ENVIRONMENT VARIABLES REFERENCE
See `.env.example` for all required variables and where to get them.

## USEFUL COMMANDS
```bash
pnpm dev                    # Start all apps
pnpm --filter web dev       # Start only Next.js
pnpm prisma studio          # Open Prisma Studio
pnpm prisma db push         # Push schema changes
pnpm prisma db seed         # Seed test data
pnpm prisma generate        # Regenerate client after schema changes
pnpm build                  # Build all packages (Turborepo)
pnpm lint                   # Lint all packages
```
