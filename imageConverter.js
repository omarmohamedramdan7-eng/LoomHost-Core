/**
 * @file imageConverter.js
 * @description وحدة برمجية معيارية (Modular) لتحويل صور لقطات الشاشة (Screenshots)
 * إلى كود HTML و Tailwind CSS نظيف باستخدام Gemini 3.5 Flash وحفظه في index.html للمشروع.
 * 
 * تمّ كتابتها كـ Express Router لتسهيل الدمج المباشر مع الخادم الفرعي (server.ts).
 */

import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";

// 1. تحديد موجّه المسارات البرمجية (Router)
export const imageConverterRouter = express.Router();

// 2. إعداد مكتبة Multer لالتقاط وحفظ الصورة المرفوعة في الذاكرة (Memory Storage) لتفادي تراكم الملفات الزائدة
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // الحد الأقصى لحجم الملف: 10 ميغابايت
  },
  fileFilter: (req, file, cb) => {
    // التأكد من أن الملف المرفوع هو صورة صالحة بالفعل
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("الملف المرفوع ليس صورة. يرجى رفع ملف صورة صالح (JPEG, PNG, WebP)."));
    }
  }
});

// 3. تهيئة متصفح Gemini باستخدام مكتبة @google/genai الرسمية الحديثة
let geminiClient = null;
function getGeminiClient() {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("لم يتم العثور على مفتاح البيئة لـ GEMINI_API_KEY. يرجى تهيئته أولاً.");
    }
    geminiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build', // متطلب أساسي في منصة AI Studio
        }
      }
    });
  }
  return geminiClient;
}

/**
 * Executes a content generation with automatic model fallback of @google/genai
 */
async function generateContentWithFallback(ai, params, fallbackModels = ["gemini-3.1-pro-preview", "gemini-3.1-flash-lite"]) {
  const modelsToTry = [params.model, ...fallbackModels.filter(m => m !== params.model)];
  let lastError = null;
  
  for (const modelName of modelsToTry) {
    try {
      console.log(`[Gemini Converter Resilience] Attempting generation with model: ${modelName}`);
      const updatedParams = { ...params, model: modelName };
      const response = await ai.models.generateContent(updatedParams);
      return response;
    } catch (err) {
      lastError = err;
      console.warn(`[Gemini Converter Fallback Warning] Model ${modelName} failed/overloaded. Error: ${err?.message || err}.`);
    }
  }
  throw lastError || new Error("All fallback models exhausted and failed.");
}

/**
 * @route POST /api/image-to-code
 * @desc استقبال صورة، ومعالجتها بالذكاء الاصطناعي، ثم حفظها كـ index.html للمستخدم.
 * @access Public
 */
imageConverterRouter.post("/api/image-to-code", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    // التأكد من تواجد الصورة في الطلب المرفوع
    if (!file) {
      return res.status(400).json({ error: "الرجاء توفير ملف الصورة المطلوب تحويلها." });
    }

    // تحديد مجلد حفظ المشروع (مثلاً: أخذ معرّف المشروع من مدخلات النموذج أو استخدام مجلد افتراضي)
    const projectId = req.body.projectId || "default_user_project";

    // 1. استدعاء عميل Gemini الذكي
    const ai = getGeminiClient();

    // 2. تحويل الصورة المرفوعة من Buffer ثنائي إلى صيغة Base64 المطلوبة لمصفوفة أجزاء Gemini
    const base64Image = file.buffer.toString("base64");

    // 3. إعداد أجزاء (Parts) المستند للذكاء الاصطناعي (Multimodal Request payload)
    const imagePart = {
      inlineData: {
        mimeType: file.mimetype,
        data: base64Image,
      }
    };

    const textPart = {
      text: "قم بتحليل هذه الصورة واستخراج الهيكل البرمجي لها باستخدام HTML و Tailwind CSS. أعد الكود كملف واحد جاهز للتشغيل."
    };

    console.log(`[ImageConverter] بدء تحليل ومعالجة الصورة للمشروع: ${projectId} عبر Gemini 3.5 Flash...`);

    // 4. استدعاء النموذج الفائق Gemini 3.5 Flash مع تفعيل الموثوقية التلقائية والتبديل عند الحاجة
    const geminiResponse = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: { 
        parts: [imagePart, textPart] 
      }
    });

    const generatedText = geminiResponse.text;
    if (!generatedText) {
      throw new Error("لم يقم الذكاء الاصطناعي بإرجاع أي مخرجات نصية.");
    }

    // 5. تصفية النص المنتج واستخلاص كود HTML النظيف (في حال قام Gemini بتضمينه داخل علامات ```html )
    let cleanHtmlCode = generatedText.trim();
    if (cleanHtmlCode.startsWith("```html")) {
      cleanHtmlCode = cleanHtmlCode.substring(7);
      if (cleanHtmlCode.endsWith("```")) {
        cleanHtmlCode = cleanHtmlCode.substring(0, cleanHtmlCode.length - 3);
      }
    } else if (cleanHtmlCode.startsWith("```")) {
      cleanHtmlCode = cleanHtmlCode.substring(3);
      if (cleanHtmlCode.endsWith("```")) {
        cleanHtmlCode = cleanHtmlCode.substring(0, cleanHtmlCode.length - 3);
      }
    }
    cleanHtmlCode = cleanHtmlCode.trim();

    // 6. تحديد المسار الكامل وحفظ الكود المنتج في ملف index.html داخل مجلد المشروع
    const projectFolder = path.join(process.cwd(), "user_projects", projectId);
    
    // إنشاء المجلد إذا لم يكن موجوداً من قبل بالوراثة
    if (!fs.existsSync(projectFolder)) {
      fs.mkdirSync(projectFolder, { recursive: true });
    }

    const outputFilePath = path.join(projectFolder, "index.html");
    fs.writeFileSync(outputFilePath, cleanHtmlCode, "utf8");

    console.log(`[ImageConverter] تم حفظ الكود النهائي بنجاح في المسار: ${outputFilePath}`);

    // 7. صياغة الاستجابة الناجحة
    return res.status(200).json({
      success: true,
      message: "تم تحليل الصورة واستخراج كود التصميم بنجاح وحفظه في ملف index.html الخاص بك.",
      projectId: projectId,
      filePath: outputFilePath,
      code: cleanHtmlCode,
    });

  } catch (err) {
    console.error("[ImageConverter Critical Error]:", err);
    return res.status(500).json({
      error: err.message || "حدث إخفاق داخلي أثناء معالجة الصورة وتحويلها.",
    });
  }
});
