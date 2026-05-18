const fs = require('fs');
let code = fs.readFileSync('src/components/steps/CharacterStep.tsx', 'utf8');

const targetStr = "  const handleSaveToLibrary";
const replaceStr = `  const [generatingThumbnail, setGeneratingThumbnail] = useState(false);

  const handleGenerateThumbnail = async () => {
    if (!character.description) return;
    setGeneratingThumbnail(true);
    await new Promise(r => setTimeout(r, 1000));
    const url = "https://image.pollinations.ai/prompt/" + encodeURIComponent("Character portrait, concept art, " + character.description + " --no text") + "?width=512&height=512&nologo=true&seed=" + Math.floor(Math.random() * 1000000);
    setCharacter({ ...character, imageUrl: url });
    setGeneratingThumbnail(false);
  };

  const handleSaveToLibrary`;

if (code.includes(targetStr) && !code.includes("handleGenerateThumbnail")) {
  code = code.replace(targetStr, replaceStr);
  fs.writeFileSync('src/components/steps/CharacterStep.tsx', code);
  console.log("Success");
} else {
  console.log("Not replaced");
}
