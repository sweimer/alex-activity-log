import React, { useState } from 'react';
import Checklist from '../../Checklist/Checklist.js';
import { checklistDescription, checklistTitle, checklistItems } from '../../Checklist/content/ChecklistContent-Home.js';

const BottomNavContentHome = [
    {
        id: 'form',
        label: 'Form',
        content: (
            <div className="alex-bottomnav-content">
                <h2>This is dummy content for the Form panel.</h2>
            </div>
        )
    },
    {
        id: 'results',
        label: 'Results',
        content: (
            <div className="alex-bottomnav-content">
                <p>This is dummy content for the Results panel.</p>
            </div>
        )
    },
    {
        id: 'checklist',
        label: 'Checklist',
        content: (
            <div className="alex-bottomnav-content">
                <Checklist
                    items={checklistItems}
                    handleCheckboxChange={() => {}}
                    checkedItems={{}}
                    checklistDescription={checklistDescription}
                    checklistTitle={checklistTitle}
                />
            </div>
        )
    }
];

export default BottomNavContentHome;