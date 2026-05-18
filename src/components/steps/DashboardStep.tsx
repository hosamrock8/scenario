import { useAppContext } from '../../store/AppContext';
import { generateIdeas, enhanceTopic, generateCategorySuggestions } from '../../services/ai';
import { Loader2, Sparkles, Wand2, UploadCloud, FileImage, X, RefreshCcw, Check, Film, BookOpen, Skull, Smile, Youtube, Link, ChevronDown, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '../../lib/utils';
import useEmblaCarousel from 'embla-carousel-react';

const SUGGESTION_CATEGORIES = [
  { 
    id: 'documentary', name: 'وثائقي وتعليمي', icon: BookOpen, 
    items: [
      "دور الذكاء الاصطناعي في استكشاف الكواكب البعيدة والبحث عن حياة",
      "كيف ستدير أنظمة الذكاء الاصطناعي المستعمرات البشرية على المريخ",
      "استخدام الذكاء الاصطناعي لتتبع المذنبات وحماية معدات الفضاء",
      "تاريخ تطور الذكاء الاصطناعي في السنوات الخمس الأخيرة",
      "رحلة في أعماق المحيطات والأحياء المكتشفة حديثاً"
    ]
  },
  {
    id: 'horror', name: 'رعب وغموض', icon: Skull, 
    items: [
      "قصة بيت مهجور في الريف وتاريخه المظلم",
      "أسطورة مجهولة من التراث القديم تعود للحياة",
      "ليلة مرعبة في غابة مظلمة ومفقودون بلا أثر",
      "لغز الجريمة التي لم تُحل منذ 50 عاماً",
      "ظواهر خارقة للطبيعة تم توثيقها بالكاميرا"
    ]
  },
  {
    id: 'comedy', name: 'كوميدي وساخر', icon: Smile, 
    items: [
      "يوميات موظف يعاني من مديره غريب الأطوار",
      "عندما تحاول تحضير طعام صحي وتفشل بكارثة",
      "مواقف محرجة تحدث في مقابلات العمل عبر الإنترنت",
      "كيف تتهرب من المناسبات الاجتماعية بذكاء",
      "تحدي العيش بدون هاتف ذكي ليوم كامل"
    ]
  },
  {
    id: 'cartoon', name: 'كرتوني وأنيميشن', icon: Sparkles, 
    items: [
      "مغامرة قطة في الفضاء تحاول العودة للأرض",
      "بطل خارق يخاف من الفئران ويحاول إنقاذ مدينته",
      "قرية الخضراوات الناطقة وتحدي فصل الشتاء",
      "اختراع سحري يحول الكلمات إلى وحوش صغيرة",
      "قصة صداقة بين روبوت قديم وطائر صغير"
    ]
  },
  {
    id: 'drama', name: 'قصص درامية', icon: Film, 
    items: [
      "لقاء مفاجئ بعد عشرين عاماً يغير مجرى الحياة",
      "رسالة لم تصل في وقتها وتسببت في فراق طويل",
      "اختيار صعب بين العائلة ومستقبل مهني باهر",
      "صراع الأجيال بين أب تقليدي وابن طموح",
      "لحظة اكتشاف حقيقة تقلب الموازين"
    ]
  }
];

export function DashboardStep() {
  const { 
    topic, setTopic, 
    contentType, setContentType, 
    platform, setPlatform,
    ideas, setIdeas,
    savedIdeas,
    setStep,
    advancedSettings
  } = useAppContext();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeCategory, setActiveCategory] = useState(SUGGESTION_CATEGORIES[0].id);
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);
  const [usedSuggestions, setUsedSuggestions] = useState<string[]>([]);
  const [youtubeLink, setYoutubeLink] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [activeInputMethod, setActiveInputMethod] = useState<'manual' | 'suggestions' | 'youtube' | ''>('manual');
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start', direction: 'rtl', dragFree: true });
  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false);

  const scrollPrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setPrevBtnEnabled(emblaApi.canScrollPrev());
    setNextBtnEnabled(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  // Handle category change and suggestion refreshing
  useEffect(() => {
    refreshSuggestions(activeCategory);
  }, [activeCategory]);

  const refreshSuggestions = async (categoryId: string) => {
    const category = SUGGESTION_CATEGORIES.find(c => c.id === categoryId);
    if (!category) return;
    
    setIsGeneratingSuggestions(true);
    
    try {
      // Fetch dynamic suggestions from AI
      const aiSuggestions = await generateCategorySuggestions(category.name, usedSuggestions.filter(s => currentSuggestions.includes(s)));
      if (aiSuggestions.length >= 3) {
        setCurrentSuggestions(aiSuggestions);
      } else if (aiSuggestions.length > 0) {
        setCurrentSuggestions(aiSuggestions);
      } else {
        // Fallback to local if AI generation fails or returns empty
        fallbackLocalSuggestions(category);
      }
    } catch (err) {
      console.error("AI suggestions failed, falling back to local.");
      fallbackLocalSuggestions(category);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const fallbackLocalSuggestions = (category: any) => {
    let available = category.items.filter((item: string) => !usedSuggestions.includes(item));
    if (available.length < 3) {
      available = category.items;
      setUsedSuggestions(prev => prev.filter(p => !category.items.includes(p)));
    }
    const shuffled = [...available].sort(() => 0.5 - Math.random());
    setCurrentSuggestions(shuffled.slice(0, 6));
  };

  const selectSuggestion = (sug: string) => {
    setTopic(sug);
    setUsedSuggestions(prev => [...prev, sug]);
    setActiveInputMethod('suggestions');
  };

  const handleGenerate = async () => {
    if (!topic && !youtubeLink) {
      setError('يرجى إدخال الموضوع أو رابط فيديو يوتيوب أو اختيار فكرة أولاً');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // If Youtube link is provided, append it to the topic to guide the AI
      let finalTopic = topic;
      if (youtubeLink) {
        finalTopic = `[تم توفير رابط يوتيوب مرجعي كفكرة ونموذج: ${youtubeLink}]\nأريد إنشاء محتوى وسيناريو بناءً على نفس فكرة وأسلوب هذا الفيديو وبجودة احترافية.\n${topic ? `مع التركيز وتعديل التفاصيل لتناسب هذا الموضوع: ${topic}` : ''}`;
      }

      const recentIdeas = [
        ...ideas.map((i) => i.title),
        ...savedIdeas.map((i) => i.title)
      ];

      const result = await generateIdeas(finalTopic, contentType, platform, recentIdeas);
      setIdeas(result);
      setStep(2); // Go to ideas step
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء التوليد. تأكد من إعداد API Key.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles].slice(0, 5)); // Limit to 5 files for UI
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto pt-8 pb-20"
    >
      <div className="text-center pt-8 pb-10">
        <h2 className="title-text text-white text-center font-bold text-[50px] leading-[60px] mb-4">
          {advancedSettings?.frontendLabels?.mainTitle || "صناعة محتوى جديد"}
        </h2>
        <p className="text-gray-400 font-light tracking-wide text-[20px]">
          {advancedSettings?.frontendLabels?.subTitle || "أدخل فكرتك لتوليد محتوى احترافي أو ابدأ بأفكار الذكاء الاصطناعي"}
        </p>
      </div>

      <div className="space-y-10">
        
        {/* Input Methods Accordions */}
        <div className="space-y-4">
          
          {/* Method 1: AI Suggestions */}
          <div className={cn("border rounded-3xl overflow-hidden transition-all duration-300", activeInputMethod === 'suggestions' ? "bg-white/[0.04] border-white/20 shadow-2xl" : "bg-black/20 border-white/5 hover:border-white/10")}>
            <button 
              onClick={() => setActiveInputMethod(activeInputMethod === 'suggestions' ? '' : 'suggestions')}
              className="w-full p-6 flex items-center justify-between text-right"
            >
              <div className="flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", activeInputMethod === 'suggestions' ? "bg-[var(--rosso-ferrari)]/20 text-[var(--rosso-ferrari)]" : "bg-black/40 text-gray-400")}>
                  <Sparkles size={20} />
                </div>
                <div className="text-right">
                  <h3 className={cn("font-medium transition-colors text-lg", activeInputMethod === 'suggestions' ? "text-white" : "text-gray-300")}>إلهام الذكاء الاصطناعي (أفكار مقترحة)</h3>
                  <p className="text-gray-500 text-sm font-light mt-1">دع الذكاء الاصطناعي يقترح أفكاراً جذابة جاهزة</p>
                </div>
              </div>
              <ChevronDown size={24} className={cn("text-gray-500 transition-transform duration-300", activeInputMethod === 'suggestions' ? "rotate-180" : "")} />
            </button>
            
            <AnimatePresence>
              {activeInputMethod === 'suggestions' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-6 pb-6 overflow-hidden"
                >
                  <div className="pt-4 border-t border-white/10">
                    <div className="mb-6 flex flex-col gap-4">
                      {/* Category Tabs Grid */}
                      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 w-full">
                        {SUGGESTION_CATEGORIES.map(cat => {
                          const isActive = activeCategory === cat.id;
                          return (
                            <button
                              key={cat.id}
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                if (activeCategory === cat.id) {
                                  refreshSuggestions(cat.id);
                                } else {
                                  setActiveCategory(cat.id); 
                                }
                              }}
                              className={cn(
                                "relative flex flex-col items-center justify-center p-4 rounded-2xl md:rounded-3xl transition-all duration-300 overflow-hidden group min-h-[120px] md:min-h-[140px]",
                                isActive 
                                  ? "text-white shadow-[0_0_20px_rgba(212,0,0,0.3)] z-10" 
                                  : "bg-black/30 border border-white/5 text-gray-400 hover:bg-white/5 hover:border-white/10 hover:text-gray-200"
                              )}
                            >
                              {isActive && (
                                <motion.div 
                                  layoutId="activeCategoryBg"
                                  className="absolute inset-0 bg-gradient-to-br from-[var(--rosso-ferrari)] to-red-900"
                                  initial={false}
                                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                              )}
                              <div className="relative z-10 flex flex-col items-center gap-3">
                                <div className={cn(
                                  "p-3 md:p-4 rounded-full transition-all duration-300",
                                  isActive ? "bg-white/20 scale-110 shadow-inner" : "bg-white/5 group-hover:bg-white/10 group-hover:scale-110"
                                )}>
                                  <cat.icon size={28} strokeWidth={isActive ? 2 : 1.5} className="md:w-8 md:h-8" />
                                </div>
                                <span className={cn("text-xs md:text-sm font-semibold text-center mt-1 transition-all", isActive ? "text-white tracking-wide" : "text-gray-400")}>{cat.name}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex justify-end">
                        <button 
                          onClick={(e) => { e.stopPropagation(); refreshSuggestions(activeCategory); }}
                          disabled={isGeneratingSuggestions}
                          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-colors text-sm font-medium text-white w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm"
                        >
                          {isGeneratingSuggestions ? <Loader2 size={16} className="animate-spin text-[var(--rosso-ferrari)]" /> : <RefreshCcw size={16} className="text-gray-400 group-hover:text-white group-hover:rotate-180 transition-all duration-500" />}
                          {isGeneratingSuggestions ? 'جاري التوليد...' : 'اقتراحات أخرى'}
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <div className="overflow-hidden" ref={emblaRef} dir="rtl">
                        <div className="flex gap-3">
                          {isGeneratingSuggestions ? (
                            Array(3).fill(0).map((_, i) => (
                              <div key={`skel-${i}`} className="flex-[0_0_90%] sm:flex-[0_0_45%] md:flex-[0_0_30%] h-[68px] bg-white/5 animate-pulse rounded-2xl border border-white/5"></div>
                            ))
                          ) : (
                            currentSuggestions.map((sug, idx) => (
                              <div key={idx} className="flex-[0_0_90%] sm:flex-[0_0_45%] md:flex-[0_0_30%] min-w-0 pb-2 flex">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); selectSuggestion(sug); }}
                                  className={cn(
                                    "w-full text-right px-4 py-4 rounded-2xl border transition-all duration-300 font-light text-sm flex items-center justify-between group",
                                    topic === sug 
                                      ? "bg-white/10 text-white border-[var(--rosso-ferrari)]/50 shadow-[0_0_15px_rgba(212,0,0,0.1)]" 
                                      : "bg-black/40 border-white/5 text-gray-400 hover:bg-white/5 hover:border-white/10 hover:text-gray-200"
                                  )}
                                  title={sug}
                                >
                                  <span className="truncate whitespace-normal line-clamp-2 md:line-clamp-1 pr-2 leading-relaxed">{sug}</span>
                                  <div className={cn(
                                    "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ml-1",
                                    topic === sug ? "border-[var(--rosso-ferrari)] text-[var(--rosso-ferrari)]" : "border-gray-600 text-transparent"
                                  )}>
                                    <Check size={12} />
                                  </div>
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                      
                      {/* Carousel Navigation */}
                      {!isGeneratingSuggestions && (
                        <>
                          <button 
                            onClick={scrollNext}
                            disabled={!nextBtnEnabled}
                            className={cn(
                              "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 md:-translate-x-1/2 w-9 h-9 rounded-full bg-black/80 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all z-10 shadow-lg",
                              nextBtnEnabled ? "opacity-100 visible" : "opacity-0 invisible"
                            )}
                          >
                            <ChevronLeft size={18} />
                          </button>
                          <button 
                            onClick={scrollPrev}
                            disabled={!prevBtnEnabled}
                            className={cn(
                              "absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 md:translate-x-1/2 w-9 h-9 rounded-full bg-black/80 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all z-10 shadow-lg",
                              prevBtnEnabled ? "opacity-100 visible" : "opacity-0 invisible"
                            )}
                          >
                            <ChevronRight size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Method 2: Manual Input */}
          <div className={cn("border rounded-3xl overflow-hidden transition-all duration-300 relative", activeInputMethod === 'manual' ? "bg-white/[0.04] border-white/20 shadow-2xl" : "bg-black/20 border-white/5 hover:border-white/10")}>
            {activeInputMethod === 'manual' && <div className="absolute -top-40 -right-40 w-80 h-80 bg-[var(--rosso-ferrari)]/10 rounded-full blur-[100px] pointer-events-none"></div>}
            
            <button 
              onClick={() => setActiveInputMethod(activeInputMethod === 'manual' ? '' : 'manual')}
              className="w-full p-6 flex items-center justify-between text-right relative z-10"
            >
              <div className="flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", activeInputMethod === 'manual' ? "bg-[var(--rosso-ferrari)]/20 text-[var(--rosso-ferrari)]" : "bg-black/40 text-gray-400")}>
                  <Wand2 size={20} />
                </div>
                <div className="text-right">
                  <h3 className={cn("font-medium transition-colors text-lg", activeInputMethod === 'manual' ? "text-white" : "text-gray-300")}>كتابة الفكرة يدوياً</h3>
                  <p className="text-gray-500 text-sm font-light mt-1">صف فكرتك بالتفصيل وسنتولى الباقي</p>
                </div>
              </div>
              <ChevronDown size={24} className={cn("text-gray-500 transition-transform duration-300", activeInputMethod === 'manual' ? "rotate-180" : "")} />
            </button>

            <AnimatePresence>
              {activeInputMethod === 'manual' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-6 pb-6 overflow-hidden relative z-10"
                >
                  <div className="pt-4 border-t border-white/10">
                    <div className="bg-black/50 border border-white/10 focus-within:border-white/30 rounded-2xl p-4 transition-all shadow-inner relative">
                      <textarea 
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="مثال: أريد فيديو وثائقي مدته دقيقة عن أسرار الفضاء، يركز على الثقوب السوداء مع أسلوب سينمائي مرعب..."
                        className="w-full bg-transparent border-none text-white font-light focus:outline-none focus:ring-0 resize-none min-h-[120px] text-lg tracking-wide leading-relaxed placeholder-gray-600 custom-scrollbar"
                      />
                      <div className="flex justify-end mt-2">
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!topic || topic.length < 5) return;
                            setIsEnhancing(true);
                            try {
                              const enhanced = await enhanceTopic(topic);
                              if (enhanced) setTopic(enhanced);
                            } catch (e) {
                              console.error(e);
                            } finally {
                              setIsEnhancing(false);
                            }
                          }}
                          disabled={!topic || topic.length < 5 || isEnhancing}
                          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-3 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="طور الفكرة الحالية إلى فكرة فيديو أكثر تفصيلاً وجاذبية، مع التركيز على زاوية فريدة ومميزة."
                        >
                          {isEnhancing ? <Loader2 size={14} className="animate-spin text-[var(--rosso-ferrari)]" /> : <Sparkles size={14} className="text-[var(--rosso-ferrari)]" />}
                          {isEnhancing ? 'جاري التحسين...' : 'تحسين الفكرة'}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Method 3: Youtube Link */}
          <div className={cn("border rounded-3xl overflow-hidden transition-all duration-300", activeInputMethod === 'youtube' ? "bg-white/[0.04] border-white/20 shadow-2xl" : "bg-black/20 border-white/5 hover:border-white/10")}>
            <button 
              onClick={() => setActiveInputMethod(activeInputMethod === 'youtube' ? '' : 'youtube')}
              className="w-full p-6 flex items-center justify-between text-right"
            >
              <div className="flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", activeInputMethod === 'youtube' ? "bg-red-500/20 text-red-500" : "bg-black/40 text-gray-400")}>
                  <Youtube size={20} />
                </div>
                <div className="text-right">
                  <h3 className={cn("font-medium transition-colors text-lg", activeInputMethod === 'youtube' ? "text-white" : "text-gray-300")}>محاكاة فيديو يوتيوب</h3>
                  <p className="text-gray-500 text-sm font-light mt-1">ضع رابط فيديو ليقوم الذكاء الاصطناعي ببناء سيناريو مشابه</p>
                </div>
              </div>
              <ChevronDown size={24} className={cn("text-gray-500 transition-transform duration-300", activeInputMethod === 'youtube' ? "rotate-180" : "")} />
            </button>

            <AnimatePresence>
              {activeInputMethod === 'youtube' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-6 pb-6 overflow-hidden"
                >
                  <div className="pt-4 border-t border-white/10">
                     <p className="text-xs text-gray-400 font-light pr-2 mb-3">قم بلصق رابط الفيديو ليقوم الذكاء الاصطناعي ببناء سيناريو احترافي على نفس النمط والترتيب.</p>
                     <div className="bg-black/50 border border-white/10 focus-within:border-white/30 rounded-2xl p-4 transition-all shadow-inner flex items-center gap-3">
                       <Link size={20} className="text-gray-500" />
                       <input 
                         type="text"
                         value={youtubeLink}
                         onChange={(e) => setYoutubeLink(e.target.value)}
                         placeholder="https://www.youtube.com/watch?v=..."
                         className="w-full bg-transparent border-none text-white font-light focus:outline-none focus:ring-0 text-sm placeholder-gray-600"
                       />
                     </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Global Selectors */}
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-sm shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Selectors */}
            <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-gray-300 text-sm font-medium">نوع المحتوى</label>
                    <select 
                      value={contentType}
                      onChange={(e) => setContentType(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 hover:border-white/20 rounded-xl px-5 py-4 text-white font-light text-sm focus:outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option className="bg-gray-900 text-white" value="وثائقي وتعليمي">وثائقي وتعليمي</option>
                      <option className="bg-gray-900 text-white" value="رعب وغموض">رعب وغموض</option>
                      <option className="bg-gray-900 text-white" value="كوميدي وساخر">كوميدي وساخر</option>
                      <option className="bg-gray-900 text-white" value="كرتوني وأنيميشن">كرتوني وأنيميشن</option>
                      <option className="bg-gray-900 text-white" value="قصص درامية">قصص درامية</option>
                      <option className="bg-gray-900 text-white" value="اقتراحات أخرى">اقتراحات أخرى</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-gray-300 text-sm font-medium">المنصة المستهدفة</label>
                    <select 
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 hover:border-white/20 rounded-xl px-5 py-4 text-white font-light text-sm focus:outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option className="bg-gray-900 text-white">YouTube Shorts</option>
                      <option className="bg-gray-900 text-white">TikTok</option>
                      <option className="bg-gray-900 text-white">Instagram Reels</option>
                      <option className="bg-gray-900 text-white">YouTube (طويل)</option>
                      <option className="bg-gray-900 text-white">Facebook Video</option>
                    </select>
                  </div>
              </div>

              {/* File uploader */}
              <div className="space-y-2 h-full flex flex-col">
                <label className="block text-gray-300 text-sm font-medium">مرفقات (صور / أدلة بصرية)</label>
                <div 
                  className="flex-1 border-2 border-dashed border-white/10 hover:border-white/30 bg-black/20 hover:bg-black/40 rounded-xl flex flex-col items-center justify-center gap-4 transition-all cursor-pointer group p-6 relative overflow-hidden"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    multiple 
                    accept="image/*,video/*" 
                  />
                  <div className="w-16 h-16 rounded-full bg-[var(--rosso-ferrari)]/10 text-[var(--rosso-ferrari)] flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <UploadCloud size={32} />
                  </div>
                  <div className="text-center">
                    <span className="text-base font-medium text-white block mb-1">أضف ملفاتك هنا</span>
                    <span className="text-xs font-light text-gray-500">تساعد الذكاء الاصطناعي على فهم النمط بشكل أفضل</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Uploaded Files Preview */}
            {files.length > 0 && (
              <div className="flex flex-wrap gap-3 pt-2">
                {files.map((file, idx) => (
                  <div key={idx} className="relative group bg-black/40 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
                    <FileImage size={16} className="text-[var(--rosso-ferrari)]" />
                    <span className="text-sm font-light text-gray-200 truncate w-32">{file.name}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {error && <div className="text-white text-center text-sm font-light mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              {error}
            </div>}
          </div>

        {/* Generate Button - Rectangular instead of Circle */}
        <div className="pt-2 flex flex-col items-center gap-4">
          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="w-full md:w-auto relative flex items-center justify-center gap-4 bg-[var(--rosso-ferrari)] hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-[var(--rosso-ferrari)] transition-all px-12 py-5 rounded-2xl shadow-xl overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            {loading ? <Loader2 className="animate-spin text-white" size={24} /> : <Wand2 className="text-white" size={24} />}
            <span className="font-bold tracking-wide text-lg text-white">{loading ? 'جاري تحليل الفكرة...' : 'ابدأ التوليد'}</span>
          </button>

          {savedIdeas.length > 0 && (
             <button 
               onClick={() => setStep(2)}
               className="text-gray-400 hover:text-white transition-colors mt-2 text-sm border-b border-transparent hover:border-white/20 pb-1"
             >
               عرض الأفكار المحفوظة ({savedIdeas.length})
             </button>
          )}
        </div>

      </div>
    </motion.div>
  );
}

