/**
 * @file serverAutomation.ts
 * @description Advanced automation backend router for LoomHost AI: AI Image-to-Code, AI SEO Optimizer, and Uptime Monitor backend logic.
 * Organized as an Express router to mount cleanly inside server.ts.
 */

import express from "express";
import multer from "multer";
import { GoogleGenAI, Type } from "@google/genai";

export const automationRouter = express.Router();

// Configure multer memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("الملف المرفوع ليس صورة صالحة. الرجاء رفع صورة (PNG, JPEG, WebP)."));
    }
  }
});

// Lazy-initialized Gemini Client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    geminiClient = new GoogleGenAI({
      apiKey: key || "MOCK_KEY_FOR_STANDBY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return geminiClient;
}

/**
 * FEATURE A: Image-to-Code Converter
 * POST /api/automation/image-to-code
 * Parses screenshot or design to clean semantic web code (HTML, CSS, JS) matching the app's standard editor context.
 */
automationRouter.post("/api/automation/image-to-code", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "الرجاء رفع صورة التصميم المطلوب تحويلها لكود." });
    }

    const ai = getGeminiClient();
    const base64Image = file.buffer.toString("base64");

    const imagePart = {
      inlineData: {
        mimeType: file.mimetype,
        data: base64Image,
      }
    };

    const promptMessage = `تحليل لقطة شاشة التصميم وتحويلها إلى كود واجهة ويب تفاعلي كامل ومكتوب باللغة العربية بأسلوب احترافي وفاخر.
المطلوب هو فصل الأكواد بالكامل وإرجاعها في بنية JSON دقيقة مطابقة للمواصفات الآتية:
1. كود HTML لجسد الصفحة فقط (بدون وسوم html, head, body, style, script). يجب أن يكون الهيكل غنياً ومصمماً بذكاء مستخدماً كلاسات Tailwind CSS الشهيرة والجميلة (ونظام ألوان غامق فاخر Dark Mode).
2. كود CSS لتخصيص الهوية والتحركات اللطيفة أو التأثيرات المتقدمة (والهوفر).
3. كود JS لإضافة لمسات تفاعلية حية (مثلاً: فتح بوب اب، عدادات ديناميكية، أزرار نشطة، الخ).
4. شرح باللغة العربية لما قمت بصياغته فلسفياً.`;

    const systemInstruction = `You are a world-class UI/UX design-to-code converter. Your job is to inspect modern screenshots and convert them to semantic, gorgeous, and fully complete HTML structures, clean customized CSS styles, and interactive JS. You MUST output your response in the requested JSON structure. Keep Arabic language as the primary content if appropriate.`;

    console.log("[Automation Backend] Transforming uploaded image to code via Gemini 3.5 Flash...");
    
    // Call Gemini 3.5 Flash (Perfect Multimodal Capability)
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: {
        parts: [imagePart, { text: promptMessage }]
      },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["html", "css", "js", "explanation", "name", "description"],
          properties: {
            name: {
              type: Type.STRING,
              description: "اسم مقترح للموقع المولّد (بالعربية)"
            },
            description: {
              type: Type.STRING,
              description: "وصف ملخص وقصير للواجهة المستخلصة"
            },
            html: {
              type: Type.STRING,
              description: "كود HTML الهيكلي النظيف فقط للجزء الداخلي (بدون head, body, script, style)"
            },
            css: {
              type: Type.STRING,
              description: "كود CSS كامل ومنسق للهوية والأنيميشنز"
            },
            js: {
              type: Type.STRING,
              description: "كود Javascript تفاعلي حقيقي متوافق مع معرّفات الـ HTML المنتجة"
            },
            explanation: {
              type: Type.STRING,
              description: "شرح باللغة العربية للتعديلات ومميزات التصميم"
            }
          }
        },
        temperature: 0.9,
      }
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error("لم تتلق استجابة صالحة من محرك الذكاء الاصطناعي.");
    }

    const parsedCode = JSON.parse(outputText.trim());
    res.json(parsedCode);

  } catch (err: any) {
    console.error("Backend Image-to-Code error details:", err);
    res.status(500).json({ error: err?.message || "حدث إخفاق داخلي أثناء محاولة تحويل الصورة وتحليل الهيكل السحابي." });
  }
});

/**
 * FEATURE B: AI SEO Optimizer
 * POST /api/automation/seo-optimize
 * Inspects host site codebase and generates meta tags, titles, image alts, and key recommendations.
 */
automationRouter.post("/api/automation/seo-optimize", async (req, res) => {
  try {
    const { html, css, js, siteName } = req.body;
    if (!html) {
      return res.status(400).json({ error: "الرجاء توفير كود الموقع (HTML) للقيام بفحص السيو." });
    }

    const ai = getGeminiClient();
    const seoPrompt = `قم بتحليل كود الصفحة ومحتواها البرمجي، وقم بتوليد حزمة السيو الفوقية (SEO Optimizer Pack) بالكامل باللغة العربية:
1. عنوان الموقع الأمثل (Title) بالنظر لمستوى التباين والمجال التجاري.
2. الكلمات المفتاحية والـ Meta Tags الفاخرة بالكامل (Meta description, keywords, OpenGraph tags, Robots etc.) جاهزة للنسخ والحقن.
3. معرّفات Alt Text مقترحة لجميع الصور المستخرجة (أو أي وسم img لا يحتوي alt أو يحتاج تحسين).
4. اقتراحات عملية مختصرة وذكية لتحسين سرعة وأرشفة الموقع في صفحات بحث جوجل وجذب عملاء أكثر.

كود الموقع الحالي لـ "${siteName || "موقعي"}":
--- HTML:
${html}

--- CSS:
${css || ""}

--- JS:
${js || ""}`;

    const systemInstruction = `You are an elite SEO auditor and content architect specialized in improving search visibility and organic ranking. Analyse code structures and return a strictly structured JSON response containing recommended Title, Meta tags list, Alt attributes recommendations, and general performance insights. All recommendations should be in eloquent Arabic.`;

    console.log("[Automation Backend] Optimizing SEO with Gemini 3.5 Flash for site:", siteName);

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: seoPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["title", "metaTags", "altTextSuggestions", "seoAdvice"],
          properties: {
            title: {
              type: Type.STRING,
              description: "عنوان الصفحة المقترح الفاخر والمحسن لمحركات البحث (SEO Title)"
            },
            metaTags: {
              type: Type.STRING,
              description: "أكواد الـ Meta Tags المقترحة مجمعة وجاهزة للحقن في جزء head"
            },
            altTextSuggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  selector: { type: Type.STRING, description: "معرّف المكون أو الكلاس أو جزء الصورة المطلوب التحسين له" },
                  existingAlt: { type: Type.STRING, description: "الـ Alt المتواجد حالياً إن وجد" },
                  suggestedAlt: { type: Type.STRING, description: "الـ Alt المقترح البليغ باللغة العربية" }
                }
              },
              description: "قائمة اقتراحات ممشوقة لخواص alt لجميع صور الموقع لتهيئة إمكانية الوصول والأرشفة الصداقة لجوجل"
            },
            seoAdvice: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "مجموعة نصائح جراحية ذكية لتسريع تحميل الموقع وأرشفته"
            }
          }
        },
        temperature: 0.8
      }
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error("حدث خطأ أثناء فحص السيو بالذكاء الاصطناعي.");
    }

    const parsedSeo = JSON.parse(outputText.trim());
    res.json(parsedSeo);

  } catch (err: any) {
    console.error("Backend SEO Optimizer error:", err);
    res.status(500).json({ error: err?.message || "فشل محرك السلايد السحابي في تحسين السيو لهذه الصفحة." });
  }
});

/**
 * FEATURE C: Manual/Instant Ping Check for Uptime Monitor
 * POST /api/automation/ping-site
 * Simulates a high-precision live health and response time analytics check for the tenant container.
 */
automationRouter.post("/api/automation/ping-site", (req, res) => {
  try {
    const { siteId } = req.body;
    if (!siteId) {
      return res.status(400).json({ error: "الرجاء توفير معرّف المشروع للقيام بفحص الاتصال الفوري." });
    }

    // In-memory response time simulation (matching latency guidelines)
    const activeLatency = Math.floor(Math.random() * (120 - 35 + 1) + 35); // 35ms to 120ms
    const isSuccess = Math.random() < 0.985; // 98.5% uptime simulation

    res.json({
      success: true,
      siteId: siteId,
      status: isSuccess ? "Active" : "Down",
      responseTimeMs: activeLatency,
      timestamp: new Date().toISOString(),
      checkedUrl: `https://${siteId}.omar.com`,
      protocol: "HTTPS / HTTP2.0 Secured",
      dnsPropagation: "99.98% Synced worldwide"
    });

  } catch (err: any) {
    res.status(500).json({ error: "فشل التحقق الفوري من استجابة بروتوكول Uptime الحية." });
  }
});
