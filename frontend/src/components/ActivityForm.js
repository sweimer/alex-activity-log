import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// LISTS
import activityListItems from '../lists/list-activity.js';
import checklistListItems from '../lists/list-checklist.js';
import staffListItems from '../lists/list-staff.js';
import tagsListItems from '../lists/list-tags.js';

/* ---------------------------------------------------------
   EXPORTED RESULTS BLOCK (TOP LEVEL)
   --------------------------------------------------------- */

export const BlockActivityResults = ({ logEntry = "", selectedActivities = [], selectedStaff = "" }) => {
    return (
        <div className="alex-block-results-page">
            <div className="alex-block-input-header">
                {logEntry}
            </div>

            <div className="alex-block-results-input">
                <p>{selectedActivities.join(' ')}</p>
            </div>

            <div className="alex-block-input-footer">
                {selectedStaff}
            </div>
        </div>
    );
};

/* ---------------------------------------------------------
   MAIN COMPONENT
   --------------------------------------------------------- */

function ActivityForm() {
    const [checkedItems, setCheckedItems] = useState({});
    const [dateMessage, setDateMessage] = useState('');
    const [formData, setFormData] = useState({ date: '', activity: '', tags: [], activities: '', other: '' });
    const [logEntry, setLogEntry] = useState('');
    const [selectedActivities, setSelectedActivities] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState('');
    const textareaRef = useRef(null);
    const [visiblePanels, setVisiblePanels] = useState({});

    // ⭐ NEW: refs for scrolling
    const checklistRef = useRef(null);
    const resultsRef = useRef(null);

    /* ---------------------------------------------------------
       INLINE BLOCKS
       --------------------------------------------------------- */

    const BlockActivityChecklist = () => (
        <div className="alex-block-checklist hint-block">
            When applicable, select a tag or multiple (command/select) tags to alert Heather that this
            date has a notable entry.
            <ul>
                {checklistListItems.map((item, index) => (
                    <li key={index}>
                        <label>
                            <input
                                type="checkbox"
                                checked={!!checkedItems[index]}
                                onChange={() =>
                                    setCheckedItems(prev => ({ ...prev, [index]: !prev[index] }))
                                }
                            />
                            {item}
                        </label>
                    </li>
                ))}
            </ul>
        </div>
    );

    const BlockActivityResultsInline = () => (
        <div className="alex-block-results hint-block">
            <div className="alex-block-input-wrapper">
                <div className="alex-block-input-buttons">
                    <button className="form-data-clear-button" type="button" onClick={handleCopy}>
                        Copy
                    </button>
                    <button className="form-data-clear-button" type="button" onClick={handleClear}>
                        Clear
                    </button>
                </div>

                <BlockActivityResults
                    logEntry={logEntry}
                    selectedActivities={selectedActivities}
                    selectedStaff={selectedStaff}
                />
            </div>
        </div>
    );

    /* ---------------------------------------------------------
       FORM LOGIC
       --------------------------------------------------------- */

    const checkDay = (date) => {
        const selectedDate = new Date(date + 'T00:00:00');
        const lastDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();

        if (selectedDate.getDate() === lastDay) {
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
        const day = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date).toUpperCase();
        return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} - ${day}`;
    };

    const handleChange = (e) => {
        const { name, value, options } = e.target;

        if (name === 'tags') {
            const selectedTags = Array.from(options).filter(o => o.selected).map(o => o.value);
            setFormData(prev => ({ ...prev, tags: selectedTags }));

            const otherDiv = document.querySelector('div.alex-block-select-other');
            if (selectedTags.includes('OTHER')) {
                otherDiv.classList.add('show');
                otherDiv.classList.remove('hide');
            } else {
                otherDiv.classList.remove('show');
                otherDiv.classList.add('hide');
            }

            setLogEntry(prev => {
                const datePart = prev.split('\n')[1] || '';
                const otherText = formData.other ? ` ${formData.other}` : '';
                const filtered = selectedTags.filter(t => t !== 'OTHER');
                return `NOTE TO HEATHER: ${filtered.join('. ')}.${selectedTags.includes('OTHER') ? otherText : ''}\n${datePart}`;
            });

        } else if (name === 'date') {
            setFormData(prev => ({ ...prev, date: value }));
            checkDay(value);

            const formatted = formatDate(new Date(value + 'T00:00:00'));
            setLogEntry(prev => {
                const tagsPart = prev.split('\n')[0] || '';
                return `${tagsPart}\n${formatted}`;
            });

        } else if (name === 'OTHER') {
            setFormData(prev => ({ ...prev, other: value }));

            setLogEntry(prev => {
                const [tagsPart, datePart] = prev.split('\n');
                const otherText = value ? ` ${value}` : '';
                return `${tagsPart.split('.')[0]}.${otherText}\n${datePart || ''}`;
            });

        } else if (name === 'activities') {
            setFormData(prev => ({ ...prev, activities: value }));
        }
    };

    const handleClear = () => {
        setFormData({ date: '', activity: '', tags: [], activities: '', other: '' });
        setLogEntry('');
        setSelectedActivities([]);
        setSelectedStaff('');
        setCheckedItems({});
        window.scrollTo(0, 0);
    };

    const handleCopy = () => {
        const text = `${logEntry}\n${selectedActivities.join(' ')}\n\n${selectedStaff}`;
        navigator.clipboard.writeText(text);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5001/save-log', formData);

            const formatted = formatDate(new Date(formData.date + 'T00:00:00'));
            const tagsWithoutOther = formData.tags.filter(t => t !== 'OTHER');
            const note = tagsWithoutOther.length > 0 || formData.tags.includes('OTHER')
                ? `NOTE FOR HEATHER: ${tagsWithoutOther.join('. ')}. `
                : '';

            const otherText = formData.other ? `${formData.other}\n` : '';

            setLogEntry(`\n\n${note}${otherText}\n\n${formatted}\n${formData.activities}`);
        } catch (err) {
            console.error(err);
        }
    };

    /* ---------------------------------------------------------
       SCROLL + PANEL TOGGLE
       --------------------------------------------------------- */

    const toggleVisibility = (panel) => {
        setVisiblePanels(prev => {
            const isOpening = !prev[panel];

            setTimeout(() => {
                // ⭐ Scroll to checklist
                if (panel === 'checklist' && isOpening && checklistRef.current) {
                    const top = checklistRef.current.getBoundingClientRect().top + window.scrollY;
                    window.scrollTo({ top: top + 50, behavior: 'smooth' });
                }

                // ⭐ Scroll to results
                if (panel === 'results' && isOpening && resultsRef.current) {
                    const top = resultsRef.current.getBoundingClientRect().top + window.scrollY;
                    window.scrollTo({ top: top + 50, behavior: 'smooth' });
                }
            }, 50);

            return { ...prev, [panel]: isOpening };
        });
    };

    /* ---------------------------------------------------------
       EFFECTS
       --------------------------------------------------------- */

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [formData.activities]);

    /* ---------------------------------------------------------
       MARKUP
       --------------------------------------------------------- */

    return (
        <main>
            <div className="alex-bottomnav">
                <h1 className="row">Alex Logs</h1>
                <div className="row">
                    <button
                        onClick={() =>
                            window.open(
                                "https://drive.google.com/drive/folders/1WouU-VuYWgM4Cl4ZeGkEV9vyhqVYPCOT",
                                "_blank")}>
                        Google Docs
                    </button>

                    <button
                        onClick={() => toggleVisibility('results')}
                    >
                        Results
                    </button>
                </div>

                <div className="row">
                    <button
                        onClick={() => toggleVisibility('checklist')}
                    >
                        Checklist
                    </button>

                    <button
                        onClick={() => window.location.href = "/results"}
                    >
                        Test Page
                    </button>
                </div>
            </div>

            <form
                onSubmit={handleSubmit}
            >
                <div className="row">

                    <div className="alex-block-date column">
                        <label>Date:</label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            required
                        />
                        <div className="hint-block">{dateMessage}</div>
                    </div>

                    <div className="alex-block-staff column">
                        <label>Staff: {selectedStaff}</label>
                        <select
                            className="alex-block-staff-select"
                            onChange={(e) => setSelectedStaff(e.target.value)}
                        >
                            {staffListItems.map((s, i) => (
                                <option key={i} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <div className="alex-block-tags column">
                        <label>Tags:</label>
                        <select
                            className="alex-block-select"
                            name="tags"
                            value={formData.tags}
                            onChange={handleChange}
                            multiple
                        >
                            {tagsListItems.map((t, i) => (
                                <option key={i} value={t}>{t}</option>
                            ))}
                        </select>

                        <div className={`alex-block-select-other ${formData.tags.includes('OTHER') ? 'show' : 'hide'}`}>
                            <label>Other:</label>
                            <textarea
                                name="OTHER"
                                value={formData.other}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="alex-block-activities column">
                        <label>Activities:</label>
                        <select
                            className="alex-block-activities-select"
                            onChange={(e) =>
                                setSelectedActivities(
                                    Array.from(e.target.selectedOptions).map(o => o.value)
                                )
                            }
                            multiple
                        >
                            {activityListItems.map((cat, i) => (
                                <optgroup key={i} label={cat.category}>
                                    {cat.items.map((item, j) => (
                                        <option key={j} value={item}>{item}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>

                </div>
            </form>

            {/* INLINE CHECKLIST */}
            {visiblePanels['checklist'] && (
                <div className="alex-inline-checklist-panel" ref={checklistRef}>
                    <BlockActivityChecklist />
                </div>
            )}

            {/* INLINE RESULTS */}
            {visiblePanels['results'] && (
                <div className="alex-inline-results-panel" ref={resultsRef}>
                    <BlockActivityResultsInline />
                </div>
            )}
        </main>
    );
}

export default ActivityForm;
