import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
//CONTRIB

//FONT AWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';
//COMPONENTS
import AccordionGroup from './AccordionGroup/AccordionGroup.js';
import AccordionGroupContentHome from './AccordionGroup/content/AccordionGroupContent-Home.js';
import BottomNavigation from './BottomNav/BottomNav.js';
import BottomNavContentHome from './BottomNav/content/BottomNavContent-Home.js';
//LISTS
import activityListItems from '../lists/list-activity.js';
import checklistListItems from '../lists/list-checklist.js';
import staffListItems from '../lists/list-staff.js';
import tagsListItems from '../lists/list-tags.js';

function ActivityForm() {
    const [formData, setFormData] = useState({ date: '', activity: '', tags: [], activities: '', other: '' });
    const [message, setMessage] = useState('');
    const [dateMessage, setDateMessage] = useState('');
    const [logEntry, setLogEntry] = useState('');
    const textareaRef = useRef(null);
    const [isAccordionOpen, setIsAccordionOpen] = useState(false);
    const [checkedItems, setCheckedItems] = useState({});
    const [isChecklistOpen, setIsChecklistOpen] = useState(false);
    const [isHintVisible, setIsHintVisible] = useState(true);
    const [visiblePanels, setVisiblePanels] = useState({});
    const panelRefs = useRef({}); // Define panelRefs here
    const [selectedStaff, setSelectedStaff] = useState('');

    //CONTENT
    const BlockActivityForm = () => {
        return (
            <div className={"alex-block-form hint-block"}>
                <p className={"bold"}>Drag and Drop</p>
                <ul>
                    {activityListItems.map((category, index) => (
                        <li key={index} className="list-top-level">
                            {category.category}
                            <ul>
                                {category.items.map((item, subIndex) => (
                                    <li
                                        key={subIndex}
                                        draggable
                                        className="draggable"
                                        onDragStart={(e) => handleDragStart(e, item)}
                                    >
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </li>
                    ))}
                </ul>
                <textarea
                    ref={textareaRef}
                    className={"alex-block-input"}
                    name="activities"
                    value={`${formData.activities}`}
                    onChange={handleChange}
                    onDrop={(e) => handleDrop(e, 'activities')}
                    onDragOver={handleDragOver}
                    onScroll={handleScroll}
                ></textarea>
            </div>
        );
    }
    const BlockActivityResults = () => {
        return (
            <div className={`alex-block-results hint-block ${isChecklistOpen ? 'show' : ''}`}>
                <div className={"alex-block-input-wrapper"}>
                    <div className={"alex-block-input-buttons"}>
                        <button className="form-data-clear-button" type="button" onClick={handleCopy}>
                            Copy
                        </button>
                        <button className={"form-data-clear-button"} type="button" onClick={handleClear}>
                            Clear
                        </button>
                    </div>
                    <div className={"alex-block-input-header"}>
                        {logEntry}
                    </div>
                    <textarea
                        ref={textareaRef}
                        className={"alex-block-results-input"}
                        name="activities"
                        value={`${formData.activities}`}
                        onChange={handleChange}
                        onDrop={(e) => handleDrop(e, 'activities')}
                        onDragOver={handleDragOver}
                        onScroll={handleScroll}
                    ></textarea>
                    <div className={"alex-block-input-footer"}>
                        {selectedStaff}
                    </div>
                </div>
            </div>
        );
    }
    const BlockActivityChecklist = () => {
        return (
            <div className={"alex-bottomnav-panel"}>
                {<div className={`alex-block-checklist hint-block ${isChecklistOpen ? 'show' : ''}`}>
                    When applicable, select a tag or multiple (command/select) tags to alert Heather that this
                    date has a notable entry.
                    <ul>
                        {checklistListItems.map((item, index) => (
                            <li key={index}>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={!!checkedItems[index]}
                                        onChange={() => handleCheckboxChange(index)}
                                    />
                                    {item}
                                </label>
                            </li>
                        ))}
                    </ul>
                </div>}
            </div>
        );
    }
    const BottomNavigationx = () => {
        return (
            <div>
                <div className="alex-bottomnav">
                    <button className={"alex-bottomnav-button bottomnav-form"} onClick={() => toggleVisibility('form')}>
                        {visiblePanels['form'] ? 'Hide Form' : 'Show Form'}
                    </button>
                    {visiblePanels['form'] && (
                        <div className={"alex-bottomnav-panel"} ref={(el) => (panelRefs.current['form'] = el)}>
                            <BlockActivityForm/>
                        </div>
                    )}

                    <button className={"alex-bottomnav-button bottomnav-results"}
                            onClick={() => toggleVisibility('results')}>
                        {visiblePanels['results'] ? 'Hide Results' : 'Show Results'}
                    </button>
                    {visiblePanels['results'] && (
                        <div className={"alex-bottomnav-panel"} ref={(el) => (panelRefs.current['results'] = el)}>
                            <BlockActivityResults/>
                        </div>
                    )}

                    <button className={"alex-bottomnav-button bottomnav-checklist"}
                            onClick={() => toggleVisibility('checklist')}>
                        {visiblePanels['checklist'] ? 'Hide Checklist' : 'Show Checklist'}
                    </button>
                    {visiblePanels['checklist'] && (
                        <div className={"alex-bottomnav-panel"} ref={(el) => (panelRefs.current['checklist'] = el)}>
                            <BlockActivityChecklist/>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    //FUNCTIONS
    const checkDay = (date) => {
        const selectedDate = new Date(date + 'T00:00:00');
        const lastDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();

        if (selectedDate.getDate() === lastDayOfMonth) {
            setDateMessage('This is the last day of the month. Did you add a FIRE DRILL and a BEHAVIOR ISSUE this month?');
        } else if (selectedDate.getDay() === 0) {
            setDateMessage('This is a Sunday. Add a MEAL PLAN, GROCERY SHOP and SHOWER line item for today.');
        } else if (selectedDate.getDay() === 3) {
            setDateMessage('This is a Wednesday. Did you add a SHOWER this week?');
        } else if (selectedDate.getDay() === 5) {
            setDateMessage('This is a Friday. Did you add 2 SHOWERs, 1 CHORE and 1 CAD this week? Did you write about CHOICE and INTERACTION this week?');
        } else if (selectedDate.getDay() === 6) {
            setDateMessage('This is a Saturday. Add an OUTING line item for today.');
        } else {
            setDateMessage('Hints...');
        }
    };
    const formatDate = (date) => {
        const dayOfWeek = new Intl.DateTimeFormat("en-US", {weekday: "long"}).format(date).toUpperCase();
        const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} - ${dayOfWeek}`;
        return formattedDate;
    };
    const getSponsor = () => {
        const selectElement = document.querySelector('select.form-data-workspace-footer-select');
        return selectElement ? selectElement.value : '';
    };
    const handleButtonClick = () => {
        const textareaDiv = document.querySelector('textarea.form-data-textarea-input-textarea');
        if (textareaDiv) {
            textareaDiv.classList.remove('sticky');
        }
    };
    const handleChange = (e) => {
        const { name, value, options } = e.target;
        if (name === 'tags' && options) {
            const selectedTags = Array.from(options).filter(option => option.selected).map(option => option.value);
            setFormData({ ...formData, [name]: selectedTags });

            const otherInputDiv = document.querySelector('div.form-data-textarea-input-select-other');
            if (selectedTags.includes('OTHER')) {
                otherInputDiv.classList.add('show');
                otherInputDiv.classList.remove('hide');
            } else {
                otherInputDiv.classList.remove('show');
                otherInputDiv.classList.add('hide');
            }

            // Update logEntry with selected tags as header, excluding "Other" and including other text if "Other" is selected
            setLogEntry(prevLogEntry => {
                const datePart = prevLogEntry.split('\n\n')[1] || '';
                const otherText = formData.other ? ` ${formData.other}` : '';
                const filteredTags = selectedTags.filter(tag => tag !== 'OTHER');
                const logEntryHeader = `NOTE TO HEATHER: ${filteredTags.join('. ')}.${selectedTags.includes('OTHER') ? otherText : ' '}`;
                return `${logEntryHeader}\n\n${datePart}`;
            });
        } else if (name === 'date') {
            setFormData({ ...formData, [name]: value });
            checkDay(value);

            // Update logEntry with selected date, preserving the tags if already set
            const formattedDate = formatDate(new Date(value + 'T00:00:00'));
            setLogEntry(prevLogEntry => {
                const tagsPart = prevLogEntry.split('\n\n')[0] || '';
                return `${tagsPart}\n\n${formattedDate}`;
            });
        } else if (name === 'OTHER') {
            setFormData({ ...formData, other: value });

            // Update logEntry with other text, preserving the tags and date if already set
            setLogEntry(prevLogEntry => {
                const [tagsPart, datePart] = prevLogEntry.split('\n\n');
                const otherText = value ? ` ${value}` : '';
                const updatedTagsPart = tagsPart ? `${tagsPart.split('.')[0]}.${otherText}` : '';
                return `${updatedTagsPart}\n\n${datePart || ''}`;
            });
        } else if (name === 'activities') {
            // Update formData without modifying logEntry
            setFormData({ ...formData, [name]: value });
        }
    };
    const handleCheckboxChange = (index) => {
        setCheckedItems(prevState => ({
            ...prevState,
            [index]: !prevState[index]
        }));
    };
    const handleClear = () => {
        setFormData({ date: '', activity: '', tags: [], activities: '', other: '' });
        setMessage('');
        setDateMessage('Hints...');
        setLogEntry('');
        //setIsOtherSelected(false);
        //setOtherTag('');
        window.scrollTo(0, 0);
    };
    const handleClickOutside = (event) => {
        if (panelRefs.current && !panelRefs.current.contains(event.target)) {
            setVisiblePanels({});
        }
    };
    const handleCopy = () => {
        const textToCopy = `${logEntry}\n\n${formData.activities}\n\n\n\n${getSponsor()}`;
        navigator.clipboard.writeText(textToCopy).then(() => {
            console.log('Text copied to clipboard');
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    };
    const handleDragStart = (e, text) => {
        e.dataTransfer.setData('text/plain', text);
    };
    const handleDragOver = (e) => {
        e.preventDefault();
    };
    const handleDrop = (e, name) => {
        e.preventDefault();
        const text = e.dataTransfer.getData('text/plain');
        setFormData({ ...formData, [name]: formData[name] + text + ' ' });
    };
    const handleScroll = () => {
        const textareaDiv = document.querySelector('div.form-data-workspace');
        const resultsDiv = document.querySelector('div.form-data-results');
        const preElement = resultsDiv ? resultsDiv.querySelector('pre') : null;

        if (textareaDiv && !preElement) {
            if (window.scrollY >= 300) {
                textareaDiv.classList.add('sticky');
            } else {
                textareaDiv.classList.remove('sticky');
            }
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5001/save-log', formData);
            setMessage(response.data.message);

            const formattedDate = formatDate(new Date(formData.date + 'T00:00:00'));
            const tagsWithoutOther = formData.tags.filter(tag => tag !== 'OTHER');
            const noteForHeather = tagsWithoutOther.length > 0 || formData.tags.includes('OTHER') ? `NOTE FOR HEATHER: ${tagsWithoutOther.join('. ')}. ` : '';
            const otherText = formData.other ? `${formData.other} \r\n` : '';
            const logEntry = `\r\n\r\n${noteForHeather}${otherText}\r\n\r\n11${formattedDate}\r\n${formData.activities}  `;
            setLogEntry(logEntry);
        } catch (error) {
            if (error.response) {
                setMessage(error.response.data.message || 'Error saving activity log');
            } else {
                setMessage('Error saving activity log');
            }
            console.error('Error saving activity log:', error);
        }
    };
    const toggleAccordion = () => {
        setIsAccordionOpen(!isAccordionOpen);
        setIsChecklistOpen(!isChecklistOpen);
    };
    const toggleHint = () => {
        setIsHintVisible(!isHintVisible);
    };
    const toggleVisibility = (buttonId) => {
        setVisiblePanels(prevState => ({
            ...prevState,
            [buttonId]: !prevState[buttonId]
        }));
    };
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }

        setDateMessage('Hints...');
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [formData.activities]);

    //MARKUP
    return (
        <div>
            <h1>Alex Log</h1>

            <form onSubmit={handleSubmit}>
                <div className={"row"}>
                    <div className={"alex-block-date column"}>
                        <label>
                            Date: {formatDate}
                        </label>
                        <div className={"form-data-date-block-input"}>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className={"alex-block-hint hint-block form-data-date-block-hint"}>
                            {dateMessage}
                        </div>
                    </div>
                    <div className={"alex-block-staff column"}>
                        <label>
                            Staff: {selectedStaff}
                        </label>
                        <select className={"alex-block-staff-select"}
                                onChange={(e) => setSelectedStaff(e.target.value)}>
                            {staffListItems.map((staff, index) => (
                                <option key={index} value={staff}>{staff}</option>
                            ))}
                        </select>
                    </div>
                    <div className={"alex-block-tags column form-data-container-tags"}>
                        <label className={'form-data-textarea-label'}>
                            Tags:
                        </label>
                        <select
                            className={"form-data-textarea-input-select"}
                            name="tags"
                            value={formData.tags}
                            onChange={handleChange}
                            multiple
                        >
                            {tagsListItems.map((tag, index) => (
                                <option key={index} value={tag}>{tag}</option>
                            ))}
                        </select>

                        <div className={"form-data-textarea-input-select-other"}>
                            <label htmlFor="other">Other:</label>
                            <input className={"form-data-textarea-input-select-other-input"}
                                   name="other"
                                   value={formData.other}
                                   type="text"
                                   id="other"
                                   onChange={handleChange}
                            ></input>
                        </div>
                    </div>
                </div>
            </form>

            <AccordionGroup items={AccordionGroupContentHome}/>

            <div className="alex-block-bottomnav">
                <BottomNavigationx/>
            </div>
        </div>
    );
}

export default ActivityForm;