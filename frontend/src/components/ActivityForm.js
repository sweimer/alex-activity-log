import React, { useState, useEffect } from 'react';
import axios from 'axios';

const handleScroll = () => {
    const textareaDiv = document.querySelector('textarea.form-data-textarea-input-textarea');
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
        } else {
            setFormData({ ...formData, [name]: value });
            if (name === 'date') {
                checkDay(value);
            } else if (name === 'other') {
                setFormData({ ...formData, other: value });
            }
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
        setFormData({ ...formData, [name]: formData[name] + text });
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

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
                                <li>CHORE at least 1 time a week.</li>
                                <li>CAD at least 1 time a week.</li>
                                <li>OUTING every Saturday.</li>
                                <li>MEAL PLAN and GROCERY SHOP every Sunday (or other day as needed).</li>
                                <li>NEW SKILL at least 1 time a month.</li>
                                <li>BEHAVIOR ISSUE at least 1 time a month.</li>
                                <li>FIRE DRILL at least 1 time a month.</li>
                                <li>SHOWER every Sunday.</li>
                                <li>SHOWER at least 2 more times a week.</li>
                                <li>CHOICE several times a week.</li>
                                <li>INTERACTION several times a month.</li>
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
                                <li className="list-top-level">Wake
                                    <ul>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Alex woke at 600am, went to bathroom, and went back to bed. ')}>
                                            Alex woke at 600am, went to bathroom, and went back to bed.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Alex woke back up at 730am. ')}>
                                            Alex woke back up at 730am.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Alex woke on her own around 730am and took herself to the bathroom. ')}>
                                            Alex woke on her own around 730am and took herself to the bathroom.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Alex slept in until 830am. ')}>
                                            Alex slept in until 830am.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Sponsor/Relief woke Alex at 730am. ')}>
                                            Sponsor/Relief woke Alex at 730am.
                                        </li>
                                    </ul>
                                </li>
                                <li className="list-top-level">Morning
                                    <ul>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Alex picked out an outfit from the ones hanging outside her dresser. ')}>
                                            CHOICE: Alex picked the pink dress with black tights from the outfits hanging outside her dresser.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Sponsor/Relief helped Alex get dressed and brush her teeth and hair. ')}>
                                            Sponsor/Relief helped Alex get dressed and brush her teeth and hair.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Sponsor/Relief helped Alex brush teeth and hair. ')}>
                                            Sponsor/Relief helped Alex brush teeth and hair.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Sponsor/Relief helped Alex pick out an outfit from the ones hanging outside her dresser. ')}>
                                            Sponsor/Relief helped Alex pick out an outfit from the ones hanging outside
                                            her dresser.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Alex put her shoes on the wrong feet and Sponsor/Relief helped Alex put them on right. ')}>
                                            Alex put her shoes on the wrong feet and Sponsor/Relief helped Alex put them
                                            on right.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Alex put her dress on backwards and Sponsor/Relief helped Alex put it on right. ')}>
                                            Alex put her dress on backwards and Sponsor/Relief helped Alex put it on
                                            right.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Alex cleaned her room and organized her shelves. Sponsor/Relief checked on Alex until she completed her chores. ')}>
                                            CHORE: Alex cleaned her room and organized her shelves. Sponsor/Relief
                                            checked on Alex until she completed her chores.
                                        </li>
                                    </ul>
                                </li>
                                <li className="list-top-level">Breakfast
                                    <ul>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Sponsor/Relief asked Alex if she wanted cereal or oats for breakfast. Alex picked Oats. ')}>
                                            CHOICE: Sponsor/Relief asked Alex if she wanted cereal or oats for
                                            breakfast. Alex
                                            picked Oats.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Alex wanted cereal for breakfast. ')}>
                                            CHOICE: Alex said she wanted cereal for breakfast.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Sponsor/Relief prepared cereal, monitored Alex as she ate and administered AM meds. ')}>
                                            Sponsor/Relief prepared cereal, monitored Alex as she ate and administered
                                            AM meds.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Sponsor/Relief prepared breakfast. ')}>
                                            Sponsor/Relief prepared breakfast.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Sponsor/Relief already prepared breakfast. ')}>
                                            Sponsor/Relief already prepared breakfast.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Sponsor/Relief monitored Alex as she ate and administered AM meds. ')}>
                                            Sponsor/Relief monitored Alex as she ate and administered AM meds.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Alex ate Breakfast and was monitored by Sponsor/Relief. ')}>
                                            Alex ate Breakfast and was monitored by Sponsor/Relief.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Sponsor/Relief administer AM meds. ')}>
                                            Sponsor/Relief administer AM meds.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'While eating. Sponsor, Relief and Alex discussed the menu for the upcoming week and made a small shopping list. ')}>
                                            MENU PLANNING: While eating. Sponsor, Relief and Alex discussed the menu for the upcoming
                                            week and made a small shopping list.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Alex helped clear the table. ')}>
                                            Alex helped clear the table.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Sponsor/Relief made Alex tea and made sure it was the right temperature. ')}>
                                            Sponsor/Relief made Alex tea and made sure it was the right temperature.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Alex drank her tea until the van arrived. ')}>
                                            Alex drank her tea until the van arrived.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Alex watched TV until the van arrived. ')}>
                                            Alex watched TV until the van arrived.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Van arrived at 830am to take Alex to Diversity. ')}>
                                            Van arrived at 830am to take Alex to Diversity.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Kiearra arrived at 800am to take Alex out for a girl\'s day. ')}>
                                            Kiearra arrived at 800am to take Alex out for a girl's day.
                                        </li>
                                    </ul>
                                </li>
                                <li className="list-top-level">Lunch
                                    <ul>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Sponsor/Relief prepared lunch and monitored Alex as she ate. ')}>
                                            Sponsor/Relief prepared lunch and monitored Alex as she ate.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Alex watched a little tv while Sponsor/Relief prepared lunch. ')}>
                                            Alex watched a little tv while Sponsor/Relief prepared lunch.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Alex helped clear the table. ')}>
                                            Alex helped clear the table.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Alex helped Sponsor cook home-made granola. ')}>
                                            CHORE: Alex helped Sponsor cook home-made granola.
                                        </li>
                                    </ul>
                                </li>
                                <li className="list-top-level">Dinner
                                    <ul>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Sponsor/Relief prepared dinner, monitored Alex as she ate and administered PM meds. ')}>
                                            Sponsor/Relief prepared dinner, monitored Alex as she ate and administered
                                            PM meds.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Sponsor/Relief prepared dinner while Alex watched TV, monitored Alex as she ate and administered PM Meds. ')}>
                                            Sponsor/Relief prepared dinner while Alex watched TV, monitored Alex as she
                                            ate and administered PM Meds.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Sponsor/Relief prepared dinner and monitored Alex as she ate. ')}>
                                            Sponsor/Relief prepared dinner and monitored Alex as she ate.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Sponsor/Relief administered PM meds. ')}>
                                            Sponsor/Relief administered PM meds.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Alex helped clear the table. ')}>
                                            Alex helped clear the table.
                                        </li>
                                    </ul>
                                </li>
                                <li className="list-top-level">Afternoon/Evening
                                    <ul>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Van returned at 230pm. ')}>
                                            Van returned at 230pm.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Sponsor/Relief asked Alex if she wanted to work on a beading craft. Alex said yes. Sponsor set Alex up with beads in the family room and checked in on her as she worked on it. ')}>
                                            CAD: Sponsor/Relief asked Alex if she wanted to work on a beading craft.
                                            Alex
                                            said yes. Sponsor set Alex up with beads in the family room and checked in
                                            on her as
                                            she worked on it.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Relief and Alex worked on making pop-together bracelets while watching TV. ')}>
                                            CAD: Relief and Alex worked on making pop-together bracelets while watching
                                            TV.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Sponsor/Relief asked Alex if she wanted to work onan art project on her Leap Pad. Alex said yes. Sponsor/Relief set Alex up with the project and checked in with her while she worked.. ')}>
                                            CAD: Sponsor/Relief asked Alex if she wanted to work onan art project on her
                                            Leap Pad. Alex said yes. Sponsor/Relief set Alex up with the project and
                                            checked in with her while she worked.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Alex helped Sponsor put away some laundry. ')}>
                                            CHORE: Alex helped Sponsor put away some laundry.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Sponsor/Relief and Alex picked out outfits for the upcoming week at Diversity and hung them outside her dresser. ')}>
                                            CHORE: Sponsor/Relief and Alex picked out outfits for the upcoming week at
                                            Diversity and hung them outside her dresser.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Kiearra returned at 330pm. While with Kiearra, Alex had her fingernails done, went to a movie and ate lunch at the movie theater.. ')}>
                                            OUTING: Kiearra returned at 330pm. While with Kiearra, Alex had her
                                            fingernails done, went to a movie and ate lunch at the movie theater.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Sponsor/Relief and Alex took Izzy back home. ')}>
                                            OUTING: Sponsor/Relief and Alex took Izzy back home.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Sponsor/Relief and Alex went to Wegmans and picked up the groceries on the list. Alex helped push the cart, load the car and unload the car at home. ')}>
                                            OUTING: Sponsor/Relief and Alex went to Wegmans and picked up the groceries
                                            on the list. Alex helped push the cart, load the car and unload the car at
                                            home.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Sponsor/Relief and Alex took Izzy for a quick neighborhood walk. ')}>
                                            OUTING: Sponsor/Relief and Alex took Izzy for a quick neighborhood walk.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Sponsor/Relief and Alex took Izzy to Huguenot Park. Alex walked 1.85 miles. ')}>
                                            OUTING: Sponsor/Relief and Alex took Izzy to Huguenot Park. Alex walked 1.85
                                            miles.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Sponsor/Relief and Alex took Izzy to the water tower to walk a couple laps around the track. ')}>
                                            OUTING: Sponsor/Relief and Alex took Izzy to the water tower to walk a couple laps around the track.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Sponsor/Relief and Alex took Izzy to the senior center to chase balls and Alex walked a couple laps around the track. ')}>
                                            OUTING: Sponsor/Relief and Alex took Izzy to the senior center to chase balls and Alex walked a couple laps around the track.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Sponsor/Relief went to Target. Relief and Alex waited in the car while Sponsor shopped. ')}>
                                            OUTING: Sponsor/Relief went to Target. Relief and Alex waited in the car while Sponsor shopped.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Sponsor, Relief and Alex watched a movie on TV. ')}>
                                            Sponsor, Relief and Alex watched a movie on TV.
                                        </li>
                                    </ul>
                                </li>
                                <li className="list-top-level">Bed
                                    <ul>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Sponsor/Relief helped Alex shower and with ADLs and helped Alex put on PJs. ')}>
                                        SHOWER: Sponsor/Relief helped Alex shower and with ADLs and helped Alex put
                                            on PJs.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Sponsor/Relief helped Alex brush teeth and hair and put on PJs. ')}>
                                            Sponsor/Relief helped Alex brush teeth and hair and put on PJs.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'AAlex watched TV with family until she was tired and went to bed around 730pm. ')}>
                                            Alex watched TV with family until she was tired and went to bed around 730pm.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Alex went to bed around 730pm. ')}>
                                            Alex went to bed around 730pm.
                                        </li>
                                    </ul>
                                </li>
                                <li className="list-top-level">Required
                                    <ul>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Sponsor/Relief conducted a Fire Drill, helped Alex leave the house when the alarm went off and helped Alex walk to the meeting point in the front yard. ')}>
                                            FIRE DRILL: Sponsor/Relief conducted a Fire Drill, helped Alex leave the house when the alarm went off and helped Alex walk to the meeting point in the front yard.
                                        </li>
                                        <li draggable
                                            className="draggable"
                                            onDragStart={(e) =>
                                                handleDragStart(e, 'Alex had a behavior issue. While in line at the theater, she got irritated and hit herself. Sponsor/Relief stepped Alex out of the line until she could calm down. alex apologized. ')}>
                                            BEHAVIOR ISSUE: Alex had a behavior issue. While in line at the theater, she got irritated and hit herself. Sponsor/Relief stepped Alex out of the line until she could calm down. alex apologized.
                                        </li>
                                    </ul>
                                </li>
                            </ul>
                        </div>
                        <textarea
                            className={"form-data-textarea-input-textarea"}
                            name="activities"
                            value={formData.activities}
                            onChange={handleChange}
                            onDrop={(e) => handleDrop(e, 'activities')}
                            onDragOver={handleDragOver}
                            onScroll={handleScroll}
                        ></textarea>
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
                {logEntry && <pre>{logEntry}</pre>}
            </div>
        </div>
    );
}

export default ActivityForm;