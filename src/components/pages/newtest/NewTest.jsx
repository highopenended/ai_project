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

    const handleTabMove = (newTabs, groupIndex) => {
        setTabGroups(prevGroups => {
            const newGroups = [...prevGroups];
            newGroups[groupIndex] = newTabs;
            return newGroups;
        });
    };

    const handleTabSplit = (tabToSplit, sourceGroupIndex, insertAtEnd) => {
        console.log('handleTabSplit called with:', { tabToSplit, sourceGroupIndex, insertAtEnd });
        
        setTabGroups(prevGroups => {
            // Create a copy of the groups
            const newGroups = [...prevGroups];
            
            // Find and remove the tab from its current group
            const sourceGroup = [...prevGroups[sourceGroupIndex]];
            const tabIndex = sourceGroup.findIndex(tab => tab.key === tabToSplit.key);
            
            if (tabIndex === -1) {
                console.error('Could not find tab to split:', tabToSplit);
                return prevGroups;
            }
            
            // Remove the tab from the source group
            sourceGroup.splice(tabIndex, 1);
            newGroups[sourceGroupIndex] = sourceGroup;
            
            // Create a new group with just this tab
            // Create a new instance of the tab with a unique key
            const newTab = React.cloneElement(tabToSplit, {
                key: `${tabToSplit.type.name}-${Date.now()}`
            });
            const newGroup = [newTab];
            
            // Insert the new group at the appropriate position
            if (insertAtEnd) {
                newGroups.push(newGroup);
            } else {
                newGroups.splice(sourceGroupIndex + 1, 0, newGroup);
            }
            
            console.log('New groups after split:', newGroups);
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