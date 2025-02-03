import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import './BiasGrid.css';

function BiasGrid({ onChange }) {
    const gridRef = useRef(null);
    const [position, setPosition] = useState({ x: 0.5, y: 0.5 }); // Center by default
    const [isDragging, setIsDragging] = useState(false);
    const [pingKey, setPingKey] = useState(0); // Use a key to force animation restart

    const updatePosition = (clientX, clientY) => {
        if (!gridRef.current) return;

        const rect = gridRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, 1 - ((clientY - rect.top) / rect.height))); // Invert Y so 0 is bottom
        
        setPosition({ x, y });
        onChange({ x, y });
    };

    const handleMouseDown = (e) => {
        e.preventDefault(); // Prevent text selection
        setIsDragging(true);
        updatePosition(e.clientX, e.clientY);
        document.body.classList.add('bias-grid-dragging');
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        updatePosition(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
        if (isDragging) {
            setPingKey(k => k + 1); // Trigger ping effect on release
        }
        setIsDragging(false);
        document.body.classList.remove('bias-grid-dragging');
    };

    const handleReset = () => {
        setPosition({ x: 0.5, y: 0.5 });
        onChange({ x: 0.5, y: 0.5 });
        setPingKey(k => k + 1); // Trigger ping effect on reset
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            // Cleanup: ensure we remove the class if component unmounts while dragging
            document.body.classList.remove('bias-grid-dragging');
        };
    }, [isDragging]);

    return (
        <div className="bias-grid-container">
            <div className="header-row">
                <h3>Shop Bias</h3>
                <button 
                    className="reset-button" 
                    onClick={handleReset}
                    title="Reset to default values"
                >
                    <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path 
                            d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
                            fill="currentColor"
                        />
                    </svg>
                </button>
            </div>
            <div className="bias-grid-wrapper">
                <div className="grid-label top">Expensive</div>
                <div className="grid-label bottom">Cheap</div>
                <div className="grid-label left">
                    Low<br/>Variety
                </div>
                <div className="grid-label right">
                    High<br/>Variety
                </div>

                <div 
                    className={`bias-grid ${isDragging ? 'dragging' : ''}`}
                    ref={gridRef}
                    onMouseDown={handleMouseDown}
                >
                    {/* Grid lines */}
                    <div className="grid-lines horizontal" />
                    <div className="grid-lines vertical" />

                    {/* Center marker */}
                    <div className="grid-center-marker" />

                    {/* Draggable dot */}
                    <div 
                        className="grid-dot"
                        style={{
                            left: `${position.x * 100}%`,
                            bottom: `${position.y * 100}%`
                        }}
                    />
                    {/* Separate ping element */}
                    <div 
                        key={pingKey}
                        className="ping-ring"
                        style={{
                            left: `${position.x * 100}%`,
                            bottom: `${position.y * 100}%`,
                            zIndex: 1000
                        }}
                    />
                </div>
            </div>
            <div className="bias-values">
                <div className="bias-value">
                    <span className="bias-label">Variety:</span>
                    <span className="bias-number">{(position.x * 100).toFixed(0)}%</span>
                </div>
                <div className="bias-value">
                    <span className="bias-label">Cost:</span>
                    <span className="bias-number">{(position.y * 100).toFixed(0)}%</span>
                </div>
            </div>
        </div>
    );
}

BiasGrid.propTypes = {
    onChange: PropTypes.func.isRequired
};

export default BiasGrid; 