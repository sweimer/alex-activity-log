import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import ActivityForm from './components/ActivityForm';
import ResultsPage from './pages/ResultsPage';

import './styles/main.scss';

function App() {

    useEffect(() => {
        // HUDX Smart Embed: Auto-height Resizing Script (React App)
        function sendHUDXSmartEmbedHeight() {
            const height = document.body.scrollHeight + 20;
            window.parent.postMessage(
                { hudxSmartEmbedHeight: height },
                "*"
            );
        }

        // Initial height
        sendHUDXSmartEmbedHeight();

        // Watch for DOM changes
        const observer = new MutationObserver(sendHUDXSmartEmbedHeight);
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Update on window resize
        window.addEventListener("resize", sendHUDXSmartEmbedHeight);

        return () => {
            window.removeEventListener("resize", sendHUDXSmartEmbedHeight);
            observer.disconnect();
        };
    }, []);

    return (
        <Router>
            <Routes>
                <Route path="/" element={<ActivityForm />} />
                <Route path="/results" element={<ResultsPage />} />
            </Routes>
        </Router>
    );
}

export default App;
