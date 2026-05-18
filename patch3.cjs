const fs = require('fs');
let code = fs.readFileSync('src/components/steps/SettingsStep.tsx', 'utf8');

const targetStr = `                          {newChar.imageUrl && (
                            <button onClick={handleAnalyzeImage} disabled={analyzingImage} className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--rosso-ferrari)]/20 hover:bg-[var(--rosso-ferrari)]/40 text-[var(--rosso-ferrari)] rounded-lg text-sm transition-colors">
                              {analyzingImage ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />} 
                              استخراج الوصف من الصورة
                            </button>
                          )}

                          <button onClick={handleSuggestIdea} disabled={generatingIdea} className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 rounded-lg text-sm transition-colors">
                            {generatingIdea ? <RefreshCw size={16} className="animate-spin" /> : <Cpu size={16} />}
                            اقتراح شخصية إبداعية
                          </button>
                        </div>
                        
                        {newChar.imageUrl && (`;

const replaceStr = `                          {newChar.imageUrl && (
                            <button onClick={handleAnalyzeImage} disabled={analyzingImage} className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--rosso-ferrari)]/20 hover:bg-[var(--rosso-ferrari)]/40 text-[var(--rosso-ferrari)] rounded-lg text-sm transition-colors">
                              {analyzingImage ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />} 
                              استخراج الوصف من الصورة
                            </button>
                          )}

                          <button onClick={handleSuggestIdea} disabled={generatingIdea} className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 rounded-lg text-sm transition-colors mb-2">
                            {generatingIdea ? <RefreshCw size={16} className="animate-spin" /> : <Cpu size={16} />}
                            اقتراح شخصية إبداعية
                          </button>

                          <button onClick={async () => {
                            if (!newChar.description) return;
                            setGeneratingIdea(true);
                            await new Promise(r => setTimeout(r, 1000));
                            const url = "https://image.pollinations.ai/prompt/" + encodeURIComponent("Character portrait, concept art, " + newChar.description + " --no text") + "?width=512&height=512&nologo=true&seed=" + Math.floor(Math.random() * 1000000);
                            setNewChar({ ...newChar, imageUrl: url });
                            setGeneratingIdea(false);
                          }} disabled={generatingIdea || !newChar.description} className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/40 text-purple-400 rounded-lg text-sm transition-colors">
                            {generatingIdea ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            توليد صورة مصغرة (AI)
                          </button>
                        </div>
                        
                        {newChar.imageUrl && (`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replaceStr);
  fs.writeFileSync('src/components/steps/SettingsStep.tsx', code);
  console.log("Success");
} else {
  console.log("Target not found");
}
