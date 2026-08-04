'use client';

import { useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

interface DocumentManagerProps {
  assignmentId: string;
}

export default function DocumentManager({
  assignmentId,
}: DocumentManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploading(true);
    setMessage('');

    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExtension}`;
      const filePath = `${assignmentId}/${fileName}`;

      const { error } = await supabase.storage
        .from('assignment-documents')
        .upload(filePath, file);

      if (error) {
        throw error;
      }

      setMessage(`Successfully uploaded: ${file.name}`);
    } catch (error) {
      console.error(error);
      setMessage('Upload failed. Please try again.');
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-slate-900">
          Documents
        </h2>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {uploading ? 'Uploading...' : 'Upload Document'}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleUpload}
      />

      {message ? (
        <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
          {message}
        </div>
      ) : (
        <p className="mt-6 text-sm text-slate-500">
          No documents uploaded yet.
        </p>
      )}
    </div>
  );
}