// import React, { useState } from 'react';
import { useState } from 'react';
import TabContainer from './components/TabContainer';
import Tab1 from './tabs/Tab1';
import Tab2 from './tabs/Tab2';
import Tab3 from './tabs/Tab3';
import Tab4 from './tabs/Tab4';
import Tab5 from './tabs/Tab5';
import './NewTest.css';
import React from 'react';

function NewTest() {
    const [tabGroups, setTabGroups] = useState([
        [<Tab1 key="Tab1-0" />, <Tab2 key="Tab2-0" />, <Tab3 key="Tab3-0" />, <Tab4 key="Tab4-0" />, <Tab5 key="Tab5-0" />]
    ]);
    
    // Add new state for drag and drop operations
    const [draggedTab, setDraggedTab] = useState(null);
    const [draggedTabIndex, setDraggedTabIndex] = useState(null);
    const [sourceGroupIndex, setSourceGroupIndex] = useState(null);
    const [dropIndicators, setDropIndicators] = useState({
        leftGroup: null,
        rightGroup: null,
        betweenGroups: null
    });

    const handleTabMove = (newTabs, sourceGroupIndex, targetGroupIndex) => {
        console.group('Tab Move Operation');
        console.log('Current tab groups:', tabGroups);
        console.log('Move params:', {
            sourceGroupIndex,
            targetGroupIndex,
            newTabs: Array.isArray(newTabs) ? {
                length: newTabs.length,
                items: newTabs.map(tab => ({
                    type: tab?.type?.name,
                    key: tab?.key,
                    props: tab?.props
                }))
            } : 'Not an array'
        });
        
        setTabGroups(prevGroups => {
            const newGroups = [...prevGroups];
            
            if (targetGroupIndex !== undefined) {
                console.log('Moving between groups');
                const [sourceTab, dropIndex] = newTabs;
                console.log('Source tab:', {
                    type: sourceTab?.type?.name,
                    key: sourceTab?.key,
                    props: sourceTab?.props
                });
                console.log('Drop index:', dropIndex);
                
                const sourceGroup = [...prevGroups[sourceGroupIndex]];
                console.log('Source group before removal:', sourceGroup.map(tab => ({
                    type: tab?.type?.name,
                    key: tab?.key
                })));
                
                sourceGroup.splice(sourceGroup.indexOf(sourceTab), 1);
                console.log('Source group after removal:', sourceGroup.map(tab => ({
                    type: tab?.type?.name,
                    key: tab?.key
                })));
                
                if (sourceGroup.length === 0) {
                    console.log('Source group empty, removing group');
                    newGroups.splice(sourceGroupIndex, 1);
                    if (targetGroupIndex > sourceGroupIndex) {
                        targetGroupIndex--;
                        console.log('Adjusted target group index:', targetGroupIndex);
                    }
                } else {
                    newGroups[sourceGroupIndex] = sourceGroup;
                }

                const newTab = React.cloneElement(sourceTab, {
                    key: `${sourceTab.type.name}-${Date.now()}`
                });
                console.log('Created new tab:', {
                    type: newTab?.type?.name,
                    key: newTab?.key
                });
                
                if (!newGroups[targetGroupIndex]) {
                    console.log('Creating new target group');
                    newGroups[targetGroupIndex] = [newTab];
                } else {
                    const targetGroup = [...newGroups[targetGroupIndex]];
                    console.log('Target group before insertion:', targetGroup.map(tab => ({
                        type: tab?.type?.name,
                        key: tab?.key
                    })));
                    targetGroup.splice(dropIndex, 0, newTab);
                    console.log('Target group after insertion:', targetGroup.map(tab => ({
                        type: tab?.type?.name,
                        key: tab?.key
                    })));
                    newGroups[targetGroupIndex] = targetGroup;
                }
            } else {
                console.log('Reordering within same group');
                console.log('New order:', newTabs.map(tab => ({
                    type: tab?.type?.name,
                    key: tab?.key
                })));
                newGroups[sourceGroupIndex] = newTabs;
            }
            
            console.log('Final groups structure:', newGroups.map(group => 
                group.map(tab => ({
                    type: tab?.type?.name,
                    key: tab?.key
                }))
            ));
            console.groupEnd();
            return newGroups;
        });
    };

    const handleTabSplit = (tabInfo, sourceGroupIndex, targetPosition) => {
        console.group('Tab Split Operation');
        console.log('Split params:', {
            tabInfo,
            sourceGroupIndex,
            targetPosition
        });
        console.log('Current tab groups:', tabGroups);
        
        setTabGroups(prevGroups => {
            const newGroups = [...prevGroups];
            const sourceGroup = [...prevGroups[sourceGroupIndex]];
            
            console.log('Source group before split:', sourceGroup.map(tab => ({
                type: tab?.type?.name,
                key: tab?.key
            })));
            
            const sourceTab = sourceGroup.find(tab => tab.type.name === tabInfo.type);
            console.log('Found source tab:', sourceTab ? {
                type: sourceTab?.type?.name,
                key: sourceTab?.key
            } : 'Not found');
            
            if (!sourceTab) {
                console.error('Could not find tab to split:', tabInfo);
                console.groupEnd();
                return prevGroups;
            }
            
            sourceGroup.splice(sourceGroup.indexOf(sourceTab), 1);
            console.log('Source group after removal:', sourceGroup.map(tab => ({
                type: tab?.type?.name,
                key: tab?.key
            })));
            
            const newTab = React.cloneElement(sourceTab, {
                key: `${sourceTab.type.name}-${Date.now()}`
            });
            console.log('Created new tab:', {
                type: newTab?.type?.name,
                key: newTab?.key
            });
            
            const newGroup = [newTab];
            
            if (sourceGroup.length === 0) {
                console.log('Source group empty, removing');
                newGroups.splice(sourceGroupIndex, 1);
                if (typeof targetPosition === 'number' && targetPosition > sourceGroupIndex) {
                    targetPosition--;
                    console.log('Adjusted target position:', targetPosition);
                }
            } else {
                newGroups[sourceGroupIndex] = sourceGroup;
            }

            if (typeof targetPosition === 'number') {
                console.log('Inserting at specific position:', targetPosition);
                newGroups.splice(targetPosition, 0, newGroup);
            } else if (targetPosition === true) {
                console.log('Appending to end');
                newGroups.push(newGroup);
            } else {
                console.log('Prepending to start');
                newGroups.unshift(newGroup);
            }
            
            console.log('Final groups structure:', newGroups.map(group => 
                group.map(tab => ({
                    type: tab?.type?.name,
                    key: tab?.key
                }))
            ));
            console.groupEnd();
            return newGroups;
        });
    };

    return (
        <div className="new-test">
            {tabGroups.map((tabs, index) => (
                <TabContainer 
                    key={index} 
                    groupIndex={index}
                    tabs={tabs} 
                    draggedTab={draggedTab}
                    draggedTabIndex={draggedTabIndex}
                    sourceGroupIndex={sourceGroupIndex}
                    dropIndicators={dropIndicators}
                    onDragStart={(tab, index) => {
                        setDraggedTab(tab);
                        setDraggedTabIndex(index);
                        setSourceGroupIndex(index);
                    }}
                    onDragEnd={() => {
                        setDraggedTab(null);
                        setDraggedTabIndex(null);
                        setSourceGroupIndex(null);
                        setDropIndicators({
                            leftGroup: null,
                            rightGroup: null,
                            betweenGroups: null
                        });
                    }}
                    onDropIndicatorChange={(indicators) => {
                        setDropIndicators(prev => ({...prev, ...indicators}));
                    }}
                    onTabMove={(newTabs) => handleTabMove(newTabs, index)}
                    onTabSplit={handleTabSplit}
                />
            ))}
        </div>
    );
}

export default NewTest; 