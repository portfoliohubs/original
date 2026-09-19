import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  writeBatch, 
  serverTimestamp,
  updateDoc,
  increment,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';
import { compressDentalImage, CompressionResult } from './imageCompressor';
import { cleanFirestoreData } from './firestoreUtils';
import { ClinicalCase, ClinicalCasePhoto, PendingUploadDocument } from '../types';

export interface UploadProgressReport {
  stage: 'compressing' | 'uploading' | 'completed' | 'failed';
  step: string;
  percent: number;
  error?: string;
  result?: CompressionResult;
}

/**
 * Compresses an image and writes it as an ephemeral staging record to
 * `users/{uid}/pending_uploads/{uploadId}`.
 * 
 * Guarantees:
 * - Image compressed to WebP <= 500 KB via Web Worker
 * - Before/After size comparison metrics calculated
 * - Pure text reference kept in case document; zero base64 in the permanent case doc
 */
export async function stageCasePhotoUpload(
  uid: string,
  caseId: string,
  photoRole: 'before' | 'after' | 'additional',
  file: File | Blob,
  onProgress?: (progress: UploadProgressReport) => void
): Promise<{ photoRef: ClinicalCasePhoto; uploadId: string }> {
  const uploadId = `upl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fileName = `case_${caseId}_${photoRole}_${Date.now()}.webp`;

  try {
    // 1. Client-Side Web Worker Compression
    onProgress?.({
      stage: 'compressing',
      step: 'ضغط الصورة سريرياً (WebP)...',
      percent: 25,
    });

    const compressionResult = await compressDentalImage(file, {
      maxDimension: 1600,
      thumbnailDimension: 400,
      maxSizeBytes: 500 * 1024, // 500 KB strict limit
    });

    onProgress?.({
      stage: 'uploading',
      step: 'رفع الوثيقة المؤقتة إلى المنصة...',
      percent: 65,
      result: compressionResult,
    });

    // 2. Prepare Ephemeral Staging Record (pending_uploads)
    const pendingDocData: PendingUploadDocument = {
      uploadId,
      uid,
      targetType: 'case',
      targetId: caseId,
      photoRole,
      fileName,
      contentType: 'image/webp',
      base64: compressionResult.webpBase64,
      thumbnailBase64: compressionResult.thumbnailBase64,
      fileSizeBytes: compressionResult.metrics.compressedSizeBytes,
      originalSizeBytes: compressionResult.metrics.originalSizeBytes,
      reductionRatio: compressionResult.metrics.reductionRatioPercent,
      createdAt: new Date().toISOString(),
    };

    const pendingRef = doc(db, 'users', uid, 'pending_uploads', uploadId);
    await setDoc(pendingRef, cleanFirestoreData(pendingDocData));

    // 3. Create Case Photo Reference (No raw base64 in the main document)
    const photoRef: ClinicalCasePhoto = {
      uploadId,
      url: `cases/${fileName}`,
      previewUrl: compressionResult.thumbnailBase64 || compressionResult.webpBase64,
      originalSizeKb: compressionResult.metrics.originalSizeKb,
      compressedSizeKb: compressionResult.metrics.compressedSizeKb,
      reductionRatioPercent: compressionResult.metrics.reductionRatioPercent,
      role: photoRole,
    };

    onProgress?.({
      stage: 'completed',
      step: 'تم تجهيز الصورة بنجاح',
      percent: 100,
      result: compressionResult,
    });

    return { photoRef, uploadId };
  } catch (err: any) {
    console.error(`[stageCasePhotoUpload] Failed for ${caseId} (${photoRole}):`, err);
    onProgress?.({
      stage: 'failed',
      step: 'تعذر رفع ومعالجة الصورة',
      percent: 0,
      error: err.message || 'فشلت معالجة ورفع الصورة. يرجى إعادة المحاولة.',
    });
    throw err;
  }
}

/**
 * Saves or updates a clinical case in users/{uid}/cases/{caseId}
 */
export async function saveClinicalCaseToSubcollection(
  uid: string,
  caseData: ClinicalCase,
  isNew = false
): Promise<void> {
  const caseDocRef = doc(db, 'users', uid, 'cases', caseData.id);
  const now = new Date().toISOString();

  // Strip any heavy legacy base64 strings if accidentally present
  const sanitizedCase: ClinicalCase = {
    ...caseData,
    photo: '', // Kept empty in case doc to prevent 1MB limit
    preview: caseData.afterPhoto?.previewUrl || caseData.beforePhoto?.previewUrl || '',
    updatedAt: now,
    createdAt: caseData.createdAt || now,
  };

  await setDoc(caseDocRef, cleanFirestoreData(sanitizedCase), { merge: true });

  // If newly added, increment doctor's caseCount in users/{uid}
  if (isNew) {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        caseCount: increment(1),
        updatedAt: now,
      });
    } catch {
      // User doc might not exist yet during initial onboarding, will be synced on profile save
    }
  }
}

/**
 * Deletes a clinical case document and all of its associated pending uploads
 * to ensure zero orphaned records in Firestore.
 */
export async function deleteClinicalCaseComplete(
  uid: string,
  caseId: string
): Promise<void> {
  // 1. Find all pending_uploads for this case
  try {
    const pendingQuery = query(
      collection(db, 'users', uid, 'pending_uploads'),
      where('targetId', '==', caseId)
    );
    const pendingSnap = await getDocs(pendingQuery);
    
    if (!pendingSnap.empty) {
      const batch = writeBatch(db);
      pendingSnap.docs.forEach(docSnap => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
    }
  } catch (e) {
    console.warn('[deleteClinicalCaseComplete] Warning cleaning pending uploads:', e);
  }

  // 2. Delete the case document itself
  const caseDocRef = doc(db, 'users', uid, 'cases', caseId);
  await deleteDoc(caseDocRef);

  // 3. Decrement user's caseCount in users/{uid}
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      caseCount: increment(-1),
      updatedAt: new Date().toISOString(),
    });
  } catch {
    // Graceful ignore
  }
}

/**
 * Fetches all clinical cases for a user from `users/{uid}/cases`
 */
export async function fetchUserCases(uid: string): Promise<ClinicalCase[]> {
  try {
    const casesCol = collection(db, 'users', uid, 'cases');
    const q = query(casesCol, orderBy('sortOrder', 'asc'));
    const snap = await getDocs(q);
    
    if (snap.empty) {
      return [];
    }

    return snap.docs.map(d => ({
      id: d.id,
      ...(d.data() as Omit<ClinicalCase, 'id'>)
    }));
  } catch (e) {
    console.warn(`[fetchUserCases] Query with orderBy failed or collection empty, falling back to direct get:`, e);
    try {
      const casesCol = collection(db, 'users', uid, 'cases');
      const snap = await getDocs(casesCol);
      const items = snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<ClinicalCase, 'id'>)
      }));
      return items.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    } catch (fallbackErr) {
      console.error('[fetchUserCases] Could not fetch cases:', fallbackErr);
      return [];
    }
  }
}

/**
 * Batch updates the sort order of multiple cases
 */
export async function reorderCasesInSubcollection(
  uid: string,
  orderedCases: ClinicalCase[]
): Promise<void> {
  const batch = writeBatch(db);
  orderedCases.forEach((c, index) => {
    const ref = doc(db, 'users', uid, 'cases', c.id);
    batch.update(ref, { 
      sortOrder: index,
      updatedAt: new Date().toISOString()
    });
  });
  await batch.commit();
}
