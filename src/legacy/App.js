import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import ActivityForm from './components/ActivityForm';
import ResultsPage from './pages/ResultsPage';

import './styles/main.scss';

// ------------------------------------------------------------
// Robust height calculation for Smart Embed
// ------------------------------------------------------------
function getTrueHeight() {
    const body = document.body;
    const html = document.documentElement;

    return Math.max(
        body.scrollHeight,
        body.offsetHeight,
        body.clientHeight,
        html.scrollHeight,
        html.offsetHeight,
        html.clientHeight
    );
}

function App() {
    useEffect(() => {
        let heightTimeout;

        function sendHeight() {
            clearTimeout(heightTimeout);
            heightTimeout = setTimeout(() => {
                const height = getTrueHeight();

                window.parent.postMessage(
                    {
                        hudxAppHeight: height,      // ⭐ NEW KEY
                        hudxEmbedId: window.name    // ⭐ REQUIRED FOR ISOLATION
                    },
                    "*"
                );
            }, 50);
        }

        // Initial height
        sendHeight();

        // Watch for DOM changes
        const observer = new MutationObserver(sendHeight);
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true
        });

        // Update on window resize
        window.addEventListener("resize", sendHeight);

        return () => {
            observer.disconnect();
            window.removeEventListener("resize", sendHeight);
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
