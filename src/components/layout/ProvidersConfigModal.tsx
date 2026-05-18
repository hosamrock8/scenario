import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Key, Plus, Trash2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useAppContext } from '../../store/AppContext';
import { CustomModelConfig } from '../../types';

export function ProvidersConfigModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { advancedSettings, setAdvancedSettings } = useAppContext();
  const models = advancedSettings.customModels || [];

  const [newModel, setNewModel] = useState<Partial<CustomModelConfig>>({
    provider: '',
    modelId: '',
    apiKey: '',
    capabilities: {
      photo: false,
      video: false,
      audio: false
    }
  });

  const handleSave = () => {
    if (!newModel.provider || !newModel.modelId) return;

    const newEntry: CustomModelConfig = {
      id: `model_${Date.now()}`,
      provider: newModel.provider,
      modelId: newModel.modelId,
      apiKey: newModel.apiKey || '',
      capabilities: newModel.capabilities || { photo: false, video: false, audio: false }
    };

    setAdvancedSettings({
      ...advancedSettings,
      customModels: [...models, newEntry]
    });

    setNewModel({
      provider: '',
      modelId: '',
      apiKey: '',
      capabilities: { photo: false, video: false, audio: false }
    });
  };

  const handleDelete = (id: string) => {
    setAdvancedSettings({
      ...advancedSettings,
      customModels: models.filter(m => m.id !== id)
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#111] border border-white/10 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar relative"
          dir="rtl"
        >
          <button 
            onClick={onClose}
            className="absolute top-6 left-6 text-gray-500 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          
          <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
            <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 shadow-inner">
              <Key size={20} className="text-white opacity-90" />
            </div>
            <div>
              <h3 className="text-xl font-medium tracking-wide text-white">إعدادات النماذج والمفاتيح المخصصة</h3>
              <p className="text-sm text-gray-500">أضف مفاتيح الربط واختصاصات النماذج</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
              <h4 className="text-white font-medium mb-2">إضافة نموذج جديد</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-gray-400">اسم المزود (Provider)</label>
                  <input 
                    type="text" 
                    value={newModel.provider}
                    onChange={(e) => setNewModel({ ...newModel, provider: e.target.value })}
                    placeholder="مثال: OpenAI, Runway, Luma" 
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[var(--rosso-ferrari)]"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-gray-400">اسم / معرّف النموذج (Model ID)</label>
                  <input 
                    type="text" 
                    value={newModel.modelId}
                    onChange={(e) => setNewModel({ ...newModel, modelId: e.target.value })}
                    placeholder="مثال: gpt-4, gen-3-alpha" 
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[var(--rosso-ferrari)]"
                  />
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-xs text-gray-400">مفتاح الـ API</label>
                  <input 
                    type="password" 
                    value={newModel.apiKey}
                    onChange={(e) => setNewModel({ ...newModel, apiKey: e.target.value })}
                    placeholder="sk-..." 
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[var(--rosso-ferrari)]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-4">
                <label className="text-xs text-gray-400">اختصاص النموذج (يمكن اختيار أكثر من واحد)</label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${newModel.capabilities?.photo ? 'bg-[var(--rosso-ferrari)] border-[var(--rosso-ferrari)]' : 'border-gray-500 group-hover:border-gray-400'}`}>
                      {newModel.capabilities?.photo && <CheckCircle2 size={14} className="text-white" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={newModel.capabilities?.photo} onChange={(e) => setNewModel({ ...newModel, capabilities: { ...newModel.capabilities!, photo: e.target.checked } })} />
                    <span className="text-sm text-gray-300">توليد الصور</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${newModel.capabilities?.video ? 'bg-[var(--rosso-ferrari)] border-[var(--rosso-ferrari)]' : 'border-gray-500 group-hover:border-gray-400'}`}>
                      {newModel.capabilities?.video && <CheckCircle2 size={14} className="text-white" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={newModel.capabilities?.video} onChange={(e) => setNewModel({ ...newModel, capabilities: { ...newModel.capabilities!, video: e.target.checked } })} />
                    <span className="text-sm text-gray-300">توليد الفيديوهات</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${newModel.capabilities?.audio ? 'bg-[var(--rosso-ferrari)] border-[var(--rosso-ferrari)]' : 'border-gray-500 group-hover:border-gray-400'}`}>
                      {newModel.capabilities?.audio && <CheckCircle2 size={14} className="text-white" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={newModel.capabilities?.audio} onChange={(e) => setNewModel({ ...newModel, capabilities: { ...newModel.capabilities!, audio: e.target.checked } })} />
                    <span className="text-sm text-gray-300">توليد الصوت/الموسيقى</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  onClick={handleSave}
                  disabled={!newModel.provider || !newModel.modelId}
                  className="px-6 py-3 bg-[var(--rosso-ferrari)] hover:bg-red-600 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Plus size={18} />
                  إضافة النموذج
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-white font-medium mb-3">النماذج المضافة ({models.length})</h4>
              {models.length === 0 ? (
                <div className="text-center py-8 text-gray-500 flex flex-col items-center gap-2 border border-dashed border-white/10 rounded-2xl">
                  <ShieldAlert size={32} className="opacity-50" />
                  <p className="text-sm">لم يتم إضافة أي نماذج بعد.</p>
                </div>
              ) : (
                models.map(model => (
                  <div key={model.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-bold">{model.provider}</span>
                        <span className="text-gray-500 text-xs px-2 py-0.5 bg-black/40 rounded-md">{model.modelId}</span>
                      </div>
                      <div className="flex gap-2">
                        {model.capabilities.photo && <span className="text-[10px] text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">الصور</span>}
                        {model.capabilities.video && <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">الفيديو</span>}
                        {model.capabilities.audio && <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">الصوت</span>}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDelete(model.id)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors self-end sm:self-auto"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
