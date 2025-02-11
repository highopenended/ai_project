import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

import Tab from './tab.jsx';
import './TabContainer.css';

function TabContainer({ 
    tabs, 
    onTabMove, 
    onTabSplit, 
    groupIndex,
    draggedTab,
    draggedTabIndex,
    dropIndicators,
    onDragStart,
    onDragEnd,
    onDropIndicatorChange,
    onTabClick
}) {
    const [activeTab, setActiveTab] = useState(tabs[0]);
    const [dropIndex, setDropIndex] = useState(null);
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
        onTabClick?.(tab, tabs.indexOf(tab));
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

        const tabElements = Array.from(e.currentTarget.parentElement.children);
        originalPositions.current = tabElements.map(tab => {
            const rect = tab.getBoundingClientRect();
            return {
                left: rect.left,
                right: rect.right,
                width: rect.width,
                center: rect.left + rect.width / 2
            };
        });
        
        onDragStart(tab, index);
        
        e.dataTransfer.setData('text/plain', index.toString());
        e.dataTransfer.setData('groupIndex', groupIndex.toString());
        e.dataTransfer.setData('tabInfo', JSON.stringify({
            type: tab.type.name,
            index: index,
            key: tab.key
        }));
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        const containerRect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        // Get header area bounds
        const headerRect = e.currentTarget.querySelector('.tab-header').getBoundingClientRect();
        const isOverHeader = mouseY >= headerRect.top && mouseY <= headerRect.bottom;
        
        if (mouseY >= containerRect.top && mouseY <= containerRect.bottom) {
            const distanceFromLeft = mouseX - containerRect.left;
            const distanceFromRight = containerRect.right - mouseX;

            const containerParent = e.currentTarget.parentElement;
            const allGroups = Array.from(containerParent.children);
            const currentGroupIndex = allGroups.indexOf(e.currentTarget);
            const isFirstGroup = currentGroupIndex === 0;
            const isLastGroup = currentGroupIndex === allGroups.length - 1;

            // Only show split indicators when NOT over the header
            const newIndicators = {
                leftGroup: !isOverHeader && isFirstGroup && distanceFromLeft < edgeThreshold ? groupIndex : null,
                rightGroup: !isOverHeader && isLastGroup && distanceFromRight < edgeThreshold ? groupIndex : null,
                betweenGroups: !isOverHeader && (!isFirstGroup && distanceFromLeft < edgeThreshold || !isLastGroup && distanceFromRight < edgeThreshold) ? groupIndex : null
            };
            
            onDropIndicatorChange(newIndicators);

            // Calculate drop index regardless of whether we're over header or not
            const relativeX = mouseX - headerRect.left;
            let newDropIndex = originalPositions.current.length;
            
            if (relativeX < originalPositions.current[0]?.center - headerRect.left) {
                newDropIndex = 0;
            } else {
                for (let i = 1; i < originalPositions.current.length; i++) {
                    const prevCenter = originalPositions.current[i - 1]?.center - headerRect.left;
                    const currentCenter = originalPositions.current[i]?.center - headerRect.left;
                    
                    if (relativeX >= prevCenter && relativeX < currentCenter) {
                        newDropIndex = i;
                        break;
                    }
                }
            }

            // When creating a new group, default to index 0
            if (!isOverHeader && (newIndicators.leftGroup !== null || 
                newIndicators.rightGroup !== null || 
                newIndicators.betweenGroups !== null)) {
                newDropIndex = 0;
            }
            
            if (dropIndex !== newDropIndex) {
                setDropIndex(newDropIndex);
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
            onDropIndicatorChange({
                leftGroup: null,
                rightGroup: null,
                betweenGroups: null
            });
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
                left: dropIndicators.leftGroup === groupIndex,
                right: dropIndicators.rightGroup === groupIndex,
                between: dropIndicators.betweenGroups === groupIndex
            }
        });
        
        const wasShowingLeftIndicator = dropIndicators.leftGroup === groupIndex;
        const wasShowingRightIndicator = dropIndicators.rightGroup === groupIndex;
        const wasShowingBetweenIndicator = dropIndicators.betweenGroups === groupIndex;
        
        onDropIndicatorChange({
            leftGroup: null,
            rightGroup: null,
            betweenGroups: null
        });
        
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

        setDropIndex(null);
        console.groupEnd();
    };

    const handleDragEnd = () => {
        setDropIndex(null);
        onDragEnd();
        if (edgeHoldTimeout.current) {
            clearTimeout(edgeHoldTimeout.current);
            edgeHoldTimeout.current = null;
        }
        // Clean up the global reference if drag is cancelled
        delete window.__draggedTab;
    };

    const getTabStyle = (index) => {
        // Only hide the dragged tab in its original group
        if (draggedTabIndex === null || dropIndex === null || draggedTab === null) return {};
        
        // Only apply visibility:hidden in the source group where the drag started
        if (draggedTab.key && tabs.find(tab => tab.key === draggedTab.key)) {
            if (index === draggedTabIndex) {
                return { visibility: 'hidden' };
            }
        }
        
        const tabElement = tabRefs.current[index];
        if (!tabElement) return {};
        
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
            className={`tab-container ${dropIndicators.leftGroup === groupIndex ? 'show-left-indicator' : ''} ${dropIndicators.rightGroup === groupIndex ? 'show-right-indicator' : ''} ${dropIndicators.betweenGroups === groupIndex ? 'show-between-indicator' : ''}`}
            onDragOver={handleDragOver}
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
    draggedTab: PropTypes.node,
    draggedTabIndex: PropTypes.number,
    dropIndicators: PropTypes.shape({
        leftGroup: PropTypes.number,
        rightGroup: PropTypes.number,
        betweenGroups: PropTypes.number
    }).isRequired,
    onDragStart: PropTypes.func.isRequired,
    onDragEnd: PropTypes.func.isRequired,
    onDropIndicatorChange: PropTypes.func.isRequired,
    onTabClick: PropTypes.func
};

export default TabContainer;
