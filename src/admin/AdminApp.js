import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
        const { relationship, source, target, shared_terms, source_title, target_title } = data;

        const getRelationshipDetails = () => {
            switch (relationship) {
                case 'parent':
                    return `Parent page of "${target_title}"`;
                case 'child':
                    return `Child page of "${source_title}"`;
                case 'internal_link':
                    return `Contains link to "${target_title}"`;
                case 'shared_taxonomy':
                    if (shared_terms) {
                        return `Shares ${shared_terms.taxonomy}: ${shared_terms.terms.join(', ')}`;
                    }
                    return 'Shares taxonomy terms';
                default:
                    return relationship ? relationship.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown';
            }
        };

        return (
            <div style={style}>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '14px' }}>
                    {getRelationshipDetails()}
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
    const [cyInstance, setCyInstance] = useState(null);

    // Theme colors passed via localized data
    const { restUrl, nonce, themeColors } = window.myGraphViewAdminData || {};

    // Memoize the stylesheet
    const stylesheet = useMemo(() => [
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
            },
        },
        {
            selector: 'node.hover',
            style: {
                'background-color': themeColors?.primary || '#9370DB',
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
                'line-color': themeColors?.primary || '#9370DB',
                'target-arrow-color': themeColors?.primary || '#9370DB',
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
    ], [themeColors]);

    // Memoize the layout config
    const layout = useMemo(() => ({
        name: 'cose',
        animate: true,
        padding: 100,
        nodeRepulsion: function (node) { return 20000; },
        nodeOverlap: 40,
        idealEdgeLength: function (edge) { return 100; },
        edgeElasticity: function (edge) { return 100; },
        nestingFactor: 1.2,
        gravity: 80,
        numIter: 500,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0,
        fit: true,
        randomize: false,
        componentSpacing: 100,
        nodeDimensionsIncludeLabels: true,
        refresh: 20,
        animationDuration: 1000,
        maxSimulationTime: 4000,
        stop: function () {
            console.log('Initial layout complete');
        }
    }), []);

    // Memoize event handlers
    const handleNodeHover = useCallback((node) => {
        setHoverData(node.data());
        setHoverType('node');

        node.addClass('hover');
        const connectedEdges = node.connectedEdges();
        const connectedNodes = node.neighborhood('node');

        cyInstance.elements().addClass('faded');
        node.removeClass('faded').addClass('hover');
        connectedEdges.removeClass('faded').addClass('highlighted');
        connectedNodes.removeClass('faded').addClass('highlighted');
    }, [cyInstance]);

    const handleNodeMouseOut = useCallback(() => {
        setHoverData(null);
        setHoverType(null);

        cyInstance?.elements()
            .removeClass('faded')
            .removeClass('highlighted')
            .removeClass('hover');
    }, [cyInstance]);

    const handleEdgeHover = useCallback((edge) => {
        setHoverData(edge.data());
        setHoverType('edge');

        cyInstance.elements().addClass('faded');
        edge.removeClass('faded').addClass('highlighted');
        edge.source().removeClass('faded').addClass('highlighted');
        edge.target().removeClass('faded').addClass('highlighted');
    }, [cyInstance]);

    // Set up Cytoscape event handlers
    useEffect(() => {
        if (!cyInstance) return;

        cyInstance.on('mouseover', 'node', (evt) => handleNodeHover(evt.target));
        cyInstance.on('mouseout', 'node', handleNodeMouseOut);
        cyInstance.on('mouseover', 'edge', (evt) => handleEdgeHover(evt.target));
        cyInstance.on('mouseout', 'edge', handleNodeMouseOut);
        cyInstance.on('tap', 'node', (evt) => {
            const nodeData = evt.target.data();
            if (nodeData.id) {
                window.open(`/wp-admin/post.php?post=${nodeData.id}&action=edit`, '_blank');
            }
        });

        // Cleanup
        return () => {
            cyInstance.removeListener('mouseover');
            cyInstance.removeListener('mouseout');
            cyInstance.removeListener('tap');
        };
    }, [cyInstance, handleNodeHover, handleNodeMouseOut, handleEdgeHover]);

    useEffect(() => {
        async function fetchGraph() {
            try {
                if (!restUrl) {
                    throw new Error('REST URL not provided.');
                }
                const res = await fetch(`${restUrl}/full-graph`, {
                    headers: { 'X-WP-Nonce': nonce },
                });
                if (!res.ok) {
                    throw new Error('Failed to fetch the full-graph data.');
                }
                const data = await res.json();
                if (!data.nodes || !data.edges) {
                    throw new Error('Invalid graph data format');
                }
                const allElements = [
                    ...data.nodes,
                    ...data.edges,
                ];
                setElements(allElements);
                setLoading(false);
            } catch (err) {
                console.error('Graph loading error:', err);
                setError(err.message);
                setLoading(false);
            }
        }

        fetchGraph();
    }, [restUrl, nonce]);

    const containerStyle = {
        width: '100%',
        height: '800px',
        border: '1px solid #ccc',
        position: 'relative',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
    };

    const graphContainerStyle = {
        flex: 1,
        position: 'relative',
        minHeight: 0,
    };

    const loadingOverlayStyle = {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    };

    const loadingTextStyle = {
        marginTop: '20px',
        color: '#1d2327',
        fontSize: '16px',
        fontWeight: 500
    };

    if (error) {
        return (
            <div style={containerStyle}>
                <div style={{ ...loadingOverlayStyle, backgroundColor: '#fdd' }}>
                    <div style={{ color: '#d63638', fontSize: '16px' }}>
                        Error: {error}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            <div style={graphContainerStyle}>
                {loading ? (
                    <div style={loadingOverlayStyle}>
                        <span className="spinner is-active" style={{ float: 'none' }}></span>
                        <div style={loadingTextStyle}>Loading Graph Data</div>
                    </div>
                ) : (
                    <>
                        <HoverInfo data={hoverData} type={hoverType} />
                        <CytoscapeComponent
                            key={elements.length > 0 ? 'loaded' : 'loading'}
                            elements={elements}
                            stylesheet={stylesheet}
                            layout={layout}
                            style={{ width: '100%', height: '100%' }}
                            cy={(cy) => {
                                setCyInstance(cy);
                            }}
                        />
                    </>
                )}
            </div>
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
