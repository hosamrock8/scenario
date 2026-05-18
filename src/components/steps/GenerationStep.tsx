import { motion } from 'motion/react';
import { useAppContext } from '../../store/AppContext';
import { PlaySquare, Download, AlertTriangle } from 'lucide-react';

export function GenerationStep() {
  const { scenario } = useAppContext();

  if (!scenario || scenario.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertTriangle className="text-yellow-500" size={48} />
        <h3 className="text-xl font-bold text-white">لا يوجد سيناريو مُولد بعد</h3>
        <p className="text-gray-400">يرجى توليد السيناريو أولاً قبل الانتقال إلى مرحلة الإنتاج.</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between bg-black/20 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
        <div>
          <h2 className="text-3xl font-bold mb-2">مرحلة الإنتاج (Generation)</h2>
          <p className="text-gray-400">هنا سيتم ربط المطالبات مع خدمات الذكاء الاصطناعي (مثل Replicate, ElevenLabs) لتوليد الصور، الفيديوهات، والتعليق الصوتي.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {scenario.map((scene, index) => (
          <div key={index} className="bg-[#1E1E1E] p-6 rounded-xl border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-1.5 h-full bg-[var(--rosso-ferrari)] opacity-50"></div>
            
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3 space-y-4">
                <h3 className="font-bold text-lg">المشهد {index + 1}: {scene.title}</h3>
                <div className="bg-black/30 p-3 rounded-lg text-sm text-gray-300">
                  <p className="mb-2"><span className="text-emerald-400 font-bold">الصوت: </span> {scene.arabicScript}</p>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold border border-white/10 transition-colors flex items-center justify-center gap-2">
                    <PlaySquare size={14}/> توليد الصوت
                  </button>
                </div>
              </div>

              <div className="md:w-1/3 space-y-4 border-r border-white/5 pr-6">
                <div className="bg-black/30 p-3 rounded-lg text-xs text-gray-400 font-mono" dir="ltr">
                  {scene.imagePrompt}
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold border border-white/10 transition-colors flex items-center justify-center gap-2">
                    <PlaySquare size={14}/> توليد الصورة
                  </button>
                </div>
              </div>

              <div className="md:w-1/3 space-y-4 border-r border-white/5 pr-6">
                <div className="bg-black/30 p-3 rounded-lg text-xs text-gray-400 font-mono" dir="ltr">
                  {scene.videoPrompt}
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 px-3 bg-[#4F46E5]/20 hover:bg-[#4F46E5]/30 text-[#4F46E5] rounded-lg text-xs font-semibold border border-[#4F46E5]/30 transition-colors flex items-center justify-center gap-2">
                    <PlaySquare size={14}/> تحويل لصورة متحركة
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
