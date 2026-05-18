const fs = require('fs');
let code = fs.readFileSync('src/components/steps/SettingsStep.tsx', 'utf8');

const targetStr = `  const handleSuggestIdea = async () => {
    setGeneratingIdea(true);
    try {
      const charIdea = await suggestCharacterIdea();
      setNewChar({ ...newChar, ...charIdea });
    } catch(err: any) {
      alert("خطأ: " + err.message);
    }
    setGeneratingIdea(false);
  };`;

const replaceStr = `  const handleSuggestIdea = async () => {
    setGeneratingIdea(true);
    try {
      const charIdea = await suggestCharacterIdea();
      const url = "https://image.pollinations.ai/prompt/" + encodeURIComponent("Character portrait, concept art, " + charIdea.description + " --no text") + "?width=512&height=512&nologo=true&seed=" + Math.floor(Math.random() * 1000000);
      setNewChar({ ...newChar, ...charIdea, imageUrl: url });
    } catch(err: any) {
      alert("خطأ: " + err.message);
    }
    setGeneratingIdea(false);
  };`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replaceStr);
  fs.writeFileSync('src/components/steps/SettingsStep.tsx', code);
  console.log("Success");
} else {
  console.log("Target not found");
}
