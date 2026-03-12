import React, { useEffect } from 'react';
import ActivityForm from './components/ActivityForm';
import './styles/main.scss';

function App() {

    useEffect(() => {
        const sendHeight = () => {
            const height = document.body.scrollHeight;
            window.parent.postMessage({ hudxAppHeight: height }, "*");
        };

        // Send initial height
        sendHeight();

        // Send height on resize
        window.addEventListener("resize", sendHeight);

        // Send height when content changes
        const observer = new MutationObserver(sendHeight);
        observer.observe(document.body, { childList: true, subtree: true });

        return () => {
            window.removeEventListener("resize", sendHeight);
            observer.disconnect();
        };
    }, []);

    return (
        <div>
            <ActivityForm/>
        </div>
    );
}

export default App;
