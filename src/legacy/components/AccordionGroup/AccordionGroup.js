import React, { useState } from 'react';
import './_AccordionGroup.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowDown, faArrowUp } from '@fortawesome/free-solid-svg-icons';

const AccordionGroup = ({ items }) => {
    const [activeIndex, setActiveIndex] = useState(null);

    const toggleAccordion = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    return (
        <div className={"alex-accordion-group"}>
            {items.map((item, index) => (
                <div key={index} className={"alex-accordion-item"}>
                    <button
                        className={"alex-accordion-button"}
                        onClick={() => toggleAccordion(index)}
                    >
                        {item.title}
                        <FontAwesomeIcon icon={activeIndex === index ? faArrowUp : faArrowDown} className="accordion-icon" />
                    </button>
                    {activeIndex === index && (
                        <div className={"alex-accordion-content"}
                             dangerouslySetInnerHTML={{ __html: item.content }}
                        />
                    )}
                </div>
            ))}
        </div>
    );
};

export default AccordionGroup;