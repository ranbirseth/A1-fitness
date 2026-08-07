import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { markAttendance } from '../features/attendance/attendance.api';
const QRAttendancePage = () => {
    const [secretCode, setSecretCode] = useState('');
    const [status, setStatus] = useState({
        type: 'idle',
        message: ''
    });
    const [location, setLocation] = useState(null);
    // Ensure theme is applied (defaulting to dark for this standalone-ish page)
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
    }, []);
    const getLocation = () => {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve(null);
                return;
            }
            navigator.geolocation.getCurrentPosition((pos) => {
                const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy };
                setLocation(loc);
                resolve(loc);
            }, () => resolve(null), { enableHighAccuracy: true, timeout: 5000 });
        });
    };
    const handleAction = async (action) => {
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
            }
            else {
                setStatus({ type: 'error', message: data.message || 'Failed to mark attendance.' });
            }
        }
        catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to mark attendance. Please check your code and location.';
            setStatus({ type: 'error', message: errorMessage });
        }
    };
    return (_jsxs("div", { className: "attendance-qr-container", style: {
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            background: 'radial-gradient(circle at top right, #1a1b25, #0a0b10)'
        }, children: [_jsxs("div", { className: "bg-mesh", style: { opacity: 0.5 }, children: [_jsx("div", { className: "blob-1" }), _jsx("div", { className: "blob-2" }), _jsx("div", { className: "blob-3" })] }), _jsxs("div", { className: "glass-card", style: {
                    width: '100%',
                    maxWidth: '400px',
                    padding: '2.5rem',
                    textAlign: 'center',
                    position: 'relative',
                    zIndex: 1
                }, children: [_jsxs("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', gap: '1rem' }, children: [_jsx("img", { src: "https://res.cloudinary.com/dyc33dchn/image/upload/q_auto/f_auto/v1776476678/WhatsApp_Image_2026-04-15_at_10.11.03_PM_2_jvuq84.jpg", alt: "RUDRA FITNESS", style: {
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '16px',
                                    objectFit: 'cover'
                                } }), _jsx("span", { className: "text-gradient", style: {
                                    fontSize: '1.8rem',
                                    fontWeight: 700,
                                    fontFamily: '"Bebas Neue", sans-serif',
                                    letterSpacing: '0.12em',
                                    background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                    filter: 'drop-shadow(0 2px 4px rgba(139, 92, 246, 0.15))'
                                }, children: "RUDRA FITNESS" })] }), _jsx("h2", { style: { fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 700 }, children: "Mark Attendance" }), _jsx("p", { className: "text-muted", style: { marginBottom: '2rem' }, children: "Enter your unique 3-digit secret code" }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '1.5rem' }, children: [_jsxs("div", { className: "form-group", style: { textAlign: 'left' }, children: [_jsx("label", { className: "form-label", style: { fontSize: '0.85rem', opacity: 0.8 }, children: "Secret Code" }), _jsx("input", { type: "text", className: "form-input", style: {
                                            fontSize: '2rem',
                                            textAlign: 'center',
                                            letterSpacing: '0.5rem',
                                            fontWeight: 700,
                                            height: '70px'
                                        }, placeholder: "000", maxLength: 3, value: secretCode, onChange: (e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            if (val.length <= 3)
                                                setSecretCode(val);
                                        }, disabled: status.type === 'loading', autoFocus: true })] }), _jsxs("div", { style: { display: 'flex', gap: '1rem' }, children: [_jsx("button", { type: "button", className: "btn btn-primary w-full", style: { height: '50px', justifyContent: 'center', fontSize: '1.1rem', background: 'var(--clr-success)', borderColor: 'var(--clr-success)' }, disabled: status.type === 'loading' || secretCode.length !== 3, onClick: () => handleAction('check-in'), children: "Check In" }), _jsx("button", { type: "button", className: "btn btn-primary w-full", style: { height: '50px', justifyContent: 'center', fontSize: '1.1rem', background: 'var(--clr-secondary)', borderColor: 'var(--clr-secondary)' }, disabled: status.type === 'loading' || secretCode.length !== 3, onClick: () => handleAction('check-out'), children: "Check Out" })] })] }), status.type !== 'idle' && status.type !== 'loading' && (_jsxs("div", { className: `glass-panel ${status.type === 'success' ? 'text-success' : 'text-danger'}`, style: {
                            marginTop: '2rem',
                            padding: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            animation: 'slideUp 0.3s ease-out',
                            background: status.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            borderColor: status.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'
                        }, children: [status.type === 'success' ? _jsx(CheckCircle2, { size: 20 }) : _jsx(AlertCircle, { size: 20 }), _jsx("span", { style: { fontWeight: 500 }, children: status.message })] }))] }), _jsx("style", { children: `
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
      ` })] }));
};
export default QRAttendancePage;
