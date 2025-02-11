// import React, { useState } from 'react';
import { useState, useEffect } from 'react';
import TabContainer from './components/TabContainer';
import Tab1 from './tabs/Tab1';
import Tab2 from './tabs/Tab2';
import Tab3 from './tabs/Tab3';
import Tab4 from './tabs/Tab4';
import Tab5 from './tabs/Tab5';
import './NewTest.css';
import React from 'react';

/**
 * NewTest Component
 * Parent component that manages multiple tab groups with drag and drop functionality
 * 
 * State Management:
 * - tabGroups: 2D array where each inner array represents a group of tabs
 * - draggedTab: Currently dragged tab component
 * - draggedTabIndex: Index of dragged tab in its group
 * - sourceGroupIndex: Index of the group where drag started
 * - dropIndicators: Visual indicators for group splitting
 * 
 * Key Behaviors:
 * 1. Tab Movement:
 *    - Within same group: Reorders tabs
 *    - Between groups: Moves tab to new group
 *    - To edges: Creates new groups
 * 
 * 2. State Updates:
 *    - Uses setTimeout to ensure clean state transitions
 *    - Resets drag states before updating groups
 *    - Maintains group integrity during operations
 * 
 * Common Issues & Solutions:
 * 1. Double drag required: Check state reset timing
 * 2. Groups not updating: Verify setTimeout execution
 * 3. Tab duplication: Check key generation
 * 4. State sync issues: Verify parent-child prop flow
 */
function NewTest() {
    // State for managing tab groups and drag operations
    const [tabGroups, setTabGroups] = useState([
        [<Tab1 key="Tab1-0" />, <Tab2 key="Tab2-0" />, <Tab3 key="Tab3-0" />, <Tab4 key="Tab4-0" />, <Tab5 key="Tab5-0" />]
    ]);
    
    // State for drag and drop operations
    const [draggedTab, setDraggedTab] = useState(null);
    const [draggedTabIndex, setDraggedTabIndex] = useState(null);
    const [sourceGroupIndex, setSourceGroupIndex] = useState(null);
    const [dropIndicators, setDropIndicators] = useState({
        leftGroup: null,
        rightGroup: null,
        betweenGroups: null,
        betweenGroupsRight: null
    });
    const [isResizing, setIsResizing] = useState(false);
    const [flexBasis, setFlexBasis] = useState([]);

    // Initialize flex basis when groups change
    useEffect(() => {
        if (tabGroups.length !== flexBasis.length) {
            setFlexBasis(tabGroups.map(() => `${100 / tabGroups.length}%`));
        }
    }, [tabGroups.length]);

    /**
     * Handles moving tabs within and between groups
     * @param {Array|Array[]} newTabs - Either the reordered tabs or [sourceTab, dropIndex]
     * @param {number} sourceGroupIndex - Index of the source group
     * @param {number} [targetGroupIndex] - Index of the target group (if moving between groups)
     */
    const handleTabMove = (newTabs, sourceGroupIndex, targetGroupIndex) => {
        // First reset all drag states to ensure clean state for next operation
        setDraggedTab(null);
        setDraggedTabIndex(null);
        setSourceGroupIndex(null);
        setDropIndicators({
            leftGroup: null,
            rightGroup: null,
            betweenGroups: null,
            betweenGroupsRight: null
        });

        // Then update the groups after a short delay to ensure state is clean
        setTimeout(() => {
            setTabGroups(prevGroups => {
                const newGroups = [...prevGroups];
                
                if (targetGroupIndex !== undefined) {
                    const [sourceTab, dropIndex] = newTabs;
                    const sourceGroup = [...prevGroups[sourceGroupIndex]];
                    
                    // Find and remove the source tab
                    const sourceTabIndex = sourceGroup.findIndex(tab => 
                        tab.type.name === sourceTab.type.name && 
                        (!tab.key || tab.key === sourceTab.key)
                    );
                    if (sourceTabIndex !== -1) {
                        sourceGroup.splice(sourceTabIndex, 1);
                    }
                    
                    if (sourceGroup.length === 0) {
                        newGroups.splice(sourceGroupIndex, 1);
                        if (targetGroupIndex > sourceGroupIndex) {
                            targetGroupIndex--;
                        }
                    } else {
                        newGroups[sourceGroupIndex] = sourceGroup;
                    }

                    // When moving back to original group, don't create a new tab
                    const targetGroup = [...(newGroups[targetGroupIndex] || [])];
                    const isMovingBackToOriginal = sourceGroupIndex === targetGroupIndex;
                    
                    if (isMovingBackToOriginal) {
                        targetGroup.splice(dropIndex, 0, sourceTab);
                    } else {
                        const newTab = React.cloneElement(sourceTab, {
                            key: `${sourceTab.type.name}-${Date.now()}`
                        });
                        targetGroup.splice(dropIndex, 0, newTab);
                    }
                    
                    newGroups[targetGroupIndex] = targetGroup;
                } else {
                    newGroups[sourceGroupIndex] = newTabs;
                }
                
                return newGroups;
            });
        }, 0);
    };

    /**
     * Handles creating new groups by splitting existing ones
     * @param {Object} tabInfo - Information about the tab being split
     * @param {number} sourceGroupIndex - Index of the source group
     * @param {boolean|number} targetPosition - Where to create the new group
     */
    const handleTabSplit = (tabInfo, sourceGroupIndex, targetPosition) => {
        setTabGroups(prevGroups => {
            const newGroups = [...prevGroups];
            const sourceGroup = [...prevGroups[sourceGroupIndex]];
            
            const sourceTab = sourceGroup.find(tab => tab.type.name === tabInfo.type);
            
            if (!sourceTab) {
                return prevGroups;
            }
            
            sourceGroup.splice(sourceGroup.indexOf(sourceTab), 1);
            
            const newTab = React.cloneElement(sourceTab, {
                key: `${sourceTab.type.name}-${Date.now()}`
            });
            
            const newGroup = [newTab];
            
            if (sourceGroup.length === 0) {
                newGroups.splice(sourceGroupIndex, 1);
                if (typeof targetPosition === 'number' && targetPosition > sourceGroupIndex) {
                    targetPosition--;
                }
            } else {
                newGroups[sourceGroupIndex] = sourceGroup;
            }

            // Handle numeric target position (between groups)
            if (typeof targetPosition === 'number') {
                newGroups.splice(targetPosition, 0, newGroup);
            } else if (targetPosition === true) {
                newGroups.push(newGroup);
            } else {
                newGroups.unshift(newGroup);
            }
            
            return newGroups;
        });
    };

    const handleResize = (newWidth, groupIndex) => {
        if (groupIndex >= tabGroups.length - 1) return;

        setIsResizing(true);
        const container = document.querySelector('.new-test');
        if (!container) return;

        const totalWidth = container.clientWidth;
        const minWidth = 200; // Minimum width in pixels
        
        setFlexBasis(prev => {
            const newBasis = [...prev];
            
            // Calculate the new width percentage
            let currentPercent = (newWidth / totalWidth) * 100;
            
            // Ensure minimum width
            if (currentPercent < (minWidth / totalWidth) * 100) {
                currentPercent = (minWidth / totalWidth) * 100;
            }
            
            // Calculate remaining width for next group
            const remainingPercent = parseFloat(newBasis[groupIndex]) + parseFloat(newBasis[groupIndex + 1]);
            const nextGroupPercent = remainingPercent - currentPercent;
            
            // Ensure next group also maintains minimum width
            if (nextGroupPercent < (minWidth / totalWidth) * 100) {
                return prev;
            }
            
            newBasis[groupIndex] = `${currentPercent}%`;
            newBasis[groupIndex + 1] = `${nextGroupPercent}%`;
            
            return newBasis;
        });
    };

    return (
        <div className={`new-test ${isResizing ? 'resizing' : ''}`}>
            {tabGroups.map((tabs, index) => (
                <TabContainer 
                    key={index} 
                    groupIndex={index}
                    tabs={tabs} 
                    draggedTab={draggedTab}
                    draggedTabIndex={draggedTabIndex}
                    sourceGroupIndex={sourceGroupIndex}
                    dropIndicators={dropIndicators}
                    isLastGroup={index === tabGroups.length - 1}
                    onResize={handleResize}
                    style={{ width: flexBasis[index] || `${100 / tabGroups.length}%` }}
                    onDragStart={(tab, tabIndex) => {
                        setDraggedTab(tab);
                        setDraggedTabIndex(tabIndex);
                        setSourceGroupIndex(index);
                    }}
                    onDragEnd={() => {
                        setDraggedTab(null);
                        setDraggedTabIndex(null);
                        setSourceGroupIndex(null);
                        setIsResizing(false);
                        setDropIndicators({
                            leftGroup: null,
                            rightGroup: null,
                            betweenGroups: null,
                            betweenGroupsRight: null
                        });
                    }}
                    onDropIndicatorChange={(indicators) => {
                        setDropIndicators(prev => ({...prev, ...indicators}));
                    }}
                    onTabMove={(newTabs) => {
                        if (Array.isArray(newTabs) && newTabs.length === 2 && typeof newTabs[1] === 'number') {
                            handleTabMove(newTabs, sourceGroupIndex, index);
                        } else {
                            handleTabMove(newTabs, index);
                        }
                    }}
                    onTabClick={() => {}}
                    onTabSplit={handleTabSplit}
                />
            ))}
        </div>
    );
}

export default NewTest; 