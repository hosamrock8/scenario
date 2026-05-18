const fs = require('fs');
let code = fs.readFileSync('src/components/steps/CharacterStep.tsx', 'utf8');

const targetStr = `  const handleSuggestCharacter = async () => {
    setGeneratingIdea(true);
    try {
      const result = await suggestCharacterIdea(topic || "فيديو يوتيوب إبداعي");
      setCharacter({
        useFixedCharacter: true,
        name: result.name,
        gender: result.gender as any,
        description: result.description
      });
    } catch (error) {
      console.error("Failed to suggest character:", error);
    } finally {
      setGeneratingIdea(false);
    }
  };`;

const replaceStr = `  const handleSuggestCharacter = async () => {
    setGeneratingIdea(true);
    try {
      const result = await suggestCharacterIdea(topic || "فيديو يوتيوب إبداعي");
      const url = "https://image.pollinations.ai/prompt/" + encodeURIComponent("Character portrait, concept art, " + result.description + " --no text") + "?width=512&height=512&nologo=true&seed=" + Math.floor(Math.random() * 1000000);
      setCharacter({
        useFixedCharacter: true,
        name: result.name,
        gender: result.gender as any,
        description: result.description,
        imageUrl: url
      });
    } catch (error) {
      console.error("Failed to suggest character:", error);
    } finally {
      setGeneratingIdea(false);
    }
  };`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replaceStr);
  fs.writeFileSync('src/components/steps/CharacterStep.tsx', code);
  console.log("Success");
} else {
  console.log("Target not found");
}
