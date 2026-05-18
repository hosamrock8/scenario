import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/call-ai", async (req, res) => {
    try {
      const { prompt, expectJson, aiSettings } = req.body;
      
      const customModelConfig = aiSettings.customModels?.find((m: any) => m.id === aiSettings.aiModel);
      
      if (customModelConfig || aiSettings.aiModel === 'OpenRouter' || !aiSettings.aiModel.includes('Gemini')) {
        let apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
        let apiKey = aiSettings.openRouterApiKey;
        let modelName = aiSettings.openRouterModel;
        
        if (customModelConfig) {
          // General integration for OpenAI-compatible endpoints or known providers
          apiKey = customModelConfig.apiKey;
          modelName = customModelConfig.modelId;
          const provider = customModelConfig.provider.toLowerCase();
          
          if (provider.includes('openai')) {
             apiUrl = 'https://api.openai.com/v1/chat/completions';
          } else if (provider.includes('anthropic')) {
             // Will hit the anthropic logic block later
          } else if (provider.includes('groq')) {
             apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
          } else if (provider.includes('deepseek')) {
             apiUrl = 'https://api.deepseek.com/chat/completions';
          } else if (provider.includes('together')) {
             apiUrl = 'https://api.together.xyz/v1/chat/completions';
          } else {
             // Default to OpenAI compatible format 
             // Without a specific url we assume it relies on OpenRouter config?
             // Actually, if the provider is custom but standard, let's just assume OpenAI compatibility if they didn't specify URL.
             // We could allow a URL in customModelConfig, but we don't have it yet.
          }
        }

        if (aiSettings.aiModel.includes('GPT') || customModelConfig?.provider.toLowerCase().includes('openai')) {
          apiUrl = 'https://api.openai.com/v1/chat/completions';
          if (!customModelConfig) {
            apiKey = aiSettings.openaiApiKey;
            modelName = aiSettings.openaiModel;
          }
        } else if (aiSettings.aiModel.includes('Claude') || customModelConfig?.provider.toLowerCase().includes('anthropic')) {
          if (!customModelConfig && !aiSettings.anthropicApiKey) {
            return res.status(400).json({ error: "مفتاح Anthropic API غير متوفر." });
          }
          const actualApiKey = customModelConfig ? customModelConfig.apiKey : aiSettings.anthropicApiKey;
          const actualModel = customModelConfig ? customModelConfig.modelId : aiSettings.anthropicModel;
          
          let anthropicSystemStr = aiSettings.systemPrompt;
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': actualApiKey,
              'anthropic-version': '2023-06-01',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: actualModel,
              max_tokens: 4000,
              system: anthropicSystemStr || undefined,
              messages: [{ role: 'user', content: prompt }],
              temperature: aiSettings.temperature,
            })
          });

          if (!response.ok) {
            const errText = await response.text();
            return res.status(response.status).json({ error: `خطأ من Anthropic: ${errText}` });
          }
          
          const data = await response.json();
          let text = data.content?.[0]?.text || "";
          if (expectJson) {
            const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) text = jsonMatch[1];
          }
          return res.json({ text });
        }

        if (!apiKey) {
          return res.status(400).json({ error: `مفتاح الـ API لـ ${customModelConfig ? customModelConfig.provider : aiSettings.aiModel} غير متوفر. يرجى إضافته في الإعدادات.` });
        }

        const messages: any[] = [];
        if (aiSettings.systemPrompt) {
          messages.push({ role: 'system', content: aiSettings.systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelName,
            messages: messages,
            temperature: aiSettings.temperature,
            ...(expectJson && (apiUrl.includes('openai') || apiUrl.includes('groq')) ? { response_format: { type: "json_object" } } : {})
          })
        });

        if (!response.ok) {
          let errorText = await response.text();
          try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.error && errorJson.error.message) {
              errorText = errorJson.error.message;
            }
          } catch (e) {}
          return res.status(response.status).json({ error: `خطأ من ${aiSettings.aiModel}: ${errorText}` });
        }

        const data = await response.json();
        let text = data.choices?.[0]?.message?.content || "";
        
        if (expectJson && !aiSettings.aiModel.includes('GPT')) {
          const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonMatch) text = jsonMatch[1];
        }
        return res.json({ text });
      }

      // Default to Gemini
      const activeGeminiKey = aiSettings.geminiApiKey || process.env.GEMINI_API_KEY;
      if (!activeGeminiKey) {
        return res.status(400).json({ error: "مفتاح Gemini API غير متوفر. يرجى إضافته في الإعدادات." });
      }
      
      const customAi = new GoogleGenAI({ apiKey: activeGeminiKey });
      let baseModel = aiSettings.geminiModel || 'gemini-2.5-flash';
      if (baseModel === 'gemini-2.5-pro') baseModel = 'gemini-2.5-flash'; // Fallback
      
      const modelStr = aiSettings.generationMode === 'fast' ? 'gemini-2.5-flash-8b' : baseModel;
      
      const config: any = {
        temperature: aiSettings.temperature,
        responseMimeType: expectJson ? "application/json" : "text/plain",
      };

      if (aiSettings.systemPrompt) {
        config.systemInstruction = aiSettings.systemPrompt;
      }

      try {
        const response = await customAi.models.generateContent({
          model: modelStr,
          contents: prompt,
          config
        });
        return res.json({ text: response.text || (expectJson ? "[]" : "") });
      } catch (err: any) {
        let errorMsg = err.message || "حدث خطأ غير معروف";
        if (typeof err === "object" && err.status === 429) {
          errorMsg = "نفد رصيد الاستخدام (Quota Exceeded) في مفتاح Gemini API الخاص بك.";
        } else if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
          errorMsg = "نفد رصيد الاستخدام (Quota Exceeded) في مفتاح Gemini API الخاص بك. تأكد من تحديث الخطة.";
        }
        
        try {
          if (errorMsg.startsWith('{')) {
            const parsed = JSON.parse(errorMsg);
            if (parsed.error && parsed.error.message) {
              errorMsg = parsed.error.message;
            }
          }
        } catch(e) {}
        
        return res.status(500).json({ error: `خطأ من Gemini API: ${errorMsg}` });
      }
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Unknown error" });
    }
  });

  app.post("/api/analyze-image", async (req, res) => {
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

      res.json({ text: response.text });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
