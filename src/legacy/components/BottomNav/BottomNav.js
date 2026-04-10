import React, { useEffect, useRef } from 'react';
import './_BottomNav.scss';

const BottomNavigation = ({ panels, visiblePanels, toggleVisibility, handleDragStart, handleDrop, handleDragOver, handleChange, handleCopy, handleClear, textareaRef, formData, checkedItems, handleCheckboxChange, isChecklistOpen }) => {
    const panelRefs = useRef([]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            panelRefs.current.forEach((ref, index) => {
                if (ref && !ref.contains(event.target) && visiblePanels[panels[index].id]) {
                    toggleVisibility(panels[index].id);
                }
            });
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [panelRefs, visiblePanels, panels, toggleVisibility]);

    return (
        <div className="alex-bottomnav">
            {panels.map((panel, index) => (
                <div key={index}>
                    <button className={`alex-bottomnav-button bottomnav-${panel.id}`} onClick={() => toggleVisibility(panel.id)}>
                        {visiblePanels[panel.id] ? `${panel.label}` : `${panel.label}`}
                    </button>
                    {visiblePanels[panel.id] && (
                        <div ref={(el) => (panelRefs.current[index] = el)} className="alex-bottomnav-panel">
                            {panel.content}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default BottomNavigation;