import React, { useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Camera, Monitor, Smartphone, Video, Film, Map, Palette, Skull, Sparkles, BookOpen, Layers, Users, Eye, Star, Zap, Image as ImageIcon, Code, ChevronDown, ChevronUp, Navigation } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ART_STYLES, SHOT_STYLES, QUALITY_OPTIONS } from '../../types';

// Map icon strings (from types) to actual Lucide components
const IconMap: any = {
  ImageIcon, Film, Star, BookOpen, Layers, Skull, Sparkles, Camera, Eye, Map, Monitor, Smartphone, Video, Palette, Users, Navigation
};

export function StyleStep() {
  const { styles, setStyles, advancedSettings, setAdvancedSettings, setStep } = useAppContext();
  const [showTemplateEditor, setShowTemplateEditor] = React.useState(false);

  const insertVariable = (variable: string) => {
    const defaultTpl = advancedSettings.videoPromptTemplate || '';
    setAdvancedSettings({ ...advancedSettings, videoPromptTemplate: defaultTpl + variable });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12 pb-12"
    >
      <div>
        <h2 className="text-3xl font-bold mb-2">الأنماط البصرية</h2>
        <p className="text-gray-400">حدد الاتجاه الفني، زوايا الكاميرا، والجودة المطلوبة للصور/الفيديوهات.</p>
      </div>

      {/* Art Styles Grid */}
      <div className="space-y-4 bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-sm shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--rosso-ferrari)]/5 rounded-full blur-3xl pointer-events-none -mt-32 -mr-32"></div>
        <h2 className="text-sm font-medium text-gray-200 mb-6 tracking-wide flex items-center gap-3 relative z-10">
          <Palette size={18} className="text-[var(--rosso-ferrari)]" /> 
          الأسلوب الفني (Art Style)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 relative z-10">
          {ART_STYLES.map((style) => {
            const Icon = IconMap[style.icon || 'ImageIcon'] || ImageIcon;
            return (
              <button
                key={style.id}
                onClick={() => setStyles({ ...styles, artStyle: style })}
                className={cn(
                  "relative p-5 h-40 rounded-2xl text-center transition-all duration-300 flex flex-col items-center justify-center gap-4 bg-black/40 border group overflow-hidden",
                  styles.artStyle?.id === style.id
                    ? "border-[var(--rosso-ferrari)] shadow-[0_0_20px_rgba(212,0,0,0.3)] bg-gradient-to-b from-[var(--rosso-ferrari)]/10 to-transparent transform -translate-y-1"
                    : "border-white/5 hover:border-white/30 hover:bg-white/5 hover:-translate-y-1"
                )}
              >
                {style.imageFallback && (
                  <div 
                    className={cn(
                      "absolute inset-0 bg-cover bg-center transition-all duration-700",
                      styles.artStyle?.id === style.id ? 'opacity-50 scale-105' : 'opacity-20 group-hover:opacity-40 group-hover:scale-110'
                    )}
                    style={{ backgroundImage: `url(${style.imageFallback})` }}
                  />
                )}
                {/* Gradient overlay to ensure text readability */}
                <div className={cn("absolute inset-0 transition-opacity duration-300 pointer-events-none", styles.artStyle?.id === style.id ? "bg-gradient-to-t from-black/90 via-black/40 to-transparent" : "bg-gradient-to-t from-black/80 via-black/50 to-black/20")} />
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <div className={cn("p-3 rounded-full backdrop-blur-sm transition-all duration-300", styles.artStyle?.id === style.id ? "bg-[var(--rosso-ferrari)]/20 shadow-[0_0_15px_rgba(212,0,0,0.5)]" : "bg-black/50 group-hover:bg-white/10")}>
                     <Icon size={28} className={cn("transition-colors drop-shadow-lg", styles.artStyle?.id === style.id ? "text-[var(--rosso-ferrari)]" : "text-gray-300 group-hover:text-white")} />
                  </div>
                  <span className={cn("font-medium text-sm transition-colors drop-shadow-md", styles.artStyle?.id === style.id ? "text-white font-bold" : "text-gray-300 group-hover:text-white")}>{style.name}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Shot Styles Grid */}
      <div className="space-y-4 bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-sm shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -mt-32 -ml-32"></div>
        <h2 className="text-sm font-medium text-gray-200 mb-6 tracking-wide flex items-center gap-3 relative z-10">
          <Camera size={18} className="text-blue-500" /> 
          نمط الإطار (Shot Style)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
          {SHOT_STYLES.map((style) => {
            const Icon = IconMap[style.icon || 'Video'] || Video;
            return (
              <button
                key={style.id}
                onClick={() => setStyles({ ...styles, shotStyle: style })}
                className={cn(
                  "relative p-5 h-40 rounded-2xl text-center transition-all duration-300 flex flex-col items-center justify-center gap-4 bg-black/40 border group overflow-hidden",
                  styles.shotStyle?.id === style.id
                    ? "border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)] bg-gradient-to-b from-blue-500/10 to-transparent transform -translate-y-1"
                    : "border-white/5 hover:border-white/30 hover:bg-white/5 hover:-translate-y-1"
                )}
              >
                {style.imageFallback && (
                  <div 
                    className={cn(
                      "absolute inset-0 bg-cover bg-center transition-all duration-700",
                      styles.shotStyle?.id === style.id ? 'opacity-50 scale-105' : 'opacity-20 group-hover:opacity-40 group-hover:scale-110'
                    )}
                    style={{ backgroundImage: `url(${style.imageFallback})` }}
                  />
                )}
                {/* Gradient overlay to ensure text readability */}
                <div className={cn("absolute inset-0 transition-opacity duration-300 pointer-events-none", styles.shotStyle?.id === style.id ? "bg-gradient-to-t from-black/90 via-black/40 to-transparent" : "bg-gradient-to-t from-black/80 via-black/50 to-black/20")} />
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <div className={cn("p-3 rounded-full backdrop-blur-sm transition-all duration-300", styles.shotStyle?.id === style.id ? "bg-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.5)]" : "bg-black/50 group-hover:bg-white/10")}>
                    <Icon size={28} className={cn("transition-colors drop-shadow-lg", styles.shotStyle?.id === style.id ? "text-blue-400" : "text-gray-300 group-hover:text-white")} />
                  </div>
                  <span className={cn("font-medium text-sm text-balance transition-colors drop-shadow-md", styles.shotStyle?.id === style.id ? "text-white font-bold" : "text-gray-300 group-hover:text-white")}>{style.name}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Shot Style Customizer */}
        <AnimatePresence>
          {styles.shotStyle && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-6 pt-6 border-t border-white/10 overflow-hidden"
            >
              <div className="flex flex-col gap-3">
                <label className="text-sm text-gray-300 font-medium flex items-center justify-between">
                  <span>تخصيص مطالبة نمط الإطار (Shot Style Prompt)</span>
                  <span className="text-xs text-blue-400 bg-blue-400/10 px-2.5 py-1 rounded-md border border-blue-400/20">{styles.shotStyle.name}</span>
                </label>
                <div className="bg-black/50 border border-white/10 focus-within:border-blue-500/50 rounded-2xl p-4 transition-all shadow-inner relative flex flex-col group">
                  <textarea 
                    value={styles.shotStyle.prompt || ''}
                    onChange={(e) => setStyles({ ...styles, shotStyle: { ...styles.shotStyle!, prompt: e.target.value } })}
                    placeholder="Describe specific camera angles, framing, lenses or compositions..."
                    className="w-full bg-transparent border-none text-white font-mono focus:outline-none focus:ring-0 resize-none min-h-[80px] text-sm tracking-wide leading-relaxed placeholder-gray-600 custom-scrollbar ltr text-left"
                    dir="ltr"
                  />
                </div>
                <div className="flex items-center justify-between sm:flex-row flex-col gap-2">
                  <p className="text-xs text-gray-500 leading-relaxed text-right sm:text-right w-full">
                    عدّل هذه المطالبة لتحقيق مظهر أكثر دقة، أو استكشف الأنماط المختلفة في القائمة أعلاه.
                  </p>
                  <button 
                    onClick={() => {
                        const originalShotStyle = SHOT_STYLES.find(s => s.id === styles.shotStyle!.id);
                        if (originalShotStyle) {
                            setStyles({ ...styles, shotStyle: { ...styles.shotStyle!, prompt: originalShotStyle.prompt } });
                        }
                    }}
                    className="text-xs text-gray-500 hover:text-white transition-colors underline underline-offset-4 decoration-white/20 whitespace-nowrap hidden sm:block"
                  >
                    استعادة الافتراضي
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quality Selector */}
      <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-sm shadow-xl flex flex-col md:flex-row justify-around items-center gap-6">
        <div className="flex items-center gap-3 text-gray-300 w-full md:w-auto">
          <Sparkles size={18} className="text-[var(--rosso-ferrari)]" />
          <span className="text-sm font-medium">جودة التوليد:</span>
        </div>
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          {QUALITY_OPTIONS.map((q) => {
             const Icon = IconMap[q.icon || 'Star'] || Star;
             return (
              <button
                key={q.id}
                onClick={() => setStyles({ ...styles, quality: q.prompt })}
                className={cn(
                  "flex items-center gap-3 px-6 py-3 rounded-xl border transition-all duration-300 group",
                  styles.quality === q.prompt 
                    ? "bg-[var(--rosso-ferrari)]/20 border-[var(--rosso-ferrari)] text-white" 
                    : "bg-black/40 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon size={16} className={cn(styles.quality === q.prompt ? "text-[var(--rosso-ferrari)]" : "text-gray-500")} />
                <span className="text-sm font-medium">{q.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Template Editor */}
      <div className="bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-sm shadow-xl overflow-hidden transition-all duration-300">
        <button 
          onClick={() => setShowTemplateEditor(!showTemplateEditor)}
          className="w-full p-6 flex flex-row items-center justify-between text-right"
        >
          <div className="flex items-center gap-4">
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", showTemplateEditor ? "bg-[var(--rosso-ferrari)]/20 text-[var(--rosso-ferrari)]" : "bg-black/40 text-gray-400")}>
              <Code size={20} />
            </div>
            <div className="text-right">
              <h3 className={cn("font-medium transition-colors text-lg", showTemplateEditor ? "text-white" : "text-gray-300")}>قالب مطالبات الفيديو المخصص (Video Prompt Template)</h3>
              <p className="text-gray-500 text-sm font-light mt-1">تخصيص هيكل ومكونات المطالبات المرسلة لمحركات توليد الفيديو</p>
            </div>
          </div>
          <ChevronDown size={24} className={cn("text-gray-500 transition-transform duration-300", showTemplateEditor ? "rotate-180" : "")} />
        </button>

        <AnimatePresence>
          {showTemplateEditor && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 pb-6 overflow-hidden"
            >
              <div className="pt-4 border-t border-white/10">
                <div className="mb-4">
                  <span className="text-sm text-gray-400 mb-2 block">المتغيرات المتاحة (اضغط للإضافة):</span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: '{scene_description}', label: 'وصف المشهد' },
                      { id: '{art_style}', label: 'الأسلوب الفني' },
                      { id: '{shot_style}', label: 'نمط الإطار' },
                      { id: '{character_desc}', label: 'وصف الشخصية' },
                      { id: '{camera_movement}', label: 'حركة الكاميرا' }
                    ].map(variable => (
                      <button
                        key={variable.id}
                        onClick={() => insertVariable(variable.id)}
                        className="text-xs px-3 py-1.5 bg-black/40 border border-white/10 hover:border-white/30 text-gray-300 hover:text-white rounded-lg transition-colors font-mono tracking-wider"
                      >
                        {variable.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="bg-black/50 border border-white/10 focus-within:border-white/30 rounded-2xl p-4 transition-all shadow-inner relative flex flex-col">
                  <textarea 
                    value={advancedSettings.videoPromptTemplate || ''}
                    onChange={(e) => setAdvancedSettings({ ...advancedSettings, videoPromptTemplate: e.target.value })}
                    placeholder="اكتب قالبك الخاص هنا، واستخدم المتغيرات أعلاه لبناء هيكل المطالبة..."
                    className="w-full bg-transparent border-none text-white font-mono focus:outline-none focus:ring-0 resize-none min-h-[120px] text-sm tracking-wide leading-relaxed placeholder-gray-600 custom-scrollbar ltr text-left"
                    dir="ltr"
                  />
                  <div className="flex justify-end mt-2">
                    <button 
                      onClick={() => setAdvancedSettings({ ...advancedSettings, videoPromptTemplate: 'تصف الحركة البصرية بدقة، {camera_movement}، والبيئة المحيطة. {art_style}. {shot_style}. {character_desc}. {scene_description}' })}
                      className="text-xs text-gray-500 hover:text-white transition-colors underline underline-offset-4 decoration-white/20 hover:decoration-white/60"
                    >
                      استعادة القالب الافتراضي
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                  هذا القالب سيتم استخدامه لبناء مطالبة الفيديو النهائية. إذا تركته فارغاً أو استخدمت إعدادات بسيطة، سيقوم المعالج الآلي باختيار قالب افتراضي قوي ودمج المتغيرات.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-between pt-6 border-t border-white/10">
        <button 
          onClick={() => setStep(3)}
          className="text-gray-400 hover:text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all"
        >
          <ArrowRight size={20} />
          <span>رجوع</span>
        </button>

        <button 
          onClick={() => setStep(5)}
          className="bg-[var(--rosso-ferrari)] hover:bg-red-800 text-white px-8 py-3 rounded-xl font-medium flex items-center gap-3 transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(212,0,0,0.3)]"
        >
          <span>التالي: توليد السيناريو 🎬</span>
          <ArrowLeft size={20} />
        </button>
      </div>
    </motion.div>
  );
}
