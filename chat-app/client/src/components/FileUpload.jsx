import React, { useRef } from 'react';
import { useSocket } from '../context/SocketContext';

const FileUpload = ({ room, onFileSent }) => {
  const { socket, currentUser } = useSocket();
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // In a real app, you'd upload to cloud storage first
    // For demo, we'll create a fake URL and send file info
    const fileMessage = {
      user: currentUser.username,
      avatar: currentUser.avatar,
      fileName: file.name,
      fileSize: formatFileSize(file.size),
      fileType: file.type,
      fileUrl: URL.createObjectURL(file), // Temporary local URL
      room: room
    };

    socket.emit('send_file', fileMessage);
    onFileSent && onFileSent();

    // Reset file input
    event.target.value = '';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
    return '📎';
  };

  return (
    <div className="relative">
      <button
        onClick={() => fileInputRef.current?.click()}
        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        title="Upload file"
      >
        📎
      </button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt,.zip"
      />
    </div>
  );
};

export default FileUpload;