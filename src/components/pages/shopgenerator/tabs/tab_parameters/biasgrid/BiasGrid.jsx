import { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import "./BiasGrid.css";
import MiniButtonGroup from "../../../shared/minibuttongroup/MiniButtonGroup";
import Section from "../../../shared/section/Section";

function BiasGrid({ setItemBias, itemBias }) {
    const gridRef = useRef(null);
    const positionRef = useRef(itemBias || { x: 0.5, y: 0.5 });
    const [position, setPosition] = useState(itemBias || { x: 0.5, y: 0.5 });
    const [isDragging, setIsDragging] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const frameRef = useRef();

    // Update position when value prop changes
    useEffect(() => {
        if (!isDragging && itemBias) {
            positionRef.current = itemBias;
            setPosition(itemBias);
        }
    }, [itemBias, isDragging]);

    const calculateNewPosition = (clientX, clientY) => {
        if (!gridRef.current) return null;

        const rect = gridRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));

        return { x, y };
    };

    const updateVisualPosition = (newPos) => {
        if (frameRef.current) {
            cancelAnimationFrame(frameRef.current);
        }

        frameRef.current = requestAnimationFrame(() => {
            setPosition(newPos);
        });
    };

    const handleMouseDown = (e) => {
        e.preventDefault();
        setIsDragging(true);
        const newPos = calculateNewPosition(e.clientX, e.clientY);
        if (newPos) {
            positionRef.current = newPos;
            updateVisualPosition(newPos);
        }
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();

        const newPos = calculateNewPosition(e.clientX, e.clientY);
        if (newPos) {
            positionRef.current = newPos;
            updateVisualPosition(newPos);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        // Only update parent state when dragging ends
        setItemBias(positionRef.current);
    };

    const handleReset = () => {
        const newPos = { x: 0.5, y: 0.5 };
        positionRef.current = newPos;
        setPosition(newPos);
        setItemBias(newPos);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        }

        return () => {
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
            }
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging]);

    return (
        <Section
            title="Shop Bias"
            miniButtonGroup={
                <MiniButtonGroup handleReset={handleReset} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            }
        >
            {/* <div className="bias-grid"> */}
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
            {/* </div> */}
        </Section>
    );
}

BiasGrid.propTypes = {
    setItemBias: PropTypes.func.isRequired,
    itemBias: PropTypes.object.isRequired,
};

export default BiasGrid;
