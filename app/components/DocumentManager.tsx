'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

interface DocumentManagerProps {
  assignmentId: string;
}

type DocumentFile = {
  name: string;
  path: string;
  created_at: string;
};

export default function DocumentManager({
  assignmentId,
}: DocumentManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const loadDocuments = async () => {
    const { data, error } = await supabase.storage
      .from('assignment-documents')
      .list(assignmentId, {
        sortBy: {
          column: 'created_at',
          order: 'desc',
        },
      });

    if (error) {
      console.error('Could not load documents:', error);
      return;
    }

    const files = (data || [])
      .filter((file) => file.name)
      .map((file) => ({
        name: file.name,
        path: `${assignmentId}/${file.name}`,
        created_at: file.created_at || '',
      }));

    setDocuments(files);
  };

  useEffect(() => {
    void loadDocuments();
  }, [assignmentId]);

  const handleUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploading(true);
    setMessage('');

    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${assignmentId}/${fileName}`;

      const { error } = await supabase.storage
        .from('assignment-documents')
        .upload(filePath, file);

      if (error) {
        throw error;
      }

      setMessage(`Successfully uploaded: ${file.name}`);

      await loadDocuments();
    } catch (error) {
      console.error('Upload error:', error);
      setMessage('Upload failed. Please try again.');
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const openDocument = async (path: string) => {
    const { data, error } = await supabase.storage
      .from('assignment-documents')
      .createSignedUrl(path, 3600);

    if (error) {
      console.error('Could not open document:', error);
      setMessage('Could not open this document.');
      return;
    }

    window.open(data.signedUrl, '_blank');
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

      {message && (
        <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
          {message}
        </div>
      )}

      {documents.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">
          No documents uploaded yet.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {documents.map((document) => (
            <div
              key={document.path}
              className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {document.name}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Uploaded document
                </p>
              </div>

              <button
                type="button"
                onClick={() => openDocument(document.path)}
                className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                View
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}