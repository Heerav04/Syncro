'use client';

import { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/client';
import { useAuth } from '@/contexts/AuthContext';

type ScreenshotUploaderProps = {
  onUploadSuccess: (url: string) => void;
};

export function ScreenshotUploader({ onUploadSuccess }: ScreenshotUploaderProps) {
  const { user, claims } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !claims?.companyId) return;

    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.');
      return;
    }

    setUploading(true);
    setError('');
    setProgress(0);

    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;
    const storageRef = ref(storage, `companies/${claims.companyId}/uploads/${user.uid}/${fileName}`);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const prog = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(prog);
      },
      (err) => {
        console.error('Upload failed:', err);
        setError('Failed to upload image.');
        setUploading(false);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        onUploadSuccess(downloadURL);
        setUploading(false);
      }
    );
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Attach Screenshot
      </label>
      
      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
      
      <div className="relative">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900/30 dark:file:text-indigo-400 dark:text-gray-400 disabled:opacity-50 transition-all cursor-pointer"
        />
        {uploading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 rounded-xl flex items-center justify-center p-2 backdrop-blur-sm">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
