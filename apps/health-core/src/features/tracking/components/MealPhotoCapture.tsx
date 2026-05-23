import React, { useRef, useState } from 'react';
import { useMediaUpload } from '@/shared/hooks/useMediaUpload';

interface MealPhotoCaptureProps {
  onPhotoUploaded: (storageKey: string) => void;
}

const ALLOWED_MIME_TYPES = 'image/*';
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit to prevent bandwidth exhaustion on mobile networks

/**
 * UI Component that matches the HealthCore dark-theme dashed dropzone design.
 * Integrates native OS camera/gallery triggers via hidden input for PWA compatibility.
 * * Design Decisions:
 * - Maintains SRP: Only handles presentation state and DOM events.
 * - Defensive UX: Provides immediate local feedback for file size limits before hitting the network.
 * - Visual Feedback: Tracks the selected file name to assure the user the upload succeeded.
 */
export const MealPhotoCapture: React.FC<MealPhotoCaptureProps> = ({ onPhotoUploaded }) => {
  const { isUploading, error: uploadError, uploadFile } = useMediaUpload();
  
  const [localValidationError, setLocalValidationError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTriggerClick = () => {
    setLocalValidationError(null);
    // Programmatically trigger the hidden native input to maintain the custom UI
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    
    // Defensive check: Ensure file selection wasn't cancelled by the user
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];

    // Fail-fast validation: Prevent large memory allocations or slow uploads
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setLocalValidationError('La imagen supera el límite de 5MB permitido.');
      resetInput();
      return;
    }

    const storageKey = await uploadFile(file);

    if (storageKey) {
      setUploadedFileName(file.name);
      onPhotoUploaded(storageKey);
    }

    resetInput();
  };

  const resetInput = () => {
    // Clears the DOM element value so the exact same file can be re-uploaded if the user deletes it
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayError = localValidationError || uploadError;

  return (
    <div className="flex flex-col w-full gap-2">
      {/* Hidden native input responsible for invoking OS-level camera/gallery */}
      <input
        type="file"
        accept={ALLOWED_MIME_TYPES}
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main UI Container mapping to the provided screenshot layout */}
      <div className="flex items-center gap-3 w-full">
        
        {/* Dashed Dropzone Area */}
        <button
          type="button"
          onClick={handleTriggerClick}
          disabled={isUploading}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border border-dashed transition-colors
            ${isUploading ? 'border-slate-600 bg-slate-800/30 text-slate-500 cursor-wait' : 'border-slate-600 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-slate-200'}
            ${uploadedFileName ? 'border-emerald-500/50 text-emerald-400 bg-emerald-900/10' : ''}
          `}
        >
          {isUploading ? (
            <>
              <SpinnerIcon />
              <span className="text-sm font-medium">Subiendo foto...</span>
            </>
          ) : uploadedFileName ? (
            <>
              <CheckCircleIcon />
              <span className="text-sm font-medium truncate max-w-[200px]">{uploadedFileName}</span>
            </>
          ) : (
            <>
              <CameraIcon />
              <span className="text-sm font-medium">Subir foto del platillo</span>
            </>
          )}
        </button>

        {/* Solid Icon Button (Right side) */}
        <button
          type="button"
          onClick={handleTriggerClick}
          disabled={isUploading}
          className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-slate-800 text-slate-400 rounded-lg border border-transparent hover:bg-slate-700 hover:text-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Seleccionar imagen de la galería"
        >
          <GalleryIcon />
        </button>
      </div>

      {/* Error feedback section */}
      {displayError && (
        <p className="text-sm text-red-400 font-medium pl-1">
          ⚠️ {displayError}
        </p>
      )}
    </div>
  );
};

// --- SVG Asset Components ---
// Extracted to keep the main component render method clean and readable.

const SpinnerIcon = () => (
  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const CameraIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const GalleryIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);