import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { imageBase64, aiSettings } = req.body;
    const activeGeminiKey = aiSettings.geminiApiKey || process.env.GEMINI_API_KEY;
    if (!activeGeminiKey) {
      return res.status(400).json({ error: "مفتاح Gemini API غير متوفر لتحليل الصورة." });
    }

    const customAi = new GoogleGenAI({ apiKey: activeGeminiKey });
    
    let mimeType = 'image/jpeg';
    let base64Data = imageBase64;
    if (imageBase64.startsWith('data:')) {
      const matches = imageBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        base64Data = matches[2];
      }
    }

    const response = await customAi.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        `أنت خبير في وصف الشخصيات لاستخدامها في نماذج توليد الصور للذكاء الاصطناعي.
قم بتحليل هذه الصورة واكتب وصفاً دقيقاً وشاملاً باللغة الإنجليزية للشخصية الموجودة فيها.
تأكد من شمل الملامح، العمر التقريبي، لون البشرة، تصفيفة ولون الشعر، الملابس، وأي خصائص مميزة.
أعد النص باللغة الإنجليزية فقط، ويكون جاهزاً للاستخدام كـ Prompt.`,
        {
          inlineData: {
            data: base64Data,
            mimeType
          }
        }
      ]
    });

    return res.status(200).json({ text: response.text });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
