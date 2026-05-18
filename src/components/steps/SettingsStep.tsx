import React, { useState, useRef } from 'react';
import { useAppContext } from '../../store/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings2, Clock, Globe, Mic, Cpu, KeyRound, Smartphone, MonitorPlay, 
  Square, Volume2, AudioLines, Sparkles, Palette, FileText, Download, Wrench, 
  CheckCircle2, AlertCircle, RefreshCw, Save, FolderOpen, Eye, EyeOff, X, Code, ChevronDown,
  Users, Image, PlaySquare, Plus, Trash2, Upload, UserCircle, Edit2, Terminal, ArrowUp, ArrowDown, Search, LayoutDashboard, Loader2, Key, ExternalLink, Link, Film
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { ART_STYLES, SHOT_STYLES, QUALITY_OPTIONS } from '../../types';
import { analyzeCharacterImage, suggestCharacterIdea } from '../../services/ai';

export function SettingsStep() {
  const { 
    settings, setSettings, 
    aiModel, setAiModel, 
    temperature, setTemperature,
    advancedSettings, setAdvancedSettings,
    exportSettings, setExportSettings,
    audioSettings, setAudioSettings,
    contentSettings, setContentSettings,
    styles, setStyles,
    apiKeys, setApiKeys
  } = useAppContext();

  const [activeTab, setActiveTab] = useState('models');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [previewFormat, setPreviewFormat] = useState<string | null>(null);
  const [showSfxTemplateEditor, setShowSfxTemplateEditor] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  const [savingTemplateType, setSavingTemplateType] = useState<'image' | 'video' | 'sfx' | 'animation' | 'voiceover' | null>(null);
  const [savingTemplateName, setSavingTemplateName] = useState('');
  const [activeTemplateIds, setActiveTemplateIds] = useState<Record<string, string>>({});
  const [apiTestStatus, setApiTestStatus] = useState<Record<string, 'idle' | 'testing' | 'success' | 'error'>>({});

  const handleTestExternalApi = (apiKeyName: string, keyValue?: string) => {
    if (!keyValue) {
      setApiTestStatus(prev => ({...prev, [apiKeyName]: 'error'}));
      setTimeout(() => {
        setApiTestStatus(prev => ({...prev, [apiKeyName]: 'idle'}));
      }, 3000);
      return;
    }
    setApiTestStatus(prev => ({...prev, [apiKeyName]: 'testing'}));
    setTimeout(() => {
      // Create a mock simulated connection logic...
      if (keyValue.length > 5) {
        setApiTestStatus(prev => ({...prev, [apiKeyName]: 'success'}));
      } else {
        setApiTestStatus(prev => ({...prev, [apiKeyName]: 'error'}));
      }
      setTimeout(() => {
        setApiTestStatus(prev => ({...prev, [apiKeyName]: 'idle'}));
      }, 4000);
    }, 1500);
  };

  const ApiKeyCard = ({ id, name, desc, icon: IconComponent, link, value, onChange }: any) => {
    const status = apiTestStatus[id] || 'idle';
    return (
      <div className={`p-6 rounded-2xl bg-black/40 border flex flex-col gap-4 group transition-all ${status === 'success' ? 'border-emerald-500/50' : status === 'error' ? 'border-red-500/50' : 'border-white/5 hover:border-[var(--rosso-ferrari)]/30'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/5 border border-white/10"><IconComponent size={18} className={status === 'success' ? 'text-emerald-400' : status === 'error' ? 'text-red-400' : 'text-white'} /></div>
            <div>
              <h4 className="text-white font-bold">{name}</h4>
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
          </div>
          <a href={link} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 transition-colors" title="احصل على المفتاح">
            <ExternalLink size={16} />
          </a>
        </div>
        <div className="relative">
          <input type={showPassword ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} placeholder="..." className="w-full bg-white/5 border border-white/10 focus:border-[var(--rosso-ferrari)] rounded-xl px-4 py-3 text-white focus:outline-none tracking-widest font-mono text-sm pl-12" dir="ltr" />
          <Key size={16} className="absolute top-3.5 left-4 text-gray-500" />
        </div>
        <button 
          onClick={() => handleTestExternalApi(id, value)}
          disabled={status === 'testing'}
          className={`self-end px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
            status === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
            status === 'error' ? 'bg-red-500/20 text-red-500' :
            status === 'testing' ? 'bg-white/10 text-white' :
            'bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300'
          }`}
        >
          {status === 'testing' ? <Loader2 size={14} className="animate-spin" /> : 
           status === 'success' ? <CheckCircle2 size={14} /> :
           status === 'error' ? <AlertCircle size={14} /> : <Link size={14} />} 
          {status === 'testing' ? 'جاري الفحص...' :
           status === 'success' ? 'متصل بنجاح' :
           status === 'error' ? 'فشل الاتصال' : 'فحص الاتصال'}
        </button>
      </div>
    );
  };

  const [isAddingCharacter, setIsAddingCharacter] = useState(false);
  const [editingCharId, setEditingCharId] = useState<string | null>(null);
  const [newChar, setNewChar] = useState({ name: '', gender: 'ذكر', description: '', imageUrl: '' });
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [generatingIdea, setGeneratingIdea] = useState(false);
  const [characterSearchQuery, setCharacterSearchQuery] = useState('');
  const charImageInputRef = useRef<HTMLInputElement>(null);

  const handleCharImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setNewChar({ ...newChar, imageUrl: ev.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!newChar.imageUrl) return;
    setAnalyzingImage(true);
    try {
      const desc = await analyzeCharacterImage(newChar.imageUrl);
      setNewChar({ ...newChar, description: desc });
    } catch (err: any) {
      alert("خطأ: " + err.message);
    }
    setAnalyzingImage(false);
  };

  const handleSuggestIdea = async () => {
    setGeneratingIdea(true);
    try {
      const charIdea = await suggestCharacterIdea();
      const url = "https://image.pollinations.ai/prompt/" + encodeURIComponent("Character portrait, concept art, " + charIdea.description + " --no text") + "?width=512&height=512&nologo=true&seed=" + Math.floor(Math.random() * 1000000);
      setNewChar({ ...newChar, ...charIdea, imageUrl: url });
    } catch(err: any) {
      alert("خطأ: " + err.message);
    }
    setGeneratingIdea(false);
  };

  const handleSaveCharacter = () => {
    if (!newChar.name || !newChar.description) return;
    const currentChars = advancedSettings.savedCharacters || [];
    if (editingCharId) {
      setAdvancedSettings({
        ...advancedSettings,
        savedCharacters: currentChars.map(c => c.id === editingCharId ? { ...c, ...newChar } : c)
      });
    } else {
      setAdvancedSettings({
        ...advancedSettings,
        savedCharacters: [...currentChars, { id: `char_${Date.now()}`, ...newChar }]
      });
    }
    setNewChar({ name: '', gender: 'ذكر', description: '', imageUrl: '' });
    setIsAddingCharacter(false);
    setEditingCharId(null);
  };

  const startEditCharacter = (char: any) => {
    setNewChar({ name: char.name, gender: char.gender, description: char.description, imageUrl: char.imageUrl || '' });
    setEditingCharId(char.id);
    setIsAddingCharacter(true);
  };

  const handleDeleteCharacter = (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الشخصية؟')) return;
    const currentChars = advancedSettings.savedCharacters || [];
    setAdvancedSettings({
      ...advancedSettings,
      savedCharacters: currentChars.filter(c => c.id !== id)
    });
  };

  const moveCharacter = (id: string, direction: number) => {
    const currentChars = [...(advancedSettings.savedCharacters || [])];
    const index = currentChars.findIndex(c => c.id === id);
    if (index < 0) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= currentChars.length) return;
    
    const temp = currentChars[index];
    currentChars[index] = currentChars[newIndex];
    currentChars[newIndex] = temp;
    
    setAdvancedSettings({
      ...advancedSettings,
      savedCharacters: currentChars
    });
  };

  const handleSaveCustomTemplate = (type: 'image' | 'video' | 'sfx' | 'animation' | 'voiceover', templateValue: string) => {
    if (!savingTemplateName.trim()) return;
    const customId = `custom_${Date.now()}`;
    const newTemplate = {
      id: customId,
      type,
      label: savingTemplateName.trim(),
      template: templateValue
    };
    const currentCustoms = advancedSettings.customTemplates || [];
    setAdvancedSettings({
      ...advancedSettings,
      customTemplates: [...currentCustoms, newTemplate]
    });
    setActiveTemplateIds({...activeTemplateIds, [type]: customId});
    setSavingTemplateType(null);
    setSavingTemplateName('');
  };

  const handleUpdateCustomTemplate = (id: string, newValue: string) => {
    const currentCustoms = advancedSettings.customTemplates || [];
    setAdvancedSettings({
      ...advancedSettings,
      customTemplates: currentCustoms.map(t => t.id === id ? { ...t, template: newValue } : t)
    });
  };

  const handleDeleteCustomTemplate = (id: string) => {
    const currentCustoms = advancedSettings.customTemplates || [];
    setAdvancedSettings({
      ...advancedSettings,
      customTemplates: currentCustoms.filter(t => t.id !== id)
    });
  };

  const insertSfxVariable = (variable: string) => {
    const defaultTpl = advancedSettings.sfxPromptTemplate || '';
    setAdvancedSettings({ ...advancedSettings, sfxPromptTemplate: defaultTpl + variable });
  };

  const insertVoiceoverVariable = (variable: string) => {
    const defaultTpl = advancedSettings.voiceoverPromptTemplate || '';
    setAdvancedSettings({ ...advancedSettings, voiceoverPromptTemplate: defaultTpl + variable });
  };

  const insertVideoVariable = (variable: string) => {
    const defaultTpl = advancedSettings.videoPromptTemplate || '';
    setAdvancedSettings({ ...advancedSettings, videoPromptTemplate: defaultTpl + variable });
  };

  const insertAnimationVariable = (variable: string) => {
    const defaultTpl = advancedSettings.animationPromptTemplate || '';
    setAdvancedSettings({ ...advancedSettings, animationPromptTemplate: defaultTpl + variable });
  };

  const insertImageVariable = (variable: string) => {
    const defaultTpl = advancedSettings.imagePromptTemplate || '';
    setAdvancedSettings({ ...advancedSettings, imagePromptTemplate: defaultTpl + variable });
  };

  const predefinedTemplates = {
    image: [
      { id: 'cinematic', label: 'Cinematic (سينمائي)', template: 'Cinematic photo, {shot_style}, {scene_description}. {character_desc}, dramatic lighting, 8k, highly detailed, {art_style}.' },
      { id: 'documentary', label: 'Documentary (وثائقي)', template: 'Documentary photography, {scene_description}, {art_style}, {shot_style}, {character_desc}, natural lighting, realistic.' },
      { id: 'digital_art', label: 'Digital Art (رقمي)', template: 'Digital art, {art_style}, {scene_description}, {character_desc}. {shot_style}, vibrant colors, vivid details, trending on artstation.' }
    ],
    video: [
      { id: 'epic_cinematic', label: 'Epic Cinematic (ملحمي)', template: 'Cinematic shot, {scene_description}, {art_style}, {shot_style}. {character_desc}, epic lighting, 8K resolution, film grain, wide angle lens, dramatic atmosphere, 120mm lens, f/1.8, sharp focus, color graded, anamorphic bokeh, shot on Arri Alexa.' },
      { id: 'cinematic', label: 'Cinematic (سينمائي)', template: 'Breathtaking cinematic sequence. Visuals: {scene_description}, featuring {character_desc}. Artistic direction: {art_style}. Captured in {shot_style}. Camera dynamics: {camera_movement}. Atmosphere: highly detailed, 8k resolution, photorealistic, cinematic lighting, volumetric fog, anamorphic lens flare, masterfully crafted motion, 60fps.' },
      { id: 'documentary', label: 'Documentary (وثائقي)', template: 'Premium documentary footage, {shot_style}. {camera_movement}. {scene_description}. {character_desc}. {art_style}, natural lighting, realistic textures, sharp focus, raw and unpolished aesthetic, handheld feel.' },
      { id: 'animation', label: 'Animation (أنيميشن)', template: 'High-quality animation, {art_style}. Action: {scene_description}. Character design: {character_desc}. Filmed with: {camera_movement}, {shot_style}. Vibrant colors, smooth frame interpolation.' }
    ],
    sfx: [
      { id: 'default', label: 'Default (الافتراضي)', template: 'High quality sound effect of {action}, happening in {scene_description}. The mood is {mood}.' },
      { id: 'cinematic', label: 'Cinematic (سينمائي)', template: 'Cinematic soundscape: {action} in {scene_description}, {mood} atmosphere, deep bass, immersive.' },
      { id: 'foley', label: 'Foley (مؤثرات واقعية)', template: 'Foley recording: {action}, close-up perspective, {scene_description}, realistic, high fidelity.' }
    ],
    voiceover: [
      { id: 'default', label: 'Default (الافتراضي)', template: '{arabic_script}' },
      { id: 'expressive', label: 'Expressive (تعبيري)', template: 'Read with {mood} and {emotion} tone. Text: {arabic_script}.' },
      { id: 'cinematic', label: 'Cinematic Trailer (عرض سينمائي)', template: 'Deep cinematic trailer voice. Dramatic pauses. Text: {arabic_script}.' }
    ],
    animation: [
      { id: 'default', label: 'Default (الافتراضي)', template: 'Animate this still image. Add {camera_movement} and subtle natural motion. Smooth frame interpolation.' },
      { id: 'dynamic', label: 'Dynamic (حيوي)', template: 'Dynamic animation, fast {camera_movement}, high energy motion, dramatic shifts, vivid action.' },
      { id: 'cinematic', label: 'Cinematic (سينمائي)', template: 'Cinematic slow motion, subtle {camera_movement}, deep focus, gentle natural motion, highly realistic.' }
    ]
  };

  const TemplateSelector = ({ type, value, onChange }: { type: 'image'|'video'|'sfx'|'animation'|'voiceover', value: string, onChange: (val: string) => void }) => {
    const defaultTemplates = predefinedTemplates[type];
    const customTemplatesList = advancedSettings.customTemplates?.filter(t => t.type === type) || [];
    const allTemplates = [...defaultTemplates, ...customTemplatesList];
    const selectedTemplate = allTemplates.find(t => t.template === value);
    const isCustomUnsaved = !selectedTemplate;
    const isSavedCustom = customTemplatesList.find(t => t.template === value);
    
    const activeId = activeTemplateIds[type];
    const isActiveCustomUnsaved = isCustomUnsaved && activeId?.startsWith('custom_') && value !== '';

    return (
      <div className="flex flex-col gap-3 relative mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <select 
              value={isCustomUnsaved ? 'custom' : selectedTemplate?.id}
              onChange={(e) => {
                const selected = allTemplates.find(t => t.id === e.target.value);
                if (selected) {
                  onChange(selected.template);
                  setActiveTemplateIds({...activeTemplateIds, [type]: selected.id});
                } else {
                  onChange('');
                  setActiveTemplateIds({...activeTemplateIds, [type]: 'custom'});
                }
              }}
              className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-xl pr-4 pl-10 py-3 appearance-none focus:outline-none focus:border-[var(--rosso-ferrari)] transition-colors cursor-pointer text-right"
              dir="rtl"
            >
              <option value="custom" className="bg-gray-900 text-gray-400">مخصص (Custom) {!selectedTemplate && value ? '- لم يتم الحفظ' : ''}</option>
              {customTemplatesList.length > 0 && (
                <optgroup label="قوالبي (My Templates)" className="bg-gray-800 text-gray-400">
                  {customTemplatesList.map(t => (
                    <option key={t.id} value={t.id} className="bg-gray-900 text-white">{t.label}</option>
                  ))}
                </optgroup>
              )}
              <optgroup label="قوالب جاهزة (Presets)" className="bg-gray-800 text-gray-400">
                {defaultTemplates.map(t => (
                  <option key={t.id} value={t.id} className="bg-gray-900 text-white">{t.label}</option>
                ))}
              </optgroup>
            </select>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronDown size={18} className="text-gray-500" />
            </div>
          </div>
          {isCustomUnsaved && value && !isActiveCustomUnsaved && (
            <button
              onClick={() => setSavingTemplateType(type)}
              className="px-3 py-3 bg-[var(--rosso-ferrari)]/20 hover:bg-[var(--rosso-ferrari)]/40 text-[var(--rosso-ferrari)] rounded-xl transition-colors text-sm font-medium whitespace-nowrap"
            >
              حفظ القالب
            </button>
          )}
          {isActiveCustomUnsaved && (
            <div className="flex gap-2">
              <button
                onClick={() => handleUpdateCustomTemplate(activeId, value)}
                className="px-3 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors text-sm font-medium whitespace-nowrap"
              >
                تحديث الحالي
              </button>
              <button
                onClick={() => setSavingTemplateType(type)}
                className="px-3 py-3 bg-[var(--rosso-ferrari)]/20 hover:bg-[var(--rosso-ferrari)]/40 text-[var(--rosso-ferrari)] rounded-xl transition-colors text-sm font-medium whitespace-nowrap"
                title="حفظ كقالب جديد"
              >
                حفظ كجديد
              </button>
            </div>
          )}
          {isSavedCustom && (
            <button
              onClick={() => handleDeleteCustomTemplate(isSavedCustom.id)}
              className="px-3 py-3 bg-red-900/40 hover:bg-red-900/60 text-red-400 rounded-xl transition-colors text-sm font-medium whitespace-nowrap"
              title="حذف القالب"
            >
              حذف
            </button>
          )}
          {value !== '' && (
            <button
              onClick={() => {
                onChange('');
                setActiveTemplateIds({...activeTemplateIds, [type]: ''});
              }}
              className="px-3 py-3 bg-blue-900/20 hover:bg-blue-900/40 text-blue-400 rounded-xl transition-colors text-sm font-medium whitespace-nowrap border border-blue-500/20"
              title="تفريغ الحقل للعودة لقالب النظام الافتراضي"
            >
              استعادة الافتراضي
            </button>
          )}
        </div>
        
        {savingTemplateType === type && (
          <div className="flex items-center gap-2 bg-black/30 p-3 rounded-xl border border-[var(--rosso-ferrari)]/30 mt-1 animate-in fade-in zoom-in-95 duration-200">
            <input 
              type="text" 
              value={savingTemplateName}
              onChange={(e) => setSavingTemplateName(e.target.value)}
              placeholder="اسم القالب (مثال: أسلوبي الخاص)..."
              className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none focus:ring-0 px-2"
              dir="rtl"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveCustomTemplate(type, value);
                if (e.key === 'Escape') {
                  setSavingTemplateType(null);
                  setSavingTemplateName('');
                }
              }}
            />
            <button 
              onClick={() => handleSaveCustomTemplate(type, value)}
              disabled={!savingTemplateName.trim()}
              className="px-3 py-1.5 bg-[var(--rosso-ferrari)] text-white text-xs rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              تأكيد
            </button>
            <button 
              onClick={() => {
                setSavingTemplateType(null);
                setSavingTemplateName('');
              }}
              className="px-3 py-1.5 bg-white/10 text-white text-xs rounded-lg hover:bg-white/20 transition-colors"
            >
              إلغاء
            </button>
          </div>
        )}
      </div>
    );
  };

  const ToggleSwitch = ({ checked, title, desc, onClick }: { checked: boolean, title: string, desc?: string, onClick?: () => void }) => (
    <div 
      onClick={onClick}
      className={cn(
        "flex items-center justify-between cursor-pointer p-5 rounded-2xl border transition-all duration-300 group hover:shadow-lg relative overflow-hidden",
        checked ? "bg-white/10 border-white/30 hover:border-white/40 hover:bg-white/[0.15] shadow-[0_8px_32px_rgba(255,255,255,0.05)]" : "bg-white/[0.02] border-white/10 hover:bg-white/[0.05] hover:border-white/20"
      )}
    >
      {checked && <div className="absolute inset-0 bg-gradient-to-r from-[var(--rosso-ferrari)]/5 to-transparent pointer-events-none" />}
      <div className="flex flex-col gap-1.5 pr-2 w-[calc(100%-4rem)] relative z-10">
        <span className={cn("font-medium tracking-wide text-sm transition-colors", checked ? "text-white drop-shadow-md" : "text-gray-300 group-hover:text-gray-200")}>{title}</span>
        {desc && <span className="text-xs text-gray-400 font-light leading-relaxed truncate whitespace-break-spaces">{desc}</span>}
      </div>
      <div className={cn("w-14 h-7 rounded-full transition-all duration-300 relative flex-shrink-0 flex items-center shadow-inner", checked ? "bg-[var(--rosso-ferrari)] border border-[var(--rosso-ferrari)] shadow-[0_0_15px_rgba(255,0,0,0.4)]" : "bg-black/60 border border-white/10")}>
        <div className={cn("h-5 w-5 rounded-full shadow-md transition-all duration-300 absolute", checked ? "left-1 bg-white" : "right-1 bg-gray-500")} />
      </div>
    </div>
  );

  const SectionCard = ({ children, title, icon: Icon }: { children: React.ReactNode, title?: string, icon?: any }) => (
    <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] space-y-6 relative overflow-hidden group hover:border-white/20 transition-all duration-500">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all duration-700 opacity-30 group-hover:opacity-60 group-hover:scale-150 pointer-events-none" />
      {title && (
        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4 relative z-10">
          {Icon && <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 shadow-inner"><Icon size={20} className="text-white opacity-90" /></div>}
          <h4 className="text-lg font-medium tracking-wide text-white drop-shadow-md">{title}</h4>
        </div>
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );

  const SliderControl = ({ label, value, min, max, step, onChange, unit = '', formatValue }: any) => (
    <div className="space-y-4 bg-white/[0.02] p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
      <div className="flex justify-between items-center text-sm font-medium">
        <span className="text-gray-300">{label}</span>
        <span className="font-mono text-white px-3 py-1 bg-black/60 rounded-lg text-sm tracking-widest border border-white/10 shadow-inner block min-w-[3rem] text-center">{formatValue ? formatValue(value) : value}{unit}</span>
      </div>
      <div className="relative flex items-center h-4">
        <input 
          type="range" min={min} max={max} step={step}
          value={value} onChange={onChange}
          className="w-full h-1.5 cursor-pointer bg-black/70 border border-white/10 rounded-full appearance-none outline-none z-10"
          style={{
             background: `linear-gradient(to right, var(--rosso-ferrari) ${(value - min) / (max - min) * 100}%, rgba(0,0,0,0.7) ${(value - min) / (max - min) * 100}%)`
          }}
        />
        <style dangerouslySetInnerHTML={{__html: `
          input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: #fff;
            box-shadow: 0 0 10px rgba(255,0,0,0.5);
            cursor: pointer;
            margin-top: 0px;
            border: 2px solid var(--rosso-ferrari);
            transition: transform 0.2s;
          }
          input[type=range]:hover::-webkit-slider-thumb {
            transform: scale(1.2);
          }
        `}} />
      </div>
    </div>
  );

  const getPreviewContent = (format: string) => {
    switch (format.toLowerCase()) {
      case 'txt':
        return `المشهد 1:\nالشخصية: أحمد يقف في الشارع، ينظر حوله بقلق.\nالمدة: 5 ثوانٍ\n\nالمشهد 2:\nالكاميرا تركز على وجه أحمد، تظهر عليه علامات المفاجأة.\nالمدة: 3 ثوانٍ`;
      case 'csv':
        return `Scene,Description,Duration\n1,"أحمد يقف في الشارع، ينظر حوله بقلق.",5\n2,"الكاميرا تركز على وجه أحمد، تظهر المفاجأة.",3`;
      case 'json':
        return `[\n  {\n    "id": 1,\n    "description": "أحمد يقف في الشارع، ينظر حوله بقلق.",\n    "duration": 5\n  },\n  {\n    "id": 2,\n    "description": "الكاميرا تركز على وجه أحمد، تظهر المفاجأة.",\n    "duration": 3\n  }\n]`;
      case 'pdf':
        if (exportSettings.pdfTemplate === 'compact') {
          return `معاينة لملف الـ PDF (مدمج):\n\n[1] 5ث | المشهد: أحمد يقف في الشارع المزدحم | الموجه: Camera pans...\n[2] 3ث | المشهد: الكاميرا تركز على الوجه | الموجه: Close up...`;
        } else if (exportSettings.pdfTemplate === 'detailed') {
          return `معاينة لملف الـ PDF (مفصل):\n\n>>> المشهد 1 <<<\n[المدة]: 5 ثوانٍ\n[النص]: أحمد يقف في الشارع المزدحم...\n[صورة]: صورة لأحمد في الشارع\n[ملاحظات الإخراج]: التركيز على الإضاءة الخافتة\n[الموجهات]: Camera pans slowly...`;
        } else {
          return `معاينة لملف الـ PDF (قياسي):\n\n=== سيناريو الفيديو ===\n\n[مشهد 1] (5ث)\nالوصف: أحمد يقف في الشارع المزدحم، ينظر حوله بقلق.\n...\n(تنسيق موجه ومجهز للمراجعة العادية)`;
        }
      default:
        return 'لا توجد معاينة متاحة لهذه الصيغة.';
    }
  };

  // Computed values
  const estimatedWords = Math.round(settings.durationTarget * (settings.wordsPerMinute / 60));
  const wordsPerScene = Math.round(estimatedWords / settings.sceneCountTarget);
  const secondsPerScene = Math.round(settings.durationTarget / settings.sceneCountTarget);

  const handleSave = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      const stateToSave = { settings, advancedSettings, exportSettings, audioSettings, contentSettings, aiModel, temperature, styles };
      localStorage.setItem('ai_video_factory_settings', JSON.stringify(stateToSave));
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2500);
    }, 600);
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    
    if (aiModel === 'OpenRouter') {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
          headers: {
            'Authorization': `Bearer ${advancedSettings.openRouterApiKey}`
          }
        });
        if (response.ok) {
          setTestStatus('success');
        } else {
          setTestStatus('error');
        }
      } catch (err) {
        setTestStatus('error');
      }
    } else {
      setTimeout(() => setTestStatus('success'), 1500);
    }
    
    setTimeout(() => {
      setTestStatus('idle');
    }, 4000);
  };

  const tabs = [
    { id: 'models', label: 'النماذج الأساسية', icon: Cpu },
    { id: 'external_apis', label: 'مفاتيح الربط (API Keys)', icon: Key },
    { id: 'video', label: 'إعدادات الفيديو', icon: MonitorPlay },
    { id: 'styles', label: 'الأنماط البصرية', icon: Palette },
    { id: 'audio', label: 'إعدادات الصوت', icon: Volume2 },
    { id: 'characters', label: 'إدارة الشخصيات', icon: Users },
    { id: 'content', label: 'المحتوى والسيناريو', icon: FileText },
    { id: 'export', label: 'إعدادات التصدير', icon: Download },
    { id: 'frontend', label: 'الواجهة الرئيسية', icon: LayoutDashboard },
    { id: 'advanced', label: 'إعدادات متقدمة', icon: Wrench },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-12 w-full max-w-6xl mx-auto relative"
    >
      <AnimatePresence>
        {previewFormat && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#111] border border-white/10 rounded-3xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto custom-scrollbar relative"
              dir="rtl"
            >
              <button 
                onClick={() => setPreviewFormat(null)}
                className="absolute top-6 left-6 text-gray-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              
              <h3 className="text-2xl font-light text-white mb-6 uppercase tracking-[0.2em]">{previewFormat} Preview</h3>
              
              <div className="bg-black/50 border border-white/5 rounded-2xl p-6 font-mono text-sm text-gray-300 whitespace-pre-wrap text-right leading-loose">
                {getPreviewContent(previewFormat)}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center pt-8 pb-8">
        <h2 className="title-text text-white mb-6">الإعدادات</h2>
        <p className="text-gray-400 font-light tracking-wide text-lg">تحكم كامل في جميع محركات التوليد وخصائص الإخراج.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Tabs */}
        <div className="lg:w-64 flex-shrink-0 space-y-2 border-l border-white/5 pl-6 pt-4">
          <div className="small-caps mb-6 text-gray-500 text-right pr-4">القوائم</div>
          <div className="flex flex-col relative space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 text-right group relative overflow-hidden",
                  activeTab === tab.id
                    ? "text-white font-medium bg-white/[0.08]"
                    : "bg-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5"
                )}
              >
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="activeTabIndicator"
                    className="absolute right-0 top-0 bottom-0 w-1 bg-[var(--rosso-ferrari)] rounded-r-2xl shadow-[0_0_10px_var(--rosso-ferrari)]"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <tab.icon size={18} className={cn("transition-colors duration-500 relative z-10", activeTab === tab.id ? "text-[var(--rosso-ferrari)]" : "text-gray-600 group-hover:text-gray-400")} />
                <span className="tracking-wide text-sm relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 p-6 md:p-10 rounded-3xl relative border border-white/5 min-h-[600px] bg-white/[0.02]">
          
          <AnimatePresence mode="wait">
            {/* 1. AI Models Tab */}
            {activeTab === 'models' && (
              <motion.div key="models" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-10 relative z-10">
                <div className="mb-10 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-white/10 bg-white/5 mb-4">
                    <Cpu size={24} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-light tracking-wide text-white mb-2">نماذج الذكاء الاصطناعي</h3>
                  <p className="small-caps text-gray-500">AI Models</p>
                  <div className="horizontal-line w-12 mx-auto mt-6 opacity-30"></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { id: 'Google Gemini 2.5 Flash', name: 'Gemini 2.5 Flash', provider: 'Google',  desc: 'الأفضل للسرعة وتعدد الوسائط' },
                    { id: 'OpenAI GPT-4o', name: 'GPT-4o', provider: 'OpenAI', desc: 'الأفضل للدقة والمنطق' },
                    { id: 'Anthropic Claude 3.5 Sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', desc: 'الأفضل للكتابة الإبداعية' },
                    { id: 'OpenRouter', name: 'OpenRouter', provider: 'OpenRouter', desc: 'نماذج متعددة (Llama وغيرها)' },
                    ...(advancedSettings.customModels || []).map(cm => ({
                      id: cm.id,
                      name: cm.modelId,
                      provider: cm.provider,
                      desc: 'نموذج مخصص مضاف بواسطة المستخدم'
                    }))
                  ].map((model) => (
                    <button
                      key={model.id}
                      onClick={() => setAiModel(model.id)}
                      className={cn(
                        "relative p-6 rounded-3xl border flex flex-col gap-4 transition-all duration-500 text-right group",
                        aiModel === model.id
                          ? "bg-white/5 border-white/50 shadow-[0_0_30px_rgba(255,255,255,0.05)]"
                          : "bg-transparent border-white/10 hover:bg-white/5 hover:border-white/30"
                      )}
                    >
                      {aiModel === model.id && <div className="absolute top-6 left-6 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_#fff] animate-pulse" />}
                      <span className="small-caps px-3 py-1 bg-white/5 rounded-full text-gray-400 w-fit">{model.provider}</span>
                      <span className="text-xl font-light text-white tracking-wide">{model.name}</span>
                      <span className="text-sm font-light text-gray-500 leading-relaxed">{model.desc}</span>
                    </button>
                  ))}
                </div>

                <SectionCard title="إعدادات الـ API" icon={KeyRound}>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2 relative">
                      <label className="text-xs text-gray-400">مفتاح الـ API</label>
                      <div className="relative">
                        <input 
                          type={showPassword ? "text" : "password"} 
                          value={
                            aiModel === 'OpenRouter' ? advancedSettings.openRouterApiKey || '' :
                            aiModel.includes('Gemini') ? advancedSettings.geminiApiKey || '' :
                            aiModel.includes('GPT') ? advancedSettings.openaiApiKey || '' :
                            advancedSettings.anthropicApiKey || ''
                          }
                          onChange={(e) => {
                            if (aiModel === 'OpenRouter') setAdvancedSettings({...advancedSettings, openRouterApiKey: e.target.value});
                            else if (aiModel.includes('Gemini')) setAdvancedSettings({...advancedSettings, geminiApiKey: e.target.value});
                            else if (aiModel.includes('GPT')) setAdvancedSettings({...advancedSettings, openaiApiKey: e.target.value});
                            else setAdvancedSettings({...advancedSettings, anthropicApiKey: e.target.value});
                          }}
                          placeholder="أدخل مفتاح الـ API الخاص بـ..." 
                          className="w-full bg-white/5 border border-white/5 focus:border-[var(--rosso-ferrari)] rounded-2xl pl-16 pr-6 py-4 text-white focus:outline-none tracking-widest font-mono"
                        />
                        <button 
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-gray-400">معرف النموذج (مثال: gpt-4o, claude-3-sonnet)</label>
                      <input 
                        type="text" 
                        value={
                          aiModel === 'OpenRouter' ? advancedSettings.openRouterModel || '' :
                          aiModel.includes('Gemini') ? advancedSettings.geminiModel || 'gemini-2.5-flash' :
                          aiModel.includes('GPT') ? advancedSettings.openaiModel || 'gpt-4o' :
                          advancedSettings.anthropicModel || 'claude-3-5-sonnet-20241022'
                        }
                        onChange={(e) => {
                          if (aiModel === 'OpenRouter') setAdvancedSettings({...advancedSettings, openRouterModel: e.target.value});
                          else if (aiModel.includes('Gemini')) setAdvancedSettings({...advancedSettings, geminiModel: e.target.value});
                          else if (aiModel.includes('GPT')) setAdvancedSettings({...advancedSettings, openaiModel: e.target.value});
                          else setAdvancedSettings({...advancedSettings, anthropicModel: e.target.value});
                        }}
                        placeholder="أدخل معرف النموذج..." 
                        className="w-full bg-white/5 border border-white/5 focus:border-[var(--rosso-ferrari)] rounded-2xl px-6 py-4 text-white focus:outline-none tracking-wide font-mono"
                      />
                    </div>
                    <button 
                      onClick={handleTestConnection}
                      className={cn(
                        "w-full px-8 py-4 rounded-2xl transition-all duration-300 font-medium flex items-center justify-center gap-3 tracking-wide group",
                        testStatus === 'success' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" :
                        testStatus === 'error' ? "bg-red-500/10 text-red-500 border border-red-500/30" :
                        testStatus === 'testing' ? "bg-white/10 text-white border border-white/30" :
                        "bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20"
                      )}
                      disabled={testStatus === 'testing'}
                    >
                      <div className="relative z-10 flex items-center justify-center gap-3 w-full">
                        {testStatus === 'success' && <CheckCircle2 size={18} />}
                        {testStatus === 'error' && <AlertCircle size={18} />}
                        {testStatus === 'testing' && <RefreshCw size={18} className="animate-spin" />}
                        <span>
                          {testStatus === 'idle' && "اختبار الاتصال"}
                          {testStatus === 'testing' && "جاري الاختبار..."}
                          {testStatus === 'success' && "نجاح الاتصال"}
                          {testStatus === 'error' && "فشل الاتصال"}
                        </span>
                      </div>
                    </button>
                  </div>
                </SectionCard>

                <SectionCard title="عوامل التوليد (Generation Params)" icon={Cpu}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <SliderControl 
                      label="درجة الإبداعية (Temperature)" 
                      value={temperature} 
                      onChange={(e: any) => setTemperature(parseFloat(e.target.value))} 
                      min="0.1" max="1.0" step="0.1" 
                    />
                    <SliderControl 
                      label="Max Tokens (للمشهد الواحد)" 
                      value={1500} 
                      onChange={() => {}} 
                      min="500" max="4000" step="100" 
                    />
                  </div>
                </SectionCard>
              </motion.div>
            )}

            {/* External APIs Tab */}
            {activeTab === 'external_apis' && (
              <motion.div key="external_apis" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-10 relative z-10">
                <div className="mb-10 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-white/10 bg-white/5 mb-4 shadow-lg shadow-[var(--rosso-ferrari)]/10">
                    <Key size={24} className="text-[var(--rosso-ferrari)]" />
                  </div>
                  <h3 className="text-2xl font-light tracking-wide text-white mb-2">مفاتيح الربط والذكاء الاصطناعي</h3>
                  <p className="small-caps text-gray-500">API Keys Integration</p>
                  <div className="horizontal-line w-12 mx-auto mt-6 opacity-30"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ApiKeyCard id="replicate" name="Replicate API" desc="لتوليد الصور أو النماذج المدعومة" icon={Code} link="https://replicate.com/account/api-tokens" value={apiKeys?.replicate || ''} onChange={(val: string) => setApiKeys({...apiKeys, replicate: val})} />
                  <ApiKeyCard id="luma" name="Luma DreamMachine" desc="لتوليد الفيديو الاحترافي" icon={MonitorPlay} link="https://lumalabs.ai/dream-machine/api/keys" value={apiKeys?.luma || ''} onChange={(val: string) => setApiKeys({...apiKeys, luma: val})} />
                  <ApiKeyCard id="runwayML" name="RunwayML" desc="النموذج المتقدم Gen-3 Alpha" icon={Film} link="https://app.runwayml.com/developer" value={apiKeys?.runwayML || ''} onChange={(val: string) => setApiKeys({...apiKeys, runwayML: val})} />
                  <ApiKeyCard id="hedra" name="Hedra" desc="لتحريك الوجوه والشفاه الصوتية" icon={Users} link="https://www.hedra.com/app/settings" value={apiKeys?.hedra || ''} onChange={(val: string) => setApiKeys({...apiKeys, hedra: val})} />
                  <ApiKeyCard id="elevenLabs" name="ElevenLabs" desc="للتعليق الصوتي الاحترافي" icon={Mic} link="https://elevenlabs.io/app/settings/api-keys" value={apiKeys?.elevenLabs || advancedSettings.elevenLabsApiKey || ''} onChange={(val: string) => { setApiKeys({...apiKeys, elevenLabs: val}); setAdvancedSettings({...advancedSettings, elevenLabsApiKey: val}); }} />
                  <ApiKeyCard id="kieAI" name="Kie.ai" desc="منصة شاملة لنماذج الذكاء" icon={Terminal} link="https://kie.ai/" value={apiKeys?.kieAI || ''} onChange={(val: string) => setApiKeys({...apiKeys, kieAI: val})} />
                  <ApiKeyCard id="falAI" name="Fal.ai" desc="توليد الصور والفيديوهات السريعة" icon={Sparkles} link="https://fal.ai/dashboard/keys" value={apiKeys?.falAI || ''} onChange={(val: string) => setApiKeys({...apiKeys, falAI: val})} />
                </div>
              </motion.div>
            )}

            {/* 2. Video Settings Tab */}
            {activeTab === 'video' && (
              <motion.div key="video" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-10 relative z-10">
                <div className="mb-10 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-white/10 bg-white/5 mb-4">
                    <MonitorPlay size={24} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-light tracking-wide text-white mb-2">إعدادات وتنسيق الفيديو</h3>
                  <p className="small-caps text-gray-500">Video Settings</p>
                  <div className="horizontal-line w-12 mx-auto mt-6 opacity-30"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-8">
                  <div className="space-y-8 flex flex-col">
                    <SectionCard title="أبعاد الفيديو (Aspect Ratio)" icon={Smartphone}>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: 'short', name: 'قصير', detail: '9:16 Shorts', icon: Smartphone },
                          { id: 'long', name: 'طويل', detail: '16:9 YouTube', icon: MonitorPlay },
                          { id: 'square', name: 'مربع', detail: '1:1 Instagram', icon: Square }
                        ].map((type) => (
                          <button
                            key={type.id}
                            onClick={() => setSettings({ ...settings, videoType: type.id as any })}
                            className={cn(
                              "p-4 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all h-32 group relative overflow-hidden",
                              settings.videoType === type.id ? "bg-white/10 border-white/50 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]" : "bg-black/20 border-white/10 text-gray-400 hover:border-white/30 hover:bg-white/5"
                            )}
                          >
                            {settings.videoType === type.id && <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full blur-2xl"></div>}
                            <type.icon size={26} className={cn("transition-colors relative z-10", settings.videoType === type.id ? "text-white" : "text-gray-500 group-hover:text-gray-300")} />
                            <span className="text-sm font-medium tracking-wide relative z-10">{type.name}</span>
                            <span className={cn("text-[10px] font-mono relative z-10 px-2 py-0.5 rounded-md", settings.videoType === type.id ? "bg-white/10 text-gray-200" : "bg-transparent text-gray-500")}>{type.detail}</span>
                          </button>
                        ))}
                      </div>
                    </SectionCard>

                    <SectionCard title="المنصة المستهدفة (Platform)" icon={Globe}>
                      <div className="grid grid-cols-2 gap-3">
                        {['YouTube Shorts', 'TikTok', 'Instagram Reels', 'YouTube Long Form'].map(platform => (
                          <button
                            key={platform}
                            onClick={() => setSettings({ ...settings, platform })}
                            className={cn(
                              "py-4 px-3 text-sm rounded-xl border transition-all duration-300 font-medium select-none shadow-sm",
                              settings.platform === platform ? "bg-white/10 border-white/50 text-white" : "bg-black/20 border-white/10 text-gray-400 hover:border-white/30 hover:text-gray-200 hover:bg-white/5"
                            )}
                          >
                            {platform}
                          </button>
                        ))}
                      </div>
                    </SectionCard>
                  </div>

                  <SectionCard title="محددات الوقت وسرعة الإيقاع" icon={Clock}>
                    <div className="space-y-8">
                      <SliderControl 
                        label="المدة المستهدفة للفيديو" 
                        value={settings.durationTarget} 
                        onChange={(e: any) => setSettings({ ...settings, durationTarget: parseInt(e.target.value) })} 
                        min="15" max="600" step="5" unit=" ثانية"
                      />
                      <SliderControl 
                        label="عدد المشاهد المقترح" 
                        value={settings.sceneCountTarget} 
                        onChange={(e: any) => setSettings({ ...settings, sceneCountTarget: parseInt(e.target.value) })} 
                        min="3" max="50" step="1" unit=" مشاهد"
                      />
                      <SliderControl 
                        label="سرعة الكلام (WPM)" 
                        value={settings.wordsPerMinute} 
                        onChange={(e: any) => setSettings({ ...settings, wordsPerMinute: parseInt(e.target.value) })} 
                        min="100" max="180" step="5" unit=" كلمة/دقيقة"
                      />
                    </div>
                  </SectionCard>
                </div>

                <div className="bg-white/5 p-6 rounded-3xl border border-white/10 mt-8">
                  <h4 className="text-lg font-medium text-white mb-4">خيارات إضافية للمونتاج</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ToggleSwitch 
                      checked={settings.enableSubtitles !== false} 
                      title="إنشاء وعرض نصوص الترجمة (Subtitles)" 
                      desc="سيتم توليد وعرض الترجمة تلقائياً على الفيديو"
                      onClick={() => setSettings({...settings, enableSubtitles: settings.enableSubtitles === false ? true : false})} 
                    />
                  </div>
                </div>

                <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex flex-wrap justify-around items-center mt-8">
                  <div className="text-center p-2">
                    <div className="small-caps mb-2 text-gray-500">إجمالي الكلمات المتوقع</div>
                    <div className="font-light text-3xl text-white">~{estimatedWords}</div>
                  </div>
                  <div className="w-px h-16 bg-white/10 hidden md:block"></div>
                  <div className="text-center p-2">
                    <div className="small-caps mb-2 text-gray-500">متوسط الكلمات / مشهد</div>
                    <div className="font-light text-3xl text-white">~{wordsPerScene}</div>
                  </div>
                  <div className="w-px h-16 bg-white/10 hidden md:block"></div>
                  <div className="text-center p-2">
                    <div className="small-caps mb-2 text-gray-500">متوسط المدة / مشهد</div>
                    <div className="font-light text-3xl text-white">~{secondsPerScene}ث</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 3. Visual Styles Tab */}
            {activeTab === 'styles' && (
              <motion.div key="styles" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-10 relative z-10 h-full overflow-y-auto pr-2 custom-scrollbar">
                <div className="mb-10 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-white/10 bg-white/5 mb-4">
                    <Palette size={24} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-light tracking-wide text-white mb-2">الأنماط البصرية</h3>
                  <p className="small-caps text-gray-500">Visual Styles</p>
                  <div className="horizontal-line w-12 mx-auto mt-6 opacity-30"></div>
                </div>
                
                <div className="space-y-4">
                  <SectionCard title="النمط الفني (Art Style)" icon={Palette}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {ART_STYLES.map(style => (
                        <button
                          key={style.id}
                          onClick={() => setStyles({ ...styles, artStyle: style })}
                          className={cn(
                            "p-4 rounded-2xl border text-center transition-all duration-300 flex items-center justify-center min-h-[80px]",
                            styles.artStyle?.id === style.id ? "border-white/80 bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] text-white" : "border-white/10 hover:border-white/30 hover:bg-white/5 bg-black/20 text-gray-400"
                          )}
                        >
                          <span className="text-sm font-medium tracking-wide">{style.name}</span>
                        </button>
                      ))}
                    </div>
                  </SectionCard>
                </div>

                <div className="space-y-4 pt-4">
                  <SectionCard title="نمط اللقطة (Shot Style)" icon={MonitorPlay}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {SHOT_STYLES.map(style => (
                        <button
                          key={style.id}
                          onClick={() => setStyles({ ...styles, shotStyle: style })}
                          className={cn(
                            "p-4 rounded-2xl border text-center transition-all duration-300 flex items-center justify-center min-h-[80px]",
                            styles.shotStyle?.id === style.id ? "border-white/80 bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] text-white" : "border-white/10 hover:border-white/30 hover:bg-white/5 bg-black/20 text-gray-400"
                          )}
                        >
                          <span className="text-sm font-medium tracking-wide">{style.name}</span>
                        </button>
                      ))}
                    </div>
                  </SectionCard>
                </div>

                <div className="space-y-4 pt-4">
                  <SectionCard title="جودة التوليد (Quality Selector)" icon={Sparkles}>
                    <div className="flex gap-3">
                      {QUALITY_OPTIONS.map(q => (
                        <button
                          key={q.id}
                          onClick={() => setStyles({ ...styles, quality: q.id })}
                          className={cn(
                            "flex-1 p-4 rounded-2xl border text-center transition-all duration-300 flex items-center justify-center min-h-[80px]",
                            styles.quality === q.id ? "border-white/80 bg-[var(--rosso-ferrari)] shadow-[0_0_20px_rgba(227,38,54,0.3)] text-white" : "border-white/10 hover:border-white/30 hover:bg-white/5 bg-black/20 text-gray-400"
                          )}
                        >
                          <span className="text-sm font-bold font-mono tracking-wider uppercase">{q.name}</span>
                        </button>
                      ))}
                    </div>
                  </SectionCard>
                </div>
              </motion.div>
            )}

            {/* 4. Audio Settings Tab */}
            {activeTab === 'audio' && (
              <motion.div key="audio" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-10 relative z-10">
                <div className="mb-10 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-white/10 bg-white/5 mb-4">
                    <Volume2 size={24} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-light tracking-wide text-white mb-2">إعدادات الصوت</h3>
                  <p className="small-caps text-gray-500">Audio Settings</p>
                  <div className="horizontal-line w-12 mx-auto mt-6 opacity-30"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-8">
                  <div className="space-y-8 flex flex-col">
                    <SectionCard title="النوع الأساسي للصوت (Audio Type)" icon={Volume2}>
                      <div className="flex bg-black/40 border border-white/10 rounded-2xl p-1.5 flex-col md:flex-row gap-1 shadow-inner">
                        {['تعليق صوتي فقط (Voiceover)', 'مؤثرات صوتية فقط (SFX)', 'تعليق وتأثيرات صوتية'].map(type => (
                          <button
                            key={type}
                            onClick={() => setAudioSettings({ ...audioSettings, type })}
                            className={cn(
                              "flex-1 py-3 px-2 text-xs sm:text-sm rounded-xl transition-all duration-300 font-medium",
                              audioSettings.type === type ? "bg-white/15 text-white shadow-md border border-white/10" : "text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent"
                            )}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </SectionCard>
                    
                    <SectionCard title="محرك التوليد (TTS Engine)" icon={Cpu}>
                      <div className="flex gap-3 text-center">
                        {['Edge-TTS', 'ElevenLabs', 'OpenAI TTS'].map(engine => (
                          <button
                            key={engine}
                            onClick={() => setAudioSettings({ ...audioSettings, ttsEngine: engine })}
                            className={cn(
                              "flex-1 py-4 px-2 text-sm rounded-xl border transition-all duration-300 font-medium flex items-center justify-center shadow-sm",
                              audioSettings.ttsEngine === engine ? "bg-white/10 border-white/50 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]" : "bg-black/20 border-white/10 text-gray-500 hover:border-white/30 hover:text-gray-300 hover:bg-white/5"
                            )}
                          >
                            {engine}
                          </button>
                        ))}
                      </div>
                      
                      {audioSettings.ttsEngine === 'ElevenLabs' && (
                        <div className="mt-6 pt-6 border-t border-white/5">
                          <label className="block text-xs font-medium text-gray-400 mb-3">مفتاح API الخاص بـ ElevenLabs</label>
                          <div className="relative mb-4">
                            <input 
                              type={showPassword ? "text" : "password"} 
                              value={advancedSettings.elevenLabsApiKey || ''}
                              onChange={(e) => setAdvancedSettings({...advancedSettings, elevenLabsApiKey: e.target.value})}
                              placeholder="sk-..." 
                              className="w-full bg-black/40 border border-white/10 focus:border-[var(--rosso-ferrari)] rounded-xl px-4 py-3 text-white font-mono text-sm tracking-widest focus:outline-none transition-colors"
                              dir="ltr"
                            />
                            <button 
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                          
                          <div className="flex gap-3 mb-2">
                             <button 
                              onClick={handleSave}
                              className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
                             >
                                <Save size={16} /> 
                                {saveStatus === 'saving' ? 'جاري الحفظ...' : 
                                 saveStatus === 'success' ? 'تم الحفظ!' : 'حفظ الإعدادات'}
                             </button>
                             <button
                               onClick={async () => {
                                 setTestStatus('testing');
                                 try {
                                   const response = await fetch('https://api.elevenlabs.io/v1/user', {
                                     headers: {
                                       'xi-api-key': advancedSettings.elevenLabsApiKey || ''
                                     }
                                   });
                                   if (response.ok) {
                                     setTestStatus('success');
                                   } else {
                                     setTestStatus('error');
                                   }
                                 } catch (e) {
                                   setTestStatus('error');
                                 }
                                 setTimeout(() => setTestStatus('idle'), 4000);
                               }}
                               className={cn(
                                 "flex-1 px-4 py-2 text-sm rounded-xl transition-colors flex items-center justify-center gap-2",
                                 testStatus === 'testing' ? "bg-white/10 text-white" :
                                 testStatus === 'success' ? "bg-emerald-500/20 text-emerald-400" :
                                 testStatus === 'error' ? "bg-red-500/20 text-red-400" :
                                 "bg-blue-500/20 hover:bg-blue-500/30 text-blue-400"
                               )}
                             >
                                {testStatus === 'testing' ? <Loader2 size={16} className="animate-spin" /> : 
                                 testStatus === 'success' ? <CheckCircle2 size={16} /> :
                                 testStatus === 'error' ? <AlertCircle size={16} /> : <Globe size={16} />}
                                اختبار الاتصال
                             </button>
                          </div>
                          
                          <p className="text-xs text-gray-500 mt-2">مطلوب التوفر على حساب مدفوع في ElevenLabs لاستخدام أصوات عالية الجودة.</p>
                        </div>
                      )}
                    </SectionCard>

                    <SectionCard title="إعدادات الصوت الدقيقة" icon={Mic}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-3">الصوت / الجنس</label>
                          <div className="flex bg-black/40 border border-white/10 rounded-xl p-1 gap-1 shadow-inner">
                            {['ذكر', 'أنثى'].map(gender => (
                              <button
                                key={gender}
                                onClick={() => setAudioSettings({ ...audioSettings, gender })}
                                className={cn(
                                  "flex-1 py-2 text-sm rounded-lg transition-all duration-300 font-medium",
                                  audioSettings.gender === gender ? "bg-white/15 text-white shadow-sm border border-white/10" : "text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent"
                                )}
                              >
                                {gender}
                              </button>
                            ))}
                          </div>
                        </div>

                        {audioSettings.ttsEngine === 'ElevenLabs' ? (
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-3">صوت ElevenLabs</label>
                            <div className="relative">
                              <select 
                                value={audioSettings.voice || 'Rachel'}
                                onChange={(e) => setAudioSettings({ ...audioSettings, voice: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 appearance-none focus:outline-none focus:border-[var(--rosso-ferrari)] transition-colors cursor-pointer text-right"
                                dir="rtl"
                              >
                                <option value="Rachel" className="bg-gray-900">Rachel (أمريكي - هادئ)</option>
                                <option value="Drew" className="bg-gray-900">Drew (أمريكي - إخباري)</option>
                                <option value="Clyde" className="bg-gray-900">Clyde (أمريكي - وثائقي)</option>
                                <option value="Mimi" className="bg-gray-900">Mimi (أطفال - أنيميشن)</option>
                                <option value="Adam" className="bg-gray-900">Adam (أمريكي - عميق)</option>
                                <option value="Antoni" className="bg-gray-900">Antoni (أمريكي - شاب)</option>
                                <option value="Bella" className="bg-gray-900">Bella (أمريكي - ناعم)</option>
                              </select>
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                <ChevronDown size={16} className="text-gray-500" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-3">اللهجة (Locale)</label>
                            <div className="flex flex-wrap gap-2">
                              {[
                                { value: 'ar-SA', label: 'السعودية' },
                                { value: 'ar-EG', label: 'مصر' },
                                { value: 'ar-AE', label: 'الإمارات' },
                                { value: 'en-US', label: 'English' }
                              ].map(locale => (
                                <button
                                  key={locale.value}
                                  onClick={() => setAudioSettings({ ...audioSettings, locale: locale.value })}
                                  className={cn(
                                    "px-3 py-2 text-sm rounded-lg border transition-all duration-300 font-medium shadow-sm",
                                    audioSettings.locale === locale.value ? "bg-white/10 border-white/50 text-white" : "bg-black/20 border-white/10 text-gray-400 hover:border-white/30 hover:text-gray-200"
                                  )}
                                >
                                  {locale.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </SectionCard>
                  </div>

                  <SectionCard title="تعديلات الصوت المتقدمة" icon={AudioLines}>
                    <div className="space-y-8">
                      <SliderControl 
                        label="سرعة الصوت (Speed)" 
                        value={audioSettings.speed} 
                        onChange={(e: any) => setAudioSettings({ ...audioSettings, speed: parseFloat(e.target.value) })} 
                        min="0.5" max="2.0" step="0.1" unit="x"
                      />
                      <SliderControl 
                        label="نبرة الصوت (Pitch)" 
                        value={audioSettings.pitch} 
                        onChange={(e: any) => setAudioSettings({ ...audioSettings, pitch: parseFloat(e.target.value) })} 
                        min="0.5" max="1.5" step="0.1"
                      />
                    </div>

                    <div className="pt-6 border-t border-white/5 space-y-4">
                      <ToggleSwitch 
                        checked={audioSettings.previewAudio} 
                        title="تفعيل المعاينة الصوتية التلقائية" 
                        onClick={() => setAudioSettings({...audioSettings, previewAudio: !audioSettings.previewAudio})} 
                      />
                      <ToggleSwitch 
                        checked={audioSettings.bgAudio} 
                        title="تضمين موسيقى خلفية (Background Music)" 
                        onClick={() => setAudioSettings({...audioSettings, bgAudio: !audioSettings.bgAudio})} 
                      />
                    </div>

                    <div className="pt-6 border-t border-white/5 space-y-6">
                      <h4 className="text-sm font-medium text-gray-300">موازنة الصوت (Audio Mix)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SliderControl 
                          label="حجم التعليق الصوتي" 
                          value={audioSettings.voiceVolume !== undefined ? audioSettings.voiceVolume : 0.8} 
                          onChange={(e: any) => setAudioSettings({ ...audioSettings, voiceVolume: parseFloat(e.target.value) })} 
                          min="0" max="1" step="0.1" unit=""
                        />
                        <SliderControl 
                          label="حجم موسيقى الخلفية" 
                          value={audioSettings.bgMusicVolume !== undefined ? audioSettings.bgMusicVolume : 0.2} 
                          onChange={(e: any) => setAudioSettings({ ...audioSettings, bgMusicVolume: parseFloat(e.target.value) })} 
                          min="0" max="1" step="0.1" unit=""
                        />
                      </div>
                    </div>

                    {audioSettings.bgAudio && (
                      <div className="pt-6 border-t border-white/5 space-y-4">
                        <h4 className="text-sm font-medium text-gray-300">مصدر موسيقى الخلفية</h4>
                        <div className="flex gap-4">
                          <button
                            onClick={() => setAudioSettings({ ...audioSettings, bgMusicType: 'library' })}
                            className={cn(
                              "flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-colors",
                              audioSettings.bgMusicType === 'library' || !audioSettings.bgMusicType ? "bg-[var(--rosso-ferrari)]/20 border-[var(--rosso-ferrari)] text-white" : "bg-black/20 border-white/10 text-gray-400 hover:border-white/30"
                            )}
                          >
                            من المكتبة (تلقائي)
                          </button>
                          <button
                            onClick={() => setAudioSettings({ ...audioSettings, bgMusicType: 'upload' })}
                            className={cn(
                              "flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-colors",
                              audioSettings.bgMusicType === 'upload' ? "bg-[var(--rosso-ferrari)]/20 border-[var(--rosso-ferrari)] text-white" : "bg-black/20 border-white/10 text-gray-400 hover:border-white/30"
                            )}
                          >
                            رفع ملف صوتي
                          </button>
                        </div>
                        
                        {audioSettings.bgMusicType === 'upload' && (
                          <div className="mt-4 p-4 border border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center p-8 bg-black/10">
                            <Upload className="text-gray-500 mb-2" size={24} />
                            <p className="text-sm text-gray-400 mb-4">قم برفع ملف mp3 أو wav</p>
                            <input
                              type="file"
                              accept="audio/mp3,audio/wav"
                              className="hidden"
                              id="bg-music-upload"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  // Mock uploading visually
                                  const url = URL.createObjectURL(file);
                                  setAudioSettings({ ...audioSettings, bgMusicUrl: url });
                                }
                              }}
                            />
                            <label htmlFor="bg-music-upload" className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm cursor-pointer transition-colors">
                              اختيار ملف
                            </label>
                            {audioSettings.bgMusicUrl && (
                              <p className="text-xs text-emerald-400 mt-4">تم رفع الملف بنجاح!</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-300">جودة التعليق الصوتي (TTS Quality)</label>
                        <select 
                          value={audioSettings.ttsQuality || 'High-Fidelity'} 
                          onChange={(e) => setAudioSettings({ ...audioSettings, ttsQuality: e.target.value as any })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-[var(--rosso-ferrari)]"
                          dir="ltr"
                        >
                          <option value="Standard">Standard (Fast generation)</option>
                          <option value="High-Fidelity">High-Fidelity (Balanced)</option>
                          <option value="Premium">Premium (Best quality, slower)</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-300">جودة المؤثرات الصوتية (SFX Quality)</label>
                        <select 
                          value={audioSettings.sfxQuality || 'High-Fidelity'} 
                          onChange={(e) => setAudioSettings({ ...audioSettings, sfxQuality: e.target.value as any })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-[var(--rosso-ferrari)]"
                          dir="ltr"
                        >
                          <option value="Standard">Standard</option>
                          <option value="High-Fidelity">High-Fidelity</option>
                          <option value="Premium">Premium</option>
                        </select>
                      </div>
                    </div>
                  </SectionCard>
                </div>
              </motion.div>
            )}

            {/* 5. Content Settings Tab */}
            {activeTab === 'content' && (
              <motion.div key="content" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-10 relative z-10">
                <div className="mb-10 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-white/10 bg-white/5 mb-4">
                    <FileText size={24} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-light tracking-wide text-white mb-2">إعدادات المحتوى</h3>
                  <p className="small-caps text-gray-500">Content Settings</p>
                  <div className="horizontal-line w-12 mx-auto mt-6 opacity-30"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-8">
                  <div className="space-y-8 flex flex-col">
                    <SectionCard title="اللغة والنبرة" icon={Globe}>
                      <div className="space-y-8">
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-3">لغة التوليد الأساسية</label>
                          <div className="flex flex-wrap gap-3">
                            {['عربي (فصحى)', 'إنجليزي', 'عربي & إنجليزي (ثنائي)'].map((lang) => (
                              <button
                                key={lang}
                                onClick={() => setContentSettings({ ...contentSettings, language: lang })}
                                className={cn(
                                  "px-5 py-3 rounded-xl text-sm font-medium border transition-all duration-300 shadow-sm flex-1 sm:flex-none text-center",
                                  contentSettings.language === lang ? "bg-white/10 border-white/60 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]" : "bg-black/20 border-white/10 text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/30"
                                )}
                              >
                                {lang}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-3">نبرة السيناريو (Tone)</label>
                          <div className="flex flex-wrap gap-3">
                            {['تعليمي', 'درامي', 'كوميدي', 'رسمي', 'رعب', 'تحفيزي'].map((tone) => (
                              <button
                                key={tone}
                                onClick={() => setContentSettings({ ...contentSettings, tone: tone })}
                                className={cn(
                                  "px-5 py-3 rounded-xl text-sm font-medium border transition-all duration-300 shadow-sm flex-1 min-w-[30%] text-center",
                                  contentSettings.tone === tone ? "bg-white/10 border-white/60 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]" : "bg-black/20 border-white/10 text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/30"
                                )}
                              >
                                {tone}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </SectionCard>
                  </div>

                  <SectionCard title="أدوات الأتمتة (Automation)" icon={Sparkles}>
                    <div className="space-y-4">
                      <ToggleSwitch 
                        checked={contentSettings.consistencyLock} 
                        title="Consistency Lock (الشخصية الثابتة)" 
                        desc="منع تغيير ملامح الشخصية المختارة عبر المشاهد"
                        onClick={() => setContentSettings({...contentSettings, consistencyLock: !contentSettings.consistencyLock})} 
                      />

                      <ToggleSwitch 
                        checked={contentSettings.autoTranslate} 
                        title="الترجمة التلقائية للمطالبات" 
                        desc="استخدام المُترجم للإنجليزية في الخلفية"
                        onClick={() => setContentSettings({...contentSettings, autoTranslate: !contentSettings.autoTranslate})} 
                      />

                      <ToggleSwitch 
                        checked={contentSettings.autoEnhancePrompts} 
                        title="تحسين المطالبات تلقائياً" 
                        desc="إضافة كلمات سحرية لرفع جودة التوليد"
                        onClick={() => setContentSettings({...contentSettings, autoEnhancePrompts: !contentSettings.autoEnhancePrompts})} 
                      />
                    </div>
                  </SectionCard>
                </div>
              </motion.div>
            )}

            {/* 6. Export Settings Tab */}
            {activeTab === 'export' && (
              <motion.div key="export" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-10 relative z-10">
                <div className="mb-10 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-white/10 bg-white/5 mb-4">
                    <Download size={24} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-light tracking-wide text-white mb-2">إعدادات التصدير والحفظ</h3>
                  <p className="small-caps text-gray-500">Export Settings</p>
                  <div className="horizontal-line w-12 mx-auto mt-6 opacity-30"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-lg font-light tracking-wide mb-6 text-gray-200">صيغ التصدير المتاحة</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.keys(exportSettings.formats).map((format) => (
                        <div key={format} className="flex flex-col gap-2">
                          <label className={cn("flex flex-col items-center justify-center gap-3 cursor-pointer p-6 rounded-3xl border transition-all duration-300 h-full relative overflow-hidden group", exportSettings.formats[format as keyof typeof exportSettings.formats] ? "bg-white/10 border-white/50 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]" : "bg-white/[0.02] border-white/10 text-gray-400 hover:border-white/30 hover:bg-white/5")}>
                            {exportSettings.formats[format as keyof typeof exportSettings.formats] && <div className="absolute top-0 right-0 w-20 h-20 bg-[var(--rosso-ferrari)]/20 rounded-full blur-2xl z-0"></div>}
                            <div className={cn("w-6 h-6 rounded-full border flex items-center justify-center transition-all z-10", exportSettings.formats[format as keyof typeof exportSettings.formats] ? "border-transparent bg-white text-black drop-shadow-md" : "border-gray-600 bg-black/20")}>
                               <CheckCircle2 size={16} className={cn("transition-transform duration-300", exportSettings.formats[format as keyof typeof exportSettings.formats] ? "scale-100" : "scale-0")} />
                            </div>
                            <span className="font-light uppercase tracking-[0.2em] relative z-10">{format}</span>
                            <input 
                              type="checkbox" 
                              className="hidden" 
                              checked={exportSettings.formats[format as keyof typeof exportSettings.formats]} 
                              onChange={(e) => setExportSettings({
                                ...exportSettings, 
                                formats: { ...exportSettings.formats, [format]: e.target.checked }
                              })} 
                            />
                          </label>
                          <button 
                            onClick={() => setPreviewFormat(format)}
                            className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-gray-400 hover:text-white px-3 py-2 rounded-xl text-xs font-light flex items-center justify-center gap-2 transition-all mt-1 w-full"
                          >
                            <Eye size={14} /> معاينة النموذج
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-8">
                    <SectionCard title="مسار ومجلد الحفظ" icon={FolderOpen}>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <input 
                          type="text" 
                          value={exportSettings.saveDirectory || ''}
                          onChange={(e) => setExportSettings({...exportSettings, saveDirectory: e.target.value})}
                          className="flex-1 bg-white/5 border border-white/10 hover:border-white/20 transition-all rounded-2xl px-6 py-4 text-white font-light focus:outline-none focus:border-white tracking-wide"
                          placeholder="مسار الحفظ الافتراضي"
                        />
                        <button 
                          onClick={async () => {
                            try {
                              if ('showDirectoryPicker' in window) {
                                const dirHandle = await (window as any).showDirectoryPicker();
                                setExportSettings({...exportSettings, saveDirectory: dirHandle.name});
                              } else {
                                alert('متصفحك لا يدعم اختيار المجلدات مباشرة. يرجى كتابة المسار يدوياً.');
                              }
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-3 transition-colors font-light whitespace-nowrap"
                        >
                          <FolderOpen size={20} /> تصفح
                        </button>
                      </div>
                    </SectionCard>

                    <SectionCard title="تفضيلات التصدير" icon={Settings2}>
                      <div className="space-y-4">
                        <ToggleSwitch 
                          checked={exportSettings.includeImagePrompts} 
                          title="تضمين Image Prompts في الملف" 
                          onClick={() => setExportSettings({...exportSettings, includeImagePrompts: !exportSettings.includeImagePrompts})} 
                        />

                        <ToggleSwitch 
                          checked={exportSettings.includeVideoPrompts} 
                          title="تضمين Video Prompts في الملف" 
                          onClick={() => setExportSettings({...exportSettings, includeVideoPrompts: !exportSettings.includeVideoPrompts})} 
                        />

                        <ToggleSwitch 
                          checked={exportSettings.autoSave} 
                          title="الحفظ التلقائي المحلي (Local Storage)" 
                          onClick={() => setExportSettings({...exportSettings, autoSave: !exportSettings.autoSave})} 
                        />
                      </div>
                    </SectionCard>

                    <AnimatePresence>
                      {exportSettings.formats?.pdf && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <SectionCard title="تخصيص تصدير PDF" icon={FileText}>
                            <div className="space-y-4">
                              <label className="block text-xs font-medium text-gray-400 mb-2">قالب الملف (PDF Template)</label>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                  { id: 'standard', name: 'قياسي', desc: 'تنسيق تقرير كلاسيكي' },
                                  { id: 'compact', name: 'مدمج', desc: 'بدون مساحات فارغة (للطباعة)' },
                                  { id: 'detailed', name: 'مفصل', desc: 'شامل مع ملاحظات الإخراج' }
                                ].map(template => (
                                  <button
                                    key={template.id}
                                    onClick={() => {
                                      setExportSettings({ ...exportSettings, pdfTemplate: template.id });
                                      setPreviewFormat('pdf');
                                    }}
                                    className={cn(
                                      "p-4 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center gap-2 text-center",
                                      exportSettings.pdfTemplate === template.id 
                                        ? "bg-white/10 border-white/50 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]" 
                                        : "bg-black/20 border-white/10 text-gray-400 hover:border-white/30 hover:text-gray-200 hover:bg-white/5"
                                    )}
                                  >
                                    <span className="text-sm font-medium">{template.name}</span>
                                    <span className="text-[10px] text-gray-500">{template.desc}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </SectionCard>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Characters Tab */}
            {activeTab === 'characters' && (
              <motion.div key="characters" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-10 relative z-10">
                <div className="mb-10 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-white/10 bg-white/5 mb-4">
                    <Users size={24} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-light tracking-wide text-white mb-2">إدارة الشخصيات</h3>
                  <p className="small-caps text-gray-500">Character Management</p>
                  <div className="horizontal-line w-12 mx-auto mt-6 opacity-30"></div>
                </div>

                <div className="space-y-8">
                  {isAddingCharacter ? (
                    <SectionCard title={editingCharId ? "تعديل شخصية" : "إنشاء شخصية جديدة"} icon={editingCharId ? Edit2 : Plus}>
                      <div className="space-y-4 text-right">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">اسم الشخصية</label>
                            <input type="text" value={newChar.name} onChange={e => setNewChar({...newChar, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--rosso-ferrari)]" />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">الجنس</label>
                            <select value={newChar.gender} onChange={e => setNewChar({...newChar, gender: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--rosso-ferrari)] appearance-none">
                              <option value="ذكر">ذكر</option>
                              <option value="أنثى">أنثى</option>
                              <option value="غير محدد">غير محدد</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <button onClick={() => charImageInputRef.current?.click()} className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 transition-colors">
                            <Upload size={16} /> رفع صورة للمرجعية
                          </button>
                          <input type="file" ref={charImageInputRef} onChange={handleCharImageUpload} accept="image/*" className="hidden" />
                          
                          {newChar.imageUrl && (
                            <button onClick={handleAnalyzeImage} disabled={analyzingImage} className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--rosso-ferrari)]/20 hover:bg-[var(--rosso-ferrari)]/40 text-[var(--rosso-ferrari)] rounded-lg text-sm transition-colors">
                              {analyzingImage ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />} 
                              استخراج الوصف من الصورة
                            </button>
                          )}

                          <button onClick={handleSuggestIdea} disabled={generatingIdea} className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 rounded-lg text-sm transition-colors mb-2">
                            {generatingIdea ? <RefreshCw size={16} className="animate-spin" /> : <Cpu size={16} />}
                            اقتراح شخصية إبداعية
                          </button>

                          <button onClick={async () => {
                            if (!newChar.description) return;
                            setGeneratingIdea(true);
                            await new Promise(r => setTimeout(r, 1000));
                            const url = "https://image.pollinations.ai/prompt/" + encodeURIComponent("Character portrait, concept art, " + newChar.description + " --no text") + "?width=512&height=512&nologo=true&seed=" + Math.floor(Math.random() * 1000000);
                            setNewChar({ ...newChar, imageUrl: url });
                            setGeneratingIdea(false);
                          }} disabled={generatingIdea || !newChar.description} className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/40 text-purple-400 rounded-lg text-sm transition-colors">
                            {generatingIdea ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            توليد صورة مصغرة (AI)
                          </button>
                        </div>
                        
                        {newChar.imageUrl && (
                          <div className="w-32 h-32 rounded-xl overflow-hidden border border-white/10 mt-2">
                             <img src={newChar.imageUrl} alt="preview" className="w-full h-full object-cover" />
                          </div>
                        )}

                        <div>
                          <label className="block text-sm text-gray-400 mb-2">الوصف البصري الكامل (بالإنجليزية لدقة التصميم)</label>
                          <textarea value={newChar.description} onChange={e => setNewChar({...newChar, description: e.target.value})} className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-white font-mono text-sm focus:outline-none focus:border-[var(--rosso-ferrari)] resize-none" dir="ltr" placeholder="A 25 year old male, short black hair..." />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                          <button onClick={() => { setIsAddingCharacter(false); setEditingCharId(null); setNewChar({ name: '', gender: 'ذكر', description: '', imageUrl: '' }); }} className="px-6 py-2 rounded-lg text-gray-400 hover:text-white transition-colors border border-white/10">إلغاء</button>
                          <button onClick={handleSaveCharacter} disabled={!newChar.name || !newChar.description} className="px-6 py-2 bg-[var(--rosso-ferrari)] rounded-lg text-white font-medium hover:bg-red-800 transition-colors disabled:opacity-50 flex items-center gap-2"><Save size={16} /> حفظ الشخصية</button>
                        </div>
                      </div>
                    </SectionCard>
                  ) : (
                    <>
                      <div className="flex justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5">
                         <span className="text-gray-400">مكتبة الشخصيات المحفوظة ({advancedSettings.savedCharacters?.length || 0})</span>
                         <button onClick={() => {
                           setIsAddingCharacter(true);
                           setEditingCharId(null);
                           setNewChar({ name: '', gender: 'ذكر', description: '', imageUrl: '' });
                         }} className="flex items-center gap-2 bg-[var(--rosso-ferrari)] hover:bg-red-800 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                           <Plus size={16} /> إضافة شخصية
                         </button>
                      </div>

                      {(advancedSettings.savedCharacters?.length || 0) > 0 && (
                        <div className="relative">
                          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                          </div>
                          <input 
                            type="text" 
                            placeholder="ابحث في الشخصيات المحفوظة بالاسم أو الوصف..." 
                            value={characterSearchQuery}
                            onChange={(e) => setCharacterSearchQuery(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl pr-12 pl-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[var(--rosso-ferrari)] transition-colors"
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(() => {
                          const filteredCharacters = (advancedSettings.savedCharacters || []).filter(char => 
                            char.name.toLowerCase().includes(characterSearchQuery.toLowerCase()) || 
                            char.description.toLowerCase().includes(characterSearchQuery.toLowerCase())
                          );

                          if (filteredCharacters.length === 0 && (advancedSettings.savedCharacters?.length || 0) > 0) {
                            return (
                              <div className="col-span-1 md:col-span-2 text-center py-12 text-gray-500 bg-black/20 rounded-2xl border border-white/5 border-dashed">
                                <Search size={48} className="mx-auto mb-4 opacity-30" />
                                لم يتم العثور على أي شخصية تطابق بحثك.
                              </div>
                            );
                          }

                          return filteredCharacters.map(char => (
                            <div key={char.id} className="bg-black/30 border border-white/10 rounded-2xl p-4 flex gap-4 text-right transition-all hover:bg-black/40 hover:border-white/20 hover:shadow-lg">
                              {char.imageUrl ? (
                                 <img src={char.imageUrl} alt={char.name} className="w-24 h-24 rounded-xl object-cover shrink-0 border border-white/10 shadow-md bg-black/50" />
                              ) : (
                                 <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center shrink-0 border border-white/10 shadow-md">
                                   <UserCircle size={36} className="text-gray-500 opacity-70" />
                                 </div>
                              )}
                              <div className="flex-1 min-w-0 flex flex-col relative group">
                                  <div className="flex justify-between items-start">
                                   <h4 className="font-semibold text-white truncate pr-2 text-lg">{char.name}</h4>
                                   <div className="flex gap-1 bg-black/40 rounded-lg p-1 border border-white/5">
                                      <button onClick={() => moveCharacter(char.id, -1)} className="text-gray-400 hover:text-white hover:bg-white/10 rounded p-1.5 transition-colors" title="تحريك لأعلى"><ArrowUp size={14} /></button>
                                      <button onClick={() => moveCharacter(char.id, 1)} className="text-gray-400 hover:text-white hover:bg-white/10 rounded p-1.5 transition-colors" title="تحريك لأسفل"><ArrowDown size={14} /></button>
                                      <button onClick={() => startEditCharacter(char)} className="text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded p-1.5 transition-colors" title="تعديل الشخصية"><Edit2 size={14} /></button>
                                      <button onClick={() => handleDeleteCharacter(char.id)} className="text-red-500/70 hover:text-red-400 hover:bg-red-500/10 rounded p-1.5 transition-colors" title="حذف الشخصية"><Trash2 size={14} /></button>
                                   </div>
                                 </div>
                                 <p className="text-xs font-medium text-[var(--rosso-ferrari)] mt-1 bg-red-500/10 inline-block px-2 py-0.5 rounded-md self-start">{char.gender}</p>
                                 <div className="relative mt-auto pt-3">
                                   <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed tracking-wide font-mono bg-black/40 p-2 rounded-lg border border-white/5" dir="ltr">{char.description}</p>
                                   
                                   {/* Custom Tooltip on Hover */}
                                   <div className="absolute bottom-full mb-2 right-0 bg-[#111] border border-white/10 rounded-xl p-3 shadow-2xl z-50 text-xs text-gray-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-[calc(100%+6rem)] max-w-md pointer-events-none" dir="ltr">
                                     <div className="font-semibold text-white mb-1 drop-shadow-md">{char.name} - Full Description</div>
                                     <div className="leading-relaxed whitespace-pre-wrap">{char.description}</div>
                                   </div>
                                 </div>
                              </div>
                            </div>
                          ));
                        })()}
                        {(!advancedSettings.savedCharacters || advancedSettings.savedCharacters.length === 0) && (
                          <div className="col-span-1 md:col-span-2 text-center py-12 text-gray-500 bg-black/20 rounded-2xl border border-white/5 border-dashed">
                             <UserCircle size={48} className="mx-auto mb-4 opacity-50" />
                             لم تقم بإنشاء أي شخصية بعد.<br/>قم بإضافة شخصيات لاستخدامها لاحقاً في السيناريوهات الخاصة بك.
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'frontend' && (
              <motion.div key="frontend" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-10 relative z-10">
                <div className="mb-10 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-white/10 bg-white/5 mb-4">
                    <LayoutDashboard size={24} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">إعدادات الواجهة الرئيسية</h3>
                  <p className="text-gray-400 font-light">تخصيص العناوين والنصوص على الصفحة الأمامية</p>
                  <div className="horizontal-line w-12 mx-auto mt-6 opacity-30"></div>
                </div>

                <div className="space-y-8 flex flex-col max-w-2xl mx-auto">
                  
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-300">عنوان الصفحة (الرئيسي)</label>
                    <input 
                      type="text"
                      className="w-full bg-black/40 border border-white/10 focus:border-[var(--rosso-ferrari)] rounded-xl px-4 py-3 text-white transition-colors"
                      placeholder="صناعة محتوى جديد"
                      value={advancedSettings?.frontendLabels?.mainTitle || ''}
                      onChange={(e) => setAdvancedSettings({...advancedSettings, frontendLabels: {...advancedSettings?.frontendLabels, mainTitle: e.target.value}})}
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-300">النص الفرعي (تحت العنوان)</label>
                    <textarea 
                      className="w-full bg-black/40 border border-white/10 focus:border-[var(--rosso-ferrari)] rounded-xl px-4 py-3 text-white transition-colors resize-none h-24"
                      placeholder="أدخل فكرتك لتوليد محتوى احترافي..."
                      value={advancedSettings?.frontendLabels?.subTitle || ''}
                      onChange={(e) => setAdvancedSettings({...advancedSettings, frontendLabels: {...advancedSettings?.frontendLabels, subTitle: e.target.value}})}
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-300">عنوان القائمة العلوية (Navbar)</label>
                    <input 
                      type="text"
                      className="w-full bg-black/40 border border-white/10 focus:border-[var(--rosso-ferrari)] rounded-xl px-4 py-3 text-white transition-colors"
                      placeholder="SCENARIO"
                      value={advancedSettings?.frontendLabels?.navTitle || ''}
                      onChange={(e) => setAdvancedSettings({...advancedSettings, frontendLabels: {...advancedSettings?.frontendLabels, navTitle: e.target.value}})}
                    />
                  </div>
                  
                </div>
              </motion.div>
            )}

            {/* 7. Advanced Tab */}
            {activeTab === 'advanced' && (
              <motion.div key="advanced" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-10 relative z-10">
                <div className="mb-10 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-white/10 bg-white/5 mb-4">
                    <Wrench size={24} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-light tracking-wide text-white mb-2">إعدادات متقدمة للمطورين</h3>
                  <p className="small-caps text-gray-500">Advanced Config & Templates</p>
                  <div className="horizontal-line w-12 mx-auto mt-6 opacity-30"></div>
                </div>

                <div className="space-y-8">
                  <SectionCard title="إعدادات المطورين المتفرقة" icon={Settings2}>
                    <div className="space-y-4">
                      <ToggleSwitch 
                        checked={advancedSettings.compareMode} 
                        title="Compare Mode" 
                        desc="مقارنة مخرجات نموذجين معاً"
                        onClick={() => setAdvancedSettings({...advancedSettings, compareMode: !advancedSettings.compareMode})} 
                      />

                      <ToggleSwitch 
                        checked={advancedSettings.streamingMode} 
                        title="Streaming Mode" 
                        desc="تحميل النصوص الطويلة بالبث"
                        onClick={() => setAdvancedSettings({...advancedSettings, streamingMode: !advancedSettings.streamingMode})} 
                      />

                      <ToggleSwitch 
                        checked={advancedSettings.debugLogs} 
                        title="Debug Logs" 
                        desc="سجلات الأخطاء للكونسول"
                        onClick={() => setAdvancedSettings({...advancedSettings, debugLogs: !advancedSettings.debugLogs})} 
                      />
                      
                      <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
                        <div>
                          <h4 className="text-white text-sm font-medium mb-1">نمط التوليد (Generation Mode)</h4>
                          <p className="text-xs text-gray-400">تحديد ما إذا كنت تفضل السرعة (Fast) أو الجودة العالية (Quality) في الذكاء الاصطناعي</p>
                        </div>
                        <div className="flex bg-black/50 p-1 rounded-xl">
                          <button
                            onClick={() => setAdvancedSettings({ ...advancedSettings, generationMode: 'fast' })}
                            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${(!advancedSettings.generationMode || advancedSettings.generationMode === 'fast') ? 'bg-[var(--rosso-ferrari)] text-white' : 'text-gray-400 hover:text-white'}`}
                          >
                            سريع
                          </button>
                          <button
                            onClick={() => setAdvancedSettings({ ...advancedSettings, generationMode: 'quality' })}
                            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${(advancedSettings.generationMode === 'quality') ? 'bg-[var(--rosso-ferrari)] text-white' : 'text-gray-400 hover:text-white'}`}
                          >
                            جودة
                          </button>
                        </div>
                      </div>

                      <ToggleSwitch 
                        checked={advancedSettings.includeAudioInVideoPrompt ?? true} 
                        title="تضمين الصوت في مطالبة الفيديو (Include Audio in Video Prompt)" 
                        desc="عند التفعيل، سيتم تضمين نص التعليق الصوتي (voiceover) أو وصف المؤثرات الصوتية (SFX) مباشرة داخل مطالبة الفيديو."
                        onClick={() => setAdvancedSettings({...advancedSettings, includeAudioInVideoPrompt: !(advancedSettings.includeAudioInVideoPrompt ?? true)})} 
                      />
                    </div>
                  </SectionCard>
                  
                  <SectionCard title="إدارة قوالب المطالبات (Templates Manager)" icon={Terminal}>
                    <div className="space-y-6">
                      <p className="text-sm text-gray-400 leading-relaxed text-right">
                        قم بإدارة واختيار أو تعديل القوالب المخصصة للمطالبات (Prompts) الخاصة بكل نوع. يمكنك تعديل القالب الحالي وسيحفظ تلقائيًا، أو حفظه كقالب جديد مخصص.
                      </p>
                      
                      <div className="grid lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                            <h4 className="flex items-center gap-2 mb-3 text-[var(--rosso-ferrari)] font-medium"><Image size={18} /> قالب الصورة (Image)</h4>
                            <TemplateSelector type="image" value={advancedSettings.imagePromptTemplate || ''} onChange={(val) => setAdvancedSettings({...advancedSettings, imagePromptTemplate: val})} />
                            <textarea value={advancedSettings.imagePromptTemplate || ''} onChange={(e) => setAdvancedSettings({...advancedSettings, imagePromptTemplate: e.target.value})} placeholder="Scene: {scene_description}. Style: {art_style}..." className="w-full h-24 bg-black/40 border border-white/10 hover:border-white/30 transition-all rounded-xl p-3 text-white font-mono text-xs focus:outline-none focus:border-[var(--rosso-ferrari)] resize-none" dir="ltr" />
                            <div className="flex flex-wrap gap-1 mt-2 justify-end" dir="ltr">
                              {[
                                { id: '{scene_description}', title: 'وصف المشهد', desc: 'Detailed description of the environment and action.' }, 
                                { id: '{art_style}', title: 'النمط البصري', desc: 'Visual aesthetic like Cinematic, 3D Render, Anime.' }, 
                                { id: '{shot_style}', title: 'نوع اللقطة', desc: 'Camera framing like Close-up, Wide shot.' }, 
                                { id: '{character_desc}', title: 'وصف الشخصية', desc: 'Visual appearance of the main character.' },
                                { id: '{lighting_description}', title: 'الإضاءة', desc: 'Lighting conditions (e.g., cinematic, moody, bright).' },
                                { id: '{mood}', title: 'الحالة المزاجية', desc: 'Emotional tone (e.g., tense, peaceful, eerie).' }
                              ].map(v => (
                                <div key={v.id} className="relative group z-10 flex-shrink-0">
                                  <button onClick={() => insertImageVariable(v.id)} className="text-[10px] px-2 py-1 bg-white/5 hover:bg-white/10 text-gray-300 rounded transition-colors font-mono">
                                    {v.id}
                                  </button>
                                  <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-black/90 text-white text-[10px] rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 text-right shadow-xl border border-white/10 pointer-events-none">
                                    <strong className="block text-[var(--rosso-ferrari)] mb-0.5">{v.title}</strong>
                                    <p className="text-gray-400 font-sans">{v.desc}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                            <h4 className="flex items-center gap-2 mb-3 text-[var(--rosso-ferrari)] font-medium"><MonitorPlay size={18} /> قالب الفيديو (Video)</h4>
                            <TemplateSelector type="video" value={advancedSettings.videoPromptTemplate || ''} onChange={(val) => setAdvancedSettings({...advancedSettings, videoPromptTemplate: val})} />
                            <textarea value={advancedSettings.videoPromptTemplate || ''} onChange={(e) => setAdvancedSettings({...advancedSettings, videoPromptTemplate: e.target.value})} placeholder="Visuals: {scene_description}. Camera: {camera_movement}..." className="w-full h-24 bg-black/40 border border-white/10 hover:border-white/30 transition-all rounded-xl p-3 text-white font-mono text-xs focus:outline-none focus:border-[var(--rosso-ferrari)] resize-none" dir="ltr" />
                            <div className="flex flex-wrap gap-1 mt-2 justify-end" dir="ltr">
                              {[
                                { id: '{scene_description}', title: 'Action & Setting', desc: 'وصف مفصل للبيئة والأحداث في المشهد.' }, 
                                { id: '{art_style}', title: 'Visual Style', desc: 'النمط الفني والجمالي (مثل سينمائي، كرتوني).' }, 
                                { id: '{shot_style}', title: 'Camera Shot Type', desc: 'نوع وزاوية لقطة الكاميرا (مثل لقطة قريبة).' }, 
                                { id: '{character_desc}', title: 'Main Character', desc: 'الوصف البصري التفصيلي للشخصية الرئيسية.' }, 
                                { id: '{camera_movement}', title: 'Camera Motion', desc: 'اتجاه ونوع حركة الكاميرا (مثل Zoom، Pan).' },
                                { id: '{lighting_description}', title: 'Lighting', desc: 'الإضاءة والمؤثرات الضوئية المعززة للمشهد.' },
                                { id: '{mood}', title: 'Mood', desc: 'الحالة المزاجية والعاطفية للمشهد.' }
                              ].map(v => (
                                <div key={v.id} className="relative group z-10 flex-shrink-0">
                                  <button onClick={() => insertVideoVariable(v.id)} className="text-[10px] px-2 py-1 bg-white/5 hover:bg-white/10 text-gray-300 rounded transition-colors font-mono">
                                    {v.id}
                                  </button>
                                  <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-black/90 text-white text-[10px] rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 text-right shadow-xl border border-white/10 pointer-events-none">
                                    <strong className="block text-[var(--rosso-ferrari)] mb-0.5">{v.title}</strong>
                                    <p className="text-gray-400 font-sans">{v.desc}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-4 text-[10px] text-gray-400 space-y-1.5 pr-2 border-r-2 border-[var(--rosso-ferrari)]/30 text-right bg-black/20 p-2 rounded-l-lg">
                              <p><code className="text-gray-300 font-mono">{"{scene_description}"}</code>: وصف المشهد والحركة.</p>
                              <p><code className="text-gray-300 font-mono">{"{art_style}"}</code>: النمط البصري (كـ Cinematic, 3D).</p>
                              <p><code className="text-gray-300 font-mono">{"{shot_style}"}</code>: نوع اللقطة (كـ Close-up, Wide shot).</p>
                              <p><code className="text-gray-300 font-mono">{"{character_desc}"}</code>: الوصف البصري للشخصية.</p>
                              <p><code className="text-gray-300 font-mono">{"{camera_movement}"}</code>: حركة الكاميرا المطلوبة.</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                            <h4 className="flex items-center gap-2 mb-3 text-[var(--rosso-ferrari)] font-medium"><PlaySquare size={18} /> تحريك الصورة (Animation)</h4>
                            <TemplateSelector type="animation" value={advancedSettings.animationPromptTemplate || ''} onChange={(val) => setAdvancedSettings({...advancedSettings, animationPromptTemplate: val})} />
                            <textarea value={advancedSettings.animationPromptTemplate || ''} onChange={(e) => setAdvancedSettings({...advancedSettings, animationPromptTemplate: e.target.value})} placeholder="Animate this. Add {camera_movement}..." className="w-full h-24 bg-black/40 border border-white/10 hover:border-white/30 transition-all rounded-xl p-3 text-white font-mono text-xs focus:outline-none focus:border-[var(--rosso-ferrari)] resize-none" dir="ltr" />
                            <div className="flex flex-wrap gap-1 mt-2 justify-end" dir="ltr">
                              {[
                                { id: '{camera_movement}', title: 'حركة الكاميرا', desc: 'كيفية تحرك الكاميرا أثناء التحريك (مثل Pan left, Zoom in).' }
                              ].map(v => (
                                <div key={v.id} className="relative group z-10 flex-shrink-0">
                                  <button onClick={() => insertAnimationVariable(v.id)} className="text-[10px] px-2 py-1 bg-white/5 hover:bg-white/10 text-gray-300 rounded transition-colors font-mono">
                                    {v.id}
                                  </button>
                                  <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-black/90 text-white text-[10px] rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 text-right shadow-xl border border-white/10 pointer-events-none">
                                    <strong className="block text-[var(--rosso-ferrari)] mb-0.5">{v.title}</strong>
                                    <p className="text-gray-400 font-sans">{v.desc}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-black/20 p-4 rounded-2xl border border-white/5 flex flex-col">
                              <h4 className="flex items-center gap-2 mb-3 text-[var(--rosso-ferrari)] font-medium"><Mic size={18} /> نص التعليق (Voiceover)</h4>
                              <TemplateSelector type="voiceover" value={advancedSettings.voiceoverPromptTemplate || ''} onChange={(val) => setAdvancedSettings({...advancedSettings, voiceoverPromptTemplate: val})} />
                              <textarea value={advancedSettings.voiceoverPromptTemplate || ''} onChange={(e) => setAdvancedSettings({...advancedSettings, voiceoverPromptTemplate: e.target.value})} className="w-full flex-1 min-h-[60px] bg-black/40 border border-white/10 rounded-xl p-2 text-white font-mono text-[10px] resize-none focus:outline-none focus:border-[var(--rosso-ferrari)]" dir="ltr" />
                              <div className="flex flex-wrap gap-1 mt-2 justify-end" dir="ltr">
                                {[
                                  { id: '{arabic_script}', title: 'النص العربي', desc: 'نص التعليق الصوتي المراد قراءته.' },
                                  { id: '{mood}', title: 'المزاج', desc: 'مزاج القراءة (مثل حماسي، هادئ).' },
                                  { id: '{emotion}', title: 'المشاعر', desc: 'المشاعر المطلوبة في نبرة الصوت.' }
                                ].map(v => (
                                  <div key={v.id} className="relative group z-10 flex-shrink-0">
                                    <button onClick={() => insertVoiceoverVariable(v.id)} className="text-[9px] px-1.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 rounded transition-colors font-mono">
                                      {v.id}
                                    </button>
                                    <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-black/90 text-white text-[10px] rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 text-right shadow-xl border border-white/10 pointer-events-none">
                                      <strong className="block text-[var(--rosso-ferrari)] mb-0.5">{v.title}</strong>
                                      <p className="text-gray-400 font-sans">{v.desc}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="bg-black/20 p-4 rounded-2xl border border-white/5 flex flex-col">
                              <h4 className="flex items-center gap-2 mb-3 text-[var(--rosso-ferrari)] font-medium"><Volume2 size={18} /> المؤثرات (SFX)</h4>
                              <TemplateSelector type="sfx" value={advancedSettings.sfxPromptTemplate || ''} onChange={(val) => setAdvancedSettings({...advancedSettings, sfxPromptTemplate: val})} />
                              <textarea value={advancedSettings.sfxPromptTemplate || ''} onChange={(e) => setAdvancedSettings({...advancedSettings, sfxPromptTemplate: e.target.value})} className="w-full flex-1 min-h-[60px] bg-black/40 border border-white/10 rounded-xl p-2 text-white font-mono text-[10px] resize-none focus:outline-none focus:border-[var(--rosso-ferrari)]" dir="ltr" />
                              <div className="flex flex-wrap gap-1 mt-2 justify-end" dir="ltr">
                                {[
                                  { id: '{scene_description}', title: 'وصف المشهد', desc: 'لإعطاء سياق للمؤثرات الصوتية.' },
                                  { id: '{action}', title: 'الحدث الأصلي', desc: 'الفعل الذي يصدر الصوت (مثل طرقة باب).' },
                                  { id: '{mood}', title: 'المزاج', desc: 'جو المشهد العام.' }
                                ].map(v => (
                                  <div key={v.id} className="relative group z-10 flex-shrink-0">
                                    <button onClick={() => insertSfxVariable(v.id)} className="text-[9px] px-1.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 rounded transition-colors font-mono">
                                      {v.id}
                                    </button>
                                    <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-black/90 text-white text-[10px] rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 text-right shadow-xl border border-white/10 pointer-events-none">
                                      <strong className="block text-[var(--rosso-ferrari)] mb-0.5">{v.title}</strong>
                                      <p className="text-gray-400 font-sans">{v.desc}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard title="توجيه النظام المخصص (Custom System Prompt)" icon={FileText}>
                    <p className="text-xs text-gray-500 mb-4 font-light">إرشادات يتم حقنها للنموذج قبل أي عملية توليد (يترك فارغاً للافتراضي)</p>
                    <textarea 
                      value={advancedSettings.systemPrompt || ''}
                      onChange={(e) => setAdvancedSettings({...advancedSettings, systemPrompt: e.target.value})}
                      placeholder="أنت مساعد خبير في كتابة سيناريوهات الفيديو..."
                      className="w-full h-32 bg-white/5 border border-white/10 hover:border-white/20 transition-all rounded-3xl p-6 text-white font-mono text-sm font-light focus:outline-none focus:border-white resize-none tracking-wide custom-scrollbar"
                    />
                  </SectionCard>

                  <div className="flex justify-end pt-4">
                    <button 
                      onClick={handleSave}
                      disabled={saveStatus === 'saving'}
                      className={cn(
                        "px-8 py-4 rounded-full font-medium tracking-wide transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden group",
                        saveStatus === 'success' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                        "bg-white text-black hover:bg-gray-200"
                      )}
                    >
                      {saveStatus === 'saving' && <RefreshCw size={18} className="animate-spin" />}
                      {saveStatus === 'success' && <CheckCircle2 size={18} />}
                      {saveStatus === 'idle' && <Save size={18} />}
                      <span>
                        {saveStatus === 'saving' ? 'جاري الحفظ...' : saveStatus === 'success' ? 'تم الحفظ بنجاح' : 'حفظ التفضيلات يدوياً'}
                      </span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
