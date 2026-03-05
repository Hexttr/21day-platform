import { AIChatPage } from '@/components/AIChatPage';

export default function ChatGPT() {
  return (
    <AIChatPage
      model="openai/gpt-5-mini"
      modelName="ChatGPT"
      modelIcon="🤖"
      modelColor="from-green-500 to-emerald-500"
    />
  );
}
