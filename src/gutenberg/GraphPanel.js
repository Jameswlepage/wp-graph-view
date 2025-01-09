import React, { useEffect, useState, useMemo } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import { Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

function GraphPanel() {
    const [elements, setElements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cyInstance, setCyInstance] = useState(null);

    // Get current post ID using WordPress data
    const postId = useSelect(select => select('core/editor').getCurrentPostId());

    // Theme colors passed via localized data
    const { restUrl, nonce, themeColors } = window.graphviewData || {};

    // Fetch graph data when post ID changes
    useEffect(() => {
        async function fetchGraph() {
            if (!postId) return;

            try {
                const res = await fetch(`${restUrl}/local-graph/${postId}`, {
                    headers: { 'X-WP-Nonce': nonce },
                });
                if (!res.ok) {
                    throw new Error('Failed to fetch graph data');
                }
                const data = await res.json();
                if (!data.nodes || !data.edges) {
                    throw new Error('Invalid graph data format');
                }

                setElements([...data.nodes, ...data.edges]);
                setLoading(false);
            } catch (err) {
                console.error('Graph loading error:', err);
                setError(err.message);
                setLoading(false);
            }
        }

        fetchGraph();
    }, [postId]);

    // Memoize the stylesheet
    const stylesheet = useMemo(() => {
        const primaryColor = themeColors?.primary || '#2271b1';
        const secondaryColor = themeColors?.secondary || '#1d2327';

        return [
            {
                selector: 'node',
                style: {
                    label: 'data(label)',
                    'background-color': secondaryColor,
                    color: '#000000',
                    'text-valign': 'bottom',
                    'text-halign': 'center',
                    'font-size': '8px',
                    'text-margin-y': '5px',
                    width: 15,
                    height: 15,
                    'z-index': 1,
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
                    'z-index': 0,
                    'arrow-scale': 0.8,
                },
            },
            {
                selector: 'node.hover',
                style: {
                    'background-color': primaryColor,
                    'z-index': 10,
                    width: 20,
                    height: 20,
                    'font-size': '10px',
                    'font-weight': 'bold',
                    'text-background-color': '#ffffff',
                    'text-background-opacity': 1,
                    'text-background-padding': '2px',
                },
            },
            {
                selector: 'edge.hover',
                style: {
                    'line-color': primaryColor,
                    'target-arrow-color': primaryColor,
                    width: 2,
                    opacity: 1,
                    'z-index': 9,
                },
            },
        ];
    }, [themeColors]);

    // Layout configuration
    const layout = {
        name: 'cose',
        animate: true,
        padding: 15,
        nodeRepulsion: function () { return 4000; },
        nodeOverlap: 10,
        idealEdgeLength: function () { return 30; },
        edgeElasticity: function () { return 25; },
        nestingFactor: 1.2,
        gravity: 30,
        numIter: 500,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0,
        fit: true,
        randomize: false,
    };

    if (error) {
        return (
            <div style={{ padding: '10px', color: '#d63638', fontSize: '12px' }}>
                Error: {error}
            </div>
        );
    }

    if (loading) {
        return (
            <div style={{ padding: '10px', textAlign: 'center' }}>
                <Spinner />
            </div>
        );
    }

    return (
        <div style={{
            height: 'calc(min(250px, 40vh))',
            position: 'relative',
            padding: '16px',
            overflow: 'hidden',
            maxHeight: '40vh',
            border: '1px solid #e0e0e0',
            borderRadius: '2px',
            backgroundColor: '#fff'
        }}>
            <CytoscapeComponent
                elements={elements}
                stylesheet={stylesheet}
                layout={{
                    ...layout,
                    padding: 20,
                    fit: true,
                    spacingFactor: 0.8,
                }}
                style={{
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0
                }}
                cy={(cy) => {
                    setCyInstance(cy);

                    // Tap event for opening posts
                    cy.on('tap', 'node', function (evt) {
                        const node = evt.target;
                        if (node.data('id')) {
                            window.open(`/wp-admin/post.php?post=${node.data('id')}&action=edit`, '_blank');
                        }
                    });

                    // Mouse hover events
                    cy.on('mouseover', 'node', function (evt) {
                        const node = evt.target;
                        const neighborhood = node.neighborhood().add(node);

                        // Clear existing hover classes
                        cy.elements().removeClass('hover');

                        // Add hover class to node and connected elements
                        neighborhood.addClass('hover');
                    });

                    cy.on('mouseout', 'node', function () {
                        cy.elements().removeClass('hover');
                    });
                }}
            />
        </div>
    );
}

export default GraphPanel; 