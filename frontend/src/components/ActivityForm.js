import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
//FONT AWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';
//LISTS
import checklistListItems from '../lists/list-checklist.js';
import activityListItems from '../lists/list-activity.js';
import staffListItems from '../lists/list-staff.js';

const handleScroll = () => {
    const textareaDiv = document.querySelector('div.form-data-workspace');
    const resultsDiv = document.querySelector('div.form-data-results');
    const preElement = resultsDiv ? resultsDiv.querySelector('pre') : null;

    if (textareaDiv && !preElement) {
        if (window.scrollY >= 550) {
            textareaDiv.classList.add('sticky');
        } else {
            textareaDiv.classList.remove('sticky');
        }
    }
};

const handleButtonClick = () => {
    const textareaDiv = document.querySelector('textarea.form-data-textarea-input-textarea');
    if (textareaDiv) {
        textareaDiv.classList.remove('sticky');
    }
};

const formatDate = (date) => {
    const dayOfWeek = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date).toUpperCase();
    const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} - ${dayOfWeek}`;
    return formattedDate;
};

function ActivityForm() {
    const [formData, setFormData] = useState({ date: '', activity: '', tags: [], activities: '', other: '' });
    const [message, setMessage] = useState('');
    const [dateMessage, setDateMessage] = useState('');
    const [logEntry, setLogEntry] = useState('');
    const textareaRef = useRef(null);
    const [isAccordionOpen, setIsAccordionOpen] = useState(false);
    const [checkedItems, setCheckedItems] = useState({});
    const [isChecklistOpen, setIsChecklistOpen] = useState(false);

    const activityListItems = [
        {
            category: "WAKE",
            items: [
                "Alex woke at 600am, went to bathroom, and went back to bed.",
                "Alex woke back up at 730am.",
                "Alex woke on her own around 730am and took herself to the bathroom.",
                "Alex slept in until 830am.",
                "Sponsor/Relief woke Alex at 730am."
            ]
        },
        {
            category: "MORNING",
            items: [
                "Alex picked the pink dress with black tights from the outfits hanging outside her dresser.",
                "Sponsor/Relief helped Alex get dressed and brush her teeth and hair.",
                "Sponsor/Relief helped Alex brush teeth and hair.",
                "Sponsor/Relief helped Alex pick out an outfit from the ones hanging outside her dresser.",
                "Alex put her shoes on the wrong feet and Sponsor/Relief helped Alex put them on right.",
                "Alex put her dress on backwards and Sponsor/Relief helped Alex put it on right.",
                "Alex cleaned her room and organized her shelves. Sponsor/Relief checked on Alex until she completed her chores."
            ]
        },
        {
            category: "BREAKFAST",
            items: [
                "Sponsor/Relief asked Alex if she wanted cereal or oats for breakfast. Alex picked Oats.",
                "Alex said she wanted cereal for breakfast.",
                "Sponsor/Relief prepared cereal, monitored Alex as she ate and administered AM meds.",
                "Sponsor/Relief already prepared breakfast.",
                "Sponsor/Relief monitored Alex as she ate and administered AM meds.",
                "Alex ate Breakfast and was monitored by Sponsor/Relief.",
                "Sponsor/Relief administer AM meds.",
                "Alex helped clear the table.",
                "Sponsor/Relief made Alex tea and made sure it was the right temperature.",
                "Alex drank her tea until the van arrived.",
                "Alex watched TV until the van arrived.",
                "Van arrived at 830am to take Alex to Diversity.",
                "Kiearra arrived at 800am to take Alex out for a girl's day."
            ]
        },
        {
            category: "MIDDAY",
            items: [
                "Sponsor/Relief and Alex took Izzy for a quick neighborhood walk.",
                "Sponsor/Relief asked Alex if she wanted to work on her new pop-together beads. Alex said Yes and worked on them in the Family room for a while.",
                "Sponsor/Relief ran a fire drill, helped Alex respond to the alarm and helped Alex evacuate to the meeting place in the front yard.",
                "Sponsor/Relief and Alex took Izzy for a quick neighborhood walk.",
                "Sponsor/Relief and Alex took Izzy to Huguenot Park. Alex walked 1.85 miles.",
                "Sponsor/Relief and Alex took Izzy to the water tower to walk a couple laps around the track.",
                "Sponsor/Relief and Alex took Izzy back home.",
                "Sponsor/Relief and Alex went to Wegmans and picked up the groceries on the list. Alex helped push the cart, load the car and unload the car at home."
            ]
        },
        {
            category: "LUNCH",
            items: [
                "Sponsor/Relief prepared lunch and monitored Alex as she ate.",
                "Alex watched a little tv while Sponsor/Relief prepared lunch.",
                "Alex helped Sponsor cook home-made granola.",
                "Alex helped clear the table."
            ]
        },
        {
            category: "DINNER",
            items: [
                "Sponsor/Relief prepared dinner, monitored Alex as she ate and administered PM meds.",
                "Sponsor/Relief prepared dinner while Alex watched TV, monitored Alex as she ate and administered PM Meds.",
                "Sponsor/Relief prepared dinner and monitored Alex as she ate.",
                "Sponsor/Relief administered PM meds.",
                "Alex helped clear the table."
            ]
        },
        {
            category: "CHORE",
            items: [
                "Alex cleaned her room and organized her shelves. Sponsor/Relief checked on Alex until she completed her chores.",
                "Alex helped Sponsor put away some laundry.",
                "Sponsor and Alex picked out outfits for the upcoming week at Diversity and hung them outside her dresser."
            ]
        },
        {
            category: "MENU PLANNING and GROCERY SHOPPING",
            items: [
                "While eating. Sponsor, Relief and Alex discussed the menu for the upcoming week and made a small shopping list.",
            ]
        },
        {
            category: "OUTING",
            items: [
                "Sponsor/Relief went to Target.",
                "Sponsor/Relief and Alex went to Wegmans and picked up the groceries on the list. Alex helped push the cart, load the car and unload the car at home.",
                "Relief and Alex waited in the car while Sponsor shopped.",
                "Alex helped push the car, load the car and unload the car back home.",
                "Sponsor/Relief asked Alex if she wanted to work on a beading craft. Alex said yes. Sponsor set Alex up with beads in the family room and checked in on her as she worked on it.",
                "Relief and Alex worked on making pop-together bracelets while watching TV."
            ]
        },
        {
            category: "AFTERNOON/AFTER SCHOOL/EVENING",
            items: [
                "Van returned at 230pm.",
                "Kiearra returned at 330pm.",
                "Alex helped Sponsor put away some laundry.",
                "Sponsor and Alex picked out outfits for the upcoming week at Diversity and hung them outside her dresser.",
                "Sponsor/Relief and Alex took Izzy for a quick neighborhood walk.",
                "Sponsor/Relief asked Alex if she wanted to work on her new pop-together beads. Alex said Yes and worked on them in the Family room for a while.",
                "Sponsor/Relief ran a fire drill, helped Alex respond to the alarm and helped Alex evacuate to the meeting place in the front yard.",
                "Sponsor/Relief and Alex took Izzy for a quick neighborhood walk.",
                "Sponsor/Relief and Alex took Izzy to Huguenot Park. Alex walked 1.85 miles.",
                "Sponsor/Relief and Alex took Izzy to the water tower to walk a couple laps around the track.",
                "Sponsor/Relief and Alex took Izzy to the senior center to chase balls. alex walked several laps around the field.",
                "Sponsor/Relief and Alex took Izzy back home.",
                "Sponsor, Relief and Alex watched a movie on TV."
            ]
        },
        {
            category: "BED",
            items: [
                "Sponsor/Relief helped Alex shower and with ADLs and helped Alex put on PJs.",
                "Alex watched TV with family until she was tired and went to bed around 730pm.",
                "Sponsor/Relief helped Alex brush teeth and hair and put on PJs.",
                "Alex watched TV with family until she was tired and went to bed around 730pm.",
                "Alex went to bed around 730pm"
            ]
        },
    ];

    // Function to determine the sponsor based on the ratio of 5 days to 3 days
    const getSponsor = () => {
        const selectElement = document.querySelector('select.form-data-workspace-footer-select');
        return selectElement ? selectElement.value : '';
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

    const checkDay = (date) => {
        const selectedDate = new Date(date + 'T00:00:00');
        const lastDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();

        if (selectedDate.getDate() === lastDayOfMonth) {
            setDateMessage('This is the last day of the month. Did you add a FIRE DRILL and a BEHAVIOR ISSUE this month?');
        } else if (selectedDate.getDay() === 0) {
            setDateMessage('This is a Sunday. Add a MEAL PLAN, GROCERY SHOP and SHOWER line item for today.');
        } else if (selectedDate.getDay() === 3) {
            setDateMessage('This is a Wednesday. Did you add a SHOWER this week?');
        }
        else if (selectedDate.getDay() === 5) {
            setDateMessage('This is a Friday. Did you add 2 SHOWERs, 1 CHORE and 1 CAD this week? Did you write about CHOICE and INTERACTION this week?');
        } else if (selectedDate.getDay() === 6) {
            setDateMessage('This is a Saturday. Add an OUTING line item for today.');
        } else {
            setDateMessage('Hints...');
        }
    };

    // CHECKBOX LIST COMPONENT
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5001/save-log', formData);
            setMessage(response.data.message);

            const formattedDate = formatDate(new Date(formData.date + 'T00:00:00'));
            const tagsWithoutOther = formData.tags.filter(tag => tag !== 'OTHER');
            const noteForHeather = tagsWithoutOther.length > 0 || formData.tags.includes('OTHER') ? `NOTE FOR HEATHER: ${tagsWithoutOther.join('. ')}. ` : '';
            const otherText = formData.other ? `${formData.other} \r\n` : '';
            const logEntry = `\r\n\r\n${noteForHeather}${otherText}${formattedDate}\r\n${formData.activities}  `;
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

    return (
        <div>
            <h1>Alex Log</h1>

            <form onSubmit={handleSubmit}>

                <div className={'alex-block-checklist'}>
                    <button className={'alex-block-checklist-button'} type="button" onClick={toggleAccordion}>
                        {isAccordionOpen ? <>
                            Hide Checklist <FontAwesomeIcon icon={faArrowUp}/></> : <>
                            Show Checklist <FontAwesomeIcon icon={faArrowDown}/></>
                        }
                    </button>
                    {isAccordionOpen && (
                        <div className={`alex-block-checklist-list hint-block ${isChecklistOpen ? 'show' : ''}`}>
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
                        </div>
                    )}
                </div>

                <div className={"row"}>
                    <div className={"alex-block-date column"}>
                        <label>
                            Date:
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
                            Staff:
                        </label>
                        <select className={"form-data-workspace-footer-select"}
                                name="workspacefooter"
                                value={formData.workspacefooter}
                                onChange={handleChange}
                        >
                            <option value="Heather Weimer, Sponsor">Heather Weimer, Sponsor</option>
                            <option value="Scott Weimer, Relief">Scott Weimer, Relief</option>
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
                            <option value="CHORE">CHORE</option>
                            <option value="CAD">CAD</option>
                            <option value="OUTING">OUTING</option>
                            <option value="MEAL PLAN and GROCERY SHOP">MEAL PLAN and GROCERY SHOP</option>
                            <option value="NEW SKILL">NEW SKILL</option>
                            <option value="BEHAVIOR ISSUE">BEHAVIOR ISSUE</option>
                            <option value="FIRE DRILL">FIRE DRILL</option>
                            <option value="SHOWER">SHOWER</option>
                            <option value="CHOICE">CHOICE</option>
                            <option value="INTERACTION">INTERACTION</option>
                            <option value="OTHER">OTHER</option>
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


                <div className={"form-data-textarea-block form-data-container-activities"}>
                    <label className={'form-data-textarea-label'}>
                        Activities:
                    </label>
                    <div className={'form-data-textarea-input'}>
                        <div className={"form-data-textarea-input-hint hint-block"}>
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
                        </div>

                        <div className={"form-data-workspace"}>
                            <div className={"form-data-workspace-copylink"}>
                                <button className="form-data-clear-button" type="button" onClick={handleCopy}>
                                    Copy
                                </button>
                                <button className={"form-data-clear-button"} type="button" onClick={handleClear}>
                                    Clear
                                </button>
                            </div>
                            <div className={"form-data-workspace-header"}>
                                {logEntry}
                            </div>
                            <textarea
                                ref={textareaRef}
                                className={"form-data-textarea-input-textarea"}
                                name="activities"
                                value={`${formData.activities}`}
                                onChange={handleChange}
                                onDrop={(e) => handleDrop(e, 'activities')}
                                onDragOver={handleDragOver}
                                onScroll={handleScroll}
                            ></textarea>
                            <div className={"form-data-workspace-footer"}>

                            </div>
                        </div>
                    </div>
                </div>

                <div className={"form-data-submit-block"}>
                    <div className={"form-data-submit_button-block"}>
                        <button className={"form-data-submit-button"} type="submit" onClick={handleButtonClick}>
                            Submit
                        </button>
                    </div>
                    <div className={"form-data-submit_message-block"}>
                        {message && <p className={"alert"}>{message}</p>}
                    </div>
                </div>
            </form>

            <div className={"form-data-results"}>
                {logEntry && <pre>
                    {logEntry}
                    <div className={"form-data-results-footer"}>{getSponsor()}</div>
                </pre>}
            </div>
        </div>
);
}

export default ActivityForm;