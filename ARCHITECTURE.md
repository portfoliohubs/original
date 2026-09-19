# PortfolioHubs — New Zero-Cost Architecture & Schema Specification

## 1. Executive Summary & Architectural Decisions

PortfolioHubs is a zero-cost, high-performance platform for dentists and dental students, hosted exclusively on **GitHub Pages** with **Firebase Auth & Firestore**.

### Locked Architectural Directives:
1. **Zero Billing & Zero-Cost Forever**: Strict prohibition of paid APIs, Firebase Cloud Functions, and Firebase Storage (which is no longer free for new projects).
2. **Permanent Image Storage**: Firestore **NEVER** holds any permanent image data. Images are compressed client-side, held ephemerally in a temporary staging sub-collection (`pending_uploads`), and written permanently as physical static WebP files into the GitHub repository via GitHub Actions.
3. **Firestore 1MB Bug Eradication**: The monolithic `cases` array inside a single portfolio document is decommissioned. Each clinical case is stored in its own independent document under `users/{uid}/cases/{caseId}`.
4. **Instant Static HTML SEO**: Public doctor portfolios are true static HTML files generated at build time by Hugo / Node build scripts and served directly from GitHub Pages CDN. Zero runtime JavaScript or Firestore queries are needed for visitors or search crawlers.
5. **Brand Identity**: Hotmart-inspired UX (stepper navigation, collapsible sidebar, dense cards, auto-saving forms) while strictly preserving the existing PortfolioHubs **Medical Cyan-Blue Brand Palette** (`#0e7490` Light / `#06b6d4` Dark).
6. **Free-Tier Limits**: Maximum of 3 clinical cases free. Attempting to add a 4th case presents a pre-composed WhatsApp contact prompt linked to `https://wa.me/201271476215`.

---

## 2. New Firestore Schema Design

```
firestore-root
│
├── users/ {uid}                          (Document: Doctor metadata - text only)
│   ├── cases/ {caseId}                   (Sub-collection: 1 doc per case)
│   └── pending_uploads/ {uploadId}       (Sub-collection: Ephemeral staging <= 500KB)
│
├── publications/ {uid}                   (Document: Approval & publishing status)
│
├── slugs/ {slug}                         (Document: Slug reservation -> uid)
│
└── admins/ {email}                       (Document: Allowed admin emails)
```

---

### Collection: `users/{uid}`
*Purpose*: Stores primary doctor profile information, educational background, contact links, and skills. **Pure text only — NO base64 image strings.**

```typescript
interface UserProfileDocument {
  uid: string;
  fullName: string;
  fullNameAr?: string;
  title: string;                         // e.g. "Restorative Dentist"
  titleAr?: string;
  bio?: string;
  bioAr?: string;
  graduationYear: string;                // e.g. "2024"
  university: string;                    // e.g. "Cairo University"
  universityAr?: string;
  clinicName?: string;
  clinicNameAr?: string;
  locationAddress?: string;
  locationAddressAr?: string;
  locationLat?: string;
  locationLng?: string;
  phone: string;
  whatsapp: string;
  email: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  bookingLink?: string;
  
  // Photo references (Stored strictly as filenames or relative repository paths, NOT base64)
  profilePhotoPath?: string;            // e.g. "doctors/dr-ahmed-ali/profile.webp"
  profileThumbnailPath?: string;        // e.g. "doctors/dr-ahmed-ali/profile_thumb.webp"
  
  // Skills arrays
  clinicalSkills: string[];
  clinicalSkillsAr?: string[];
  digitalSkills: string[];
  digitalSkillsAr?: string[];
  softSkills: string[];
  softSkillsAr?: string[];
  
  // Timeline events
  timeline: Array<{
    year: string;
    event: string;
    eventAr?: string;
  }>;
  
  caseCount: number;                    // Tracked count of cases (max 3 free)
  active: boolean;                      // Online/offline toggle
  createdAt: string;                    // ISO 8601
  updatedAt: string;                    // ISO 8601
}
```

---

### Sub-collection: `users/{uid}/cases/{caseId}`
*Purpose*: Each clinical case is an independent document. This fundamentally solves the Firestore 1MB document limit, allowing dozens of cases without document size contention.

```typescript
interface ClinicalCaseDocument {
  id: string;                           // Generated case ID (e.g. "case_1710892019123")
  uid: string;                          // Owner doctor UID
  title: string;                        // e.g. "Full Mouth Composite Restoration"
  titleAr?: string;
  category: string;                     // e.g. "Restorative", "Endodontics", "Orthodontics"
  categoryAr?: string;
  customCategory?: string;
  description: string;
  descriptionAr?: string;
  treatmentType?: string;               // e.g. "Direct Veneers", "Class II", "Root Canal"
  patientAge?: string;
  sessionCount?: number;
  
  // Static image references committed in repository (NO BASE64 IN THIS DOCUMENT)
  photoPath: string;                    // e.g. "doctors/dr-ahmed-ali/cases/case_1_full.webp"
  thumbnailPath: string;                // e.g. "doctors/dr-ahmed-ali/cases/case_1_thumb.webp"
  
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
```

---

### Sub-collection: `users/{uid}/pending_uploads/{uploadId}`
*Purpose*: **Ephemeral staging document**. When a doctor selects or changes an image, the client-side Web Worker compresses the image to a high-density WebP (≤ 500 KB) and writes a staging record here. 
**Lifespan**: Exists only until the next GitHub Actions build cycle or automated workflow transfers the image into the Git repository, after which it is **permanently deleted**.

```typescript
interface PendingUploadDocument {
  uploadId: string;                     // e.g. "upl_1710892039123"
  uid: string;                          // Doctor UID
  targetType: 'profile' | 'case';       // Target entity
  targetId?: string;                    // caseId (if targetType == 'case')
  fileName: string;                     // Proposed filename e.g. "case_1_full.webp"
  contentType: 'image/webp';
  base64: string;                       // WebP image data (Enforced <= 685,000 chars / <= 500 KB binary)
  thumbnailBase64?: string;             // 400px thumbnail WebP data
  fileSizeBytes: number;                // Actual compressed bytes
  originalSizeBytes: number;            // Original uploaded bytes
  reductionRatio: number;               // Percentage reduced (e.g. 78.4%)
  createdAt: string;
}
```

---

### Collection: `publications/{uid}`
*Purpose*: Independent collection controlling the review, approval, and deployment lifecycle.
*Security Requirement*: **Doctors cannot approve their own portfolios.** The `approved` and `status: 'approved'` states can only be written by an authorized administrator.

```typescript
interface PublicationDocument {
  uid: string;
  slug: string;                         // Unique URL slug e.g. "dr-ahmed-ali"
  doctorName: string;
  email: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  hasUnreviewedChanges: boolean;
  adminNotes?: string;
  approved: boolean;                    // Admin-only write
  approvedBy?: string;                  // Admin email/uid
  approvedAt?: string;                  // ISO 8601
  submittedAt?: string;                 // ISO 8601
  deployedCommitSha?: string;           // Associated Git commit on GitHub Pages
}
```

---

## 3. End-to-End Image Lifecycle (Zero-Cost & Zero Firebase Storage)

```
[Doctor in Browser]
       │
       ▼
1. User selects image (JPEG, PNG, HEIC, up to 25MB)
       │
       ▼
2. Web Worker (`compressDentalImage` in src/lib/imageCompressor.ts)
   - Resizes to max 1600px width/height.
   - Encodes to WebP (0.82 quality).
   - Generates 400px WebP thumbnail.
   - Iterative check: If file size > 500 KB, dynamically drops quality/dimensions until <= 500 KB.
   - UI thread remains 100% fluid (0ms UI lag).
       │
       ▼
3. Writes ephemeral staging doc to Firestore:
   `users/{uid}/pending_uploads/{uploadId}` (Total payload < 650KB)
       │
       ▼
4. GitHub Actions Trigger (or Admin Approval Dispatch)
   - Workflow downloads pending uploads via GitHub Action script using Node.js + Firebase Admin.
   - Saves binary WebP files directly into repository:
     `public/doctors/{slug}/images/{fileName}`
   - Updates `users/{uid}/cases/{caseId}` with the static relative path.
   - PERMANENTLY DELETES `users/{uid}/pending_uploads/{uploadId}` from Firestore.
       │
       ▼
5. Static Site Generation (Hugo / Vite)
   - Generates static `dist/{slug}/index.html` referencing `<img src="./images/{fileName}" />`.
   - Commits and deploys static assets to GitHub Pages CDN.
       │
       ▼
[Zero Storage Cost, Zero Base64 in Firestore, Instant CDN Delivery, 100% Lighthouse Performance]
```

---

## 4. Static HTML Generation & SEO Architecture

### Why the previous setup suffered in SEO:
1. Base64 strings embedded in HTML bloated document sizes to 1.5MB+ per page, drastically violating Google Core Web Vitals (Largest Contentful Paint) and consuming crawl budgets.
2. Relying on SPA client-side JavaScript rendering meant search engine bots that index synchronously or without headless JavaScript execution received an empty `<div id="root"></div>`.

### The New Architecture:
1. **Pre-rendered Static HTML**: Every doctor's portfolio is compiled directly into a self-contained, high-performance static HTML file (`dist/{slug}/index.html`) using the Hugo static template or pre-rendering script.
2. **Schema.org Structured Data**: Each doctor's page embeds a rich `MedicalBusiness` / `Dentist` JSON-LD schema:
   ```html
   <script type="application/ld+json">
   {
     "@context": "https://schema.org",
     "@type": "Dentist",
     "name": "Dr. Ahmed Ali",
     "image": "https://portfoliohubs.github.io/dr-ahmed-ali/images/profile.webp",
     "telephone": "+201271476215",
     "medicalSpecialty": "Dentistry",
     "address": {
       "@type": "PostalAddress",
       "streetAddress": "Nasr City",
       "addressLocality": "Cairo",
       "addressCountry": "EG"
     }
   }
   </script>
   ```
3. **OpenGraph & Twitter Cards**: Native `<meta property="og:image">` tags pointing to real static WebP files.
4. **Indexing Velocity**: Static HTML hosted on GitHub Pages is indexed by Googlebot in 48–72 hours without rendering delays.

---

## 5. Hotmart-Style UI/UX & Brand Blue Color Palette

The interface layout is designed around modern SaaS paradigms (Hotmart-inspired), while maintaining strict fidelity to the PortfolioHubs medical brand:

*   **Primary Brand Blue**: `#0e7490` (Deep Medical Cyan / Primary in Light Mode)
*   **Vibrant Brand Accent**: `#06b6d4` (Cyan-500 / Primary in Dark Mode)
*   **Brand Line / Highlight**: `#0ab4fc` (Vibrant Medical Blue)
*   **Structural Layout**:
    *   **Collapsible Sidebar**: Left-hand navigation (RTL: right-hand) with quick section jumps (`Overview`, `Profile`, `Cases`, `Settings`, `Status`).
    *   **Linear Stepper**: Visual completion indicator showing percentage of portfolio completeness.
    *   **High-Density Bento Cards**: Clean padding, subtle borders, no bloated margins.
    *   **Auto-Save Indicators**: Real-time debounce feedback (`Saving...`, `Saved to cloud`).

---

## 6. Free Tier Limit Enforcement (3 Cases Maximum)

In compliance with the locked architectural rule:
*   A user is permitted to create up to **3 clinical cases** free.
*   When a user attempts to add a 4th case, the UI intercepts the action and displays an informative dialog:
    *   **Notice**: "You have reached the free limit of 3 clinical cases. Upgrade to display unlimited cases and premium features."
    *   **Direct WhatsApp Action**: Opens `https://wa.me/201271476215?text={encoded_message}`.
    *   **Encoded Message Template**:
        `"مرحباً دكتور، أنا د. [اسم الطبيب]، أود تفعيل باقة الحالات غير المحدودة في PortfolioHubs."`
