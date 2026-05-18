import { useAppContext } from '../../store/AppContext';
import { Grid, Lightbulb, User, Palette, Film, Settings, ImagePlay, Clapperboard } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Key } from 'lucide-react';
import { DashboardStep } from '../steps/DashboardStep';
import { IdeasStep } from '../steps/IdeasStep';
import { CharacterStep } from '../steps/CharacterStep';
import { StyleStep } from '../steps/StyleStep';
import { ScenarioStep } from '../steps/ScenarioStep';
import { SettingsStep } from '../steps/SettingsStep';
import { GenerationStep } from '../steps/GenerationStep';
import { MontageStep } from '../steps/MontageStep';
import { ProvidersConfigModal } from './ProvidersConfigModal';
import { useState } from 'react';

const STEPS = [
  { id: 1, name: 'الأساسيات', icon: Grid },
  { id: 2, name: 'الأفكار', icon: Lightbulb },
  { id: 3, name: 'الشخصية', icon: User },
  { id: 4, name: 'الأنماط البصرية', icon: Palette },
  { id: 5, name: 'السيناريو', icon: Film },
  { id: 6, name: 'الإنتاج', icon: ImagePlay },
  { id: 7, name: 'المونتاج', icon: Clapperboard },
  { id: 8, name: 'الإعدادات', icon: Settings },
];

export function MainLayout() {
  const { step, setStep, advancedSettings } = useAppContext();
  const [isProvidersModalOpen, setIsProvidersModalOpen] = useState(false);

  const renderStep = () => {
    switch (step) {
      case 1: return <DashboardStep />;
      case 2: return <IdeasStep />;
      case 3: return <CharacterStep />;
      case 4: return <StyleStep />;
      case 5: return <ScenarioStep />;
      case 6: return <GenerationStep />;
      case 7: return <MontageStep />;
      case 8: return <SettingsStep />;
      default: return <DashboardStep />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-full relative bg-[#1E1E1E] text-white selection:bg-white/20">
      
      {/* Topbar */}
      <header className="w-full border-b border-white/10 flex items-center justify-between z-20 px-6 lg:px-12 py-4 bg-[#1E1E1E]/50 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-8">
          <div className="flex items-baseline gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">{advancedSettings?.frontendLabels?.navTitle || 'SCENARIO'}</h1>
            <p className="small-caps text-[10px] text-[var(--rosso-ferrari)] font-bold">PRO</p>
          </div>

          <nav className="hidden md:flex items-center space-x-1 space-x-reverse overflow-x-auto pb-1 scrollbar-hide">
            {STEPS.map((s) => (
              <button
                key={s.id}
                onClick={() => setStep(s.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-300 group whitespace-nowrap",
                  step === s.id
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <s.icon 
                  size={14} 
                  className={cn(
                    "transition-all duration-300",
                    step === s.id ? "text-[var(--rosso-ferrari)]" : "group-hover:text-gray-200"
                  )} 
                />
                <span className={cn(
                  "font-medium text-[11px] tracking-wide",
                  step === s.id ? "font-semibold" : "font-light"
                )}>{s.name}</span>
              </button>
            ))}
          </nav>
        </div>
        
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsProvidersModalOpen(true)}
            className="hidden md:flex items-center gap-2 border border-white/10 hover:border-white/30 rounded-full px-4 py-1.5 bg-white/5 hover:bg-white/10 transition-all text-sm group"
            title="إعدادات النماذج والربط"
          >
            <Key size={14} className="text-gray-400 group-hover:text-emerald-400" />
            <span className="text-xs text-gray-300 group-hover:text-white font-medium">النماذج</span>
          </button>
          <div className="hidden lg:flex items-center gap-2 border border-white/10 rounded-full px-3 py-1.5 bg-white/5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-300">System Ready</span>
          </div>
          <div className="flex items-center gap-3 pl-4 border-l border-white/10">
            <div className="flex flex-col text-right items-start hidden sm:flex">
               <span className="text-sm font-medium text-white">Guest</span>
               <span className="text-[10px] text-emerald-400">Online</span>
            </div>
            <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center bg-white/5 overflow-hidden">
              <User size={18} className="text-white/60" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto z-10 relative">
        <div className="w-full flex-1 flex flex-col max-w-7xl mx-auto px-6 lg:px-12 pt-6">
          <div id="step-scroll-container" className="flex-1 pb-16 overflow-y-auto scrollbar-hide">
            {renderStep()}
          </div>
        </div>
      </main>
      
      <ProvidersConfigModal 
        isOpen={isProvidersModalOpen} 
        onClose={() => setIsProvidersModalOpen(false)} 
      />
    </div>
  );
}

