'use client';

import { useRef } from 'react';

export default function DocumentManager() {
    const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Documents</h2>

      <>
 <input
  ref={fileInputRef}
  type="file"
  className="hidden"
/>

  <button
  onClick={() => fileInputRef.current?.click()}
    
    className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
  >
    Upload Document
  </button>
</>

      <p className="mt-6 text-slate-500">
        No documents uploaded yet.
      </p>
    </div>
  );
}