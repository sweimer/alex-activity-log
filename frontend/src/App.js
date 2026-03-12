import React, { useEffect } from 'react';
import ActivityForm from './components/ActivityForm';
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
        <div>
            <ActivityForm/>
        </div>
    );
}

export default App;
