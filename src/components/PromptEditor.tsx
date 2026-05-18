import React from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';

// Define a custom language for Prompt
Prism.languages.prompt = {
  'keyword': /\b(masterpiece|best quality|highres|8k|4k|high detail|ultra-detailed|intricate|cinematic|volumetric|octane render|unreal engine 5|ray tracing|hdr|uhd|raw photo|detailed|sharp focus|lighting|shadows|portrait|landscape|close up)\b/i,
  'number': /\b\d+(\.\d*)?\b/,
  'punctuation': /[{}[\](),.]/,
  'operator': /[:|]/,
  'important': /\b(negative|no|without|bad|poor|ugly|nsfw|watermark|text|signature|deformed|blurry|mutated)\b/i,
};

interface PromptEditorProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
}

export function PromptEditor({ value, onChange, className, placeholder }: PromptEditorProps) {
  return (
    <div className={`prompt-editor-container ${className}`}>
      <Editor
        value={value}
        onValueChange={onChange}
        highlight={code => Prism.highlight(code, Prism.languages.prompt, 'prompt')}
        padding={12}
        placeholder={placeholder}
        style={{
          fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
          minHeight: '100%',
        }}
        className="w-full h-full focus:outline-none"
        textareaClassName="focus:outline-none"
      />
    </div>
  );
}
