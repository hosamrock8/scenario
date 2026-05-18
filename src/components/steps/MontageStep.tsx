import { motion } from 'motion/react';
import { Layers, Play, Settings } from 'lucide-react';

export function MontageStep() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 flex flex-col h-full"
    >
      <div className="flex items-center justify-between bg-black/20 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
        <div>
          <h2 className="text-3xl font-bold mb-2">المونتاج والدمج (Montage)</h2>
          <p className="text-gray-400">تجميع الفيديوهات المُولدة، إضافة التعليق الصوتي والمؤثرات، وتطبيق الانتقالات والنصوص (الترجمة).</p>
        </div>
        <button className="px-4 py-2 bg-[var(--rosso-ferrari)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg shadow-[var(--rosso-ferrari)]/20">
          <Play size={16} /> تصدير الفيديو النهائي
        </button>
      </div>

      <div className="flex-1 min-h-[400px] border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center p-8 text-center bg-black/10">
        <Layers size={48} className="text-gray-500 mb-4" />
        <h3 className="text-xl font-bold text-gray-300 mb-2">محرر الفيديو قيد التطوير</h3>
        <p className="text-gray-500 max-w-md">
          هنا سيتم عرض واجهة المونتاج (Timeline) لترتيب المشاهد، مزامنة الصوت مع الصورة، وإضافة الفلاتر والترجمة بشكل احترافي ومماثل لبرامج المونتاج.
        </p>
      </div>
    </motion.div>
  );
}
