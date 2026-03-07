import { AIChatPage } from '@/components/AIChatPage';

export default function Groq() {
  return (
    <AIChatPage
      modelName="Groq"
      modelIcon="⚡"
      modelColor="from-orange-500 to-amber-500"
      providerName="groq"
    />
  );
}
