import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt, expectJson, aiSettings } = req.body;
    
    const customModelConfig = aiSettings.customModels?.find((m: any) => m.id === aiSettings.aiModel);
    
    if (customModelConfig || aiSettings.aiModel === 'OpenRouter' || !aiSettings.aiModel.includes('Gemini')) {
      let apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
      let apiKey = aiSettings.openRouterApiKey;
      let modelName = aiSettings.openRouterModel;
      
      if (customModelConfig) {
        apiKey = customModelConfig.apiKey;
        modelName = customModelConfig.modelId;
        const provider = customModelConfig.provider.toLowerCase();
        
        if (provider.includes('openai')) {
           apiUrl = 'https://api.openai.com/v1/chat/completions';
        } else if (provider.includes('anthropic')) {
           // handled in block below
        } else if (provider.includes('groq')) {
           apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
        } else if (provider.includes('deepseek')) {
           apiUrl = 'https://api.deepseek.com/chat/completions';
        } else if (provider.includes('together')) {
           apiUrl = 'https://api.together.xyz/v1/chat/completions';
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
        return res.status(200).json({ text });
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
      return res.status(200).json({ text });
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
      return res.status(200).json({ text: response.text || (expectJson ? "[]" : "") });
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
    return res.status(500).json({ error: e.message || "Unknown error" });
  }
}
