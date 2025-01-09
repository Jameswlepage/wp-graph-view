import React, { useEffect, useState } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';

function FrontendApp() {
    const [elements, setElements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { restUrl, currentPostId, themeColors } = window.myGraphViewData || {};

    useEffect(() => {
        async function fetchLocalGraph() {
            try {
                if (!restUrl || !currentPostId) {
                    throw new Error('REST URL or currentPostId not provided.');
                }
                const res = await fetch(`${restUrl}/local-graph/${currentPostId}?max_edges=20`);
                if (!res.ok) {
                    throw new Error('Failed to fetch local-graph data.');
                }
                const data = await res.json();
                if (data.nodes.length < 2) {
                    // If there's not enough data, we can skip rendering
                    return;
                }
                const allElements = [...data.nodes, ...data.edges];
                setElements(allElements);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchLocalGraph();
    }, [restUrl, currentPostId]);

    if (loading) {
        return <div style={styles.overlay}>Loading mini-graph...</div>;
    }
    if (error) {
        return <div style={styles.overlayError}>Error: {error}</div>;
    }
    if (!elements || elements.length < 2) {
        return null; // Not enough data to display
    }

    const stylesheet = [
        {
            selector: 'node',
            style: {
                label: 'data(label)',
                'background-color': themeColors?.secondary || '#444444',
                color: '#000000',
                'font-size': '8px',
                'text-valign': 'bottom',
                'text-halign': 'center',
                'text-margin-y': '10px',
            },
        },
        {
            selector: 'node[?isCurrent]',
            style: {
                'background-color': themeColors?.primary || '#9370DB',
                'border-width': '3px',
                'border-color': '#000000',
            },
        },
        {
            selector: 'edge',
            style: {
                width: 1,
                'line-color': '#e0e0e0',
                opacity: 0.8,
            },
        },
        {
            selector: 'edge.highlighted',
            style: {
                'line-color': themeColors?.primary || '#9370DB',
                opacity: 1,
                width: 2,
            },
        },
        {
            selector: 'node.faded',
            style: {
                opacity: 0.5,
            },
        },
        {
            selector: 'edge.faded',
            style: {
                opacity: 0,
            },
        },
    ];

    const layout = {
        name: 'concentric',
        concentric: (node) => node.degree(),
        levelWidth: () => 2,
        animate: true,
        padding: 10,
    };

    return (
        <div style={styles.container}>
            <CytoscapeComponent
                elements={elements}
                stylesheet={stylesheet}
                layout={layout}
                style={{ width: '100%', height: '300px' }}
                cy={(cy) => {
                    // Hover logic, etc.
                    cy.on('mouseover', 'node', (evt) => {
                        cy.elements().addClass('faded');
                        const node = evt.target;
                        node.removeClass('faded');
                        node.connectedEdges().removeClass('faded').addClass('highlighted');
                        node.neighborhood('node').removeClass('faded');
                    });

                    cy.on('mouseout', 'node', () => {
                        cy.elements().removeClass('faded').removeClass('highlighted');
                    });
                }}
            />
        </div>
    );
}

const styles = {
    container: {
        position: 'relative',
        width: '100%',
        height: '300px',
        border: '1px solid #ccc',
        margin: '1em 0',
    },
    overlay: {
        padding: '1em',
    },
    overlayError: {
        padding: '1em',
        backgroundColor: '#fdd',
        border: '1px solid red',
    },
};

export default FrontendApp;
