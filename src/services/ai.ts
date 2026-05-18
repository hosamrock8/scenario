import { CharacterSetup, StyleSettings, Idea, VideoSettings, Scene } from '../types';

function getAiSettings() {
  try {
    const saved = localStorage.getItem('ai_video_factory_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        aiModel: parsed.aiModel || 'Google Gemini 2.5 Flash',
        openRouterApiKey: parsed.advancedSettings?.openRouterApiKey || '',
        openRouterModel: parsed.advancedSettings?.openRouterModel || 'meta-llama/llama-3.3-70b-instruct',
        geminiApiKey: parsed.advancedSettings?.geminiApiKey || '',
        geminiModel: parsed.advancedSettings?.geminiModel || 'gemini-2.5-flash',
        openaiApiKey: parsed.advancedSettings?.openaiApiKey || '',
        openaiModel: parsed.advancedSettings?.openaiModel || 'gpt-4o',
        anthropicApiKey: parsed.advancedSettings?.anthropicApiKey || '',
        anthropicModel: parsed.advancedSettings?.anthropicModel || 'claude-3-5-sonnet-20241022',
        temperature: parsed.advancedSettings?.generationMode === 'fast' ? 0.3 : (parsed.temperature || 0.7),
        generationMode: parsed.advancedSettings?.generationMode || 'quality',
        systemPrompt: parsed.advancedSettings?.systemPrompt || '',
        imagePromptTemplate: parsed.advancedSettings?.imagePromptTemplate || '',
        videoPromptTemplate: parsed.advancedSettings?.videoPromptTemplate || '',
        sfxPromptTemplate: parsed.advancedSettings?.sfxPromptTemplate || '',
        voiceoverPromptTemplate: parsed.advancedSettings?.voiceoverPromptTemplate || '',
        animationPromptTemplate: parsed.advancedSettings?.animationPromptTemplate || '',
        includeAudioInVideoPrompt: parsed.advancedSettings?.includeAudioInVideoPrompt ?? true
      };
    }
  } catch (e) {}
  return { 
    aiModel: 'Google Gemini 2.5 Flash', 
    openRouterApiKey: '', 
    openRouterModel: 'meta-llama/llama-3.3-70b-instruct', 
    geminiApiKey: '',
    geminiModel: 'gemini-2.5-flash',
    openaiApiKey: '',
    openaiModel: 'gpt-4o',
    anthropicApiKey: '',
    anthropicModel: 'claude-3-5-sonnet-20241022',
    temperature: 0.7,
    systemPrompt: '',
    imagePromptTemplate: '',
    videoPromptTemplate: '',
    sfxPromptTemplate: '',
    voiceoverPromptTemplate: '',
    animationPromptTemplate: '',
    includeAudioInVideoPrompt: true
  };
}

async function callAI(prompt: string, expectJson: boolean = false): Promise<string> {
  const aiSettings = getAiSettings();

  const response = await fetch('/api/call-ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      expectJson,
      aiSettings
    })
  });

  const textResponse = await response.text();
  let data;
  try {
    data = JSON.parse(textResponse);
  } catch (e) {
    if (!response.ok) {
      throw new Error(`Server Error (${response.status}): ${textResponse.slice(0, 100)}`);
    } else {
      throw new Error(`Invalid JSON response: ${textResponse.slice(0, 100)}`);
    }
  }

  if (!response.ok) {
    throw new Error(data.error || 'Unknown error from server');
  }

  return data.text;
}

async function withRetry<T>(operation: () => Promise<T>, maxRetries = 4): Promise<T> {
  let attempt = 0;
  const initialDelayMs = 1500;

  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error: any) {
      attempt++;
      
      const errorMsg = error.message?.toLowerCase() || '';
      const isQuotaError = errorMsg.includes('quota') || errorMsg.includes('نفد رصيد');
      const isTransient = !isQuotaError && (
        errorMsg.includes('network') || 
        errorMsg.includes('timeout') || 
        errorMsg.includes('500') ||
        errorMsg.includes('503') ||
        errorMsg.includes('429') ||
        errorMsg.includes('rate limit') ||
        errorMsg.includes('rate exceeded') ||
        errorMsg.includes('too many requests') ||
        error.status === 429 ||
        error.status >= 500
      );

      if (!isTransient || attempt >= maxRetries) {
        let userMessage = "حدث خطأ غير معروف أثناء التواصل مع الذكاء الاصطناعي.";
        
        if (error.status === 401 || error.status === 403 || errorMsg.includes('api key') || errorMsg.includes('unauthorized') || errorMsg.includes('غير مقوم')) {
          userMessage = "مفتاح API غير صالح أو غير مصرح به. يرجى التحقق من إعدادات المفتاح.";
        } else if (isQuotaError || error.status === 429 || errorMsg.includes('rate limit') || errorMsg.includes('rate exceeded')) {
          userMessage = "تم تجاوز الحد المسموح للاستخدام أو ضغط على السيرفر (Rate Limit). يرجى المحاولة لاحقاً أو استخدام مفتاح API الخاص بك في الإعدادات.";
        } else if (errorMsg.includes('not found') || error.status === 404 || errorMsg.includes('لا يوجد نموذج') || errorMsg.includes('model')) {
          userMessage = "النموذج المحدد غير موجود أو غير متاح. يرجى التأكد من اسم النموذج في الإعدادات (مثال: meta-llama/llama-3-8b-instruct).";
        } else if (error.status >= 500 || errorMsg.includes('500') || errorMsg.includes('503') || errorMsg.includes('504')) {
          userMessage = "هناك مشكلة في خوادم الذكاء الاصطناعي حالياً. يرجى المحاولة مرة أخرى.";
        } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
          userMessage = "خطأ في الاتصال بالشبكة. يرجى التحقق من اتصالك بالإنترنت والتبويب المفتوح.";
        } else if (error.message) {
          userMessage = `خطأ في الخدمة: ${error.message}`;
        }

        
        throw new Error(userMessage);
      }
      
      console.warn(`AI call attempt ${attempt} failed, retrying...`, error.message);
      
      // Exponential backoff with random jitter
      const delay = initialDelayMs * Math.pow(2, attempt - 1) + Math.random() * 500;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error("فشلت العملية بعد عدة محاولات.");
}

export async function generateCategorySuggestions(categoryName: string, existingSuggestions: string[] = []): Promise<string[]> {
  const prompt = `
أنت خبير في صناعة المحتوى على منصات التواصل الاجتماعي وموقع يوتيوب.
المطلوب: قم بتوليد 6 أفكار مبتكرة، متنوعة، وحديثة لمقاطع فيديو تنتمي إلى فئة: "${categoryName}".
يجب أن تكون الأفكار مختلفة وتغطي زوايا فريدة لجذب المشاهدين.
${existingSuggestions.length > 0 ? `تجنب تكرار هذه الأفكار السابقة: ${existingSuggestions.join('، ')}.` : ''}

قم بإرجاع النتيجة بصيغة JSON array مكون من 6 نصوص (Strings) فقط، حيث كل نص هو فكرة فيديو (بحد أقصى 15 كلمة للفكرة). مثال للمخرجات:
["فكرة 1", "فكرة 2", "فكرة 3", "فكرة 4", "فكرة 5", "فكرة 6"]
بدون أي ماركداون إضافي.
`;
  try {
    const response = await callAI(prompt, true);
    let parsed;
    try {
      parsed = JSON.parse(response);
    } catch (e) {
      // Clean potential unescaped stuff or markdown fallback
      const clean = response.replace(/```(?:json)?\s*([\s\S]*?)```/, '$1').trim();
      parsed = JSON.parse(clean);
    }
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.slice(0, 3);
    }
  } catch (err: any) {
    // Silently fallback on failure to avoid console clutter. 
    // Usually caused by Quota / Rate Limit errors which are handled elsewhere.
  }
  return []; // return empty to fallback to local
}

export async function enhanceTopic(topic: string): Promise<string> {
  const prompt = `
أنت خبير في كتابة محتوى إبداعي ومختص في أفكار الفيديو.
المطلوب: طور الفكرة الحالية إلى فكرة فيديو أكثر تفصيلاً وجاذبية، مع التركيز على زاوية فريدة ومميزة. واكتبها في فقرة واحدة فقط.
الفكرة الحالية: "${topic}"

اكتب الفكرة المحسنة فقط بدون أي مقدمات أو شروحات.
`;
  return await callAI(prompt, false);
}

export async function improveArabicScript(
  currentScript: string, 
  title: string, 
  duration: number,
  tone?: string
): Promise<string> {
  const prompt = `
You are an expert Arabic scriptwriter and copywriter.
Please improve the Arabic script for the scene "${title}" to make it more engaging, flowing smoothly, and natural-sounding.
Crucially, ensure the length of the text perfectly fits the intended duration of ${duration} seconds (roughly 2-3 words per second).
${tone ? `Make sure the tone of the Arabic script is: ${tone}.` : ''}

The current script is:
"${currentScript}"

Write ONLY the improved Arabic script, directly, without any introduction, greetings, or explanation.
`;
  let result = await callAI(prompt, false);
  return result.trim();
}

export async function enhanceNegativePrompt(
  imagePrompt: string, 
  videoPrompt: string, 
  currentNegativePrompt: string, 
  characterDesc?: string
): Promise<string> {
  const prompt = `
You are an expert prompt engineer. Enhance or generate the negative prompt for this scene to prevent common artifacts and ensure visual consistency.
Focus on preventing common deformations, extra limbs, bad anatomy, bad lighting, and any potential issues that might arise from the provided positive prompts and character description.

The current negative prompt is: "${currentNegativePrompt}"
Image Prompt: "${imagePrompt}"
Video Prompt: "${videoPrompt}"
Character Description: "${characterDesc || 'None'}"

Generate a comprehensive negative prompt. Combine general artifact prevention and scenario-specific negative terms.
Return ONLY the enhanced negative prompt as a single comma-separated string, in English, without any explanations.
`;
  let result = await callAI(prompt, false);
  return result.trim();
}

export async function enhanceVisualPrompts(
  imagePrompt: string,
  videoPrompt: string,
  animationPrompt: string,
  characterDesc: string,
  artStyle?: string,
  shotStyle?: string,
  videoPromptTemplate?: string,
  imagePromptTemplate?: string,
  animationPromptTemplate?: string
): Promise<{ imagePrompt: string; videoPrompt: string; animationPrompt: string }> {
  const prompt = `
You are an elite prompt engineer and art director specializing in AI image and video generation (e.g., Midjourney, Runway Gen-2, Pika).
I need you to significantly enhance the following image, video, and animation prompts based on the character description, art style, and shot style to ensure maximum visual quality and consistency.

Character Description: "${characterDesc}"
Art Style: "${artStyle || 'None'}"
Shot Style: "${shotStyle || 'None'}"

Current Image Prompt: "${imagePrompt}"
Current Video Prompt: "${videoPrompt}"
Current Animation Prompt: "${animationPrompt}"

Image Prompt Instructions:
Rewrite the image prompt into a highly professional, dense, comma-separated string of descriptive visual keywords. Integrate the character description seamlessly. Include high-end adjectives for lighting (e.g., cinematic lighting, volumetric lighting, rim lighting), cinematography (e.g., 35mm lens, depth of field), and overall mood that perfectly align with the Art Style and Shot Style. If an image template is provided, follow it strictly: "${imagePromptTemplate || 'None'}". Ensure the core action remains unchanged.

Video Prompt Instructions:
Rewrite the video prompt to be extremely clear and kinetic. Integrate the character, art style, and lighting. Explicitly define precise and cinematic camera movements that complement the scene's action. If a video prompt template is provided, you MUST use it: "${videoPromptTemplate || 'None'}". The video prompt should describe motion and fluidity effectively.

Animation Prompt Instructions:
Rewrite the animation prompt to be a specialized prompt for animating a static image. It should suggest subtle movements, ensuring visual interest and dynamism. Suggest appropriate camera movements like subtle pans or zooms. If an animation prompt template is provided, you MUST use it: "${animationPromptTemplate || 'None'}". Keep it concise but effective.

Please return ONLY a valid JSON object with exactly three string properties: "imagePrompt", "videoPrompt", and "animationPrompt", containing the enhanced prompts tightly written in English. Do not add markdown blocks outside the JSON format.
`;
  let resultStr = await callAI(prompt, true);
  try {
    const result = JSON.parse(resultStr);
    return result;
  } catch(e) {
    console.error("Error parsing enhance visual prompts result", e);
    // fallback if JSON parsing fails, though callAI(..., true) usually enforces JSON
    return { imagePrompt, videoPrompt, animationPrompt };
  }
}

export async function suggestTransition(currentSceneData: any, nextSceneData: any, artStyle?: string, shotStyle?: string): Promise<string[]> {
  const prompt = `
You are an expert video editor and director. 
I have two sequential scenes in a video. 
Art Style: "${artStyle || 'None'}"
Shot Style: "${shotStyle || 'None'}"

Current Scene:
- Title: "${currentSceneData.title}"
- Script: "${currentSceneData.arabicScript}"
- Video Prompt: "${currentSceneData.videoPrompt}"

Next Scene:
- Title: "${nextSceneData?.title || 'End of Video'}"
- Script: "${nextSceneData?.arabicScript || 'None'}"
- Video Prompt: "${nextSceneData?.videoPrompt || 'None'}"

Suggest 3 different appropriate video transition options to use between the Current Scene and the Next Scene (e.g., "smooth fade to black", "quick cut", "whip pan to the right", "zoom in transition", "match cut"). The transitions must respect the visual styles and ensure a smooth visual flow between the two scenes.
Return ONLY a JSON array of 3 English strings, without any extra text or markdown.
Example format:
["fade to black", "whip pan right", "match cut"]
`;
  try {
    let text = await callAI(prompt, true);
    text = text.replace(/```json\s*/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return ["fade to black"];
  } catch (err) {
    return ["auto transition"];
  }
}

export async function generateIdeas(topic: string, contentType: string, platform: string, recentIdeas: string[] = []): Promise<Idea[]> {
  const prompt = `
أنت متخصص في تسويق المحتوى وصانع محتوى خبير على منصات التواصل الاجتماعي.
المطلوب: توليد 3 أفكار فيديوهات جديدة كلياً من فئة "الكوميديا (Comedy)" بناءً على الاهتمامات الحالية والتريند، على منصة "${platform}" 
عن موضوع: "${topic}"
نوع المحتوى المفضل: "${contentType}"

${recentIdeas.length > 0 ? `تجنب تماماً هذه الأفكار التي تم استخدامها مؤخراً:\n${recentIdeas.map(i => `- ${i}`).join('\n')}` : ''}

الرجاء التركيز على أفكار إبداعية، ترفيهية، غير مستهلكة، ولها قابلية عالية للانتشار (Virality).

قم بإرجاع النتيجة بصيغة JSON array فقط، حيث يكون كل عنصر كائن يحتوي على:
- "id": معرف فريد (مثلا idea_1)
- "title": عنوان جذاب وكوميدي للفكرة
- "angle": زاوية الطرح أو الملخص السريع للفكرة (سطر واحد يوضح الجانب الكوميدي)

لا تضف أي نص آخر أو تنسيق ماركداون خارج مصفوفة الـ JSON خالص.
`;

  try {
    return await withRetry(async () => {
      let text = await callAI(prompt, true);
      // Remove any json markdown blocks if present
      text = text.replace(/```json\s*/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed.map((p: any) => ({
          ...p,
          id: `idea_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
        }));
      }
      return [];
    });
  } catch (error) {
    throw error;
  }
}

export async function generateScenario(
  idea: Idea,
  character: CharacterSetup,
  styles: StyleSettings,
  settings: VideoSettings,
  contentSettings?: any,
  audioSettings?: any
): Promise<Scene[]> {
  const aiSettings = getAiSettings();

  const estimatedWords = Math.round(settings.durationTarget * (130 / 60));
  
  const charPrompt = character.useFixedCharacter 
    ? `الشخصية الثابتة في الفيديو: ${character.name}، الجنس: ${character.gender}. الوصف البصري الثابت (CHARACTER_DESC): "${character.description}". هام جداً: للحفاظ على تناسق الشخصية (Character Consistency)، يجب إدراج الوصف البصري (CHARACTER_DESC) بدقة في بداية مطالبات الصور والفيديو (imagePrompt و videoPrompt) في جميع المشاهد التي تظهر فيها الشخصية.`
    : `بدون شخصية ثابتة محددة، استخدم شخصيات مناسبة أو لقطات عامة لكل مشهد حسب الحاجة.`;

  const visualStylePrompt = `النمط الفني: ${styles.artStyle?.name || ''} (${styles.artStyle?.prompt || ''}) | نمط الإطار: ${styles.shotStyle?.name || ''} (${styles.shotStyle?.prompt || ''}) | جودة الإخراج: ${styles.quality || ''}`;

  const defaultImagePromptTpl = "وصف المشهد التفصيلي. هام جداً: إذا المشهد متسلسل في نفس بيئة المشهد السابق، ابدأ بعبارة 'consistent setting, same location' + النمط البصري للعمل بالكامل + وصف الشخصية (باستخدام CHARACTER_DESC حرفيا لضمان التناسق)";
  const userImagePromptTpl = aiSettings.imagePromptTemplate?.trim();
  const imagePromptTpl = userImagePromptTpl 
    ? `عليك استخدام هذا القالب بالضبط وتعبئة المتغيرات: "${userImagePromptTpl}". استبدل المتغيرات كالتالي:
       - {scene_description}: وصفك الدقيق للمشهد. هام جداً: إذا المشهد متسلسل في نفس بيئة المشهد السابق، يجب أن تبدأ الوصف بعبارة "consistent setting, same location".
       - {art_style}: تفاصيل النمط الفني (${styles.artStyle?.prompt || ''})
       - {shot_style}: تفاصيل زاوية الكاميرا (${styles.shotStyle?.prompt || ''})
       - {character_desc}: استخدم قيمة "CHARACTER_DESC" حرفيا.
       - {lighting_description}: وصف للإضاءة المناسبة للمشهد (مثل cinematic lighting, moody, bright, natural light).
       - {mood}: المزاج العام أو الجو العاطفي للمشهد (مثل tense, peaceful, eerie, joyful).`
    : defaultImagePromptTpl;

  const defaultVideoPromptTpl = "يجب أن تصف الحركة البصرية بدقة (Visual Action)، حركة الكاميرا (مثل pan, zoom)، والبيئة المحيطة. هام جداً: إذا كان المشهد في نفس البيئة السابقة، ابدأ الوصف بعبارة 'consistent setting, same location'. ومن الضروري دمج إعدادات النمط الفني بالكامل ووصف الشخصية البصري (CHARACTER_DESC) لضمان التناسق البصري المستمر (Visual Coherence)";
  const userVideoPromptTpl = aiSettings.videoPromptTemplate?.trim();
  const videoPromptTpl = userVideoPromptTpl
    ? `هام: لقد قدم المستخدم قالب مخصص لمطالبة الفيديو (Video Prompt Template). عليك بناء قيمة "videoPrompt" لكل مشهد باستخدام هذا القالب حصرياً واستبدال المتغيرات فيه:
       القالب: "${userVideoPromptTpl}"
       
      كيفية استبدال المتغيرات وتوظيفها داخل مطالبة الفيديو المخصصة (Video Prompt Custom Template):
       - {scene_description}: Purpose: يصف الحركة (Action) والبيئة (Environment) بوضوح للمشهد الحالي. Usage: استبدله بوصف دقيق بالإنجليزية لما يحدث في المشهد وأين يحدث. هام جداً: إذا كان المشهد متسلسلاً في نفس بيئة المشهد السابق، يجب أن تتضمن عبارة "consistent setting, same location".
       - {camera_movement}: Purpose: يوجه نموذج الذكاء الاصطناعي لكيفية تحريك الكاميرا (Camera Motion). Usage: استبدله بوصف دقيق لحركة الكاميرا بالإنجليزية (مثل pan right, slow zoom in, tracking shot).
       - {art_style}: Purpose: يحدد النمط البصري والجمالي (Visual Style / Aesthetic) للمشهد المستمد من إعدادات القصة. Usage: استبدله بالنص التالي: "${styles.artStyle?.prompt || ''}".
       - {shot_style}: Purpose: يحدد نوع وزاوية التصوير (Camera Shot Type / Framing). Usage: استبدله بالنص التالي: "${styles.shotStyle?.prompt || ''}".
       - {character_desc}: Purpose: يضمن استمرارية مظهر الشخصيات الأساسية (Character Consistency). Usage: استبدله بالنص التالي: "CHARACTER_DESC".
       - {lighting_description}: Purpose: يصف إضاءة المشهد. Usage: استبدله بوصف يعكس إضاءة المشهد بدقة.
       - {mood}: Purpose: يصف الحالة الشعورية والجو العام للمشهد. Usage: استبدله بوصف يعكس المزاج العام للمشهد.`
    : defaultVideoPromptTpl;

  const defaultSfxPromptTpl = "مطالبة للصوت (SFX Prompt) باللغة الإنجليزية تصف المؤثرات الصوتية المناسبة للمشهد. أضفها إذا كان إعداد الصوت الحالي يتطلب ذلك (SFX أو كلاهما).";
  const userSfxPromptTpl = aiSettings.sfxPromptTemplate?.trim();
  const sfxPromptTpl = userSfxPromptTpl
    ? `استخدم هذا القالب بالضبط لبناء مطالبة المؤثرات الصوتية: "${userSfxPromptTpl}". استبدل المتغيرات كالتالي:
       - {scene_description}: البيئة الصوتية للمشهد
       - {action}: الحركة المسببة للصوت
       - {mood}: المزاج العام`
    : defaultSfxPromptTpl;

  const defaultVoiceoverPromptTpl = "مطالبة التعليق الصوتي (Voiceover Prompt) باللغة الإنجليزية تصف أسلوب ومزاج ومشاعر القراءة المناسبة للنص في هذا المشهد لموجهات الصوت (مثل ElevenLabs). دعها فارغة إن لم تكن هناك حاجة.";
  const userVoiceoverPromptTpl = aiSettings.voiceoverPromptTemplate?.trim();
  const voiceoverPromptTpl = userVoiceoverPromptTpl
    ? `عليك بناء مطالبة التعليق الصوتي باستخدام هذا القالب وتعبئة المتغيرات بمحتوى باللغة الإنجليزية: "${userVoiceoverPromptTpl}".
       - {arabic_script}: استبدلها بكلمة "arabic_script" كتلميح أو ترجمها للإنجليزية إن لزم الأمر
       - {mood}: المزاج العام للقراءة
       - {emotion}: المشاعر الأساسية`
    : defaultVoiceoverPromptTpl;

  const prompt = `
أنت كاتب سيناريو محترف ومخرج فني.
قم بكتابة سيناريو كامل لفيديو بناءً على المعطيات التالية:

- الفكرة: "${idea.title}" (${idea.angle})
- المدة المستهدفة: ${settings.durationTarget} ثانية (تقريباً ${estimatedWords} كلمة)
- النبرة (Tone): ${contentSettings?.tone || 'محايد'}
- نوع الصوت: ${audioSettings?.type || 'كلاهما (Voiceover + SFX)'}
- إعدادات الشخصية: ${charPrompt}
- النمط البصري للعمل (Visual Style): ${visualStylePrompt}

المطلوب:
تقسيم الفيديو إلى عدة مشاهد (من 3 إلى 15 مشهداً حسب المدة المستهدفة). المشهد الأول يجب أن يكون Hook قوي لخطب الانتباه في أول 3 ثوانٍ. والمشهد الأخير يجب أن يحتوي على CTA.

هام جداً للحفاظ على الترابط (Continuity):
- يجب أن يكون هناك تسلسل منطقي وترابط قصصي قوي بين المشاهد، بحيث يكمل كل مشهد ما قبله بدون قفزات مفاجئة غير مبررة.
- للحفاظ على التناسق البصري (Visual Coherence)، يجب أن تستمر عناصر البيئة، والمكان، وتوقيت الإضاءة (Day/Night)، وتواجد الشخصية عبر المشاهد المتتالية ما لم يقتضِ النص انتقالًا صريحًا. قم بتضمين كلمات مفتاحية في مطالبات الصور والفيديو تؤكد على الاستمرارية (مثلاً: "same location," "consistent setting," "continuous action").

قم بإرجاع النتيجة بصيغة JSON array فقط لكل مشهد. يجب أن يحتوي كل كائن في المصفوفة على:
- "id": معرف المشهد (مثلاً scene_1)
- "title": عنوان أو وصف قصير جدًا للمشهد (كـ Hook, Scene, CTA)
- "duration": المدة المقدرة للمشهد بالثواني (مجموع المدد يجب أن يقارب ${settings.durationTarget})
- "sameSettingAsPrevious": boolean (True إذا كان المشهد الحالي في نفس مكان/بيئة المشهد السابق تماماً)
- "arabicScript": النص العربي للتعليق الصوتي أو الشرح الداخلي للمشهد (Voiceover).
- "audioType": حدد ما إذا كان المشهد يتطلب Voiceover, SFX أو كلاهما.
- "imagePrompt": مطالبة الصورة (Prompt) باللغة الإنجليزية للذكاء الاصطناعي لتوليد الصور المرافقة للمشهد. يجب أن تترجم وتشمل العناصر البصرية المهمة من النص العربي (arabicScript) كجزء من وصف المشهد وإضافة التفاصيل المرئية الدقيقة. ادمج دائمًا التالي في المطالبة: ${imagePromptTpl}.
- "videoPrompt": مطالبة الفيديو (Video Prompt) مفصلة باللغة الإنجليزية موجهة لنماذج توليد الفيديو. إرشادات القالب: ${videoPromptTpl}. ${aiSettings.includeAudioInVideoPrompt ? 'هام جداً: إذا كان المشهد يحتوي على تعليق صوتي لشخصية تتحدث (audio_type هو Voiceover أو Both) وكانت الشخصية تظهر في المشهد، يجب تضمين تفاصيل التحدث وتزامن الشفاه الدقيق. قم بترجمة النص العربي (arabicScript) إلى الإنجليزية وأضف توجيه دقيق في مطالبة الفيديو بالصيغة التالية: "The character is visibly speaking, looking at the camera, with natural lip sync to the dialogue: \'[Translated Script]\'". هذا التوجيه حاسم لنماذج الفيديو لإنتاج تزامن شفاه صحيح.' : ''}
- "animationPrompt": مطالبة تحريك الصورة (Image Animation Prompt) باللغة الإنجليزية تستخدم خصيصاً لتحريك صور ثابتة (Image-to-Video). تصف بدقة الحركة المطلوبة في الصورة (مثلاً pan, zoom, character blinking, smooth motion). ${aiSettings.animationPromptTemplate ? `استخدم هذا القالب: "${aiSettings.animationPromptTemplate}"` : ''}
- "sfxPrompt": ${sfxPromptTpl}
- "voiceoverPrompt": ${voiceoverPromptTpl}
- "negativePrompt": مطالبة سلبية (Negative Prompt) باللغة الإنجليزية لمنع التشوهات. يجب أن تكون مبنية على المطالبات الإيجابية (imagePrompt و videoPrompt) الخاصة بهذا المشهد الحالي. أولاً، يجب أن تمنع التشوهات العامة (مثل: "extra fingers, asymmetrical eyes, bad anatomy, bad proportions, missing limbs, text, watermarks, cropped, worst quality, low resolution, weird morphing, unnatural movement, flickering, jittering, distorted faces"). ثانياً، يجب أن تعالج مشاكل محتملة قد تنتج عن المطالبة الإيجابية (مثلاً إذا كانت المطالبة لغرفة مظلمة، استبعد "sunlight, bright windows, exterior"). هام جداً: إذا كانت هناك شخصية ثابتة، أضف شروطاً تمنع فقدان التناسق (مثلاً: "different person, multiple people, changes in facial features, inconsistent character design"). ادمج الجميع في نص واحد مفصول بفواصل.
- "transition": وصف دقيق باللغة الإنجليزية للانتقال (Transition) المناسب للخروج من هذا المشهد إلى المشهد التالي (مثلاً: "smooth fade to black", "quick cut", "whip pan right", "zoom in transition"). يجب أن يكون الانتقال منطقياً ويتناسب مع محتوى المشهدين الحالي والتالي.

الـ JSON Array فقط بدون أي نصوص أخرى أو ماركداون.
`;


  try {
    return await withRetry(async () => {
      let text = await callAI(prompt, true);
      text = text.replace(/```json\s*/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(text);
      
      if (Array.isArray(parsed)) {
        return parsed.map((scene: any, index: number) => {
          if (scene.sameSettingAsPrevious && index > 0) {
            const consistencyPrefix = 'consistent setting, same location, ';
            if (scene.imagePrompt && !scene.imagePrompt.toLowerCase().includes('consistent setting')) {
              scene.imagePrompt = consistencyPrefix + scene.imagePrompt;
            }
            if (scene.videoPrompt && !scene.videoPrompt.toLowerCase().includes('consistent setting')) {
              scene.videoPrompt = consistencyPrefix + scene.videoPrompt;
            }
            if (scene.animationPrompt && !scene.animationPrompt.toLowerCase().includes('consistent setting')) {
              scene.animationPrompt = consistencyPrefix + scene.animationPrompt;
            }
          }
          return scene;
        });
      }
      return [];
    });
  } catch (error) {
    throw error;
  }
}

export async function analyzeCharacterImage(imageBase64: string): Promise<string> {
  const aiSettings = getAiSettings();

  const response = await fetch('/api/analyze-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      imageBase64,
      aiSettings
    })
  });

  const textResponse = await response.text();
  let data;
  try {
    data = JSON.parse(textResponse);
  } catch (e) {
    if (!response.ok) {
      throw new Error(`Server Error (${response.status}): ${textResponse.slice(0, 100)}`);
    } else {
      throw new Error(`Invalid JSON response: ${textResponse.slice(0, 100)}`);
    }
  }

  if (!response.ok) {
    throw new Error(data.error || 'Unknown error from server');
  }

  return data.text || '';
}

export async function improveCharacterDescription(currentDescription: string): Promise<string> {
  const prompt = `
أنت مصمم شخصيات خبير ومهندس مطالبات للذكاء الاصطناعي لتوليد الصور (Midjourney/Stable Diffusion).
قم بتحسين وتوسيع وصف الشخصية التالي ليكون أكثر تفصيلاً ودقة.
وصف الشخصية الحالي: "${currentDescription}"

يجب إضافة تفاصيل مميزة عن:
- المظهر (الوجه، الشعر، العيون، العمر، البنية الجسدية)
- الملابس والأناقة (أسلوب اللباس، الألوان، التفاصيل)
- الحالة المزاجية، النظرة، وأي خصائص فريدة (مثل ندبة، نظارات، وشم)
- الإضاءة والزاوية المناسبة لها

اجعل الوصف جذابًا وقابلاً للاستخدام مباشرة في مطالبة بناء صورة (Image Generation Prompt) واكتبه باللغة الإنجليزية في فقرة واحدة متصلة غنية بالتفاصيل.
لا تضف أي شرح إضافي أو مقدمة، فقط أعد الوصف المحسن.
`;
  let resultStr = await callAI(prompt, false);
  return resultStr.trim();
}

export async function suggestCharacterIdea(topic?: string): Promise<{name: string, gender: string, description: string}> {
  const prompt = `
أنت مصمم شخصيات خبير وكاتب قصص.
قم بابتكار شخصية واحدة مثيرة للاهتمام يمكن استخدامها كشخصية رئيسية في مقاطع فيديو.
${topic ? `الفكرة أو الموضوع الخاص بالفيديو هو: ${topic}\nيرجى جعل الشخصية مناسبة تماماً لهذه الفكرة.` : ''}
قم بإرجاع النتيجة بصيغة JSON حصراً، تحتوي على المفاتيح التالية:
- "name": اسم الشخصية
- "gender": "ذكر" أو "أنثى"
- "description": وصف بصري مفصل للشخصية باللغة الإنجليزية، جاهز للاستخدام في نماذج توليد الصور (مثال: "A 25-year-old confident woman with short curly red hair, wearing a yellow raincoat...")
لا تضف أي نص خارج مصفوفة ال JSON.
  `;
  try {
    let text = await callAI(prompt, true);
    text = text.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch (e) {
    return { name: "Character", gender: "غير محدد", description: "Detailed visual description..." };
  }
}

export async function bulkEnhanceScenario(
  scenario: Scene[], 
  characterDescription: string, 
  artStyle: string,
  shotStyle?: string,
  videoPromptTemplate?: string,
  imagePromptTemplate?: string,
  animationPromptTemplate?: string,
  sfxPromptTemplate?: string,
  voiceoverPromptTemplate?: string
): Promise<Scene[]> {
  const prompt = `أنت صانع أفلام، مخرج فني، ومهندس مطالبات (Prompt Engineer) خبير بأساليب التوليد بالذكاء الاصطناعي (Midjourney, Runway, Pika, Stable Diffusion).
المطلوب تحسين جودة المطالبات بشكل شامل لجميع المشاهد في السيناريو التالي لضمان التناسق البصري وأفضل الممارسات.

وصف الشخصية الثابتة: ${characterDescription || 'غير محدد'}
النمط الفني العام (Art Style): ${artStyle || 'غير محدد'}
نمط الإطار وحركة الكاميرا (Shot Style): ${shotStyle || 'غير محدد'}
قالب مطالبة الصورة (Image Template): ${imagePromptTemplate || 'None'}
قالب مطالبة الفيديو (Video Template): ${videoPromptTemplate || 'None'}
قالب مطالبة التحريك (Animation Template): ${animationPromptTemplate || 'None'}
قالب مطالبة الصوتيات (SFX Template): ${sfxPromptTemplate || 'None'}
قالب مطالبة التعليق الصوتي (Voiceover Template): ${voiceoverPromptTemplate || 'None'}

السيناريو الحالي (مصفوفة JSON):
${JSON.stringify(scenario, null, 2)}

المطلوب إرجاعه هو نفس هيكل السيناريو تماماً (مصفوفة JSON للمشاهد) مع تطبيق التحسينات الاحترافية التالية:
1. تحسين arabicScript: صياغة النص العربي ليكون أكثر جاذبية، تدفقاً، ومناسباً للتعليق الصوتي، بحيث يتطابق تماماً مع المدة الزمنية المحددة لكل مشهد (duration). استعن بقالب التعليق الصوتي (Voiceover Template) إذا توفر كمرشد للأسلوب.
2. تحسين imagePrompt: يجب أن تُصاغ المطالبة باللغة الإنجليزية كـ Image Generation Prompt احترافية. أدمج تفاصيل الشخصية بدقة. أضف كلمات مفتاحية عن الإضاءة (Cinematic lighting, volumetric lighting, etc.) والمزاج والتصوير الفوتوغرافي لضمان التناسق البصري بين المشاهد وفق النمط الفني المحدد. التزم بالقالب إذا وجد.
3. تحسين videoPrompt: يجب أن تُصاغ المطالبة باللغة الإنجليزية كـ Video Generation Prompt احترافية. أدمج الشخصية والنمط، وحدد بدقة حركات الكاميرا المناسبة لكل مشهد (مثل: 'Slow smooth pan left', 'Dynamic tracking shot', 'Cinematic zoom in') بحيث تعزز الحكاية البصرية وتتماشى مع المزاج. التزم بالقالب المخصص للفيديو.
4. تحسين أو توليد animationPrompt: صياغة مطالبة باللغة الإنجليزية مخصصة لتحريك الصور الثابتة (Image-to-Video). اقترح حركات خفيفة ومناسبة لضمان حيوية المشهد مع الحفاظ على استقراره. التزم بقالب التحريك (Animation Template) إذا وُجد.
5. توليد negativePrompt: بناء قائمة قوية من الكلمات السلبية (Negative Prompt) التي تمنع التشوهات، الأخطاء التشريحية، والنصوص المشوهة (مثل: mutated, ugly, bad anatomy, deformed, distorted, text, watermark, low quality) مخصصة لتلائم المشهد. تعتمد على المطالبات الإيجابية ووصف الشخصية.
6. إضافة انتقالات (Transitions): اقترح انتقالاً بصرياً سلساً يربط المشهد الحالي بالمشهد التالي بانسيابية واذكر ذلك في حقل transition. يجب أن يتوافق مع المزاج والنمط الفني العام.
7. توليد sfxPrompt (إذا لزم الأمر): إنشاء مطالبة للمؤثرات الصوتية تناسب المشهد والمزاج، متبنياً قالب مطالبة الصوتيات (SFX Template) إذا وُجد.
8. التناسق البصري: تأكد أن جميع المشاهد تبدو وكانها من نفس الفيلم، من خلال الحفاظ على الكلمات المفتاحية الأساسية ومواصفات الشخصية الثابتة في كل المطالبات لتجنب التشوهات (Visual Consistency).

الناتج يجب أن يكون مصفوفة JSON صالحة حصراً، بدون أي نصوص تمهيدية أو أكواد ماركداون.`;

  try {
    let text = await withRetry(() => callAI(prompt, true));
    
    // Strip markdown blocks if present
    text = text.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim();

    let parsed = JSON.parse(text);
    if (!Array.isArray(parsed) && parsed.scenario) parsed = parsed.scenario;
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as Scene[];
    return scenario;
  } catch (err: any) {
    console.error("Error bulk enhancing scenario:", err);
    throw new Error(err.message || "فشل في تحليل الرد من الذكاء الاصطناعي");
  }
}
