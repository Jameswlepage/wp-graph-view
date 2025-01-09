import React, { useEffect, useState, useMemo } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';

// Import WordPress components properly
import { Icon } from '@wordpress/components';
import { rotateLeft, fullscreen, close } from '@wordpress/icons';

// Simplified hover info component for frontend
function HoverInfo({ data, type }) {
    if (!data) return null;

    const { themeColors } = window.graphviewData || {};
    const primaryColor = themeColors?.primary || '#2271b1';

    const style = {
        position: 'absolute',
        top: '10px',
        left: '10px',
        padding: '8px 12px',
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        maxWidth: '250px',
        zIndex: 1000,
        fontSize: '12px',
    };

    // Function to decode HTML entities
    const decodeHTML = (html) => {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    };

    if (type === 'node') {
        const { label } = data;
        return (
            <div style={style}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {decodeHTML(label)}
                </div>
                <div style={{ fontSize: '11px', color: '#666', fontStyle: 'italic' }}>
                    Click to view post
                </div>
            </div>
        );
    }

    if (type === 'edge') {
        const { relationship, source_title, target_title, shared_terms } = data;

        const getRelationshipText = () => {
            switch (relationship) {
                case 'parent':
                    return `Parent of "${target_title}"`;
                case 'child':
                    return `Child of "${source_title}"`;
                case 'internal_link':
                    return `Links to "${target_title}"`;
                case 'shared_taxonomy':
                    if (shared_terms) {
                        return `Shares ${shared_terms.taxonomy}: ${shared_terms.terms.join(', ')}`;
                    }
                    return 'Shares taxonomy terms';
                default:
                    return relationship ? relationship.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '';
            }
        };

        return (
            <div style={style}>
                {getRelationshipText()}
            </div>
        );
    }

    return null;
}

// Control buttons component
function ControlButtons({ onReset, onPopOut, isExpanded }) {
    const buttonStyle = {
        position: 'absolute',
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '4px',
        cursor: 'pointer',
        width: '28px',
        height: '28px',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    };

    const iconStyle = {
        width: '20px',
        height: '20px',
        display: 'block',
    };

    return (
        <>
            <button
                style={{ ...buttonStyle, top: '10px', right: '44px' }}
                onClick={onReset}
                title="Reset View"
            >
                <Icon icon={rotateLeft} size={20} style={iconStyle} />
            </button>
            <button
                style={{ ...buttonStyle, top: '10px', right: '10px' }}
                onClick={onPopOut}
                title={isExpanded ? "Close" : "Expand"}
            >
                <Icon icon={isExpanded ? close : fullscreen} size={20} style={iconStyle} />
            </button>
        </>
    );
}

function FrontendApp() {
    const [elements, setElements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hoverData, setHoverData] = useState(null);
    const [hoverType, setHoverType] = useState(null);
    const [cyInstance, setCyInstance] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);

    const { restUrl, currentPostId, themeColors } = window.graphviewData || {};
    const primaryColor = themeColors?.primary || '#2271b1';
    const secondaryColor = themeColors?.secondary || '#1d2327';

    // Memoize the layout config
    const layout = useMemo(() => ({
        name: 'cose',
        animate: true,
        padding: 30,
        nodeRepulsion: function () { return 10000; },
        nodeOverlap: 20,
        idealEdgeLength: function () { return 50; },
        edgeElasticity: function () { return 100; },
        nestingFactor: 1.2,
        gravity: 80,
        numIter: 200,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0,
        fit: true,
        randomize: false,
        componentSpacing: 50,
        nodeDimensionsIncludeLabels: true,
        stop: function () {
            console.log('Layout complete');
        }
    }), []);

    // Add effect for initial zoom fitting
    useEffect(() => {
        if (!cyInstance || loading) return;

        // Wait for layout to complete
        const timer = setTimeout(() => {
            // Find the current node
            const currentNode = cyInstance.nodes('[?isCurrent]');
            if (!currentNode.length) return;

            // Get connected nodes and edges
            const neighborhood = currentNode.neighborhood();
            const relevantElements = currentNode.union(neighborhood);

            // Get the bounds of the relevant elements
            const bounds = relevantElements.boundingBox();
            const padding = 20; // Reduced padding for mini-graph

            // Calculate container dimensions
            const containerWidth = cyInstance.width();
            const containerHeight = cyInstance.height();

            // Calculate zoom ratios focusing on the neighborhood
            const widthRatio = (containerWidth - 2 * padding) / bounds.w;
            const heightRatio = (containerHeight - 2 * padding) / bounds.h;

            // Use a larger zoom factor for the mini-graph
            let zoomFactor = Math.min(widthRatio, heightRatio) * 1.5; // Increase zoom by 50%

            // Ensure we don't zoom in too far
            zoomFactor = Math.min(zoomFactor, 2.5); // Cap maximum zoom

            // Center on the current node and apply zoom
            cyInstance.zoom({
                level: zoomFactor,
                position: currentNode.position()
            });

            // Pan to center the current node
            cyInstance.center(currentNode);

        }, 100); // Wait for layout to settle

        return () => clearTimeout(timer);
    }, [cyInstance, loading]);

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

    // Memoize the stylesheet
    const stylesheet = useMemo(() => [
        {
            selector: 'node',
            style: {
                label: 'data(label)',
                'background-color': secondaryColor,
                color: '#000000',
                'font-size': '10px',
                'text-valign': 'bottom',
                'text-halign': 'center',
                'text-margin-y': '10px',
                'z-index': 1,
            },
        },
        {
            selector: 'node[?isCurrent]',
            style: {
                'background-color': primaryColor,
                'z-index': 10,
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
            },
        },
        {
            selector: 'node.hover',
            style: {
                'background-color': primaryColor,
                'z-index': 10,
            },
        },
        {
            selector: 'node.faded',
            style: {
                opacity: 0.5,
                'z-index': 0,
            },
        },
        {
            selector: 'edge.highlighted',
            style: {
                'line-color': primaryColor,
                'target-arrow-color': primaryColor,
                opacity: 1,
                width: 2,
                'z-index': 9,
            },
        },
        {
            selector: 'edge.faded',
            style: {
                'z-index': 0,
                opacity: 0.2,
            },
        },
        {
            selector: 'node.highlighted',
            style: {
                'z-index': 8,
                opacity: 1,
            },
        },
    ], [primaryColor, secondaryColor]);

    const handleReset = () => {
        if (cyInstance) {
            cyInstance.fit();
            cyInstance.center();
        }
    };

    const handlePopOut = () => {
        setIsExpanded(!isExpanded);
    };

    const containerStyle = {
        position: 'relative',
        width: '100%',
        height: isExpanded ? '80vh' : '300px',
        border: '1px solid #ccc',
        margin: '1em 0',
        backgroundColor: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    };

    const modalStyle = {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90vw',
        height: '80vh',
        maxWidth: '1400px',
        backgroundColor: 'white',
        zIndex: 160000,
        padding: '20px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
        borderRadius: '4px',
    };

    const modalOverlayStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 159999,
    };

    const loadingStyle = {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        zIndex: 10,
    };

    if (error) {
        return (
            <div style={containerStyle}>
                <div style={styles.overlayError}>Error: {error}</div>
            </div>
        );
    }

    // Add a useEffect to handle layout recalculation when expanded
    useEffect(() => {
        if (isExpanded && cyInstance) {
            // Small delay to ensure the modal is rendered
            setTimeout(() => {
                cyInstance.resize();
                cyInstance.fit();
                cyInstance.center();
            }, 50);
        }
    }, [isExpanded, cyInstance]);

    const graphContent = (
        <>
            {loading && (
                <div style={loadingStyle}>
                    Loading mini-graph...
                </div>
            )}
            {!loading && elements.length >= 2 && (
                <>
                    <HoverInfo data={hoverData} type={hoverType} />
                    <ControlButtons
                        onReset={handleReset}
                        onPopOut={handlePopOut}
                        isExpanded={isExpanded}
                    />
                    <CytoscapeComponent
                        elements={elements}
                        stylesheet={stylesheet}
                        layout={layout}
                        style={{ width: '100%', height: '100%' }}
                        cy={(cy) => {
                            setCyInstance(cy);

                            cy.on('mouseover', 'node', (evt) => {
                                const node = evt.target;
                                setHoverData(node.data());
                                setHoverType('node');

                                node.addClass('hover');
                                const connectedEdges = node.connectedEdges();
                                const connectedNodes = node.neighborhood('node');

                                cy.elements().addClass('faded');
                                node.removeClass('faded').addClass('hover');
                                connectedEdges.removeClass('faded').addClass('highlighted');
                                connectedNodes.removeClass('faded').addClass('highlighted');
                            });

                            cy.on('mouseout', 'node', () => {
                                setHoverData(null);
                                setHoverType(null);

                                cy.elements()
                                    .removeClass('faded')
                                    .removeClass('highlighted')
                                    .removeClass('hover');
                            });

                            cy.on('mouseover', 'edge', (evt) => {
                                const edge = evt.target;
                                setHoverData(edge.data());
                                setHoverType('edge');

                                cy.elements().addClass('faded');
                                edge.removeClass('faded').addClass('highlighted');
                                edge.source().removeClass('faded').addClass('highlighted');
                                edge.target().removeClass('faded').addClass('highlighted');
                            });

                            cy.on('mouseout', 'edge', () => {
                                setHoverData(null);
                                setHoverType(null);

                                cy.elements()
                                    .removeClass('faded')
                                    .removeClass('highlighted')
                                    .removeClass('hover');
                            });

                            cy.on('tap', 'node', (evt) => {
                                const nodeData = evt.target.data();
                                if (nodeData.id) {
                                    window.location.href = `?p=${nodeData.id}`;
                                }
                            });
                        }}
                    />
                </>
            )}
        </>
    );

    return isExpanded ? (
        <>
            <div style={modalOverlayStyle} onClick={() => setIsExpanded(false)} />
            <div style={modalStyle}>
                {graphContent}
            </div>
        </>
    ) : (
        <div style={containerStyle}>
            {graphContent}
        </div>
    );
}

const styles = {
    overlayError: {
        padding: '1em',
        backgroundColor: '#fdd',
        border: '1px solid red',
        borderRadius: '4px',
    },
};

export default FrontendApp;
