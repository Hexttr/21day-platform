import { AIChatPage } from '@/components/AIChatPage';

export default function Gemini() {
  return (
    <AIChatPage
      modelName="Gemini"
      modelIcon="✨"
      modelColor="from-blue-500 to-cyan-500"
      providerName="gemini"
    />
  );
}
