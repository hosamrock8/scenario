import { useAppContext } from '../../store/AppContext';
import { generateScenario, enhanceNegativePrompt, suggestTransition, improveArabicScript, enhanceVisualPrompts, bulkEnhanceScenario } from '../../services/ai';
import { cn } from '../../lib/utils';
import { Loader2, ArrowLeft, ArrowRight, Copy, RefreshCcw, Download, CheckCircle2, Play, Square, ChevronDown, ChevronUp, Sparkles, Wand2, GripVertical } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Scene } from '../../types';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { PromptEditor } from '../PromptEditor';

export function ScenarioStep() {
  const { 
    selectedIdea, character, styles, settings, 
    contentSettings, audioSettings, advancedSettings,
    scenario, setScenario, 
    isGenerating, setIsGenerating,
    setStep,
    exportSettings
  } = useAppContext();

  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState('');
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [showPromptsMap, setShowPromptsMap] = useState<Record<number, boolean>>({});
  const [generatingPreviewMap, setGeneratingPreviewMap] = useState<Record<number, boolean>>({});
  const [previewMediaMap, setPreviewMediaMap] = useState<Record<number, string | null>>({});
  const [enhancingNegativePromptMap, setEnhancingNegativePromptMap] = useState<Record<number, boolean>>({});
  const [improvingScriptMap, setImprovingScriptMap] = useState<Record<number, boolean>>({});
  const [suggestingTransitionMap, setSuggestingTransitionMap] = useState<Record<number, boolean>>({});
  const [transitionOptionsMap, setTransitionOptionsMap] = useState<Record<number, string[]>>({});
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);
  const [isEnhancingAll, setIsEnhancingAll] = useState(false);

  useEffect(() => {
    setScrollElement(document.getElementById('step-scroll-container'));
  }, []);

  const enhanceAllScenes = async () => {
    if (isEnhancingAll || scenario.length === 0) return;
    setIsEnhancingAll(true);
    try {
      const artStyleStr = styles.artStyle?.prompt || '';
      const shotStyleStr = styles.shotStyle?.prompt || '';
      const charDescStr = character?.useFixedCharacter ? character.description : '';
      const enhancedScenario = await bulkEnhanceScenario(
        scenario, 
        charDescStr, 
        artStyleStr, 
        shotStyleStr, 
        advancedSettings.videoPromptTemplate, 
        advancedSettings.imagePromptTemplate,
        advancedSettings.animationPromptTemplate,
        advancedSettings.sfxPromptTemplate,
        advancedSettings.voiceoverPromptTemplate
      );
      if (enhancedScenario && enhancedScenario.length > 0) {
        // Only keep ID and base properties identical, just update enhanced fields
        const merged = scenario.map((scene, i) => {
          const improved = enhancedScenario[i] || enhancedScenario[enhancedScenario.length - 1];
          return {
            ...scene,
            arabicScript: improved.arabicScript || scene.arabicScript,
            imagePrompt: improved.imagePrompt || scene.imagePrompt,
            videoPrompt: improved.videoPrompt || scene.videoPrompt,
            animationPrompt: improved.animationPrompt || scene.animationPrompt,
            sfxPrompt: improved.sfxPrompt || scene.sfxPrompt,
            voiceoverPrompt: improved.voiceoverPrompt || scene.voiceoverPrompt,
            negativePrompt: improved.negativePrompt || scene.negativePrompt,
            transition: improved.transition || scene.transition
          };
        });
        setScenario(merged);
      }
    } catch (err) {
      console.error("Enhance all failed", err);
    } finally {
      setIsEnhancingAll(false);
    }
  };

  const improveArabicScriptForScene = async (index: number) => {
    const scene = scenario[index];
    if (!scene) return;
    
    setImprovingScriptMap(prev => ({ ...prev, [index]: true }));
    try {
      const newScript = await improveArabicScript(scene.arabicScript, scene.title || '', scene.duration, scene.tone);
      if (newScript) {
        setScenario(prev => {
          const updated = [...prev];
          updated[index] = { ...updated[index], arabicScript: newScript };
          return updated;
        });
      }
    } catch (err) {
      console.error("Error improving script:", err);
    } finally {
      setImprovingScriptMap(prev => ({ ...prev, [index]: false }));
    }
  };

  const applyDefaultVideoPromptTemplate = (index: number) => {
    const scene = scenario[index];
    if (!scene) return;
    const template = advancedSettings.videoPromptTemplate || '';
    if (!template) return;
    
    // Replace variables in the template
    let newPrompt = template
      .replace('{image_prompt}', scene.imagePrompt || '')
      .replace('{arabic_script}', scene.arabicScript || '')
      .replace('{sfx}', scene.sfxPrompt || '')
      .replace('{character}', character?.description || '');
      
    setScenario(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], videoPrompt: newPrompt };
      return updated;
    });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDropTargetIndex(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dropTargetIndex === index) {
      setDropTargetIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDropTargetIndex(null);
    const dragIndexStr = e.dataTransfer.getData('text/plain');
    if (!dragIndexStr) return;
    const dragIndex = parseInt(dragIndexStr, 10);
    if (dragIndex === dropIndex || isNaN(dragIndex)) {
      setDraggedIndex(null);
      return;
    }

    setScenario(prev => {
      const newScenario = [...prev];
      const [draggedItem] = newScenario.splice(dragIndex, 1);
      newScenario.splice(dropIndex, 0, draggedItem);
      return newScenario;
    });
    setDraggedIndex(null);
  };

  const virtualizer = useVirtualizer({
    count: scenario.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => 500,
    overscan: 2,
  });

  const playAudioPreview = async (text: string, index: number) => {
    if (playingIndex === index) {
      window.speechSynthesis.cancel();
      // Also stop HTMLAudioElement if supported
      (window as any).elevenAudio?.pause();
      (window as any).bgAudioPreview?.pause();
      setPlayingIndex(null);
      return;
    }

    if (playingIndex !== null) {
      window.speechSynthesis.cancel();
      (window as any).elevenAudio?.pause();
      (window as any).bgAudioPreview?.pause();
    }
    
    setPlayingIndex(index);

    const playBgm = () => {
      if (audioSettings.bgAudio) {
        const bgmUrl = audioSettings.bgMusicType === 'upload' && audioSettings.bgMusicUrl ? audioSettings.bgMusicUrl : "https://actions.google.com/sounds/v1/water/rain_on_roof.ogg";
        const bgAudio = new Audio(bgmUrl);
        bgAudio.volume = audioSettings.bgMusicVolume !== undefined ? audioSettings.bgMusicVolume : 0.2;
        bgAudio.loop = true;
        (window as any).bgAudioPreview = bgAudio;
        bgAudio.play().catch(e => console.log('BGM play blocked/failed', e));
      }
    };
    
    const stopBgm = () => {
      (window as any).bgAudioPreview?.pause();
    };

    if (audioSettings.ttsEngine === 'ElevenLabs' && advancedSettings.elevenLabsApiKey) {
      try {
        const voiceIdMap: Record<string, string> = {
          'Rachel': '21m00Tcm4TlvDq8ikWAM',
          'Drew': '29vD33N1CtxCmqQRPOAB',
          'Clyde': '2EiwWnXFnvU5JabPnv8n',
          'Mimi': 'zrHiDhphv9ZnVBTi48pMz',
          'Adam': 'pNInz6obpgDQGcFmaJgB',
          'Antoni': 'ErXwobaYiN019PkySvjV',
          'Bella': 'EXAVITQu4vr4xnSDxMaL'
        };
        const voiceId = voiceIdMap[audioSettings.voice || 'Rachel'] || '21m00Tcm4TlvDq8ikWAM';
        
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'xi-api-key': advancedSettings.elevenLabsApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: text,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5
            }
          })
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.volume = audioSettings.voiceVolume !== undefined ? audioSettings.voiceVolume : 1;
          (window as any).elevenAudio = audio;
          playBgm();
          audio.onended = () => {
            setPlayingIndex(null);
            stopBgm();
            URL.revokeObjectURL(url);
          };
          audio.play();
          return;
        } else {
          console.error("ElevenLabs API error", await response.text());
          // Fallback to browser TTS
        }
      } catch (err) {
        console.error("ElevenLabs fetch error", err);
        // Fallback to browser TTS
      }
    } else if (audioSettings.ttsEngine === 'OpenAI TTS' && advancedSettings.openaiApiKey) {
      try {
        let voiceId = 'alloy';
        if (audioSettings.gender === 'أنثى') {
          voiceId = 'nova';
        } else {
          voiceId = 'onyx';
        }
        
        const response = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${advancedSettings.openaiApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: "tts-1",
            input: text,
            voice: voiceId,
            speed: audioSettings.speed || 1
          })
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.volume = audioSettings.voiceVolume !== undefined ? audioSettings.voiceVolume : 1;
          (window as any).elevenAudio = audio;
          playBgm();
          audio.onended = () => {
             setPlayingIndex(null);
             stopBgm();
             URL.revokeObjectURL(url);
          };
          audio.play();
          return;
        } else {
          console.error("OpenAI TTS error", await response.text());
        }
      } catch (err) {
        console.error("OpenAI TTS fetch error", err);
      }
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = audioSettings.speed || 1;
    const langMap = {
      'ar-SA': 'ar-SA',
      'ar-EG': 'ar-EG',
      'ar-AE': 'ar-AE',
      'en-US': 'en-US'
    };
    utterance.lang = langMap[audioSettings.locale as keyof typeof langMap] || (audioSettings.locale === 'en-US' ? 'en-US' : 'ar-SA');
    utterance.pitch = audioSettings.pitch || 1;
    utterance.volume = audioSettings.voiceVolume !== undefined ? audioSettings.voiceVolume : 1;
    
    playBgm();
    utterance.onend = () => {
      setPlayingIndex(null);
      stopBgm();
    };
    
    window.speechSynthesis.speak(utterance);
  };

  const runGeneration = async () => {
    if (!selectedIdea) return;
    setError('');
    setIsGenerating(true);
    try {
      const result = await generateScenario(selectedIdea, character, styles, settings, contentSettings, audioSettings);
      
      // Apply requested modifications to Scene 1 (index 0)
      if (result.length > 0) {
        result[0].duration = 8;
        result[0].tone = 'تحفيزي';
        
        // Enhance visual prompts for the current scene (index 0) as requested
        if (character?.description) {
          const enhancedVisuals = await enhanceVisualPrompts(
            result[0].imagePrompt || '', 
            result[0].videoPrompt || '', 
            result[0].animationPrompt || '',
            character.description,
            styles.artStyle?.prompt || '',
            styles.shotStyle?.prompt || '',
            advancedSettings.videoPromptTemplate,
            advancedSettings.imagePromptTemplate,
            advancedSettings.animationPromptTemplate
          );
          if (enhancedVisuals && enhancedVisuals.imagePrompt && enhancedVisuals.videoPrompt) {
            result[0].imagePrompt = enhancedVisuals.imagePrompt;
            result[0].videoPrompt = enhancedVisuals.videoPrompt;
            if (enhancedVisuals.animationPrompt) {
              result[0].animationPrompt = enhancedVisuals.animationPrompt;
            }
          }
        }
      }

      setScenario(result);
      setIsGenerating(false);

      // Automatically enhance all scenes in the background
      if (result.length > 0) {
        result.forEach(async (scene, index) => {
          try {
            // 1. Enhance negative prompt
            setEnhancingNegativePromptMap(prev => ({ ...prev, [index]: true }));
            enhanceNegativePrompt(scene.imagePrompt || '', scene.videoPrompt || '', scene.negativePrompt || '', character?.description)
              .then(enhancedNeg => {
                if (enhancedNeg) {
                  setScenario(prev => {
                    const updated = [...prev];
                    updated[index] = { ...updated[index], negativePrompt: enhancedNeg };
                    return updated;
                  });
                }
              })
              .catch(e => console.error("Error auto-enhancing negative prompt:", e))
              .finally(() => setEnhancingNegativePromptMap(prev => ({ ...prev, [index]: false })));

            // 2. Enhance image & video prompts
            if (character?.description && character.useFixedCharacter) {
              setEnhancingNegativePromptMap(prev => ({ ...prev, [index]: true })); // REUSING SAME UI STATE FOR LOADING
              enhanceVisualPrompts(
                scene.imagePrompt || '', 
                scene.videoPrompt || '', 
                scene.animationPrompt || '',
                character.description,
                styles.artStyle?.prompt || '',
                styles.shotStyle?.prompt || '',
                advancedSettings.videoPromptTemplate,
                advancedSettings.imagePromptTemplate,
                advancedSettings.animationPromptTemplate
              )
                .then(enhancedVisuals => {
                  if (enhancedVisuals && enhancedVisuals.imagePrompt && enhancedVisuals.videoPrompt) {
                    setScenario(prev => {
                      const updated = [...prev];
                      updated[index] = { 
                        ...updated[index], 
                        imagePrompt: enhancedVisuals.imagePrompt, 
                        videoPrompt: enhancedVisuals.videoPrompt,
                        animationPrompt: enhancedVisuals.animationPrompt || updated[index].animationPrompt
                      };
                      return updated;
                    });
                  }
                })
                .catch(e => console.error("Error auto-enhancing visuals:", e))
                .finally(() => setEnhancingNegativePromptMap(prev => ({ ...prev, [index]: false })));
            }

            // 3. Improve Arabic script
            setImprovingScriptMap(prev => ({ ...prev, [index]: true }));
            improveArabicScript(scene.arabicScript || '', scene.title || '', scene.duration || 5, scene.tone)
              .then(improvedScript => {
                if (improvedScript) {
                  setScenario(prev => {
                    const updated = [...prev];
                    updated[index] = { ...updated[index], arabicScript: improvedScript };
                    return updated;
                  });
                }
              })
              .catch(e => console.error("Error auto-improving script:", e))
              .finally(() => setImprovingScriptMap(prev => ({ ...prev, [index]: false })));

            // 4. Suggest and apply transition for each pair
            if (index < result.length - 1) {
              const nextScene = result[index + 1];
              setSuggestingTransitionMap(prev => ({ ...prev, [index]: true }));
              suggestTransition(scene, nextScene, styles.artStyle?.prompt, styles.shotStyle?.prompt)
                .then(transitions => {
                  if (transitions && transitions.length > 0) {
                    setTransitionOptionsMap(prev => ({ ...prev, [index]: transitions }));
                    setScenario(prev => {
                      const updated = [...prev];
                      updated[index] = { ...updated[index], transition: transitions[0] };
                      return updated;
                    });
                  }
                })
                .catch(e => console.error("Error auto-suggesting transition:", e))
                .finally(() => setSuggestingTransitionMap(prev => ({ ...prev, [index]: false })));
            }
          } catch (err) {
            console.error(`Error initiating enhancements for scene ${index}:`, err);
          }
        });
      }

    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء استخراج السيناريو. تأكد من صحة API Key.');
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (scenario.length === 0 && selectedIdea) {
      runGeneration();
    }
    
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2000);
  };

  const handleToneChange = (index: number, newTone: string) => {
    setScenario(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], tone: newTone };
      return updated;
    });
  };

  const handleDurationChange = (index: number, newDuration: number) => {
    if (isNaN(newDuration) || newDuration < 0.5) return;
    
    setScenario(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], duration: newDuration };
      return updated;
    });
  };

  const handleEnhanceVisualPrompts = async (index: number) => {
    const scene = scenario[index];
    if (!scene || !scene.imagePrompt || !scene.videoPrompt || !character?.description) return;
    
    setEnhancingNegativePromptMap(prev => ({ ...prev, [index]: true })); // reuse loading state
    try {
      const artStyleStr = styles.artStyle?.prompt || '';
      const shotStyleStr = styles.shotStyle?.prompt || '';
      const enhancedVisuals = await enhanceVisualPrompts(
        scene.imagePrompt, 
        scene.videoPrompt, 
        scene.animationPrompt || '',
        character.description,
        artStyleStr,
        shotStyleStr,
        advancedSettings.videoPromptTemplate,
        advancedSettings.imagePromptTemplate,
        advancedSettings.animationPromptTemplate
      );
      if (enhancedVisuals && enhancedVisuals.imagePrompt && enhancedVisuals.videoPrompt) {
        setScenario(prev => {
          const updated = [...prev];
          updated[index] = { 
            ...updated[index], 
            imagePrompt: enhancedVisuals.imagePrompt, 
            videoPrompt: enhancedVisuals.videoPrompt,
            animationPrompt: enhancedVisuals.animationPrompt || updated[index].animationPrompt
          };
          return updated;
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEnhancingNegativePromptMap(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleEnhanceNegativePrompt = async (index: number) => {
    const scene = scenario[index];
    if (!scene || !scene.imagePrompt || !scene.videoPrompt) return;
    
    setEnhancingNegativePromptMap(prev => ({ ...prev, [index]: true }));
    
    try {
      const newNegPrompt = await enhanceNegativePrompt(scene.imagePrompt, scene.videoPrompt, scene.negativePrompt || '', character?.description);
      if (newNegPrompt) {
        setScenario(prev => {
          const updated = [...prev];
          updated[index] = { ...updated[index], negativePrompt: newNegPrompt };
          return updated;
        });
      }
    } catch (err) {
      console.error("Error enhancing negative prompt:", err);
      // Optional: Add a toast component call if you have one, or simple console log is enough usually.
    } finally {
      setEnhancingNegativePromptMap(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleSuggestTransition = async (index: number) => {
    const scene = scenario[index];
    const nextScene = scenario[index + 1];
    
    setSuggestingTransitionMap(prev => ({ ...prev, [index]: true }));
    
    try {
      const suggestedTransitions = await suggestTransition(scene, nextScene, styles.artStyle?.prompt, styles.shotStyle?.prompt);
      if (suggestedTransitions && suggestedTransitions.length > 0) {
        setTransitionOptionsMap(prev => ({ ...prev, [index]: suggestedTransitions }));
        setScenario(prev => {
          const updated = [...prev];
          updated[index] = { ...updated[index], transition: suggestedTransitions[0] };
          return updated;
        });
      }
    } catch (err) {
      console.error("Error suggesting transition:", err);
    } finally {
      setSuggestingTransitionMap(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleGeneratePreview = async (index: number) => {
    setGeneratingPreviewMap(prev => ({ ...prev, [index]: true }));
    const scene = scenario[index];
    const basePrompt = scene.imagePrompt || scene.arabicScript || 'cinematic shot';
    // Incorporate styles for a better image
    const enhancedPrompt = `${basePrompt}, ${character?.description || ''}, ${styles.artStyle?.prompt || ''}, ${styles.shotStyle?.prompt || ''}`;
    const cleanPrompt = enhancedPrompt.replace(/[^a-zA-Z0-9 ,.\-]/g, '').substring(0, 800); // Pollinations prefers ascii
    
    // Use pollinations.ai for free image generation based on prompt without API keys
    const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=800&height=450&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;
    
    // Simulate loading for UI smoothness 
    await new Promise(r => setTimeout(r, 1500));
    setPreviewMediaMap(prev => ({ ...prev, [index]: imgUrl }));
    setGeneratingPreviewMap(prev => ({ ...prev, [index]: false }));
  };

  const handleAddScene = (index: number) => {
    setScenario(prev => {
      const newScenario = [...prev];
      const newScene: Scene = {
        id: Math.random().toString(36).substr(2, 9),
        title: 'مشهد جديد',
        duration: 5,
        arabicScript: '',
        audioType: 'voiceover',
        imagePrompt: '',
        videoPrompt: '',
        tone: contentSettings.tone || 'محايد'
      };
      newScenario.splice(index + 1, 0, newScene);
      return newScenario;
    });
  };

  const handleDeleteScene = (index: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المشهد؟')) return;
    setScenario(prev => {
      const newScenario = [...prev];
      newScenario.splice(index, 1);
      return newScenario;
    });
  };

  const suggestAllTransitions = async () => {
    if (scenario.length < 2) return;
    
    // Set all to true
    const newSuggestingMap: Record<number, boolean> = {};
    for (let i = 0; i < scenario.length; i++) {
        if (i < scenario.length - 1 || scenario[i].transition === undefined) {
             newSuggestingMap[i] = true;
        }
    }
    setSuggestingTransitionMap(prev => ({...prev, ...newSuggestingMap}));

    try {
        const promises = scenario.map(async (scene, index) => {
            if (index < scenario.length - 1 || scene.transition === undefined) {
                const nextScene = scenario[index + 1];
                const suggestedTransitions = await suggestTransition(scene, nextScene, styles.artStyle?.prompt, styles.shotStyle?.prompt);
                if (suggestedTransitions && suggestedTransitions.length > 0) {
                    setTransitionOptionsMap(prev => ({ ...prev, [index]: suggestedTransitions }));
                    return { index, transition: suggestedTransitions[0] };
                }
            }
            return null;
        });

        const results = await Promise.allSettled(promises);
        
        setScenario(prev => {
            const updated = [...prev];
            results.forEach((result) => {
                if (result.status === 'fulfilled' && result.value) {
                    updated[result.value.index] = { 
                        ...updated[result.value.index], 
                        transition: result.value.transition 
                    };
                }
            });
            return updated;
        });
    } catch (err) {
        console.error("Error suggesting all transitions:", err);
    } finally {
        setSuggestingTransitionMap({}); // Clear all loading states
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(scenario, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `scenario_${Date.now()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          setScenario(json);
        } else {
          setError("ملف JSON غير صالح: يجب أن يكون مصفوفة مشاهد.");
        }
      } catch (err) {
        setError("خطأ في قراءة ملف JSON.");
      }
    };
    reader.readAsText(file);
    // Reset the input value so the same file can be selected again
    e.target.value = '';
  };

  const handleExportTXT = () => {
    let text = `السيناريو: ${selectedIdea?.title}\n\n`;
    scenario.forEach((s, i) => {
      text += `[مشهد ${i + 1} - ${s.title}] (${s.duration} ثوانٍ)\n`;
      text += `النص: ${s.arabicScript}\n`;
      text += `الصوت: ${s.audioType}\n`;
      text += `مطالبة الصورة:\n${s.imagePrompt}\n`;
      text += `مطالبة الفيديو:\n${s.videoPrompt}\n`;
      if (s.animationPrompt) text += `مطالبة التحريك (Animation):\n${s.animationPrompt}\n`;
      if (s.sfxPrompt) text += `مطالبة الصوت:\n${s.sfxPrompt}\n`;
      if (s.negativePrompt) text += `المطالبة السلبية (Negative):\n${s.negativePrompt}\n`;
      if (s.transition) text += `الانتقال (Transition):\n${s.transition}\n`;
      text += `\n-----------------------------------\n\n`;
    });
    
    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(text);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `scenario_${Date.now()}.txt`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleExportCSV = () => {
    const csv = Papa.unparse(scenario.map((s, i) => ({
      "رقم المشهد": i + 1,
      "اسم المشهد": s.title,
      "المدة": s.duration,
      "نص التعليق الصوتي": s.arabicScript,
      "نوع الصوت": s.audioType,
      "مطالبة الصورة (Image Prompt)": s.imagePrompt,
      "مطالبة التحريك (Animation)": s.animationPrompt || "",
      "المطالبة السلبية (Negative Prompt)": s.negativePrompt || "",
      "مطالبة الفيديو (Video Prompt)": s.videoPrompt,
      "مطالبة الصوت (SFX Prompt)": s.sfxPrompt || "",
      "الانتقال (Transition)": s.transition || ""
    })));
    
    // Add BOM for UTF-8 encoding in Excel
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", url);
    downloadAnchorNode.setAttribute("download", `scenario_${Date.now()}.csv`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    document.body.removeChild(downloadAnchorNode);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: exportSettings.pdfTemplate === 'compact' ? 'portrait' : 'landscape',
    });
    
    doc.setFontSize(18);
    doc.text(`Scenario: ${selectedIdea?.title || 'Unknown'}`, 14, 22);
    doc.setFontSize(11);
    doc.text(`Template Style: ${exportSettings.pdfTemplate}`, 14, 30);
    
    if (exportSettings.pdfTemplate === 'compact') {
      const tableData = scenario.map((s, i) => [
        String(i + 1),
        s.duration + 's',
        s.imagePrompt,
        s.videoPrompt
      ]);
      (doc as any).autoTable({
        startY: 35,
        head: [['#', 'Dur', 'Image Prompt', 'Video Prompt']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 15 } }
      });
    } else {
      const tableData = scenario.map((s, i) => [
        String(i + 1),
        s.duration + 's',
        s.audioType,
        exportSettings.includeImagePrompts ? s.imagePrompt : 'Hidden',
        exportSettings.includeVideoPrompts ? s.videoPrompt : 'Hidden',
        s.tone || 'Neutral'
      ]);
      (doc as any).autoTable({
        startY: 35,
        head: [['#', 'Time', 'Audio', 'Image Prompt', 'Video Prompt', 'Tone']],
        body: tableData,
        theme: 'striped',
        styles: { fontSize: 8 },
        columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 15 }, 2: { cellWidth: 20 }, 5: { cellWidth: 20 } }
      });
    }

    doc.save(`scenario_${exportSettings.pdfTemplate}_${Date.now()}.pdf`);
  };

  if (!selectedIdea) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-gray-400">عليك اختيار فكرة أولاً لإنشاء السيناريو.</p>
        <button onClick={() => setStep(2)} className="text-ferrari hover:underline">العودة للأفكار</button>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-6">
        <Loader2 className="animate-spin text-ferrari" size={64} />
        <h2 className="text-2xl font-bold text-white">جاري كتابة السيناريو وبناء المطالبات...</h2>
        <p className="text-gray-400">يقوم الذكاء الاصطناعي بتطبيق الأنماط البصرية وإعدادات الشخصية في المطالبات الإنجليزية.</p>
      </div>
    );
  }

  // Calculate total scenario duration
  const totalScenarioDuration = scenario.reduce((acc, scene) => acc + (scene.duration || 0), 0);
  const durationDeviation = Math.abs(totalScenarioDuration - settings.durationTarget);
  const isDurationWarning = durationDeviation > 5; // e.g., > 5 seconds difference

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-12"
    >
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold mb-2">لوحة السيناريو</h2>
          <p className="text-gray-400">الفكرة: {selectedIdea.title}</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-sm text-gray-300 bg-white/5 px-2 py-1 rounded-md">
              المدة الإجمالية: <span className="font-mono">{totalScenarioDuration.toFixed(1)}</span> / {settings.durationTarget} ثواني
            </span>
            {isDurationWarning && (
              <span className="text-xs text-yellow-400 flex items-center gap-1.5 bg-yellow-400/10 px-2 py-1 rounded-md border border-yellow-400/20">
                ⚠️ المدة الإجمالية تختلف عن الهدف بشكل ملحوظ. قد تحتاج إلى ضبط المشاهد الأخرى أو إعادة التوليد.
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={runGeneration}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors border border-white/10"
          >
            <RefreshCcw size={16} /> إعادة توليد
          </button>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input 
                type="file" 
                accept=".json" 
                onChange={handleImportJSON} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="استيراد ملف JSON"
              />
              <button
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors text-white border border-white/10"
              >
                استيراد JSON
              </button>
            </div>
            <button
              onClick={handleExportJSON}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors text-white border border-white/10 font-mono"
            >
              تصدير JSON
            </button>
            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2 bg-ferrari hover:bg-ferrari-hover rounded-lg text-sm transition-colors text-white">
                <Download size={16} /> المزيد
              </button>
              <div className="absolute left-0 mt-2 w-32 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden text-sm">
                {exportSettings.formats?.json && <button onClick={handleExportJSON} className="w-full text-right px-4 py-3 hover:bg-white/5">JSON</button>}
                {exportSettings.formats?.txt && <button onClick={handleExportTXT} className="w-full text-right px-4 py-3 hover:bg-white/5 border-t border-white/5">TXT النص</button>}
                {exportSettings.formats?.csv && <button onClick={handleExportCSV} className="w-full text-right px-4 py-3 hover:bg-white/5 border-t border-white/5">CSV جدول</button>}
                {exportSettings.formats?.pdf && <button onClick={handleExportPDF} className="w-full text-right px-4 py-3 hover:bg-white/5 border-t border-white/5">PDF مستند</button>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 p-4 border border-[var(--rosso-ferrari)]/30 bg-[var(--rosso-ferrari)]/5 rounded-xl shadow-inner">
        <div className="flex items-start md:items-center gap-3">
          <Wand2 size={24} className="text-[var(--rosso-ferrari)] shrink-0 mt-1 md:mt-0" />
          <div>
            <h3 className="font-bold text-white mb-1">التحسين الشامل للسيناريو (Auto-Pilot)</h3>
            <p className="text-sm text-gray-400">ستقوم هذه الأداة بتحسين النصوص العربية، وحركات الكاميرا، ودمج وصف الشخصية والنمط الفني في المطالبات، وإنشاء انتقالات ومطالبات سلبية احترافية دفعة واحدة.</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
          <button
            onClick={enhanceAllScenes}
            disabled={isEnhancingAll || scenario.length === 0}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[var(--rosso-ferrari)] hover:bg-red-800 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-md w-full"
          >
            {isEnhancingAll ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} 
            {isEnhancingAll ? 'جاري التحسين الشامل...' : 'تطبيق التحسينات الآن'}
          </button>
          <button
            onClick={suggestAllTransitions}
            disabled={Object.values(suggestingTransitionMap).some(v => v) || isEnhancingAll || scenario.length < 2}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 disabled:opacity-50 text-blue-100 rounded-xl text-xs font-bold transition-all shadow-md w-full"
          >
            {Object.values(suggestingTransitionMap).some(v => v) && !isEnhancingAll ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />} 
            {Object.values(suggestingTransitionMap).some(v => v) && !isEnhancingAll ? 'جاري التوليد...' : 'اقتراح وتطبيق الانتقالات للكل'}
          </button>
        </div>
      </div>

      {error ? (
        <div className="p-4 bg-red-900/40 border border-red-500/50 rounded-xl text-red-200">
          {error}
        </div>
      ) : (
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const index = virtualItem.index;
            const scene = scenario[index];
            return (
              <div
                key={scene.id || index}
                ref={virtualizer.measureElement}
                data-index={index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                  paddingBottom: '24px', // Similar to space-y-6
                }}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragLeave={(e) => handleDragLeave(e, index)}
                onDrop={(e) => handleDrop(e, index)}
              >
                <div className={cn(
                  "glass-card p-6 rounded-2xl relative border-l-4 border-l-[var(--rosso-ferrari)] transition-all",
                  draggedIndex === index ? "opacity-50 scale-95" : "opacity-100",
                  dropTargetIndex === index ? "border-2 border-[var(--rosso-ferrari)] ring-4 ring-[var(--rosso-ferrari)]/20" : ""
                )}>
                  {dropTargetIndex === index && draggedIndex !== null && index < draggedIndex && (
                    <div className="absolute -top-3 left-0 right-0 h-1 bg-[var(--rosso-ferrari)] rounded-full z-10 shadow-[0_0_8px_var(--rosso-ferrari)]" />
                  )}
                  {dropTargetIndex === index && draggedIndex !== null && index > draggedIndex && (
                    <div className="absolute -bottom-3 left-0 right-0 h-1 bg-[var(--rosso-ferrari)] rounded-full z-10 shadow-[0_0_8px_var(--rosso-ferrari)]" />
                  )}
                  <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                <div className="flex items-center gap-4">
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    className="cursor-move p-1.5 hover:bg-white/10 rounded-md text-gray-500 hover:text-white transition-colors"
                    title="سحب لترتيب المشهد"
                  >
                    <GripVertical size={20} />
                  </div>
                  <h3 className="text-xl font-bold font-mono">
                    المشهد {index + 1} — {scene.title}
                  </h3>
                  <select
                    value={scene.tone || contentSettings.tone || ''}
                    onChange={(e) => handleToneChange(index, e.target.value)}
                    className="bg-white/5 border border-white/10 text-xs text-gray-300 px-2 py-1 rounded-lg focus:outline-none focus:border-white/30"
                  >
                    {['تعليمي', 'درامي', 'كوميدي', 'رسمي', 'رعب', 'تحفيزي', 'محايد'].map(tone => (
                      <option key={tone} value={tone}>{tone}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleGeneratePreview(index)}
                    disabled={generatingPreviewMap[index]}
                    className="flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-xs font-medium transition-colors"
                  >
                    {generatingPreviewMap[index] ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                    معاينة بصرية
                  </button>
                  <div className="flex items-center gap-2 bg-white/5 rounded-full px-3 py-1 border border-white/10">
                    <span className="text-xs text-gray-400">⏱</span>
                    <input
                      type="number"
                      min="1"
                      step="0.5"
                      value={scene.duration}
                      onChange={(e) => handleDurationChange(index, parseFloat(e.target.value))}
                      className="w-16 bg-transparent text-sm font-mono text-center text-white focus:outline-none"
                    />
                    <span className="text-xs text-gray-400">ثوانٍ</span>
                  </div>
                </div>
              </div>

              {previewMediaMap[index] && (
                <div className="mb-6 relative rounded-xl overflow-hidden border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)] bg-black/40 aspect-video flex items-center justify-center">
                  <img src={previewMediaMap[index] as string} alt={`Preview scene ${index + 1}`} className="w-full h-full object-cover opacity-80 mix-blend-screen" />
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                     <p className="text-xs text-white/80 font-mono shadow-sm truncate">{scene.imagePrompt}</p>
                  </div>
                  <button 
                    onClick={() => setPreviewMediaMap(prev => ({ ...prev, [index]: null }))}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black border border-white/10 rounded-full text-white/50 hover:text-white transition-colors"
                  >
                    <Square size={12} />
                  </button>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm text-ferrari font-semibold">📝 النص للتعليق الصوتي ({scene.audioType})</h4>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => improveArabicScriptForScene(index)}
                        disabled={improvingScriptMap[index]}
                        className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--rosso-ferrari)]/10 text-[var(--rosso-ferrari)] border border-[var(--rosso-ferrari)]/30 hover:bg-[var(--rosso-ferrari)]/20 transition-all font-medium disabled:opacity-50"
                        title="تحسين النص بالذكاء الاصطناعي"
                      >
                        {improvingScriptMap[index] ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12}/>}
                        تحسين النص
                      </button>
                      <button 
                        onClick={() => playAudioPreview(scene.arabicScript, index)}
                        className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all font-medium text-white"
                        title="معاينة التعليق الصوتي"
                      >
                        {playingIndex === index ? <Square fill="currentColor" size={12} className="text-red-400" /> : <Play fill="currentColor" size={12} className="text-green-400" />}
                        {playingIndex === index ? 'إيقاف' : 'تشغيل المشهد'}
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={scene.arabicScript || ''}
                    onChange={(e) => {
                      setScenario(prev => {
                        const updated = [...prev];
                        updated[index] = { ...updated[index], arabicScript: e.target.value };
                        return updated;
                      });
                    }}
                    className="w-full bg-black/40 p-4 rounded-xl text-lg font-medium leading-relaxed font-sans text-white border border-transparent focus:outline-none focus:border-[var(--rosso-ferrari)] transition-colors resize-none custom-scrollbar min-h-[100px]"
                    dir="rtl"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button 
                    onClick={() => setShowPromptsMap(prev => ({ ...prev, [index]: !prev[index] }))}
                    className="flex flex-row items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {showPromptsMap[index] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    <span className="font-medium">{showPromptsMap[index] ? 'إخفاء المطالبات وتفاصيل التوليد' : 'عرض المطالبات وتفاصيل التوليد'}</span>
                  </button>
                  {showPromptsMap[index] && (
                    <button
                      onClick={() => handleEnhanceVisualPrompts(index)}
                      disabled={enhancingNegativePromptMap[index]} // using same loading state
                      className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all font-medium disabled:opacity-50"
                      title="تحسين مطالبات الصورة والفيديو وتضمين تفاصيل الشخصية"
                    >
                      {enhancingNegativePromptMap[index] ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12}/>}
                      تحسين المطالبات البصرية
                    </button>
                  )}
                </div>

                {showPromptsMap[index] && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Image Prompt */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm text-gray-400 font-semibold">📸 مطالبة الصورة (Image Prompt)</h4>
                        <button 
                          onClick={() => handleCopy(scene.imagePrompt, `img_${index}`)}
                          className="text-xs flex items-center gap-1.5 px-2 py-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                          title="نسخ مطالبة الصورة"
                        >
                          {copiedId === `img_${index}` ? <CheckCircle2 size={14} className="text-green-500"/> : <Copy size={14}/>}
                          {copiedId === `img_${index}` ? <span className="text-green-500">تم النسخ</span> : <span>نسخ</span>}
                        </button>
                      </div>
                      <div className="flex flex-col gap-2 relative h-32 bg-black/60 rounded-xl overflow-hidden border border-transparent focus-within:border-[var(--rosso-ferrari)] transition-colors">
                        <div className="absolute inset-0 overflow-y-auto ltr custom-scrollbar" dir="ltr">
                          <PromptEditor
                            value={scene.imagePrompt || ''}
                            onChange={(val) => {
                              setScenario(prev => {
                                const updated = [...prev];
                                updated[index] = { ...updated[index], imagePrompt: val };
                                return updated;
                              });
                            }}
                            placeholder="e.g. Masterpiece, high detail, volumetric lighting, surreal atmosphere..."
                            className="text-sm font-mono text-gray-300 min-h-full w-full"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-500 text-right mt-1">نصيحة: أضف تفاصيل دقيقة حول الإضاءة، المزاج، والعناصر الفنية لتعزيز جودة الصورة.</p>
                    </div>

                    {/* Video Prompt */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm text-gray-400 font-semibold">🎬 مطالبة الفيديو (Video Prompt)</h4>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => applyDefaultVideoPromptTemplate(index)}
                            className="text-xs flex items-center gap-1.5 px-2 py-1 rounded-md text-emerald-400 hover:text-white hover:bg-emerald-500/20 transition-all border border-emerald-500/30"
                            title="تطبيق القالب الافتراضي"
                          >
                            <Wand2 size={12} /> استخدام القالب
                          </button>
                          <button 
                            onClick={() => handleCopy(scene.videoPrompt, `vid_${index}`)}
                            className="text-xs flex items-center gap-1.5 px-2 py-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                            title="نسخ مطالبة الفيديو"
                          >
                            {copiedId === `vid_${index}` ? <CheckCircle2 size={14} className="text-green-500"/> : <Copy size={14}/>}
                            {copiedId === `vid_${index}` ? <span className="text-green-500">تم النسخ</span> : <span>نسخ</span>}
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 relative h-32 bg-black/60 rounded-xl overflow-hidden border border-transparent focus-within:border-[var(--rosso-ferrari)] transition-colors">
                        <div className="absolute inset-0 overflow-y-auto ltr custom-scrollbar" dir="ltr">
                          <PromptEditor
                            value={scene.videoPrompt || ''}
                            onChange={(val) => {
                              setScenario(prev => {
                                const updated = [...prev];
                                updated[index] = { ...updated[index], videoPrompt: val };
                                return updated;
                              });
                            }}
                            placeholder="e.g. Cinematic lighting, dramatic shadows, wide angle lens, somber mood..."
                            className="text-sm font-mono text-gray-300 min-h-full w-full"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-500 text-right mt-1">نصيحة: أضف تفاصيل حول الإضاءة، والمزاج، وزوايا الكاميرا لتعزيز فهم الذكاء الاصطناعي للمشهد.</p>
                    </div>
                  </div>

                  {/* Animation Prompt */}
                  {scene.animationPrompt && (
                    <div className="w-full bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm text-emerald-400 font-semibold flex items-center gap-2">
                          <span>✨</span> مطالبة تحريك الصورة (Animation Prompt)
                        </h4>
                        <button 
                          onClick={() => handleCopy(scene.animationPrompt!, `anim_${index}`)}
                          className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                          title="نسخ مطالبة التحريك"
                        >
                          {copiedId === `anim_${index}` ? <CheckCircle2 size={14} className="text-emerald-500"/> : <Copy size={14}/>}
                          {copiedId === `anim_${index}` ? <span>تم النسخ</span> : <span>نسخ المطالبة</span>}
                        </button>
                      </div>
                      <div className="flex flex-col gap-2 relative min-h-[5rem] bg-black/60 rounded-xl overflow-hidden border border-transparent focus-within:border-emerald-500 transition-colors shadow-inner">
                        <div className="absolute inset-0 overflow-y-auto ltr custom-scrollbar" dir="ltr">
                          <PromptEditor
                            value={scene.animationPrompt || ''}
                            onChange={(val) => {
                              setScenario(prev => {
                                const updated = [...prev];
                                updated[index] = { ...updated[index], animationPrompt: val };
                                return updated;
                              });
                            }}
                            className="text-sm font-mono text-gray-300 min-h-full w-full"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SFX Prompt */}
                  {scene.sfxPrompt && (
                    <div className="w-full bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm text-[var(--rosso-ferrari)] font-semibold flex items-center gap-2">
                          <span>🔊</span> مطالبة المؤثرات الصوتية (SFX Prompt)
                        </h4>
                        <button 
                          onClick={() => handleCopy(scene.sfxPrompt!, `sfx_${index}`)}
                          className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--rosso-ferrari)]/10 text-[var(--rosso-ferrari)] hover:bg-[var(--rosso-ferrari)]/20 transition-all"
                          title="نسخ مطالبة الصوت"
                        >
                          {copiedId === `sfx_${index}` ? <CheckCircle2 size={14} className="text-[var(--rosso-ferrari)]"/> : <Copy size={14}/>}
                          {copiedId === `sfx_${index}` ? <span>تم النسخ</span> : <span>نسخ المطالبة</span>}
                        </button>
                      </div>
                      <div className="flex flex-col gap-2 relative min-h-[5rem] bg-black/60 rounded-xl overflow-hidden border border-transparent focus-within:border-[var(--rosso-ferrari)] transition-colors shadow-inner">
                        <div className="absolute inset-0 overflow-y-auto ltr custom-scrollbar" dir="ltr">
                          <PromptEditor
                            value={scene.sfxPrompt || ''}
                            onChange={(val) => {
                              setScenario(prev => {
                                const updated = [...prev];
                                updated[index] = { ...updated[index], sfxPrompt: val };
                                return updated;
                              });
                            }}
                            className="text-sm font-mono text-gray-300 min-h-full w-full"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Negative Prompt */}
                  <div className="w-full">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm text-gray-400 font-semibold flex items-center gap-2">
                        <span>🚫 المطالبة السلبية (Negative Prompt)</span>
                      </h4>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEnhanceNegativePrompt(index)}
                          disabled={enhancingNegativePromptMap[index]}
                          className="text-xs flex items-center gap-1.5 px-3 py-1 rounded-md bg-[var(--rosso-ferrari)]/10 text-[var(--rosso-ferrari)] border border-[var(--rosso-ferrari)]/30 hover:bg-[var(--rosso-ferrari)]/20 transition-all disabled:opacity-50"
                          title="تحسين بالذكاء الاصطناعي"
                        >
                          {enhancingNegativePromptMap[index] ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14}/>}
                          <span>{scene.negativePrompt ? 'تحسين' : 'توليد'}</span>
                        </button>
                        {scene.negativePrompt && (
                          <button 
                            onClick={() => handleCopy(scene.negativePrompt!, `neg_${index}`)}
                            className="text-xs flex items-center gap-1.5 px-2 py-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                            title="نسخ المطالبة السلبية"
                          >
                            {copiedId === `neg_${index}` ? <CheckCircle2 size={14} className="text-green-500"/> : <Copy size={14}/>}
                            {copiedId === `neg_${index}` ? <span className="text-green-500">تم النسخ</span> : <span>نسخ</span>}
                          </button>
                        )}
                      </div>
                    </div>
                    {scene.negativePrompt ? (
                      <div className="flex flex-col gap-2 relative h-24 bg-red-900/10 rounded-xl overflow-hidden border border-red-500/20 focus-within:border-red-500 transition-colors">
                        <div className="absolute inset-0 overflow-y-auto ltr custom-scrollbar" dir="ltr">
                          <PromptEditor
                            value={scene.negativePrompt || ''}
                            onChange={(val) => {
                              setScenario(prev => {
                                const updated = [...prev];
                                updated[index] = { ...updated[index], negativePrompt: val };
                                return updated;
                              });
                            }}
                            className="text-sm font-mono text-gray-300 min-h-full w-full"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-black/40 border border-dashed border-white/10 p-3 rounded-xl text-sm font-mono text-gray-500 h-24 flex items-center justify-center ltr" dir="ltr">
                        No negative prompt. Click generate to suggest one.
                      </div>
                    )}
                  </div>
                </div>
                )}

                {/* Scene Actions */}
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5">
                  <button
                    onClick={() => handleDeleteScene(index)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-sm font-medium"
                    title="حذف هذا المشهد"
                  >
                    حذف المشهد
                  </button>
                  <button
                    onClick={() => handleAddScene(index)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 transition-colors text-sm font-medium"
                    title="إضافة مشهد جديد بعد هذا المشهد"
                  >
                    <span className="font-bold text-lg leading-none">+</span>
                    إضافة مشهد هنا
                  </button>
                </div>
              </div>
            </div>
            
            {/* Transition Connector (Shown below card) */}
            <div className="relative mt-6 mb-2 flex flex-col items-center">
              {/* Connector Line */}
              <div className="w-px h-8 bg-gradient-to-b from-white/20 to-blue-500/50 absolute top-0 -mt-6"></div>
              
              <div className="w-full max-w-2xl bg-blue-900/10 border border-blue-500/20 rounded-xl p-3 z-10 shadow-lg backdrop-blur-sm relative">
                <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#1e1e1e] border-2 border-blue-500 z-10 hidden md:block"></div>
                <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#1e1e1e] border-2 border-blue-500 z-10 hidden md:block"></div>
                
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm text-blue-400 font-semibold flex items-center gap-2">
                    <span className="bg-blue-500/20 p-1 rounded-md">🎬</span> 
                    {index < scenario.length - 1 ? 'انتقال للمشهد التالي (Transition)' : 'انتقال الختام (Outro Transition)'}
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSuggestTransition(index)}
                      disabled={suggestingTransitionMap[index]}
                      className="text-[10px] flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all disabled:opacity-50"
                      title="اقتراح انتقال بالذكاء الاصطناعي"
                    >
                      {suggestingTransitionMap[index] ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12}/>}
                      <span>{scene.transition ? 'تحديث' : 'اقتراح'}</span>
                    </button>
                    {scene.transition && (
                      <button 
                        onClick={() => handleCopy(scene.transition!, `trans_${index}`)}
                        className="text-[10px] flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                        title="نسخ الانتقال"
                      >
                        {copiedId === `trans_${index}` ? <CheckCircle2 size={12} className="text-green-500"/> : <Copy size={12}/>}
                        {copiedId === `trans_${index}` ? <span className="text-green-500">تم النسخ</span> : <span className="sr-only">نسخ</span>}
                      </button>
                    )}
                  </div>
                </div>
                {scene.transition ? (
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={scene.transition}
                      onChange={(e) => {
                        setScenario(prev => {
                          const updated = [...prev];
                          updated[index] = { ...updated[index], transition: e.target.value };
                          return updated;
                        });
                      }}
                      className="bg-black/40 border border-blue-500/30 px-3 py-2 rounded-lg text-sm font-mono text-blue-200 w-full focus:outline-none focus:border-blue-400 ltr text-center transition-colors"
                      dir="ltr"
                      placeholder="e.g. smooth fade to black"
                    />
                    {transitionOptionsMap[index] && transitionOptionsMap[index].length > 1 && (
                      <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1" dir="ltr">
                        {transitionOptionsMap[index].map((opt, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setScenario(prev => {
                                const updated = [...prev];
                                updated[index] = { ...updated[index], transition: opt };
                                return updated;
                              });
                            }}
                            className={cn(
                              "text-[10px] px-2 py-1 rounded transition-colors border",
                              scene.transition === opt 
                                ? "bg-blue-500/30 border-blue-400 text-white"
                                : "bg-black/40 border-blue-500/20 text-blue-300 hover:bg-blue-500/20 hover:text-white"
                            )}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-black/20 border border-dashed border-blue-500/20 p-2 rounded-lg text-xs font-mono text-blue-400/50 flex items-center justify-center ltr cursor-pointer hover:bg-blue-500/10 hover:border-blue-500/40 transition-colors" dir="ltr" onClick={() => handleSuggestTransition(index)}>
                    {suggestingTransitionMap[index] ? 'Generating transition...' : 'Click to generate transition...'}
                  </div>
                )}
              </div>
            </div>
          </div>
          );
        })}
        </div>
      )}

      <div className="flex justify-between pt-6 border-t border-white/10 mt-12">
        <button 
          onClick={() => setStep(4)}
          className="text-gray-400 hover:text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all"
        >
          <ArrowRight size={20} />
          <span>رجوع للأنماط</span>
        </button>
      </div>
    </motion.div>
  );
}
