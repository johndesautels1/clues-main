/**
 * FileUpload — Upload medical records (P8) and financial spreadsheets (P11) for Gemini.
 *
 * Gemini 3.1 Pro Preview supports 100MB file uploads. This component allows users
 * to attach supporting documents alongside their 30 paragraphs for 100% accuracy.
 *
 * Blueprint: "If the user has complex medical records (P8) or financial spreadsheets (P11),
 * Gemini 3.1 Pro Preview can now ingest those files directly alongside the 30 paragraphs."
 *
 * WCAG 2.1 AA: Drag-and-drop with keyboard alternative, 4.5:1 contrast, focus-visible.
 */

import { useState, useRef, useCallback } from 'react';
import { uploadFileForGemini } from '../../lib/api';

interface FileUploadProps {
  onFileUploaded: (fileUrl: string, fileName: string) => void;
  maxFiles?: number;
}

interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: string;
}

const MAX_FILE_SIZE_MB = 100;
const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.csv', '.xlsx', '.xls', '.json', '.jpg', '.jpeg', '.png', '.webp'];

export function FileUpload({ onFileUploaded, maxFiles = 5 }: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);

    // Validate size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    // Validate extension
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(`Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
      return;
    }

    // Validate count
    if (uploadedFiles.length >= maxFiles) {
      setError(`Maximum ${maxFiles} files allowed.`);
      return;
    }

    setUploading(true);
    try {
      const fileUrl = await uploadFileForGemini(file);
      const uploaded: UploadedFile = {
        name: file.name,
        url: fileUrl,
        size: file.size,
        type: file.type,
      };
      setUploadedFiles(prev => [...prev, uploaded]);
      onFileUploaded(fileUrl, file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [uploadedFiles, maxFiles, onFileUploaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (inputRef.current) inputRef.current.value = '';
  }, [handleFile]);

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload supporting documents"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
        style={{
          padding: '20px',
          border: dragOver
            ? '2px dashed var(--text-accent, #60a5fa)'
            : '2px dashed rgba(255, 255, 255, 0.12)',
          borderRadius: 10,
          background: dragOver
            ? 'rgba(96, 165, 250, 0.06)'
            : 'rgba(255, 255, 255, 0.02)',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          onChange={handleInputChange}
          accept={ALLOWED_EXTENSIONS.join(',')}
          style={{ display: 'none' }}
          aria-hidden="true"
        />
        <div style={{
          fontSize: '1.5rem',
          marginBottom: 8,
          opacity: 0.6,
        }}>
          &#x1F4CE;
        </div>
        <p style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: '0.8125rem',
          color: 'var(--text-secondary, #9ca3af)',
          margin: '0 0 4px',
        }}>
          {uploading ? 'Uploading...' : 'Drop files here or click to browse'}
        </p>
        <p style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: '0.6875rem',
          color: 'var(--text-muted, #8b95a5)',
          margin: 0,
        }}>
          Medical records, financial spreadsheets, or supporting documents (max {MAX_FILE_SIZE_MB}MB)
        </p>
      </div>

      {/* Error */}
      {error && (
        <p style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: '0.75rem',
          color: 'var(--score-red, #ef4444)',
          marginTop: 8,
        }}>
          {error}
        </p>
      )}

      {/* Uploaded files list */}
      {uploadedFiles.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {uploadedFiles.map((file, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 10px',
              background: 'rgba(34, 197, 94, 0.06)',
              border: '1px solid rgba(34, 197, 94, 0.15)',
              borderRadius: 6,
            }}>
              <span style={{ fontSize: '0.875rem' }}>&#x2705;</span>
              <span style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: '0.75rem',
                color: 'var(--text-primary, #f9fafb)',
                flex: 1,
              }}>
                {file.name}
              </span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.6875rem',
                color: 'var(--text-muted, #8b95a5)',
              }}>
                {formatSize(file.size)}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                aria-label={`Remove ${file.name}`}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  border: 'none',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--score-red, #ef4444)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
