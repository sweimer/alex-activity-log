import React from 'react';

function ResultsPage() {
    return (
        <main>
            <h1>Test Page</h1>

            <button
                onClick={() => window.location.href = "/"}
            >
                ← Back to Form
            </button>

            <div className="row">
                <div className="card">
                    <h2>Column 1</h2>
                    <p>Static test content goes here.</p>
                    <p>Lorem ipsum dolor sit amet.</p>
                </div>

                <div className="card">
                    <h2>Column 2</h2>
                    <p>More static test content.</p>
                    <p>Consectetur adipiscing elit.</p>
                </div>

                <div className="card">
                    <h2>Column 3</h2>
                    <p>Even more static test content.</p>
                    <p>Sed do eiusmod tempor.</p>
                </div>
            </div>
        </main>
    );
}

export default ResultsPage;
