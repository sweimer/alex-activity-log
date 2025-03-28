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
    const [checkedItems, setCheckedItems] = useState({});
    const [dateMessage, setDateMessage] = useState('');
    const [formData, setFormData] = useState({ date: '', activity: '', tags: [], activities: '', other: '' });
    const [isAccordionOpen, setIsAccordionOpen] = useState(false);
    const [isChecklistOpen, setIsChecklistOpen] = useState(false);
    const [isHintVisible, setIsHintVisible] = useState(true);
    const [logEntry, setLogEntry] = useState('');
    const [message, setMessage] = useState('');
    const panelRefs = useRef({}); // Define panelRefs here
    const [selectedActivities, setSelectedActivities] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState('');
    const textareaRef = useRef(null);
    const [visiblePanels, setVisiblePanels] = useState({});

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
    const BlockActivityResultsBlock = () => {
        return (
            <div className={"alex-block-input-resultsblock"}>
                <div className={"alex-block-input-header"}>
                    {logEntry}
                </div>
                <div className={"alex-block-results-input"}>
                    <ul>
                        <p>
                            {selectedActivities.join(' ')}
                        </p>
                    </ul>
                </div>
                <div className={"alex-block-input-footer"}>
                    {selectedStaff}
                </div>
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
                    <BlockActivityResultsBlock/>
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
                    <button className={"alex-bottomnav-button bottomnav-form"}
                            onClick={() => window.open("https://drive.google.com/drive/folders/1WouU-VuYWgM4Cl4ZeGkEV9vyhqVYPCOT", "_blank")}>
                        Google Docs
                    </button>

                    <button className={"alex-bottomnav-button bottomnav-results"}
                            onClick={() => toggleVisibility('results')}>
                        {visiblePanels['results'] ? 'Results' : 'Results'}
                    </button>
                    {visiblePanels['results'] && (
                        <div className={"alex-bottomnav-panel"} ref={(el) => (panelRefs.current['results'] = el)}>
                            <BlockActivityResults/>
                        </div>
                    )}

                    <button className={"alex-bottomnav-button bottomnav-checklist"}
                            onClick={() => toggleVisibility('checklist')}>
                        {visiblePanels['checklist'] ? 'Checklist' : 'Checklist'}
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

            const otherInputDiv = document.querySelector('div.alex-block-select-other');
            if (selectedTags.includes('OTHER')) {
                otherInputDiv.classList.add('show');
                otherInputDiv.classList.remove('hide');
            } else {
                otherInputDiv.classList.remove('show');
                otherInputDiv.classList.add('hide');
            }

            setLogEntry(prevLogEntry => {
                const datePart = prevLogEntry.split('\n')[1] || '';
                const otherText = formData.other ? ` ${formData.other}` : '';
                const filteredTags = selectedTags.filter(tag => tag !== 'OTHER');
                const logEntryHeader = `NOTE TO HEATHER: ${filteredTags.join('. ')}.${selectedTags.includes('OTHER') ? otherText : ' '}`;
                return `${logEntryHeader}\n${datePart}`;
            });
        } else if (name === 'date') {
            setFormData({ ...formData, [name]: value });
            checkDay(value);

            const formattedDate = formatDate(new Date(value + 'T00:00:00'));
            setLogEntry(prevLogEntry => {
                const tagsPart = prevLogEntry.split('\n')[0] || '';
                return `${tagsPart}\n${formattedDate}`;
            });
        } else if (name === 'OTHER') {
            setFormData({ ...formData, other: value });

            setLogEntry(prevLogEntry => {
                const [tagsPart, datePart] = prevLogEntry.split('\n');
                const otherText = value ? ` ${value}` : '';
                const updatedTagsPart = tagsPart ? `${tagsPart.split('.')[0]}.${otherText}` : '';
                return `${updatedTagsPart}\n${datePart || ''}`;
            });
        } else if (name === 'activities') {
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
        setSelectedActivities([]);
        setSelectedStaff('');
        setCheckedItems({});
        window.scrollTo(0, 0);

        // Clear selected options in alex-block-activities-select
        const selectElement = document.querySelector('.alex-block-activities-select');
        if (selectElement) {
            Array.from(selectElement.options).forEach(option => {
                option.selected = false;
            });
        }

        // Ensure the node is a child before removing it
        const nodeToRemove = document.querySelector('.node-to-remove');
        if (nodeToRemove && nodeToRemove.parentNode) {
            nodeToRemove.parentNode.removeChild(nodeToRemove);
        }
    };
    const handleCopy = () => {
        const textToCopy = `${logEntry}\n${selectedActivities.join(' ')}\n\n${selectedStaff}`;
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
                        <div className={"alex-block-date-input"}>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className={"hint-block"}>
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
                    <div className={"alex-block-tags column"}>
                        <label className={'alex-block-textarea-label'}>
                            Tags:
                        </label>
                        <select
                            className={"alex-block-select"}
                            name="tags"
                            value={formData.tags}
                            onChange={handleChange}
                            multiple
                        >
                            {tagsListItems.map((tag, index) => (
                                <option key={index} value={tag}>{tag}</option>
                            ))}
                        </select>

                        <div className={`alex-block-select-other ${formData.tags.includes('OTHER') ? 'show' : 'hide'}`}>
                            <label htmlFor="other">Other:</label>
                            <textarea
                                className="alex-block-select-other-input"
                                name="other"
                                value={formData.other}
                                type="text"
                                id="other"
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <div className={"alex-block-activities column"}>
                        <label>
                            Activities:
                        </label>
                        <select className={"alex-block-activities-select"}
                                onChange={(e) => {
                                    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
                                    setSelectedActivities(selectedOptions);
                                }}
                                multiple
                        >
                            {activityListItems.map((activity, index) => (
                                <optgroup key={index} label={activity.category}>
                                    {activity.items.map((item, itemIndex) => (
                                        <option key={itemIndex} value={item}>{item}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>
                </div>
            </form>

            <div className="alex-block-bottomnav">
                <BottomNavigationx/>
            </div>
        </div>
    );
}

export default ActivityForm;