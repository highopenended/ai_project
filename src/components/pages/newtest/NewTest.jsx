// import React, { useState } from 'react';
import { useState } from 'react';
import TabContainer from './components/TabContainer';
import Tab1 from './tabs/Tab1';
import Tab2 from './tabs/Tab2';
import Tab3 from './tabs/tab3';
import Tab4 from './tabs/Tab4';




function NewTest() {
    const [tabGroups, setTabGroups] = useState([
        [<Tab1 key="Tab1-0" />, <Tab2 key="Tab2-0" />, <Tab3 key="Tab3-0" />, <Tab4 key="Tab4-0" />]
    ]);

    const handleTabMove = (newTabs) => {
        setTabGroups(prevGroups => {
            const newGroups = [...prevGroups];
            newGroups[0] = newTabs;  // For now, we're just working with one group
            return newGroups;
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