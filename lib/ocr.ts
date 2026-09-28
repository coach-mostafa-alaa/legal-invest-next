import Tesseract from "tesseract.js";

export interface ExtractedData {
  name: string;
  number: string;
  letter: string;
  year: string;
  office: string;
}

export async function extractFromImage(
  imageData: string | File | Blob,
  onProgress?: (p: number) => void
): Promise<ExtractedData> {
  const result = await Tesseract.recognize(imageData, "ara+eng", {
    logger: (m) => {
      if (m.status === "recognizing text" && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });

  const text = result.data.text;
  return parseAttorneyText(text);
}

function parseAttorneyText(text: string): ExtractedData {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  // استخراج رقم التوكيل
  const numberMatch = text.match(/رقم[:\s]+(\d+)/);
  const number = numberMatch?.[1] || "";

  // استخراج السنة
  const yearMatch = text.match(/20\d{2}/);
  const year = yearMatch?.[0] || new Date().getFullYear().toString();

  // استخراج الحرف
  const letterMatch = text.match(/حرف[:\s]+([أ-ي])/);
  const letter = letterMatch?.[1] || "";

  // استخراج مكتب التوثيق
  const officeMatch = text.match(/مكتب[:\s]+([^\n]+)/);
  const office = officeMatch?.[1]?.trim() || "";

  // استخراج اسم الموكل — عادةً أول سطر فيه حروف عربية فقط
  const nameLines = lines.filter(l =>
    /[\u0600-\u06FF]/.test(l) &&
    l.length > 5 &&
    !l.includes("مكتب") &&
    !l.includes("رقم") &&
    !l.includes("توثيق")
  );
  const name = nameLines[0] || "";

  return { name, number, letter, year, office };
}
