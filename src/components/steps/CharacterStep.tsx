import { useAppContext } from '../../store/AppContext';
import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, UserCircle, Users, Wand2, Loader2, Sparkles, Save, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { SavedCharacter } from '../../types';
import { suggestCharacterIdea, improveCharacterDescription } from '../../services/ai';

export function CharacterStep() {
  const { character, setCharacter, setStep, advancedSettings, setAdvancedSettings, topic } = useAppContext();
  const savedCharacters = advancedSettings.savedCharacters || [];
  const [generatingIdea, setGeneratingIdea] = useState(false);
  const [enhancingDesc, setEnhancingDesc] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleSelectSavedCharacter = (char: SavedCharacter) => {
    setCharacter({
      useFixedCharacter: true,
      name: char.name,
      gender: char.gender,
      description: char.description
    });
  };

  const handleSuggestCharacter = async () => {
    setGeneratingIdea(true);
    try {
      const result = await suggestCharacterIdea(topic || "فيديو يوتيوب إبداعي");
      const url = "https://image.pollinations.ai/prompt/" + encodeURIComponent("Character portrait, concept art, " + result.description + " --no text") + "?width=512&height=512&nologo=true&seed=" + Math.floor(Math.random() * 1000000);
      setCharacter({
        useFixedCharacter: true,
        name: result.name,
        gender: result.gender as any,
        description: result.description,
        imageUrl: url
      });
    } catch (error) {
      console.error("Failed to suggest character:", error);
    } finally {
      setGeneratingIdea(false);
    }
  };

  const handleEnhanceDescription = async () => {
    if (!character.description) return;
    setEnhancingDesc(true);
    try {
      const EnhancedDesc = await improveCharacterDescription(character.description);
      setCharacter({
        ...character,
        description: EnhancedDesc
      });
    } catch (error) {
      console.error("Failed to enhance character:", error);
    } finally {
      setEnhancingDesc(false);
    }
  };

  const [generatingThumbnail, setGeneratingThumbnail] = useState(false);

  const handleGenerateThumbnail = async () => {
    if (!character.description) return;
    setGeneratingThumbnail(true);
    await new Promise(r => setTimeout(r, 1000));
    const url = "https://image.pollinations.ai/prompt/" + encodeURIComponent("Character portrait, concept art, " + character.description + " --no text") + "?width=512&height=512&nologo=true&seed=" + Math.floor(Math.random() * 1000000);
    setCharacter({ ...character, imageUrl: url });
    setGeneratingThumbnail(false);
  };

  const handleSaveToLibrary = () => {
    if (!character.name || !character.description) return;
    setSaveStatus('saving');
    
    // Check if character with same name already exists
    const existingIndex = savedCharacters.findIndex(c => c.name === character.name);
    
    let newSavedCharacters = [...savedCharacters];
    if (existingIndex >= 0) {
      newSavedCharacters[existingIndex] = {
        ...newSavedCharacters[existingIndex],
        gender: character.gender,
        description: character.description
      };
    } else {
      newSavedCharacters.push({
        id: `char_${Date.now()}`,
        name: character.name,
        gender: character.gender as any,
        description: character.description,
        imageUrl: '' // Added imageUrl field as it is in the type 
      });
    }

    setAdvancedSettings({
      ...advancedSettings,
      savedCharacters: newSavedCharacters
    });

    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };


  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-3xl font-bold mb-2">إعداد الشخصية (اختياري)</h2>
        <p className="text-gray-400">هل تريد شخصية محددة وثابتة تظهر في معظم مشاهد الفيديو؟ يمكنك إنشاء أو اختيار شخصيات من قائمة الإعدادات.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => setCharacter({ ...character, useFixedCharacter: false })}
          className={cn(
            "p-6 rounded-2xl border text-right transition-all duration-300 bg-[#1A1A1A]",
            !character.useFixedCharacter
              ? "active-border"
              : "border-transparent hover:bg-white/5"
          )}
        >
          <Users size={32} className={!character.useFixedCharacter ? "text-[var(--rosso-ferrari)] mb-4" : "text-gray-500 mb-4"} />
          <h3 className="text-xl font-bold text-white mb-2">بدون شخصية ثابتة</h3>
          <p className="text-sm text-gray-400">مثالي للفيديوهات الوثائقية، أو اللقطات العامة التي لا تركز على شخصية بعينها.</p>
        </button>

        <button
          onClick={() => setCharacter({ ...character, useFixedCharacter: true })}
          className={cn(
            "p-6 rounded-2xl border text-right transition-all duration-300 bg-[#1A1A1A]",
            character.useFixedCharacter
              ? "active-border"
              : "border-transparent hover:bg-white/5"
          )}
        >
          <UserCircle size={32} className={character.useFixedCharacter ? "text-[var(--rosso-ferrari)] mb-4" : "text-gray-500 mb-4"} />
          <h3 className="text-xl font-bold text-white mb-2">شخصية رئيسية ثابتة</h3>
          <p className="text-sm text-gray-400">يضمن إضافة وصف الشخصية في جميع مطالبات الصور للحصول على استمرارية بصرية.</p>
        </button>
      </div>

      {character.useFixedCharacter && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-6 overflow-hidden"
        >
          {savedCharacters.length > 0 && (
            <div className="glass-card p-4 rounded-2xl">
              <label className="block text-sm font-medium text-gray-300 mb-3">اختيار من الشخصيات المحفوظة</label>
              <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar pr-1">
                {savedCharacters.map(char => (
                  <button 
                    key={char.id}
                    onClick={() => handleSelectSavedCharacter(char)}
                    className={cn(
                      "flex items-center gap-3 bg-black/40 border p-2 pr-3 rounded-xl min-w-[200px] text-right transition-all",
                      character.name === char.name && character.description === char.description
                        ? "border-[var(--rosso-ferrari)] bg-[var(--rosso-ferrari)]/10"
                        : "border-white/10 hover:border-white/30"
                    )}
                  >
                    {char.imageUrl ? (
                      <img src={char.imageUrl} alt={char.name} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                        <UserCircle size={20} className="text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-medium text-white">{char.name}</h4>
                      <p className="text-[10px] text-gray-500">{char.gender}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="glass-card p-6 rounded-2xl space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
              <h4 className="text-lg font-semibold text-white">تفاصيل الشخصية</h4>
              <button 
                onClick={handleSuggestCharacter}
                disabled={generatingIdea}
                className="flex items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded-xl text-sm font-medium transition-colors border border-blue-500/30"
              >
                {generatingIdea ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                اقتراح شخصية مناسبة للفكرة بالذكاء الاصطناعي
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">اسم الشخصية (اختياري، للتمييز)</label>
                <input 
                  type="text" 
                  value={character.name}
                  onChange={(e) => setCharacter({ ...character, name: e.target.value })}
                  placeholder="مثال: أحمد"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[var(--rosso-ferrari)] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">الجنس</label>
                <select 
                  value={character.gender}
                  onChange={(e) => setCharacter({ ...character, gender: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--rosso-ferrari)] transition-all appearance-none"
                >
                  <option>ذكر</option>
                  <option>أنثى</option>
                  <option>غير محدد / آلي</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-300">الوصف البصري الكامل (بالإنجليزية لدقة المطالبات)</label>
                <div className="flex gap-2">
                  <button
                    onClick={handleEnhanceDescription}
                    disabled={!character.description || enhancingDesc}
                    className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 disabled:opacity-50 transition-colors"
                  >
                    {enhancingDesc ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    تحسين الوصف
                  </button>
                  <button
                    onClick={handleSaveToLibrary}
                    disabled={!character.name || !character.description || saveStatus !== 'idle'}
                    className="flex items-center gap-1.5 text-xs text-[var(--rosso-ferrari)] hover:text-red-400 disabled:opacity-50 transition-colors"
                  >
                    {saveStatus === 'idle' && <Save size={14} />}
                    {saveStatus === 'saving' && <Loader2 size={14} className="animate-spin" />}
                    {saveStatus === 'saved' && <CheckCircle2 size={14} className="text-green-500" />}
                    {saveStatus === 'saved' ? 'تم الحفظ' : 'حفظ الشخصية للمكتبة'}
                  </button>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <textarea 
                    value={character.description}
                    onChange={(e) => setCharacter({ ...character, description: e.target.value })}
                    placeholder="e.g. 30 year old man, short black hair, wearing a casual red hoodie, wearing glasses, sharp facial features"
                    rows={4}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[var(--rosso-ferrari)] transition-all resize-none ltr text-left"
                    dir="ltr"
                  />
                </div>
                
                <div className="w-32 flex flex-col gap-2 flex-shrink-0">
                  {character.imageUrl ? (
                    <div className="w-32 h-32 rounded-xl overflow-hidden border border-[var(--rosso-ferrari)]/30 group relative">
                      <img src={character.imageUrl} alt="thumbnail" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setCharacter({...character, imageUrl: ''})}
                        className="absolute top-1 right-1 bg-black/60 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-white hover:text-red-400"
                        title="إزالة الصورة"
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-gray-500">
                       <UserCircle size={40} className="opacity-30" />
                    </div>
                  )}
                  <button 
                    onClick={handleGenerateThumbnail} 
                    disabled={generatingThumbnail || !character.description}
                    className="w-full py-2 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 transition-colors flex items-center justify-center gap-1.5"
                    title="توليد صورة مصغرة للشخصية"
                  >
                    {generatingThumbnail ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    {character.imageUrl ? 'تحديث الصورة' : 'توليد صورة'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex justify-between pt-6">
        <button 
          onClick={() => setStep(2)}
          className="text-gray-400 hover:text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all"
        >
          <ArrowRight size={20} />
          <span>رجوع</span>
        </button>

        <button 
          onClick={() => setStep(4)}
          className="bg-[var(--rosso-ferrari)] hover:bg-red-800 text-white px-8 py-3 rounded-xl font-medium flex items-center gap-3 transition-all transform hover:scale-105 active:scale-95"
        >
          <span>التالي: الأنماط البصرية</span>
          <ArrowLeft size={20} />
        </button>
      </div>
    </motion.div>
  );
}
