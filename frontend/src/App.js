import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import ActivityForm from './components/ActivityForm';
import ResultsPage from './pages/ResultsPage';

import './styles/main.scss';

function App() {

    useEffect(() => {
        const sendHeight = () => {
            const height = document.body.getBoundingClientRect().height + 200;
            window.parent.postMessage({ hudxAppHeight: height }, "*");
        };

        sendHeight();

        window.addEventListener("resize", sendHeight);

        const observer = new MutationObserver(sendHeight);
        observer.observe(document.body, { childList: true, subtree: true });

        return () => {
            window.removeEventListener("resize", sendHeight);
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
