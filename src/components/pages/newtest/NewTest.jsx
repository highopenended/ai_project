// import React, { useState } from 'react';
import { useState } from 'react';
import TabContainer from './components/TabContainer';
import Tab1 from './tabs/Tab1';
import Tab2 from './tabs/Tab2';
import Tab3 from './tabs/tab3';
import Tab4 from './tabs/Tab4';
import Tab5 from './tabs/Tab5';
import './NewTest.css';
import React from 'react';

function NewTest() {
    const [tabGroups, setTabGroups] = useState([
        [<Tab1 key="Tab1-0" />, <Tab2 key="Tab2-0" />, <Tab3 key="Tab3-0" />, <Tab4 key="Tab4-0" />, <Tab5 key="Tab5-0" />]
    ]);

    const handleTabMove = (newTabs, sourceGroupIndex, targetGroupIndex) => {
        console.log('handleTabMove:', { newTabs, sourceGroupIndex, targetGroupIndex });
        
        setTabGroups(prevGroups => {
            const newGroups = [...prevGroups];
            
            if (targetGroupIndex !== undefined) {
                // Moving to another group
                const [sourceTab, dropIndex] = newTabs;
                const sourceGroup = [...prevGroups[sourceGroupIndex]];
                
                // Remove from source group first
                sourceGroup.splice(sourceGroup.indexOf(sourceTab), 1);
                
                // If source group is now empty, remove it
                if (sourceGroup.length === 0) {
                    newGroups.splice(sourceGroupIndex, 1);
                    // Adjust target index if it's after the removed group
                    if (targetGroupIndex > sourceGroupIndex) {
                        targetGroupIndex--;
                    }
                } else {
                    newGroups[sourceGroupIndex] = sourceGroup;
                }

                // Create new instance of the tab with a new key
                const newTab = React.cloneElement(sourceTab, {
                    key: `${sourceTab.type.name}-${Date.now()}`
                });
                
                // Add to target group at the specified position
                if (!newGroups[targetGroupIndex]) {
                    newGroups[targetGroupIndex] = [newTab];
                } else {
                    const targetGroup = [...newGroups[targetGroupIndex]];
                    targetGroup.splice(dropIndex, 0, newTab);
                    newGroups[targetGroupIndex] = targetGroup;
                }
            } else {
                // Moving within the same group
                newGroups[sourceGroupIndex] = newTabs;
            }
            
            return newGroups;
        });
    };

    const handleTabSplit = (tabInfo, sourceGroupIndex, targetPosition) => {
        console.log('handleTabSplit called with:', { tabInfo, sourceGroupIndex, targetPosition });
        
        setTabGroups(prevGroups => {
            const newGroups = [...prevGroups];
            
            // Find the source tab
            const sourceGroup = [...prevGroups[sourceGroupIndex]];
            const sourceTab = sourceGroup.find(tab => tab.type.name === tabInfo.type);
            
            if (!sourceTab) {
                console.error('Could not find tab to split:', tabInfo);
                return prevGroups;
            }
            
            // Remove the tab from the source group
            sourceGroup.splice(sourceGroup.indexOf(sourceTab), 1);
            
            // Create a new group with just this tab
            const newTab = React.cloneElement(sourceTab, {
                key: `${sourceTab.type.name}-${Date.now()}`
            });
            const newGroup = [newTab]; // This tab will automatically become active in the new group
            
            // If the source group is now empty, remove it
            if (sourceGroup.length === 0) {
                newGroups.splice(sourceGroupIndex, 1);
                
                // Adjust target position if it's after the removed group
                if (typeof targetPosition === 'number' && targetPosition > sourceGroupIndex) {
                    targetPosition--;
                }
            } else {
                newGroups[sourceGroupIndex] = sourceGroup;
            }

            // Insert the new group at the appropriate position
            if (typeof targetPosition === 'number') {
                // Insert at specific position between groups
                newGroups.splice(targetPosition, 0, newGroup);
            } else if (targetPosition === true) {
                // Insert at end
                newGroups.push(newGroup);
            } else {
                // Insert at start
                newGroups.unshift(newGroup);
            }
            
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
                    onTabMove={(newTabs) => handleTabMove(newTabs, index)}
                    onTabSplit={handleTabSplit}
                />
            ))}
        </div>
    );
}

export default NewTest; 