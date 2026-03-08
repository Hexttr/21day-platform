import React, { useRef, useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

const DEFAULT_ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'];

type ImageUploadPanelProps = {
  images: string[];
  onChange: (images: string[]) => void;
  disabled?: boolean;
  maxImages?: number;
  maxFileSizeMb?: number;
  allowedTypes?: string[];
  className?: string;
  previewSummary?: React.ReactNode;
  dropHint?: string;
  children: (controls: { openFilePicker: () => void }) => React.ReactNode;
  footer?: React.ReactNode;
};

export function ImageUploadPanel({
  images,
  onChange,
  disabled = false,
  maxImages = 14,
  maxFileSizeMb = 10,
  allowedTypes = DEFAULT_ALLOWED_TYPES,
  className,
  previewSummary,
  dropHint = 'Перетащите изображения сюда, чтобы добавить их в запрос.',
  children,
  footer,
}: ImageUploadPanelProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const processFiles = async (files: File[]) => {
    if (!files.length) return;

    const remaining = maxImages - images.length;
    if (remaining <= 0) {
      toast.error(`Максимум ${maxImages} изображений`);
      return;
    }

    const toAdd: File[] = [];
    for (let i = 0; i < Math.min(files.length, remaining); i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        toast.error(`Формат не поддерживается: ${file.name}. Используйте PNG, JPEG, WebP`);
        continue;
      }
      if (file.size > maxFileSizeMb * 1024 * 1024) {
        toast.error(`${file.name} слишком большой (макс. ${maxFileSizeMb}MB)`);
        continue;
      }
      if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
        toast.error(`Формат не поддерживается: ${file.name}. Используйте PNG, JPEG, WebP`);
        continue;
      }
      toAdd.push(file);
    }

    const urls = await Promise.all(toAdd.map((file) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    }))).catch(() => {
      toast.error('Ошибка загрузки');
      return null;
    });

    if (!urls) return;
    onChange([...images, ...urls].slice(0, maxImages));
  };

  const removeImage = (index?: number) => {
    if (index === undefined) {
      onChange([]);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    onChange(images.filter((_, currentIndex) => currentIndex !== index));
  };

  return (
    <div
      className={`flex-shrink-0 bg-card rounded-2xl border shadow-soft p-4 transition-colors ${
        isDragOver ? 'border-primary bg-primary/5' : 'border-border/50'
      } ${className || ''}`}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setIsDragOver(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsDragOver(false);
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragOver(false);
        if (!disabled) {
          void processFiles(Array.from(event.dataTransfer.files || []));
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={allowedTypes.join(',')}
        multiple
        onChange={(event) => {
          const files = event.target.files;
          if (files?.length) {
            void processFiles(Array.from(files));
          }
          event.target.value = '';
        }}
        className="hidden"
      />

      {images.length > 0 && (
        <div className={`mb-3 gap-2 rounded-xl border border-border/50 bg-secondary/30 p-3 ${isMobile ? 'flex overflow-x-auto' : 'flex flex-wrap'}`}>
          {images.map((url, index) => (
            <div key={`${url}-${index}`} className="relative flex-shrink-0">
              <img src={url} alt="" className={`${isMobile ? 'h-12 w-12' : 'w-14 h-14'} rounded-lg object-cover border border-border/50`} />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md hover:bg-destructive/90"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {previewSummary}
        </div>
      )}

      {children({
        openFilePicker: () => inputRef.current?.click(),
      })}

      {footer}

      {isDragOver && (
        <div className="mt-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-sm text-primary">
          {dropHint}
        </div>
      )}

      {images.length > 0 && (
        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeImage()}
            className="text-xs text-muted-foreground hover:text-destructive"
            disabled={disabled}
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Очистить вложения
          </Button>
        </div>
      )}
    </div>
  );
}
