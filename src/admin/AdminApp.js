import React, { useEffect, useState } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';

// Hover info component
function HoverInfo({ data, type }) {
    if (!data) return null;

    const style = {
        position: 'absolute',
        top: '20px',
        left: '20px',
        padding: '15px',
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        maxWidth: '300px',
        zIndex: 1000,
    };

    if (type === 'node') {
        const { label, excerpt, taxonomies, id } = data;
        return (
            <div style={style}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>{label}</h3>
                {excerpt && (
                    <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
                        {excerpt.length > 150 ? excerpt.substring(0, 150) + '...' : excerpt}
                    </p>
                )}
                {taxonomies && Array.isArray(taxonomies) && taxonomies.length > 0 && (
                    <div style={{ margin: '0 0 10px 0', fontSize: '12px' }}>
                        {taxonomies.map(({ taxonomy, terms }) => (
                            <div key={taxonomy}>
                                <strong>{taxonomy}:</strong> {Array.isArray(terms) ? terms.join(', ') : terms}
                            </div>
                        ))}
                    </div>
                )}
                <a
                    href={`/wp-admin/post.php?post=${id}&action=edit`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'inline-block',
                        padding: '5px 10px',
                        backgroundColor: '#2271b1',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '3px',
                        fontSize: '12px'
                    }}
                >
                    Edit Post
                </a>
            </div>
        );
    }

    if (type === 'edge') {
        const { relationship } = data;

        // Convert relationship type to human-readable format
        const getRelationshipLabel = (type) => {
            switch (type) {
                case 'parent':
                    return 'Parent Page';
                case 'child':
                    return 'Child Page';
                case 'internal_link':
                    return 'Internal Link';
                case 'shared_taxonomy':
                    return 'Shared Taxonomy Terms';
                default:
                    return type ? type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown';
            }
        };

        return (
            <div style={style}>
                <h3 style={{ margin: '0', fontSize: '14px' }}>
                    {getRelationshipLabel(relationship)}
                </h3>
            </div>
        );
    }

    return null;
}

function AdminApp() {
    const [elements, setElements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hoverData, setHoverData] = useState(null);
    const [hoverType, setHoverType] = useState(null);

    // Theme colors passed via localized data
    const { restUrl, nonce, themeColors } = window.myGraphViewAdminData || {};

    useEffect(() => {
        async function fetchGraph() {
            try {
                if (!restUrl) {
                    throw new Error('REST URL not provided.');
                }
                // GET /full-graph
                const res = await fetch(`${restUrl}/full-graph`, {
                    headers: { 'X-WP-Nonce': nonce },
                });
                if (!res.ok) {
                    throw new Error('Failed to fetch the full-graph data.');
                }
                const data = await res.json();
                // Format shape { nodes, edges } -> [ { data: {...}}, ... ]
                // react-cytoscapejs uses the same format as cytoscape
                const allElements = [
                    ...data.nodes,
                    ...data.edges,
                ];
                setElements(allElements);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchGraph();
    }, [restUrl, nonce]);

    if (loading) {
        return <div style={styles.loadingOverlay}>Loading graph data...</div>;
    }
    if (error) {
        return <div style={styles.errorOverlay}>Error: {error}</div>;
    }

    // Basic Cytoscape stylesheet
    const stylesheet = [
        {
            selector: 'node',
            style: {
                label: 'data(label)',
                'background-color': themeColors?.secondary || '#444444',
                color: '#000000',
                'text-valign': 'bottom',
                'text-halign': 'center',
                'font-size': '10px',
                'text-margin-y': '10px',
            },
        },
        {
            selector: 'edge',
            style: {
                width: 1,
                'line-color': '#e0e0e0',
                'target-arrow-shape': 'triangle',
                'target-arrow-color': '#e0e0e0',
                'curve-style': 'bezier',
                opacity: 0.8,
            },
        },
        {
            selector: 'node.hover',
            style: {
                'background-color': themeColors?.primary || '#9370DB',
            },
        },
        {
            selector: 'node.faded',
            style: {
                opacity: 0.5,
            },
        },
        {
            selector: 'edge.highlighted',
            style: {
                'line-color': themeColors?.primary || '#9370DB',
                'target-arrow-color': themeColors?.primary || '#9370DB',
                opacity: 1,
                width: 2,
            },
        },
    ];

    // Basic layout
    const layout = {
        name: 'cose',  // Compound Spring Embedder algorithm
        animate: true,
        padding: 50,
        nodeRepulsion: 8000,  // Higher values = nodes push each other away more
        idealEdgeLength: 100, // Edge length
        nodeOverlap: 20,      // How much overlap to tolerate
        refresh: 20,          // Number of iterations between consecutive screen positions update
        fit: true,           // Whether to fit the network view after when done
        randomize: false,    // Whether to give nodes random positions at first
        componentSpacing: 100, // Extra spacing between components
        nodeDimensionsIncludeLabels: true,
        gravity: 80,         // Higher values = nodes attracted to center more
    };

    return (
        <div style={{ width: '100%', height: '800px', border: '1px solid #ccc', position: 'relative' }}>
            <HoverInfo data={hoverData} type={hoverType} />
            <CytoscapeComponent
                elements={elements}
                stylesheet={stylesheet}
                layout={layout}
                style={{ width: '100%', height: '100%' }}
                cy={(cy) => {
                    // On mouseover node
                    cy.on('mouseover', 'node', (evt) => {
                        const node = evt.target;
                        setHoverData(node.data());
                        setHoverType('node');

                        // Existing hover styling
                        node.addClass('hover');
                        const connectedEdges = node.connectedEdges();
                        const connectedNodes = node.neighborhood('node');
                        cy.elements().addClass('faded');
                        node.removeClass('faded');
                        connectedEdges.removeClass('faded').addClass('highlighted');
                        connectedNodes.removeClass('faded');
                    });

                    // On mouseout node
                    cy.on('mouseout', 'node', (evt) => {
                        setHoverData(null);
                        setHoverType(null);

                        // Existing mouseout styling
                        evt.target.removeClass('hover');
                        cy.elements().removeClass('faded').removeClass('highlighted');
                    });

                    // On mouseover edge
                    cy.on('mouseover', 'edge', (evt) => {
                        const edge = evt.target;
                        setHoverData(edge.data());
                        setHoverType('edge');

                        // Add hover styling for edge
                        edge.addClass('highlighted');
                    });

                    // On mouseout edge
                    cy.on('mouseout', 'edge', () => {
                        setHoverData(null);
                        setHoverType(null);
                        cy.edges().removeClass('highlighted');
                    });

                    // Existing click handler
                    cy.on('tap', 'node', (evt) => {
                        const nodeData = evt.target.data();
                        if (nodeData.id) {
                            window.open(`/wp-admin/post.php?post=${nodeData.id}&action=edit`, '_blank');
                        }
                    });
                }}
            />
        </div>
    );
}

const styles = {
    loadingOverlay: {
        padding: '1em',
        backgroundColor: '#fff',
        border: '1px solid #ccc',
        margin: '1em',
    },
    errorOverlay: {
        padding: '1em',
        backgroundColor: '#fdd',
        border: '1px solid red',
        margin: '1em',
    },
};

export default AdminApp;
