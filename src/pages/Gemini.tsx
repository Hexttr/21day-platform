import { AIChatPage } from '@/components/AIChatPage';

export default function Gemini() {
  return (
    <AIChatPage
      model="google/gemini-3-flash-preview"
      modelName="Gemini"
      modelIcon="✨"
      modelColor="from-blue-500 to-cyan-500"
    />
  );
}
