import React from 'react';

function ResultsPage() {
    return (
        <div style={{ padding: '20px' }}>
            <h1>Test Page</h1>

            <button
                style={{
                    marginBottom: '20px',
                    padding: '10px 20px',
                    background: '#444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                }}
                onClick={() => window.location.href = "/"}
            >
                ← Back to Form
            </button>

            <div
                style={{
                    display: 'flex',
                    gap: '20px',
                    marginTop: '20px'
                }}
            >
                <div
                    style={{
                        flex: 1,
                        background: '#f2f2f2',
                        padding: '20px',
                        borderRadius: '8px'
                    }}
                >
                    <h2>Column 1</h2>
                    <p>Static test content goes here.</p>
                    <p>Lorem ipsum dolor sit amet.</p>
                </div>

                <div
                    style={{
                        flex: 1,
                        background: '#e8e8e8',
                        padding: '20px',
                        borderRadius: '8px'
                    }}
                >
                    <h2>Column 2</h2>
                    <p>More static test content.</p>
                    <p>Consectetur adipiscing elit.</p>
                </div>

                <div
                    style={{
                        flex: 1,
                        background: '#dedede',
                        padding: '20px',
                        borderRadius: '8px'
                    }}
                >
                    <h2>Column 3</h2>
                    <p>Even more static test content.</p>
                    <p>Sed do eiusmod tempor.</p>
                </div>
            </div>
        </div>
    );
}

export default ResultsPage;
