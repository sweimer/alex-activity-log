import React from 'react';
import PropTypes from 'prop-types';
import './_Checklist.scss';

const Checklist = ({ items, handleCheckboxChange, checkedItems, checklistDescription, checklistTitle }) => {
    return (
        <div className="alex-block-checklist hint-block">
            <h2>{checklistTitle}</h2>
            <p>{checklistDescription}</p>
            <ul>
                {items.map((item, index) => (
                    <li key={index}>
                        <label>
                            <input
                                type="checkbox"
                                checked={!!checkedItems[item]}
                                onChange={() => handleCheckboxChange(item)}
                            />
                            {item}
                        </label>
                    </li>
                ))}
            </ul>
        </div>
    );
};

Checklist.propTypes = {
    items: PropTypes.arrayOf(PropTypes.string).isRequired,
    handleCheckboxChange: PropTypes.func.isRequired,
    checkedItems: PropTypes.object.isRequired,
    checklistDescription: PropTypes.string.isRequired,
    checklistTitle: PropTypes.string.isRequired
};

export default Checklist;