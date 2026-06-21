import React, { useState, useRef } from 'react';
import { FileAudio } from 'lucide-react';

interface FileDropzoneProps {
  onFileSelected: (file: File) => void;
  isLoading: boolean;
}

export default function FileDropzone({ onFileSelected, isLoading }: FileDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelected(e.target.files[0]);
    }
  };

  const triggerInputClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      id="drag-and-drop-container"
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={triggerInputClick}
      className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
        isDragActive
          ? 'border-indigo-500 bg-indigo-950/20 scale-[1.01]'
          : 'border-zinc-800 hover:border-indigo-500/60 hover:bg-[#161616]'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,audio/mp3,audio/mpeg,.wav,audio/wav,.mpeg,.mpg"
        onChange={handleFileChange}
        className="hidden"
        id="audio-file-input"
      />
      <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mb-3">
        <FileAudio className="w-6 h-6 animate-pulse" />
      </div>
      <p className="text-sm font-medium text-gray-300">
        Arrastra y suelta tu archivo de audio <span className="text-indigo-400 font-semibold text-xs bg-indigo-500/10 border border-indigo-550/20 px-2 py-0.5 rounded-full inline-block">MP3 / MPEG / WAV</span> aquí o haz clic para explorar
      </p>
      <p className="text-xs text-gray-500 mt-2">
        El archivo se cargará localmente antes de procesarse. Soporta hasta 50 MB
      </p>
    </div>
  );
}
