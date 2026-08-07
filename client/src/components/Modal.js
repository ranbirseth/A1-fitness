import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { X } from 'lucide-react';
const Modal = ({ isOpen, onClose, title, children }) => {
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        if (isOpen)
            document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "modal-overlay", onClick: onClose, children: _jsxs("div", { className: "glass-panel modal-content", onClick: (e) => e.stopPropagation(), style: {
                width: '95%',
                maxWidth: '600px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                padding: '1.5rem',
                position: 'relative',
                overflow: 'hidden'
            }, children: [_jsxs("div", { style: {
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1.5rem',
                        flexShrink: 0
                    }, children: [_jsx("h2", { style: { fontSize: '1.25rem', fontWeight: '700' }, children: title }), _jsx("button", { className: "btn-icon", onClick: onClose, children: _jsx(X, { size: 20 }) })] }), _jsx("div", { style: {
                        overflowY: 'auto',
                        flex: 1,
                        paddingRight: '0.5rem',
                        marginRight: '-0.5rem'
                    }, children: children })] }) }));
};
export default Modal;
