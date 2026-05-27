import { Camera, Loader2 } from 'lucide-react';
import { type ChangeEvent, useRef } from 'react';

interface ProfileAvatarProps {
  name: string;
  photoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  editable?: boolean;
  accept?: string;
  onFileSelected?: (file: File) => void | Promise<void>;
  isUploading?: boolean;
  error?: string | null;
  helperText?: string;
  cameraLabel?: string;
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<ProfileAvatarProps['size']>, string> = {
  sm: 'h-12 w-12 text-lg',
  md: 'h-16 w-16 text-xl',
  lg: 'h-20 w-20 text-3xl',
  xl: 'h-24 w-24 text-4xl',
};

const CAMERA_BUTTON_CLASSES: Record<NonNullable<ProfileAvatarProps['size']>, string> = {
  sm: 'h-7 w-7',
  md: 'h-8 w-8',
  lg: 'h-9 w-9',
  xl: 'h-10 w-10',
};

export const ProfileAvatar = ({
  name,
  photoUrl,
  size = 'lg',
  editable = false,
  accept = 'image/*',
  onFileSelected,
  isUploading = false,
  error,
  helperText,
  cameraLabel = 'Cambiar foto de perfil',
  className = '',
}: Readonly<ProfileAvatarProps>) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const initial = (name.trim().charAt(0) || 'U').toUpperCase();

  const handleOpenPicker = () => {
    if (!editable || isUploading) {
      return;
    }
    inputRef.current?.click();
  };

  const handleInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onFileSelected) {
      return;
    }

    await onFileSelected(file);
    event.target.value = '';
  };

  return (
    <div className={`flex flex-col items-start gap-2 ${className}`.trim()}>
      <div className="relative">
        <div
          className={`relative overflow-hidden rounded-full border-4 border-background bg-primary text-primary-foreground shadow-lg ${SIZE_CLASSES[size]}`}
        >
          {photoUrl ? (
            <img src={photoUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-bold">
              {initial}
            </div>
          )}
          {isUploading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/35">
              <Loader2 className="animate-spin text-white" size={20} />
            </div>
          ) : null}
        </div>

        {editable ? (
          <>
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              className="hidden"
              onChange={(event) => {
                void handleInputChange(event);
              }}
            />
            <button
              type="button"
              aria-label={cameraLabel}
              onClick={handleOpenPicker}
              disabled={isUploading}
              className={`absolute -bottom-1 -right-1 flex items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-md transition hover:scale-105 disabled:cursor-wait disabled:opacity-80 ${CAMERA_BUTTON_CLASSES[size]}`}
            >
              <Camera size={16} />
            </button>
          </>
        ) : null}
      </div>

      {helperText ? <p className="text-xs text-muted-foreground">{helperText}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
};
