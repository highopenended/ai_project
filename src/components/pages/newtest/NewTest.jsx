// import React, { useState } from 'react';
import { useState } from 'react';
import TabContainer from './components/TabContainer';
import Tab1 from './tabs/Tab1';
import Tab2 from './tabs/Tab2';
import Tab3 from './tabs/tab3';

function NewTest() {
    const [tabGroups, setTabGroups] = useState([
        [<Tab1 key="Tab1-0" />, <Tab2 key="Tab2-0" />, <Tab3 key="Tab3-0" />]
    ]);

    const handleTabMove = (tab) => {
        setTabGroups((prevGroups) => {
            // Find the source group
            const sourceGroupIndex = prevGroups.findIndex(group => group.includes(tab));
            if (sourceGroupIndex === -1) return prevGroups;

            // Remove the tab from the source group
            const newGroups = prevGroups.map((group, index) =>
                index === sourceGroupIndex ? group.filter(t => t !== tab) : group
            );

            // Add the tab to a new group (for simplicity, just append it to the last group)
            newGroups[newGroups.length - 1].push(tab);

            // Remove empty groups
            return newGroups.filter(group => group.length > 0);
        });
    };

    return (
        <div className="new-test">
            {tabGroups.map((tabs, index) => (
                <TabContainer key={index} tabs={tabs} onTabMove={handleTabMove} />
            ))}
        </div>
    );
}

export default NewTest; 