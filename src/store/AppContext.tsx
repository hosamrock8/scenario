import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Idea, Scene, CharacterSetup, VideoSettings, StyleSettings, AdvancedSettings, ExportSettings, AudioSettings, ContentSettings, ART_STYLES, SHOT_STYLES, QUALITY_OPTIONS } from '../types';

export interface ApiKeys {
  replicate: string;
  elevenLabs: string;
  openAI: string;
  runwayML: string;
  luma: string;
  hedra: string;
  kieAI: string;
  falAI: string;
}

interface AppContextType {
  step: number;
  setStep: (step: number) => void;
  // Step 1
  topic: string;
  setTopic: (topic: string) => void;
  contentType: string;
  setContentType: (type: string) => void;
  platform: string;
  setPlatform: (platform: string) => void;
  ideas: Idea[];
  setIdeas: (ideas: Idea[]) => void;
  savedIdeas: Idea[];
  setSavedIdeas: (ideas: Idea[]) => void;
  selectedIdea: Idea | null;
  setSelectedIdea: (idea: Idea | null) => void;
  
  // Step 2
  character: CharacterSetup;
  setCharacter: (char: CharacterSetup) => void;
  
  // Step 3
  styles: StyleSettings;
  setStyles: (styles: StyleSettings) => void;
  
  // Settings
  settings: VideoSettings;
  setSettings: (settings: VideoSettings) => void;
  
  // AI Settings
  aiModel: string;
  setAiModel: (model: string) => void;
  temperature: number;
  setTemperature: (temp: number) => void;

  // Advanced Settings
  advancedSettings: AdvancedSettings;
  setAdvancedSettings: (settings: AdvancedSettings) => void;
  exportSettings: ExportSettings;
  setExportSettings: (settings: ExportSettings) => void;
  audioSettings: AudioSettings;
  setAudioSettings: (settings: AudioSettings) => void;
  contentSettings: ContentSettings;
  setContentSettings: (settings: ContentSettings) => void;

  // API Keys
  apiKeys: ApiKeys;
  setApiKeys: (keys: ApiKeys) => void;

  // Output
  scenario: Scene[];
  setScenario: (scenario: Scene[]) => void;
  isGenerating: boolean;
  setIsGenerating: (isGenerating: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState(1);
  
  const [topic, setTopic] = useState('');
  const [contentType, setContentType] = useState('وثائقي وتعليمي');
  const [platform, setPlatform] = useState('YouTube Shorts');
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [savedIdeas, setSavedIdeas] = useState<Idea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  
  const [character, setCharacter] = useState<CharacterSetup>({
    useFixedCharacter: true,
    name: 'AI Humanoid',
    gender: 'غير محدد / آلي',
    description: 'A futuristic humanoid AI, sleek silver facial features with subtly glowing cyan circuitry lines, wearing a modern minimalist white high-collar jacket. Calm, analytical, and intelligent mood, cinematic lighting.'
  });
  
  const [styles, setStyles] = useState<StyleSettings>({
    artStyle: ART_STYLES.find(s => s.id === 'horror') || ART_STYLES[0],
    shotStyle: SHOT_STYLES[0],
    quality: QUALITY_OPTIONS[0].id
  });
  
  const [settings, setSettings] = useState<VideoSettings>({
    videoType: 'short',
    aspectRatio: '9:16',
    durationTarget: 60,
    sceneCountTarget: 10,
    wordsPerMinute: 130,
    platform: 'YouTube Shorts',
    enableSubtitles: true
  });

  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>({
    compareMode: false,
    streamingMode: true,
    debugLogs: false,
    systemPrompt: 'أنت مساعد خبير في كتابة سيناريوهات الفيديو.',
    imagePromptTemplate: 'وصف المشهد الدقيق. هام: إذا المشهد متسلسل في نفس بيئة المشهد السابق، ابدأ بعبارة "consistent setting, same location" + النمط البصري للعمل بالكامل + وصف الشخصية',
    videoPromptTemplate: 'Visuals: {scene_description}, {art_style}, {shot_style}, {character_desc}. Camera: {camera_movement}.',
    animationPromptTemplate: 'Animate this still image. Add {camera_movement} and subtle natural motion. Smooth frame interpolation.',
    includeAudioInVideoPrompt: true,
    savedCharacters: [
      {
        id: 'char_ai_assitant',
        name: 'AI Assistant',
        gender: 'غير محدد / آلي',
        description: 'A futuristic humanoid AI, helpful and intelligent persona, sleek modern design with glowing data streams, wearing a professional, ultra-modern tech uniform. Friendly, welcoming, analytical, and ready to assist.'
      }
    ],
    openRouterApiKey: '',
    openRouterModel: 'meta-llama/llama-3-8b-instruct',
    elevenLabsApiKey: '',
    frontendLabels: {
      mainTitle: 'AI Video Factory',
      subTitle: 'Generate stunning AI videos with custom scenarios and prompts',
      navTitle: 'AI Video Factory'
    }
  });

  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    formats: { txt: true, csv: false, json: false, pdf: false },
    saveDirectory: 'Downloads',
    autoSave: true,
    includeImagePrompts: true,
    includeVideoPrompts: true,
    pdfTemplate: 'standard'
  });

  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    type: 'تعليق وتأثيرات صوتية',
    ttsEngine: 'Edge-TTS',
    voice: 'طبيعي',
    gender: 'ذكر',
    locale: 'ar-SA',
    speed: 1.0,
    pitch: 1.0,
    previewAudio: true,
    bgAudio: true,
    ttsQuality: 'High-Fidelity',
    sfxQuality: 'High-Fidelity',
    bgMusicVolume: 0.2,
    voiceVolume: 0.8,
    bgMusicType: 'library',
    bgMusicUrl: ''
  });

  const [contentSettings, setContentSettings] = useState<ContentSettings>({
    language: 'عربي (فصحى)',
    tone: 'رسمي واحترافي',
    consistencyLock: true,
    autoTranslate: true,
    autoEnhancePrompts: true
  });

  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    replicate: '',
    elevenLabs: '',
    openAI: '',
    runwayML: '',
    luma: '',
    hedra: '',
    kieAI: '',
    falAI: ''
  });

  const [aiModel, setAiModel] = useState('Google Gemini 2.5 Flash');
  const [temperature, setTemperature] = useState(0.7);
  
  const [scenario, setScenario] = useState<Scene[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load from local storage on init
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('ai_video_factory_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.settings) setSettings(parsed.settings);
        if (parsed.advancedSettings) setAdvancedSettings(prev => ({ ...prev, ...parsed.advancedSettings }));
        if (parsed.exportSettings) setExportSettings(parsed.exportSettings);
        if (parsed.audioSettings) setAudioSettings(parsed.audioSettings);
        if (parsed.contentSettings) setContentSettings(parsed.contentSettings);
        if (parsed.aiModel) setAiModel(parsed.aiModel);
        if (parsed.temperature) setTemperature(parsed.temperature);
        if (parsed.styles) setStyles(parsed.styles);
        if (parsed.apiKeys) setApiKeys(parsed.apiKeys);
      }
      
      const savedIdeasLocal = localStorage.getItem('ai_video_factory_saved_ideas');
      if (savedIdeasLocal) {
        setSavedIdeas(JSON.parse(savedIdeasLocal));
      }
    } catch (e) {
      console.error("Failed to load settings from local storage", e);
    }
  }, []);

  React.useEffect(() => {
    localStorage.setItem('ai_video_factory_saved_ideas', JSON.stringify(savedIdeas));
  }, [savedIdeas]);

  // Save to local storage on change
  React.useEffect(() => {
    if (exportSettings.autoSave) {
      const stateToSave = {
        settings,
        advancedSettings,
        exportSettings,
        audioSettings,
        contentSettings,
        aiModel,
        temperature,
        styles,
        apiKeys
      };
      localStorage.setItem('ai_video_factory_settings', JSON.stringify(stateToSave));
    }
  }, [settings, advancedSettings, exportSettings, audioSettings, contentSettings, aiModel, temperature, styles, apiKeys]);

  return (
    <AppContext.Provider value={{
      step, setStep,
      topic, setTopic,
      contentType, setContentType,
      platform, setPlatform,
      ideas, setIdeas,
      savedIdeas, setSavedIdeas,
      selectedIdea, setSelectedIdea,
      character, setCharacter,
      styles, setStyles,
      settings, setSettings,
      advancedSettings, setAdvancedSettings,
      exportSettings, setExportSettings,
      audioSettings, setAudioSettings,
      contentSettings, setContentSettings,
      apiKeys, setApiKeys,
      aiModel, setAiModel,
      temperature, setTemperature,
      scenario, setScenario,
      isGenerating, setIsGenerating
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
