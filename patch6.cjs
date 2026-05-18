const fs = require('fs');

let code = fs.readFileSync('src/components/steps/ScenarioStep.tsx', 'utf8');

const target = `            arabicScript: improved.arabicScript || scene.arabicScript,
            imagePrompt: improved.imagePrompt || scene.imagePrompt,
            videoPrompt: improved.videoPrompt || scene.videoPrompt,
            negativePrompt: improved.negativePrompt || scene.negativePrompt,
            transition: improved.transition || scene.transition`;

const replace = `            arabicScript: improved.arabicScript || scene.arabicScript,
            imagePrompt: improved.imagePrompt || scene.imagePrompt,
            videoPrompt: improved.videoPrompt || scene.videoPrompt,
            animationPrompt: improved.animationPrompt || scene.animationPrompt,
            sfxPrompt: improved.sfxPrompt || scene.sfxPrompt,
            voiceoverPrompt: improved.voiceoverPrompt || scene.voiceoverPrompt,
            negativePrompt: improved.negativePrompt || scene.negativePrompt,
            transition: improved.transition || scene.transition`;

if (code.includes(target)) {
  code = code.replace(target, replace);
  fs.writeFileSync('src/components/steps/ScenarioStep.tsx', code);
  console.log("Success");
} else {
  console.log("Target not found");
}
