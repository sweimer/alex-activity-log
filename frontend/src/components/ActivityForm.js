import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

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
    //const [isOtherSelected, setIsOtherSelected] = useState(false);
    //const [otherTag, setOtherTag] = useState('');
    const textareaRef = useRef(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [formData.activities]);

    // Function to determine the sponsor based on the ratio of 5 days to 3 days
    const getSponsor = () => {
        const currentDate = new Date();
        const dayOfYear = Math.floor((currentDate - new Date(currentDate.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
        const cycleDay = dayOfYear % 8; // 8-day cycle
        return cycleDay < 5 ? "Heather Weimer, Sponsor" : "Scott Weimer, Relief";
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

    useEffect(() => {
        setDateMessage('Hints...');
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const handleChange = (e) => {
        const { name, value, options } = e.target;
        if (name === 'tags' && options) {
            const selectedTags = Array.from(options).filter(option => option.selected).map(option => option.value);
            setFormData({ ...formData, [name]: selectedTags });

            const otherInputDiv = document.querySelector('div.form-data-textarea-input-select-other');
            if (selectedTags.includes('Other')) {
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
                const filteredTags = selectedTags.filter(tag => tag !== 'Other');
                const logEntryHeader = `NOTE TO HEATHER: ${filteredTags.join('. ')}.${selectedTags.includes('Other') ? otherText : ' '}`;
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
        } else if (name === 'other') {
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

    const handleCopy = () => {
        const textToCopy = `${logEntry}\n\n${formData.activities}\n\n\n\n${getSponsor()}`;
        navigator.clipboard.writeText(textToCopy).then(() => {
            console.log('Text copied to clipboard');
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5001/save-log', formData);
            setMessage(response.data.message);

            const formattedDate = formatDate(new Date(formData.date + 'T00:00:00'));
            const tagsWithoutOther = formData.tags.filter(tag => tag !== 'Other');
            const noteForHeather = tagsWithoutOther.length > 0 || formData.tags.includes('Other') ? `NOTE FOR HEATHER: ${tagsWithoutOther.join('. ')}. ` : '';
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

    const handleDragStart = (e, text) => {
        e.dataTransfer.setData('text/plain', text);
    };

    const handleDrop = (e, name) => {
        e.preventDefault();
        const text = e.dataTransfer.getData('text/plain');
        setFormData({ ...formData, [name]: formData[name] + text + ' ' });
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const hintListItems = [
        "CHORE at least 1 time a week.",
        "CAD at least 1 time a week.",
        "OUTING every Saturday.",
        "MEAL PLAN and GROCERY SHOP every Sunday (or other day as needed).",
        "NEW SKILL at least 1 time a month.",
        "BEHAVIOR ISSUE at least 1 time a month.",
        "FIRE DRILL at least 1 time a month.",
        "SHOWER every Sunday.",
        "SHOWER at least 2 more times a week.",
        "CHOICE several times a week.",
        "INTERACTION several times a month."
    ];

    const activityListItems = [
        {
            category: "Wake",
            items: [
                "Alex woke at 600am, went to bathroom, and went back to bed.",
                "Alex woke back up at 730am.",
                "Alex woke on her own around 730am and took herself to the bathroom.",
                "Alex slept in until 830am.",
                "Sponsor/Relief woke Alex at 730am."
            ]
        },
        {
            category: "Morning",
            items: [
                "CHOICE: Alex picked the pink dress with black tights from the outfits hanging outside her dresser.",
                "Sponsor/Relief helped Alex get dressed and brush her teeth and hair.",
                "Sponsor/Relief helped Alex brush teeth and hair.",
                "Sponsor/Relief helped Alex pick out an outfit from the ones hanging outside her dresser.",
                "Alex put her shoes on the wrong feet and Sponsor/Relief helped Alex put them on right.",
                "Alex put her dress on backwards and Sponsor/Relief helped Alex put it on right.",
                "CHORE: Alex cleaned her room and organized her shelves. Sponsor/Relief checked on Alex until she completed her chores."
            ]
        },
        {
            category: "Breakfast",
            items: [
                "CHOICE: Sponsor/Relief asked Alex if she wanted cereal or oats for breakfast. Alex picked Oats.",
                "CHOICE: Alex said she wanted cereal for breakfast.",
                "Sponsor/Relief prepared cereal, monitored Alex as she ate and administered AM meds.",
                "Sponsor/Relief prepared breakfast.",
                "Sponsor/Relief already prepared breakfast.",
                "Sponsor/Relief monitored Alex as she ate and administered AM meds.",
                "Alex ate Breakfast and was monitored by Sponsor/Relief.",
                "Sponsor/Relief administer AM meds.",
                "MENU PLANNING: While eating. Sponsor, Relief and Alex discussed the menu for the upcoming week and made a small shopping list.",
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
                "Alex helped Sponsor put away some laundry.",
                "Sponsor and Alex picked out outfits for the upcoming week at Diversity and hung them outside her dresser.",
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
            category: "AFTERNOON/AFTER SCHOOL",
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
                "Sponsor/Relief and Alex took Izzy back home.",
                "Sponsor/Relief and Alex went to Wegmans and picked up the groceries on the list. Alex helped push the cart, load the car and unload the car at home."
            ]
        },
        {
            category: "EVENING",
            items: [
                "Sponsor/Relief and Alex took Izzy for a quick neighborhood walk.",
                "Sponsor/Relief and Alex took Izzy to Huguenot Park. Alex walked 1.85 miles.",
                "Sponsor/Relief and Alex took Izzy to the water tower to walk a couple laps around the track.",
                "Sponsor/Relief went to Target.",
                "Relief and Alex waited in the car while Sponsor shopped.",
                "Alex helped push the car, load the car and unload the car back home.",
                "Sponsor/Relief asked Alex if she wanted to work on a beading craft. Alex said yes. Sponsor set Alex up with beads in the family room and checked in on her as she worked on it.",
                "Relief and Alex worked on making pop-together bracelets while watching TV.",
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

    return (
        <div>
            <h1>Alex Activity Log</h1>

            <form onSubmit={handleSubmit}>
                <div className={"form-data-textarea-block form-data-container-tags"}>
                    <label className={'form-data-textarea-label'}>
                        Tags:
                    </label>
                    <div className={'form-data-textarea-input'}>
                        <div className={"form-data-textarea-input-hint hint-block"}>
                            When applicable, select a tag or multiple (command/select) tags to alert Heather that this
                            date has a notable entry.
                            <ul className={"list-decoration-on"}>
                                {hintListItems.map((item, index) => (
                                    <li key={index}>{item}</li>
                                ))}
                            </ul>
                        </div>
                        <select
                            className={"form-data-textarea-input-select"}
                            name="tags"
                            value={formData.tags}
                            onChange={handleChange}
                            multiple
                        >
                            <option value="Chore">CHORE</option>
                            <option value="CAD">CAD</option>
                            <option value="Outing">OUTING</option>
                            <option value="Meal Planning and Grocery Shopping">MEAL PLAN and GROCERY SHOP</option>
                            <option value="New Skill">NEW SKILL</option>
                            <option value="Behavior Issue">BEHAVIOR ISSUE</option>
                            <option value="Fire Drill">FIRE DRILL</option>
                            <option value="Shower">SHOWER</option>
                            <option value="Choice">CHOICE</option>
                            <option value="Interaction">INTERACTION</option>
                            <option value="Other">OTHER</option>
                        </select>
                    </div>
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

                <div className={"form-data-date-block"}>
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
                        <div className={"form-data-textarea-input-hint hint-block form-data-date-block-hint"}>
                            {dateMessage}
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
                                {getSponsor()}
                            </div>
                        </div>
                    </div>
                </div>

                <div className={"form-data-submit-block"}>
                    <div className={"form-data-submit_button-block"}>
                        <button className={"form-data-submit-button"} type="submit" onClick={handleButtonClick}>
                            Submit
                        </button>
                        <button className={"form-data-clear-button"} type="button" onClick={handleClear}>
                        Clear
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