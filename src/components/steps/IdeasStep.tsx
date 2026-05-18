import React, { useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Check, Star, Bookmark, Edit2, Plus, X, Search, Trash2, Film, Lightbulb, BookOpen, Skull, Laugh, Presentation, Video } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Idea } from '../../types';

const CATEGORIES = ['الكل', 'وثائقي', 'تعليمي', 'كوميدي', 'رعب', 'دراما', 'تسويقي', 'عام'];

const getCategoryIcon = (category?: string) => {
  switch (category) {
    case 'وثائقي': return <BookOpen size={16} />;
    case 'تعليمي': return <Presentation size={16} />;
    case 'كوميدي': return <Laugh size={16} />;
    case 'رعب': return <Skull size={16} />;
    case 'دراما': return <Film size={16} />;
    case 'تسويقي': return <Video size={16} />;
    default: return <Lightbulb size={16} />;
  }
};

export function IdeasStep() {
  const { ideas, setIdeas, savedIdeas, setSavedIdeas, selectedIdea, setSelectedIdea, setStep } = useAppContext();
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<{ title: string, angle: string, category: string }>({ title: '', angle: '', category: 'عام' });
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');

  if (ideas.length === 0 && savedIdeas.length === 0 && !isAddingNew) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-gray-400">لا توجد أفكار بعد. يرجى توليد الأفكار من الخطوة الأولى أو إضافة فكرة يدوياً.</p>
        <div className="flex gap-4">
          <button 
            onClick={() => setStep(1)}
            className="text-gray-400 hover:text-white px-4 py-2 border border-white/10 rounded-lg flex items-center gap-2 transition-colors"
          >
            <ArrowRight size={16} /> العودة للأساسيات
          </button>
          <button 
            onClick={() => { setIsAddingNew(true); setEditingDraft({ title: '', angle: '', category: 'عام' }); }}
            className="bg-[var(--rosso-ferrari)] text-white hover:bg-red-800 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={16} /> إضافة فكرة يدوياً
          </button>
        </div>
      </div>
    );
  }

  const toggleSaveIdea = (idea: Idea, e: React.MouseEvent) => {
    e.stopPropagation();
    const isSaved = savedIdeas.some(s => s.id === idea.id);
    if (isSaved) {
      setSavedIdeas(savedIdeas.filter(s => s.id !== idea.id));
    } else {
      setSavedIdeas([...savedIdeas, idea]);
    }
  };

  const deleteSavedIdea = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(window.confirm('هل أنت متأكد من حذف هذه الفكرة من المحفوظات؟')) {
      setSavedIdeas(savedIdeas.filter(s => s.id !== id));
      if (selectedIdea?.id === id) setSelectedIdea(null);
    }
  };

  const startEditing = (idea: Idea, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingIdeaId(idea.id);
    setEditingDraft({ title: idea.title, angle: idea.angle, category: idea.category || 'عام' });
  };

  const saveEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingDraft.title || !editingDraft.angle) return;
    
    const updatedSaved = savedIdeas.map(s => s.id === id ? { ...s, title: editingDraft.title, angle: editingDraft.angle, category: editingDraft.category } : s);
    setSavedIdeas(updatedSaved);
    
    const updatedIdeas = ideas.map(s => s.id === id ? { ...s, title: editingDraft.title, angle: editingDraft.angle, category: editingDraft.category } : s);
    setIdeas(updatedIdeas);
    
    if (selectedIdea?.id === id) {
      setSelectedIdea({ ...selectedIdea, title: editingDraft.title, angle: editingDraft.angle, category: editingDraft.category });
    }
    
    setEditingIdeaId(null);
  };

  const saveNewIdea = () => {
    if (!editingDraft.title || !editingDraft.angle) return;
    const newIdea: Idea = {
      id: `manual_idea_${Date.now()}`,
      title: editingDraft.title,
      angle: editingDraft.angle,
      category: editingDraft.category || 'عام'
    };
    setSavedIdeas([...savedIdeas, newIdea]);
    setIsAddingNew(false);
    setEditingDraft({ title: '', angle: '', category: 'عام' });
  };

  const renderIdeaCard = (idea: Idea, index: number, showDelete: boolean = false) => {
    const isSaved = savedIdeas.some(s => s.id === idea.id);
    const isEditing = editingIdeaId === idea.id;
    const isSelected = selectedIdea?.id === idea.id;

    return (
      <motion.div
        key={idea.id || index}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        onClick={() => !isEditing && setSelectedIdea(idea)}
        className={cn(
          "p-6 rounded-2xl transition-all duration-300 relative overflow-hidden group cursor-pointer border flex flex-col",
          isSelected 
            ? "bg-[#FFD700]/5 border-[#FFD700] shadow-[0_0_20px_rgba(255,215,0,0.15)]" 
            : "bg-[#1A1A1A] border-white/5 hover:border-white/20 hover:bg-white/5"
        )}
      >
        {isSelected && !isEditing && (
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Check size={64} className="text-[#FFD700]" />
          </div>
        )}

        {isEditing ? (
          <div className="space-y-4 relative z-10" onClick={(e) => e.stopPropagation()}>
            <input 
              type="text" 
              autoFocus
              value={editingDraft.title}
              onChange={e => setEditingDraft({...editingDraft, title: e.target.value})}
              className="w-full bg-black/60 border border-[var(--rosso-ferrari)]/50 rounded-xl px-4 py-3 text-white outline-none focus:border-[var(--rosso-ferrari)] text-lg font-bold shadow-inner transition-colors"
              placeholder="عنوان الفكرة"
            />
            <div className="flex gap-2">
              {CATEGORIES.slice(1).map(cat => (
                <button
                  key={cat}
                  onClick={(e) => { e.stopPropagation(); setEditingDraft({...editingDraft, category: cat}); }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                    editingDraft.category === cat ? "bg-[var(--rosso-ferrari)] text-white border-[var(--rosso-ferrari)]" : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
            <textarea 
              value={editingDraft.angle}
              onChange={e => setEditingDraft({...editingDraft, angle: e.target.value})}
              className="w-full bg-black/60 border border-[var(--rosso-ferrari)]/50 rounded-xl px-4 py-3 text-gray-200 outline-none focus:border-[var(--rosso-ferrari)] resize-none h-24 shadow-inner custom-scrollbar transition-colors"
              placeholder="وصف الزاوية والتفاصيل"
            />
            <div className="flex gap-3 justify-end mt-4">
              <button onClick={(e) => { e.stopPropagation(); setEditingIdeaId(null); }} className="px-5 py-2.5 rounded-xl text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium">إلغاء</button>
              <button onClick={(e) => saveEdit(idea.id, e)} className="px-5 py-2.5 bg-[var(--rosso-ferrari)] text-white rounded-xl text-sm hover:bg-red-800 transition-all font-medium drop-shadow-md">حفظ الفكرة</button>
            </div>
          </div>
        ) : (
          <div className="relative z-10 flex-1 flex flex-col">
            <div className="flex justify-between items-start gap-4 mb-3">
              <div className="flex items-start gap-3">
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-[#FFD700] flex items-center justify-center shrink-0 shadow-lg mt-1">
                    <Check size={14} className="text-black stroke-[3]" />
                  </div>
                )}
                <div>
                  <h3 className={cn("text-xl font-bold transition-colors mb-2", isSelected ? "text-white" : "text-gray-100")}>{idea.title}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-white/5 text-[var(--rosso-ferrari)] font-medium border border-white/10">
                      {getCategoryIcon(idea.category)}
                      {idea.category || 'عام'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button 
                  onClick={(e) => startEditing(idea, e)}
                  className="p-2 rounded-full text-gray-400 hover:bg-black/50 hover:text-white transition-all border border-transparent hover:border-white/10 shadow-sm"
                  title="تعديل الفكرة"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={(e) => toggleSaveIdea(idea, e)}
                  className={cn(
                    "p-2 rounded-full transition-all border border-transparent hover:border-yellow-500/30 shadow-sm",
                    isSaved 
                      ? "text-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20" 
                      : "text-gray-400 hover:bg-black/50 hover:text-yellow-500"
                  )}
                  title={isSaved ? "إلغاء الحفظ" : "حفظ الفكرة للعودة إليها لاحقاً"}
                >
                  <Star size={16} fill={isSaved ? "currentColor" : "none"} />
                </button>
                {showDelete && (
                  <button 
                    onClick={(e) => deleteSavedIdea(idea.id, e)}
                    className="p-2 rounded-full text-gray-400 hover:bg-black/50 hover:text-red-500 transition-all border border-transparent hover:border-red-500/30 shadow-sm"
                    title="حذف الفكرة"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
            <p className={cn("leading-relaxed text-sm flex-1", isSelected ? "text-gray-300" : "text-gray-400")}>{idea.angle}</p>
          </div>
        )}
      </motion.div>
    );
  };

  const filteredIdeas = ideas.filter(idea => 
    (idea.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    idea.angle.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (selectedCategory === 'الكل' || idea.category === selectedCategory || (!idea.category && selectedCategory === 'عام'))
  );

  const filteredSavedIdeas = savedIdeas.filter(idea => 
    (idea.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    idea.angle.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (selectedCategory === 'الكل' || idea.category === selectedCategory || (!idea.category && selectedCategory === 'عام'))
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold mb-2">اختر الفكرة المناسبة</h2>
          <p className="text-gray-400">حدد إحدى الأفكار للمتابعة إلى إعدادات الشخصية والسيناريو، أو احفظ الأفكار المميزة للعودة إليها لاحقاً.</p>
        </div>
        <button 
          onClick={() => { setIsAddingNew(true); setEditingDraft({ title: '', angle: '', category: 'عام' }); }}
          className="bg-[var(--rosso-ferrari)] hover:bg-red-800 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all font-medium drop-shadow-md whitespace-nowrap"
        >
          <Plus size={18} /> إضافة فكرة يدوياً
        </button>
      </div>

      {(ideas.length > 0 || savedIdeas.length > 0) && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm",
                  selectedCategory === cat 
                    ? "bg-white text-black" 
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 right-0 pl-3 pr-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="ابحث في الأفكار بالعنوان أو الوصف..."
              className="block w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[var(--rosso-ferrari)] focus:border-transparent transition-all sm:text-sm shadow-inner"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      <AnimatePresence>
        {isAddingNew && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0a0a0a] p-6 rounded-3xl border border-white/10 shadow-2xl w-full max-w-lg space-y-6 relative overflow-hidden"
            >
              <div className="flex justify-between items-center relative z-10">
                <h3 className="text-xl text-white font-bold flex items-center gap-2">
                  <Edit2 size={20} className="text-[var(--rosso-ferrari)]" /> إضافة فكرة يدوياً
                </h3>
                <button onClick={() => { setIsAddingNew(false); setEditingDraft({ title: '', angle: '', category: 'عام' }); }} className="text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full p-2"><X size={18}/></button>
              </div>
              <div className="space-y-4 relative z-10">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">عنوان الفكرة المذهلة</label>
                  <input 
                    type="text" 
                    value={editingDraft.title}
                    onChange={e => setEditingDraft({...editingDraft, title: e.target.value})}
                    className="w-full bg-black/60 border border-white/10 focus:border-[var(--rosso-ferrari)] rounded-xl px-4 py-3 text-white outline-none font-medium transition-colors"
                    placeholder="مثال: خمس عادات للنجاح..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">التصنيف (Category)</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.slice(1).map(cat => (
                      <button
                        key={cat}
                        onClick={() => setEditingDraft({...editingDraft, category: cat})}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                          editingDraft.category === cat ? "bg-[var(--rosso-ferrari)] text-white border-[var(--rosso-ferrari)]" : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">تفاصيل الفكرة والزاوية</label>
                  <textarea 
                    value={editingDraft.angle}
                    onChange={e => setEditingDraft({...editingDraft, angle: e.target.value})}
                    className="w-full bg-black/60 border border-white/10 focus:border-[var(--rosso-ferrari)] rounded-xl px-4 py-3 text-gray-200 outline-none resize-none h-32 custom-scrollbar transition-colors leading-relaxed"
                    placeholder="اشرح فكرتك وكيف سيتم تناولها..."
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2 relative z-10">
                <button onClick={() => { setIsAddingNew(false); setEditingDraft({ title: '', angle: '', category: 'عام' }); }} className="px-6 py-2.5 rounded-xl text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors font-medium">إلغاء</button>
                <button onClick={saveNewIdea} disabled={!editingDraft.title.trim() || !editingDraft.angle.trim()} className="px-6 py-2.5 bg-[var(--rosso-ferrari)] text-white rounded-xl font-medium hover:bg-red-800 disabled:opacity-50 transition-all drop-shadow-md">حفظ وإضافة للأفكار</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {ideas.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--rosso-ferrari)]"></span>
            الأفكار المولدة الحالية
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredIdeas.length > 0 ? (
               filteredIdeas.map((idea, index) => renderIdeaCard(idea, index, false))
            ) : (
               <p className="text-gray-500 min-h-[60px] flex items-center justify-center bg-black/20 rounded-xl border border-white/5 md:col-span-2">لا توجد أفكار مولدة تطابق بحثك.</p>
            )}
          </div>
        </div>
      )}

      {savedIdeas.length > 0 && (
        <div className="space-y-4 pt-4 mt-6">
          <h3 className="text-lg font-medium text-white flex items-center gap-2">
            <Bookmark size={20} className="text-[var(--rosso-ferrari)]" /> 
            الأفكار المحفوظة ({savedIdeas.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSavedIdeas.length > 0 ? (
              filteredSavedIdeas.map((idea, index) => renderIdeaCard(idea, index, true))
            ) : (
              <p className="text-gray-500 min-h-[60px] flex items-center justify-center bg-black/20 rounded-xl border border-white/5 md:col-span-2">لا توجد أفكار محفوظة تطابق بحثك.</p>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between pt-6 border-t border-white/5 mt-8 relative z-20 bg-[#0a0a0a] sticky bottom-0 pb-4">
        <button 
          onClick={() => setStep(1)}
          className="text-gray-400 hover:text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10"
        >
          <ArrowRight size={20} />
          <span>الخطوة السابقة</span>
        </button>

        <button 
          onClick={() => selectedIdea && setStep(3)}
          disabled={!selectedIdea}
          className="bg-[var(--rosso-ferrari)] hover:bg-red-800 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold tracking-wide flex items-center gap-3 transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-[0_0_20px_rgba(227,38,54,0.3)] disabled:shadow-none disabled:hover:translate-y-0"
        >
          <span>التالي: إعداد الشخصية والأسلوب</span>
          <ArrowLeft size={20} />
        </button>
      </div>
    </motion.div>
  );
}

