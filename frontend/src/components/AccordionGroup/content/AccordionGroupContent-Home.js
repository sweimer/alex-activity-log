import React, { useState } from 'react';
import Checklist from '../../Checklist/Checklist.js';
import { checklistDescription, checklistTitle, checklistItems } from '../../Checklist/content/ChecklistContent-Home.js';

const AccordionGroupContentHome = [
    { title: 'Accordion 1', content: '<div>test</div>' },
    { title: 'Accordion 2', content: 'Content for accordion 2' },
    {
        title: 'Checklist',
        content: (
            <Checklist
                items={checklistItems}
                handleCheckboxChange={() => {}}
                checkedItems={{}}
                checklistDescription={checklistDescription}
                checklistTitle={checklistTitle}
            />
        )
    }
];

export default AccordionGroupContentHome;