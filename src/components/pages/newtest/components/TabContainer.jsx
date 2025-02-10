import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

import Tab from './tab.jsx';
import './TabContainer.css';

function TabContainer({ tabs, onTabMove, onTabSplit, groupIndex }) {
    const [activeTab, setActiveTab] = useState(tabs[0]);
    const [draggedTab, setDraggedTab] = useState(null);
    const [draggedTabIndex, setDraggedTabIndex] = useState(null);
    const [dropIndex, setDropIndex] = useState(null);
    const [showLeftIndicator, setShowLeftIndicator] = useState(false);
    const [showRightIndicator, setShowRightIndicator] = useState(false);
    const [showBetweenIndicator, setShowBetweenIndicator] = useState(false);
    const tabRefs = useRef({});
    const originalPositions = useRef([]);
    const edgeThreshold = 40;
    const edgeHoldTimeout = useRef(null);

    // Update active tab if the current one is no longer in the tabs array
    useEffect(() => {
        if (!tabs.includes(activeTab)) {
            setActiveTab(tabs[0]);
        }
    }, [tabs, activeTab]);

    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };

    const handleDragStart = (e, tab, index) => {
        // Safety check for tab structure
        if (!tab || !tab.type) {
            console.error('Invalid tab structure in handleDragStart:', {
                tab,
                hasType: !!tab?.type,
                typeName: tab?.type?.name,
                index
            });
            return;
        }

        console.group('Drag Start');
        console.log('Tab being dragged:', {
            type: tab.type.name,
            key: tab.key,
            index,
            groupIndex,
            props: tab.props
        });

        const tabElements = Array.from(e.currentTarget.parentElement.children);
        console.log('All tabs in group:', tabElements.map((el, i) => ({
            index: i,
            key: el.getAttribute('data-key'),
            className: el.className
        })));
        
        originalPositions.current = tabElements.map(tab => {
            const rect = tab.getBoundingClientRect();
            return {
                left: rect.left,
                right: rect.right,
                width: rect.width,
                center: rect.left + rect.width / 2
            };
        });
        console.log('Original positions:', originalPositions.current);
        
        setDraggedTab(tab);
        setDraggedTabIndex(index);
        
        e.dataTransfer.setData('text/plain', index.toString());
        e.dataTransfer.setData('groupIndex', groupIndex.toString());
        e.dataTransfer.setData('tabInfo', JSON.stringify({
            type: tab.type.name,
            index: index,
            key: tab.key
        }));

        console.log('Data transfer set:', {
            index: index.toString(),
            groupIndex: groupIndex.toString(),
            tabInfo: {
                type: tab.type.name,
                index: index,
                key: tab.key
            }
        });
        console.groupEnd();
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        const containerRect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        // Get header area bounds
        const headerRect = e.currentTarget.querySelector('.tab-header').getBoundingClientRect();
        const isOverHeader = mouseY >= headerRect.top && mouseY <= headerRect.bottom;
        
        // Only process if we're within the vertical bounds of the container
        if (mouseY >= containerRect.top && mouseY <= containerRect.bottom) {
            // Check if we're near the edges of the container
            const distanceFromLeft = mouseX - containerRect.left;
            const distanceFromRight = containerRect.right - mouseX;

            // Get information about the current group's position
            const containerParent = e.currentTarget.parentElement;
            const allGroups = Array.from(containerParent.children);
            const currentGroupIndex = allGroups.indexOf(e.currentTarget);
            const isFirstGroup = currentGroupIndex === 0;
            const isLastGroup = currentGroupIndex === allGroups.length - 1;

            // Clear all indicators first
            setShowLeftIndicator(false);
            setShowRightIndicator(false);
            setShowBetweenIndicator(false);

            // If we're over the header, only handle within-group movement
            if (isOverHeader) {
                // Handle within-group movement
                const relativeX = mouseX - headerRect.left;
                
                // Find the insertion point based on original positions
                let newDropIndex = originalPositions.current.length;
                
                // Special case: if we're before the first tab's center
                if (relativeX < originalPositions.current[0]?.center - headerRect.left) {
                    newDropIndex = 0;
                } else {
                    // Find the gap we're currently in
                    for (let i = 1; i < originalPositions.current.length; i++) {
                        const prevCenter = originalPositions.current[i - 1]?.center - headerRect.left;
                        const currentCenter = originalPositions.current[i]?.center - headerRect.left;
                        
                        if (relativeX >= prevCenter && relativeX < currentCenter) {
                            newDropIndex = i;
                            break;
                        }
                    }
                }
                
                if (dropIndex !== newDropIndex) {
                    setDropIndex(newDropIndex);
                }
            } 
            // When not over header, handle group creation/splitting
            else {
                // Handle edge cases for leftmost and rightmost groups
                if (isFirstGroup && distanceFromLeft < edgeThreshold) {
                    setShowLeftIndicator(true);
                    setDropIndex(null);
                    return;
                }
                if (isLastGroup && distanceFromRight < edgeThreshold) {
                    setShowRightIndicator(true);
                    setDropIndex(null);
                    return;
                }

                // Check for between-group position
                if (!isFirstGroup && distanceFromLeft < edgeThreshold) {
                    setShowBetweenIndicator(true);
                    setDropIndex(null);
                }
                else if (!isLastGroup && distanceFromRight < edgeThreshold) {
                    setShowBetweenIndicator(true);
                    setDropIndex(null);
                }
            }
        }
    };

    const handleDragLeave = (e) => {
        const containerRect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        const isOutsideContainer = 
            mouseX < containerRect.left ||
            mouseX > containerRect.right ||
            mouseY < containerRect.top ||
            mouseY > containerRect.bottom;
            
        if (isOutsideContainer) {
            console.log('Mouse left container, clearing indicators');
            setShowLeftIndicator(false);
            setShowRightIndicator(false);
            setShowBetweenIndicator(false);
            if (edgeHoldTimeout.current) {
                clearTimeout(edgeHoldTimeout.current);
                edgeHoldTimeout.current = null;
            }
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        
        console.group('Drop Operation');
        const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'));
        const sourceGroupIndex = parseInt(e.dataTransfer.getData('groupIndex'));
        const tabInfo = JSON.parse(e.dataTransfer.getData('tabInfo'));
        
        console.log('Drop data:', {
            sourceIndex,
            sourceGroupIndex,
            tabInfo,
            currentGroupIndex: groupIndex,
            dropIndex,
            indicators: {
                left: showLeftIndicator,
                right: showRightIndicator,
                between: showBetweenIndicator
            }
        });
        
        const wasShowingLeftIndicator = showLeftIndicator;
        const wasShowingRightIndicator = showRightIndicator;
        const wasShowingBetweenIndicator = showBetweenIndicator;
        
        setShowLeftIndicator(false);
        setShowRightIndicator(false);
        setShowBetweenIndicator(false);
        
        if (wasShowingBetweenIndicator) {
            console.log('Creating new group between existing groups');
            onTabSplit(tabInfo, sourceGroupIndex, groupIndex);
        }
        else if (wasShowingLeftIndicator || wasShowingRightIndicator) {
            console.log('Creating new group at edge');
            onTabSplit(tabInfo, sourceGroupIndex, wasShowingRightIndicator);
        }
        else if (sourceGroupIndex !== groupIndex) {
            console.log('Moving tab between groups');
            const targetIndex = dropIndex !== null ? dropIndex : tabs.length;
            console.log('Target details:', {
                sourceGroupIndex,
                targetGroupIndex: groupIndex,
                targetIndex,
                totalTabs: tabs.length
            });
            onTabMove([draggedTab, targetIndex], sourceGroupIndex, groupIndex);
        }
        else if (sourceIndex !== dropIndex && dropIndex !== null) {
            console.log('Reordering within same group');
            console.log('Reorder details:', {
                sourceIndex,
                dropIndex,
                groupIndex
            });
            const newTabs = [...tabs];
            const [movedTab] = newTabs.splice(sourceIndex, 1);
            newTabs.splice(dropIndex, 0, movedTab);
            onTabMove(newTabs, groupIndex);
            if (activeTab === tabs[sourceIndex]) {
                setActiveTab(movedTab);
            }
        }

        setDraggedTab(null);
        setDraggedTabIndex(null);
        setDropIndex(null);
        console.groupEnd();
    };

    const handleDragEnd = () => {
        setDraggedTab(null);
        setDraggedTabIndex(null);
        setDropIndex(null);
        setShowLeftIndicator(false);
        setShowRightIndicator(false);
        setShowBetweenIndicator(false);
        if (edgeHoldTimeout.current) {
            clearTimeout(edgeHoldTimeout.current);
            edgeHoldTimeout.current = null;
        }
        // Clean up the global reference if drag is cancelled
        delete window.__draggedTab;
    };

    const getTabStyle = (index) => {
        if (draggedTabIndex === null || dropIndex === null) return {};
        
        if (index === draggedTabIndex) {
            return { visibility: 'hidden' };
        }
        
        const draggedRect = tabRefs.current[draggedTabIndex]?.getBoundingClientRect();
        const tabWidth = draggedRect ? draggedRect.width : 0;
        
        if (draggedTabIndex < dropIndex) {
            if (index > draggedTabIndex && index <= dropIndex) {
                return { transform: `translateX(-${tabWidth}px)` };
            }
        } else if (draggedTabIndex > dropIndex) {
            if (index >= dropIndex && index < draggedTabIndex) {
                return { transform: `translateX(${tabWidth}px)` };
            }
        }
        
        return {};
    };

    return (
        <div 
            className={`tab-container ${showLeftIndicator ? 'show-left-indicator' : ''} ${showRightIndicator ? 'show-right-indicator' : ''} ${showBetweenIndicator ? 'show-between-indicator' : ''}`}
            onDragOver={(e) => {
                e.preventDefault();
                handleDragOver(e);
            }}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="tab-header">
                {tabs.map((tab, index) => {
                    // Safety check for tab structure
                    if (!tab || !tab.type) {
                        console.error('Invalid tab structure:', tab);
                        return null;
                    }

                    const tabKey = tab.key || `tab-${tab.type.name || 'unknown'}-${index}`;
                    
                    return (
                        <Tab
                            key={tabKey}
                            tab={tab}
                            index={index}
                            isActive={tab === activeTab}
                            isDragging={draggedTab === tab}
                            isDropTarget={dropIndex === index}
                            tabRef={el => tabRefs.current[index] = el}
                            style={getTabStyle(index)}
                            onTabClick={handleTabClick}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                        />
                    );
                })}
            </div>
            <div className="tab-content">
                {activeTab}
            </div>
        </div>
    );
}

TabContainer.propTypes = {
    tabs: PropTypes.arrayOf(PropTypes.node).isRequired,
    onTabMove: PropTypes.func.isRequired,
    onTabSplit: PropTypes.func.isRequired,
    groupIndex: PropTypes.number.isRequired,
};

export default TabContainer;
