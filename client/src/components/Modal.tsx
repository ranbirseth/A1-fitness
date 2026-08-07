import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()} style={{ 
        width: '95%', 
        maxWidth: '600px', 
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '1.5rem',
          flexShrink: 0 
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{title}</h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div style={{ 
          overflowY: 'auto', 
          flex: 1,
          paddingRight: '0.5rem',
          marginRight: '-0.5rem'
        }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
