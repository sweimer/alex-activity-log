// Import required modules
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const allowedOrigins = ['http://localhost:3000', 'https://alex-activity-log.vercel.app'];

// Initialize express app
const app = express();
const port = 5001;

// Middleware to parse JSON and handle CORS
app.use(bodyParser.json());
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ["GET", "POST", "OPTIONS"], // Allowed HTTP methods
    allowedHeaders: ["Content-Type"],
}));

// Function to format a date as 03/01/2025 - SATURDAY
const formatDate = (date) => {
    const dayOfWeek = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date).toUpperCase();
    const formattedDate = `${date.getMonth() + 1}/${String(date.getDate()).padStart(2, '0')}/${String(date.getFullYear()).slice(-2)} - ${dayOfWeek}`;
    return formattedDate;
};

const parseFormattedDate = (formattedDate) => {
    const [datePart, dayOfWeek] = formattedDate.split(' - ');
    const [month, day, year] = datePart.split('/');
    return new Date(`${year}-${month}-${day}`);
};

// Function to sort log entries by date
const sortLogEntriesByDate = (logFilePath) => {
    const logFileContent = fs.readFileSync(logFilePath, 'utf-8');
    const logEntries = logFileContent.split('\r\n\r\n').filter(entry => entry.trim() !== '');

    logEntries.sort((a, b) => {
        const dateA = parseFormattedDate(a.split('\r\n')[0]);
        const dateB = parseFormattedDate(b.split('\r\n')[0]);
        return dateA - dateB;
    });

    const sortedLogContent = logEntries.join('\r\n\r\n');
    fs.writeFileSync(logFilePath, sortedLogContent, { flag: 'w' });
};

// Default route for root URL
app.get("/", (req, res) => {
    res.send("Welcome to the Alex Activity Log Server!");
});

// Endpoint to handle form submission and save to log file
app.post('/save-log', (req, res) => {
    const formData = req.body;
    const formattedDate = formatDate(new Date(formData.date + 'T00:00:00'));
    const logEntry = `\r\n\r\n${formData.tags.length > 0 ? `NOTE:${formData.tags.join('. ')}. \r\n` : ''}${formattedDate}\r\n${formData.wake} ${formData.morning} `;

    try {
        // if (!fs.existsSync(logFilePath)) {
        //     fs.writeFileSync(logFilePath, logHeader, { flag: "w" });
        // }

        // const logFileContent = fs.readFileSync(logFilePath, "utf-8");
        // if (logFileContent.includes(formattedDate)) {
        //     return res.status(400).json({ message: "Date has already been submitted" });
        // }

        // fs.appendFile(logFilePath, logEntry, (err) => {
        //     if (err) {
        //         console.error("Error saving to log file:", err);
        //         return res.status(500).json({ message: "Error saving data", error: err.message });
        //     }
        //     console.log("Form data saved to", logFilePath);
        //     sortLogEntriesByDate(logFilePath);
        //     res.status(200).json({ message: "Form data saved successfully" });
        // });

        console.log("Form data received but not saved to log file.");
        res.status(200).json({ message: "Form data received but not saved to log file." });
    } catch (error) {
        console.error("Unexpected error:", error);
        res.status(500).json({ message: "Unexpected error occurred", error: error.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log('Server is running on port 5001');
});