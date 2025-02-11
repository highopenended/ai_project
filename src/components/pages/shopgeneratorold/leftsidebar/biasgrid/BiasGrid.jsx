import { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import "./BiasGrid.css";
import ButtonGroup from "../../components/ButtonGroup";
import Section from "../../components/Section";

function BiasGrid({ onChange, value }) {
    const gridRef = useRef(null);
    const [position, setPosition] = useState(value || { x: 0.5, y: 0.5 }); // Use value if provided, otherwise center
    const [isDragging, setIsDragging] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Update position when value prop changes
    useEffect(() => {
        if (value) {
            setPosition(value);
        }
    }, [value]);

    const updatePosition = (clientX, clientY) => {
        if (!gridRef.current) return;

        const rect = gridRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height)); // Invert Y so 0 is bottom

        setPosition({ x, y });
        onChange({ x, y });
    };

    const handleMouseDown = (e) => {
        e.preventDefault(); // Prevent text selection
        setIsDragging(true);
        updatePosition(e.clientX, e.clientY);
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        updatePosition(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleReset = () => {
        setPosition({ x: 0.5, y: 0.5 });
        onChange({ x: 0.5, y: 0.5 });
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        }

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging]);

    return (
        <Section
            title="Shop Bias"
            buttonGroup={
                <ButtonGroup handleReset={handleReset} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            }
        >
            <div className="bias-grid">
                {!isCollapsed && (
                    <div className="bias-grid-content">
                        <div className="grid-label top">Expensive</div>
                        <div className="grid-label bottom">Cheap</div>
                        <div className="grid-label left">Low Variety</div>
                        <div className="grid-label right">High Variety</div>

                        <div
                            className={`bias-grid-area ${isDragging ? "dragging" : ""}`}
                            ref={gridRef}
                            onMouseDown={handleMouseDown}
                        >
                            {/* Grid lines */}
                            <div className="grid-lines horizontal" />
                            <div className="grid-lines vertical" />

                            {/* Values readout */}
                            <div className="grid-readout">
                                <span>Variety: {(position.x * 100).toFixed(0)}%</span>
                                <span>Cost: {(position.y * 100).toFixed(0)}%</span>
                            </div>

                            {/* Center marker */}
                            <div className="grid-center-marker" />

                            {/* Draggable dot */}
                            <div
                                className="grid-dot"
                                style={{
                                    left: `${position.x * 100}%`,
                                    top: `${(1 - position.y) * 100}%`,
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </Section>
    );
}

BiasGrid.propTypes = {
    onChange: PropTypes.func.isRequired,
    value: PropTypes.object,
};

export default BiasGrid;
