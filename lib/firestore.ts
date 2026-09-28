import {
  collection, addDoc, getDocs, getDoc, doc,
  updateDoc, deleteDoc, query, where, orderBy,
  serverTimestamp, Timestamp
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "./firebase";

export interface Attorney {
  id?: string;
  name: string;
  number: string;
  letter: string;
  year: string;
  office: string;
  seqNumber?: number;       // رقم تسلسلي داخل السنة
  location?: string;        // مكان وجود التوكيل
  filePath?: string;        // رابط الملف في Firebase Storage
  fileName?: string;        // اسم الملف
  imageUrl?: string;        // رابط الصورة الضوئية
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ActivityLog {
  id?: string;
  userName: string;
  action: string;
  details?: string;
  createdAt?: Timestamp;
}

// ── جيب الرقم التسلسلي التالي لسنة معينة ──
export async function getNextSeqNumber(year: string): Promise<number> {
  const q = query(collection(db, "attorneys"), where("year", "==", year));
  const snap = await getDocs(q);
  if (snap.empty) return 1;
  const nums = snap.docs
    .map(d => (d.data() as Attorney).seqNumber || 0)
    .filter(n => n > 0);
  return nums.length > 0 ? Math.max(...nums) + 1 : 1;
}

// ── إضافة توكيل جديد ──
export async function addAttorney(data: Omit<Attorney, "id" | "createdAt" | "updatedAt">) {
  const seqNumber = await getNextSeqNumber(data.year);
  return await addDoc(collection(db, "attorneys"), {
    ...data,
    seqNumber,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// ── تحديث توكيل ──
export async function updateAttorney(id: string, data: Partial<Attorney>) {
  const ref = doc(db, "attorneys", id);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

// ── حذف توكيل ──
export async function deleteAttorney(id: string, fileName?: string) {
  if (fileName) {
    try {
      const fileRef = ref(storage, `attorneys/${fileName}`);
      await deleteObject(fileRef);
    } catch (_) {}
  }
  await deleteDoc(doc(db, "attorneys", id));
}

// ── رفع ملف (صورة/PDF) ──
export async function uploadFile(file: File, attorneyName: string): Promise<{ url: string; fileName: string }> {
  const ext = file.name.split(".").pop();
  const fileName = `${attorneyName}.${ext}`;
  const fileRef = ref(storage, `attorneys/${fileName}`);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);
  return { url, fileName };
}

// ── رفع صورة ضوئية من الكاميرا ──
export async function uploadScanImage(blob: Blob, attorneyName: string): Promise<{ url: string; fileName: string }> {
  const fileName = `${attorneyName}_scan_${Date.now()}.jpg`;
  const fileRef = ref(storage, `scans/${fileName}`);
  await uploadBytes(fileRef, blob, { contentType: "image/jpeg" });
  const url = await getDownloadURL(fileRef);
  return { url, fileName };
}

// ── البحث ──
export async function searchAttorneys(q: string): Promise<Attorney[]> {
  const snap = await getDocs(collection(db, "attorneys"));
  const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Attorney));
  const lower = q.toLowerCase();
  return all.filter(a =>
    a.name?.includes(q) ||
    a.number?.includes(q) ||
    a.office?.includes(q) ||
    a.year?.includes(q) ||
    a.letter?.includes(q) ||
    a.location?.includes(q)
  );
}

// ── جيب كل التوكيلات ──
export async function getAllAttorneys(): Promise<Attorney[]> {
  const snap = await getDocs(
    query(collection(db, "attorneys"), orderBy("year", "desc"))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Attorney));
}

// ── جيب توكيلات سنة معينة مرتبة أبجدياً ──
export async function getAttorneysByYear(year: string): Promise<Attorney[]> {
  const q = query(
    collection(db, "attorneys"),
    where("year", "==", year),
    orderBy("seqNumber", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Attorney));
}

// ── سجل النشاط ──
export async function logActivity(userName: string, action: string, details?: string) {
  await addDoc(collection(db, "activity_log"), {
    userName, action, details: details || "",
    createdAt: serverTimestamp(),
  });
}

// ── جيب السجلات ──
export async function getActivityLogs(): Promise<ActivityLog[]> {
  const q = query(collection(db, "activity_log"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ActivityLog));
}
