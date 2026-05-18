export interface Idea {
  id: string;
  title: string;
  angle: string;
  category?: string;
  icon?: string;
}

export interface Scene {
  id: string;
  title: string;
  duration: number;
  arabicScript: string;
  imagePrompt: string;
  videoPrompt: string;
  animationPrompt?: string;
  sfxPrompt?: string;
  voiceoverPrompt?: string;
  negativePrompt?: string;
  transition?: string;
  audioType: string;
  tone?: string;
}

export interface CharacterSetup {
  useFixedCharacter: boolean;
  name: string;
  gender: string;
  description: string;
  imageUrl?: string;
}

export interface VideoSettings {
  videoType: 'short' | 'long' | 'square';
  aspectRatio: string;
  durationTarget: number; // in seconds
  sceneCountTarget: number;
  wordsPerMinute: number;
  platform: string;
  enableSubtitles?: boolean;
}

export interface SavedCharacter {
  id: string;
  name: string;
  gender: string;
  description: string;
  imageUrl?: string;
}

export interface CustomTemplate {
  id: string;
  type: 'image' | 'video' | 'sfx' | 'animation' | 'voiceover';
  label: string;
  template: string;
}

export interface CustomModelConfig {
  id: string;
  provider: string;
  modelId: string;
  apiKey: string;
  capabilities: {
    photo: boolean;
    video: boolean;
    audio: boolean;
  };
}

export interface AdvancedSettings {
  compareMode: boolean;
  streamingMode: boolean;
  debugLogs: boolean;
  generationMode?: 'fast' | 'quality';
  systemPrompt: string;
  imagePromptTemplate?: string;
  videoPromptTemplate?: string;
  animationPromptTemplate?: string;
  includeAudioInVideoPrompt?: boolean;
  sfxPromptTemplate?: string;
  voiceoverPromptTemplate?: string;
  customTemplates?: CustomTemplate[];
  savedCharacters?: SavedCharacter[];
  customModels?: CustomModelConfig[];
  openRouterApiKey?: string;
  openRouterModel?: string;
  geminiApiKey?: string;
  geminiModel?: string;
  openaiApiKey?: string;
  openaiModel?: string;
  anthropicApiKey?: string;
  anthropicModel?: string;
  elevenLabsApiKey?: string;
  frontendLabels?: {
    mainTitle?: string;
    subTitle?: string;
    navTitle?: string;
  };
}

export interface ExportSettings {
  formats: { txt: boolean, csv: boolean, json: boolean, pdf: boolean };
  saveDirectory: string;
  autoSave: boolean;
  includeImagePrompts: boolean;
  includeVideoPrompts: boolean;
  pdfTemplate: string;
}

export interface AudioSettings {
  type: string;
  ttsEngine: string;
  voice: string;
  gender: string;
  locale: string;
  speed: number;
  pitch: number;
  previewAudio: boolean;
  bgAudio: boolean;
  ttsQuality?: 'Standard' | 'High-Fidelity' | 'Premium';
  sfxQuality?: 'Standard' | 'High-Fidelity' | 'Premium';
  bgMusicVolume?: number;
  voiceVolume?: number;
  bgMusicType?: 'none' | 'library' | 'upload';
  bgMusicUrl?: string; // URL for library or data URI for upload
}

export interface ContentSettings {
  language: string;
  tone: string;
  consistencyLock: boolean;
  autoTranslate: boolean;
  autoEnhancePrompts: boolean;
}

export interface StyleSettings {
  artStyle: StyleOption | null;
  shotStyle: StyleOption | null;
  quality: string;
}

export interface StyleOption {
  id: string;
  name: string;
  prompt: string;
  imageFallback?: string;
  icon?: string;
}

// Data structures for the grids
export const ART_STYLES: StyleOption[] = [
  { id: 'realistic', name: 'Realistic', prompt: 'photorealistic, 8K, cinematic lighting, DSLR quality, sharp focus, natural colors', icon: 'Camera', imageFallback: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: '3d', name: '3D Animation', prompt: '3D animation, Pixar style, Unreal Engine 5, highly detailed render, studio lighting', icon: 'Layers', imageFallback: 'https://images.unsplash.com/photo-1618331835717-801e976710b2?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'anime', name: 'Anime', prompt: 'anime style, Studio Ghibli, vibrant colors, hand-drawn, cel shading, Japanese animation', icon: 'Sparkles', imageFallback: 'https://images.unsplash.com/photo-1578632616212-32a2434685ff?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'true_crime', name: 'True Crime', prompt: 'dark dramatic, red silhouettes, noir style, crime scene atmosphere, high contrast', icon: 'Skull', imageFallback: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'documentary', name: 'Documentary', prompt: 'documentary style, raw footage look, natural lighting, journalistic photography', icon: 'BookOpen', imageFallback: 'https://images.unsplash.com/photo-1558237937-2384a569cc06?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'dramatic_comic', name: 'Dramatic Comic', prompt: 'comic book art, dramatic ink, high contrast, graphic novel style, bold lines', icon: 'Palette', imageFallback: 'https://images.unsplash.com/photo-1612036782180-6f0b6ce846ce?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'horror', name: 'Horror', prompt: 'horror atmosphere, dark moody, eerie fog, desaturated colors, unsettling composition', icon: 'Eye', imageFallback: 'https://images.unsplash.com/photo-1505635552518-3448ff116af3?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: '3d_red_pop', name: '3D Red Pop', prompt: '3D render, bold red color pop, minimalist background, high contrast, modern design', icon: 'Star', imageFallback: 'https://images.unsplash.com/photo-1605364848074-cefc0a312386?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'comic', name: 'Comic', prompt: 'classic comic, halftone dots, bold outlines, vivid colors, retro comic book style', icon: 'Image', imageFallback: 'https://images.unsplash.com/photo-1534809027769-b00d750a6bac?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'sketch', name: 'Sketch', prompt: 'pencil sketch, hand-drawn, black and white, detailed crosshatching, artistic drawing', icon: 'Palette', imageFallback: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=300&h=300' },
];

export const SHOT_STYLES: StyleOption[] = [
  { id: 'cinematic_wide', name: 'Cinematic Wide', prompt: 'wide cinematic shot, anamorphic lens, letterbox, epic scale, movie scene', icon: 'Monitor', imageFallback: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'close_up', name: 'Close-Up Portrait', prompt: 'close-up portrait, shallow depth of field, bokeh background, face focus, emotional', icon: 'Users', imageFallback: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'aerial', name: 'Aerial / Bird Eye', prompt: 'aerial view, birds eye, top-down perspective, wide landscape', icon: 'Map', imageFallback: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'drone_shot', name: 'Drone Shot', prompt: 'drone footage, aerial view, sweeping landscape, high altitude, cinematic movement', icon: 'Navigation', imageFallback: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'first_person', name: 'First Person POV', prompt: 'first person POV, immersive view, action camera style, GoPro look', icon: 'Video', imageFallback: 'https://images.unsplash.com/photo-1518773922455-87bd879958bc?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'low_angle', name: 'Low Angle Hero', prompt: 'low angle shot, hero perspective, dramatic upward view, powerful stance', icon: 'Camera', imageFallback: 'https://images.unsplash.com/photo-1563604313013-1fe64e3234d7?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'over_shoulder', name: 'Over Shoulder', prompt: 'over-the-shoulder shot, depth layers, conversation framing, cinematic dialogue', icon: 'Users', imageFallback: 'https://images.unsplash.com/photo-1601055743477-9d7a2283e3f0?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'flat_2d', name: 'Flat 2D Cartoon', prompt: 'flat 2D cartoon, simple shapes, bold colors, vector art, clean illustration', icon: 'Image', imageFallback: 'https://images.unsplash.com/photo-1614729939124-032f0b56c9ce?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'macro', name: 'Macro Detail', prompt: 'macro photography, extreme close-up, fine texture, sharp microscopic detail', icon: 'Sparkles', imageFallback: 'https://images.unsplash.com/photo-1582298538104-fe2e24564c4c?auto=format&fit=crop&q=80&w=300&h=300' },
];

export const QUALITY_OPTIONS = [
  { id: 'standard', name: 'Standard', prompt: 'high quality, detailed, well-composed', icon: 'Star' },
  { id: 'premium', name: 'Premium', prompt: '8K ultra HD, masterpiece, award winning, professional photography, perfect lighting', icon: 'Sparkles' },
  { id: 'cinematic', name: 'Cinematic', prompt: 'cinematic color grading, film grain, movie quality, IMAX, dramatic atmosphere, DCI-P3', icon: 'Film' },
];
