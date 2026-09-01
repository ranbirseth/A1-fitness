import React, { useState, useEffect } from 'react';
import { Dumbbell, CheckCircle2, AlertCircle, Loader2, MapPin } from 'lucide-react';
import { markAttendance } from '../features/attendance/attendance.api';

const QRAttendancePage: React.FC = () => {
  const [secretCode, setSecretCode] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'idle' | 'loading', message: string }>({
    type: 'idle',
    message: ''
  });
  const [location, setLocation] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);

  // Ensure theme is applied (defaulting to dark for this standalone-ish page)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  const getLocation = (): Promise<{ latitude: number; longitude: number; accuracy: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy };
          setLocation(loc);
          resolve(loc);
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });
  };

  const handleAction = async (action: 'check-in' | 'check-out') => {
    if (secretCode.length !== 3 || !/^\d+$/.test(secretCode)) {
      setStatus({ type: 'error', message: 'Please enter a valid 3-digit code.' });
      return;
    }

    setStatus({ type: 'loading', message: `Verifying location and processing ${action}...` });

    try {
      const currentLoc = await getLocation();
      const response = await markAttendance({ 
        secretCode, 
        action,
        location: currentLoc || undefined 
      });
      const data = response.data;

      if (response.status === 200 || response.status === 201) {
        setStatus({ type: 'success', message: data.message || `${action === 'check-in' ? 'Checked in' : 'Checked out'} successfully!` });
        setSecretCode('');
        // Clear success message after 5 seconds
        setTimeout(() => setStatus({ type: 'idle', message: '' }), 5000);
      } else {
        setStatus({ type: 'error', message: data.message || 'Failed to mark attendance.' });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to mark attendance. Please check your code and location.';
      setStatus({ type: 'error', message: errorMessage });
    }
  };

  return (
    <div className="attendance-qr-container" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      background: 'radial-gradient(circle at top right, #1a1b25, #0a0b10)'
    }}>
      <div className="bg-mesh" style={{ opacity: 0.5 }}>
        <div className="blob-1"></div>
        <div className="blob-2"></div>
        <div className="blob-3"></div>
      </div>

      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '400px',
        padding: '2.5rem',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', gap: '1rem' }}>
          <img 
            src="/logo.svg" 
            alt="A1 FITNESS" 
            style={{ 
              width: '80px',
              height: '80px',
              borderRadius: '16px',
              objectFit: 'cover'
            }}
          />
          <span className="text-gradient" style={{ 
            fontSize: '1.8rem', 
            fontWeight: 700,
            fontFamily: '"Bebas Neue", sans-serif',
            letterSpacing: '0.12em',
            background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 2px 4px rgba(139, 92, 246, 0.15))'
          }}>A1 FITNESS</span>
        </div>

        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 700 }}>Mark Attendance</h2>
        <p className="text-muted" style={{ marginBottom: '2rem' }}>Enter your unique 3-digit secret code</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="form-label" style={{ fontSize: '0.85rem', opacity: 0.8 }}>Secret Code</label>
            <input
              type="text"
              className="form-input"
              style={{ 
                fontSize: '2rem', 
                textAlign: 'center', 
                letterSpacing: '0.5rem',
                fontWeight: 700,
                height: '70px'
              }}
              placeholder="000"
              maxLength={3}
              value={secretCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                if (val.length <= 3) setSecretCode(val);
              }}
              disabled={status.type === 'loading'}
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              type="button" 
              className="btn btn-primary w-full" 
              style={{ height: '50px', justifyContent: 'center', fontSize: '1.1rem', background: 'var(--clr-success)', borderColor: 'var(--clr-success)' }}
              disabled={status.type === 'loading' || secretCode.length !== 3}
              onClick={() => handleAction('check-in')}
            >
              Check In
            </button>
            <button 
              type="button" 
              className="btn btn-primary w-full" 
              style={{ height: '50px', justifyContent: 'center', fontSize: '1.1rem', background: 'var(--clr-secondary)', borderColor: 'var(--clr-secondary)' }}
              disabled={status.type === 'loading' || secretCode.length !== 3}
              onClick={() => handleAction('check-out')}
            >
              Check Out
            </button>
          </div>
        </div>

        {status.type !== 'idle' && status.type !== 'loading' && (
          <div className={`glass-panel ${status.type === 'success' ? 'text-success' : 'text-danger'}`} style={{
            marginTop: '2rem',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            animation: 'slideUp 0.3s ease-out',
            background: status.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            borderColor: status.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'
          }}>
            {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span style={{ fontWeight: 500 }}>{status.message}</span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default QRAttendancePage;
