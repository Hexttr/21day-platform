import React from 'react';
import { MessageSquarePlus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { buildConversationPreview, type ChatConversationRecord } from '@/lib/ai-conversations';

type AIConversationListProps = {
  title: string;
  conversations: ChatConversationRecord[];
  activeConversationId: string | null;
  onNewChat: () => void;
  onSelectConversation: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
};

function formatTimestamp(value: string): string {
  const date = new Date(value);
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function AIConversationList({
  title,
  conversations,
  activeConversationId,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
}: AIConversationListProps) {
  const isMobile = useIsMobile();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-14 items-center justify-between gap-3 border-b border-border/40 px-4 pr-12 md:h-16 md:pr-4">
        <div>
          <div className="ai-kicker">Диалоги</div>
          <div className="mt-1 text-sm font-medium text-foreground">{title}</div>
        </div>
        <Button onClick={onNewChat} size="sm" className="rounded-xl gap-2 shadow-soft h-9">
          <MessageSquarePlus className="h-4 w-4" />
          Новый
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {conversations.length === 0 ? (
          <div className="rounded-3xl border border-border/60 border-dashed bg-background/95 px-4 py-5 text-sm text-muted-foreground shadow-xs">
            Здесь появятся ваши диалоги. Новый чат создастся автоматически после первого сообщения.
          </div>
        ) : (
          <div className="space-y-1.5 md:space-y-2">
            {conversations.map((conversation) => {
              const isActive = conversation.id === activeConversationId;
              return (
                <div
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onSelectConversation(conversation.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className={`group w-full rounded-2xl border px-3 py-2.5 text-left transition-all md:py-3 ${
                    isActive
                      ? 'border-primary/30 bg-primary/10 shadow-soft'
                      : 'border-border/50 bg-background/65 hover:border-primary/20 hover:bg-background/95 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-foreground">{conversation.title}</div>
                      <div className={`mt-1 text-xs text-muted-foreground ${isMobile ? 'line-clamp-1 leading-[1.15rem]' : 'line-clamp-2 leading-5'}`}>
                        {buildConversationPreview(conversation.messages)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteConversation(conversation.id);
                      }}
                      className={`rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive ${
                        isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                      title="Удалить диалог"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/65 md:mt-2 md:text-[11px]">
                    {formatTimestamp(conversation.updatedAt)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
