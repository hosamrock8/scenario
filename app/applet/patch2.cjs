const fs = require('fs');
let code = fs.readFileSync('src/components/steps/CharacterStep.tsx', 'utf8');

const targetStr = `              <textarea 
                value={character.description}
                onChange={(e) => setCharacter({ ...character, description: e.target.value })}
                placeholder="e.g. 30 year old man, short black hair, wearing a casual red hoodie, wearing glasses, sharp facial features"
                rows={4}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[var(--rosso-ferrari)] transition-all resize-none ltr text-left"
                dir="ltr"
              />
            </div>`;
const replaceStr = `              <div className="flex gap-4 items-start">
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
                         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
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
            </div>`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replaceStr);
  fs.writeFileSync('src/components/steps/CharacterStep.tsx', code);
  console.log("Success");
} else {
  console.log("Target not found");
}
