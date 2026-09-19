// Central Type Definitions for PortfolioHubs

export interface ClinicalCasePhoto {
  uploadId?: string;
  url?: string;            // Cloud/CDN static path (e.g. "doctors/dr-ahmed/cases/case1_before.webp")
  previewUrl?: string;     // Local object URL or thumbnail for instant UI display
  originalSizeKb?: number;
  compressedSizeKb?: number;
  reductionRatioPercent?: number;
  role: 'before' | 'after' | 'additional';
}

export interface ClinicalCase {
  id: string;               // Unique document ID (e.g. "case_1710892019123")
  uid: string;              // Owner doctor UID
  title: string;            // Case title (English)
  titleAr?: string;         // Case title (Arabic)
  category: string;         // Standard category ID (e.g. 'operative', 'endodontics')
  categoryAr?: string;
  customCategory?: string;  // If category === 'custom'
  description?: string;
  descriptionAr?: string;
  treatmentType?: string;   // e.g. "Direct Composite Veneers"
  patientAge?: string;
  sessionCount?: number;

  // New multi-photo structure (Zero Base64 in Firestore case document)
  beforePhoto?: ClinicalCasePhoto;
  afterPhoto?: ClinicalCasePhoto;
  additionalPhotos?: ClinicalCasePhoto[];

  // Legacy compatibility fields
  photo?: string;           // Kept for backward compatibility
  preview?: string;
  originalSizeKb?: number;
  compressedSizeKb?: number;

  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PendingUploadDocument {
  uploadId: string;
  uid: string;
  targetType: 'profile' | 'case';
  targetId?: string;        // caseId if targetType === 'case'
  photoRole?: 'profile' | 'before' | 'after' | 'additional';
  fileName: string;
  contentType: 'image/webp';
  base64: string;           // Enforced <= 685,000 chars / <= 500 KB binary
  thumbnailBase64?: string; // 400px thumbnail
  fileSizeBytes: number;
  originalSizeBytes: number;
  reductionRatio: number;
  createdAt: string;
}

export interface Milestone {
  year: string;
  event: string;
  eventAr?: string;
}

export interface PortfolioData {
  uid?: string;
  fullName: string;
  fullNameAr?: string;
  title: string;
  titleAr?: string;
  graduationYear: string;
  university: string;
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
  profilePhoto?: string;
  profilePreview?: string;
  profilePhotoPath?: string;
  clinicalSkills: string[];
  digitalSkills: string[];
  softSkills: string[];
  clinicalSkillsAr?: string[];
  digitalSkillsAr?: string[];
  softSkillsAr?: string[];
  timeline: Milestone[];
  cases: ClinicalCase[];
  status: 'draft' | 'pending_review' | 'published' | 'rejected';
  packageTier?: string;
  caseLimit?: number;
  caseCount?: number;
  active?: boolean;
  hasUnreviewedChanges?: boolean;
  paymentConfirmed?: boolean;
  adminNotes?: string;
  migratedToSubcollection?: boolean;
  updatedAt?: string;
  createdAt?: string;
}
