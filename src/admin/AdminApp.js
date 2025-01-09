import React, { useEffect, useState, useMemo, useCallback } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import Select from 'react-select';

// Reset View Button Component
function ResetViewButton({ onClick }) {
    const style = {
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 10,
        padding: '8px',
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '4px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    };

    return (
        <div
            style={style}
            onClick={onClick}
            title="Reset View"
        >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 3H21V9" stroke="#1d2327" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 21H3V15" stroke="#1d2327" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 3L14 10" stroke="#1d2327" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 21L10 14" stroke="#1d2327" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </div>
    );
}

// FilterBar component
function FilterBar({
    searchTerm,
    onSearchChange,
    visibleRelationships,
    onRelationshipToggle,
    visiblePostTypes,
    onPostTypeToggle,
    visibleTaxonomies,
    onTaxonomyToggle,
    availablePostTypes,
    availableTaxonomies
}) {
    const { themeColors } = window.myGraphViewAdminData || {};
    const primaryColor = themeColors?.primary || '#2271b1';

    const filterBarStyle = {
        padding: '15px',
        marginTop: '20px',
        backgroundColor: 'white',
        border: '1px solid #ccc',
        //borderRadius: '4px',
        //width: '100%'

    };

    const filterLayoutStyle = {
        display: 'flex',
        gap: '20px',
        alignItems: 'flex-start',
        flexDirection: 'column'
    };

    const searchContainerStyle = {
        width: '100%'
    };

    const selectorsContainerStyle = {
        display: 'flex',
        gap: '15px',
        width: '100%'
    };

    const selectorStyle = {
        flex: 1
    };

    const labelStyle = {
        fontSize: '13px',
        fontWeight: '500',
        color: '#1d2327',
        marginBottom: '4px'
    };

    const searchStyle = {
        padding: '8px 12px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '14px',
        width: '100%'
    };

    // Convert arrays to react-select options
    const relationshipOptions = [
        { value: 'parent', label: 'Parent/Child' },
        { value: 'internal_link', label: 'Internal Links' },
        { value: 'shared_taxonomy', label: 'Shared Taxonomy' }
    ];

    const postTypeOptions = availablePostTypes.map(type => ({
        value: type,
        label: type.charAt(0).toUpperCase() + type.slice(1)
    }));

    const taxonomyOptions = availableTaxonomies.map(tax => ({
        value: tax,
        label: tax
    }));

    // Custom styles for react-select
    const selectStyles = {
        control: (base) => ({
            ...base,
            minHeight: '36px',
            borderColor: '#ddd',
            '&:hover': {
                borderColor: primaryColor
            }
        }),
        multiValue: (base) => ({
            ...base,
            backgroundColor: primaryColor + '1A', // 10% opacity
        }),
        multiValueLabel: (base) => ({
            ...base,
            color: primaryColor,
            fontSize: '12px'
        }),
        multiValueRemove: (base) => ({
            ...base,
            color: primaryColor,
            '&:hover': {
                backgroundColor: primaryColor + '33', // 20% opacity
                color: primaryColor
            }
        })
    };

    return (
        <div style={filterBarStyle}>
            <div style={filterLayoutStyle}>
                <div style={searchContainerStyle}>
                    <label style={labelStyle} htmlFor="post-search">Search Posts</label>
                    <input
                        id="post-search"
                        type="text"
                        placeholder="Search by title or content..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        style={searchStyle}
                    />
                </div>

                <div style={selectorsContainerStyle}>
                    <div style={selectorStyle}>
                        <label style={labelStyle}>Relationship Types</label>
                        <Select
                            isMulti
                            name="relationships"
                            options={relationshipOptions}
                            value={relationshipOptions.filter(option =>
                                visibleRelationships.includes(option.value)
                            )}
                            onChange={(selected) => {
                                const values = selected ? selected.map(s => s.value) : [];
                                onRelationshipToggle(values);
                            }}
                            placeholder="Select types..."
                            styles={selectStyles}
                            isClearable={true}
                        />
                    </div>

                    <div style={selectorStyle}>
                        <label style={labelStyle}>Post Types</label>
                        <Select
                            isMulti
                            name="postTypes"
                            options={postTypeOptions}
                            value={postTypeOptions.filter(option =>
                                visiblePostTypes.includes(option.value)
                            )}
                            onChange={(selected) => {
                                const values = selected ? selected.map(s => s.value) : [];
                                onPostTypeToggle(values);
                            }}
                            placeholder="Select types..."
                            styles={selectStyles}
                            isClearable={true}
                        />
                    </div>

                    <div style={selectorStyle}>
                        <label style={labelStyle}>Taxonomies</label>
                        <Select
                            isMulti
                            name="taxonomies"
                            options={taxonomyOptions}
                            value={taxonomyOptions.filter(option =>
                                visibleTaxonomies.includes(option.value)
                            )}
                            onChange={(selected) => {
                                const values = selected ? selected.map(s => s.value) : [];
                                onTaxonomyToggle(values);
                            }}
                            placeholder="Select taxonomies..."
                            styles={selectStyles}
                            isClearable={true}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

// Hover info component
function HoverInfo({ data, type }) {
    if (!data) return null;

    // Get theme colors with fallbacks
    const { themeColors } = window.myGraphViewAdminData || {};
    const primaryColor = themeColors?.primary || '#2271b1'; // WP Admin blue

    // Function to decode HTML entities
    const decodeHTML = (html) => {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    };

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

    const clickInstructionStyle = {
        marginTop: '10px',
        fontSize: '12px',
        color: '#666',
        fontStyle: 'italic'
    };

    if (type === 'node') {
        const { label, excerpt, taxonomies, id } = data;
        return (
            <div style={style}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>{decodeHTML(label)}</h3>
                {excerpt && (
                    <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
                        {excerpt.length > 150 ? decodeHTML(excerpt).substring(0, 150) + '...' : decodeHTML(excerpt)}
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
                <div style={clickInstructionStyle}>
                    Click node to open post in new tab
                </div>
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

    // Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [visibleRelationships, setVisibleRelationships] = useState(['parent', 'internal_link', 'shared_taxonomy']);
    const [visiblePostTypes, setVisiblePostTypes] = useState([]);
    const [visibleTaxonomies, setVisibleTaxonomies] = useState([]);
    const [availablePostTypes, setAvailablePostTypes] = useState([]);
    const [availableTaxonomies, setAvailableTaxonomies] = useState([]);
    const [allElements, setAllElements] = useState([]);

    // Theme colors passed via localized data
    const { restUrl, nonce, themeColors } = window.myGraphViewAdminData || {};

    // Debounced search term
    const debouncedSearchTerm = useMemo(() => {
        const timer = setTimeout(() => {
            if (cyInstance) {
                applyFilters();
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Filter handlers
    const handleSearchChange = (value) => {
        setSearchTerm(value);
    };

    const handleRelationshipToggle = (relationships) => {
        setVisibleRelationships(relationships);
    };

    const handlePostTypeToggle = (postTypes) => {
        setVisiblePostTypes(postTypes);
    };

    const handleTaxonomyToggle = (taxonomies) => {
        setVisibleTaxonomies(taxonomies);
    };

    // Function to reset all filters
    const handleResetOptions = useCallback(() => {
        setSearchTerm('');
        setVisibleRelationships(['parent', 'internal_link', 'shared_taxonomy']);
        setVisiblePostTypes(availablePostTypes);
        setVisibleTaxonomies(availableTaxonomies);

        // Re-apply the layout after resetting
        if (cyInstance && allElements.length > 0) {
            setElements(allElements);
            setTimeout(() => {
                cyInstance.layout(layout).run();
            }, 50);
        }
    }, [cyInstance, allElements, availablePostTypes, availableTaxonomies]);

    // Modified applyFilters to preserve layout and relationships
    const applyFilters = useCallback(() => {
        if (!cyInstance || !allElements.length) return;

        // First, determine which nodes should be visible
        const visibleNodeIds = new Set();
        const nodesToShow = allElements.filter(ele => {
            if (!ele.data.source) { // It's a node
                const matchesPostType = visiblePostTypes.length === 0 || visiblePostTypes.includes(ele.data.type);
                const matchesSearch = !searchTerm || (
                    (ele.data.label?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                    (ele.data.excerpt?.toLowerCase() || '').includes(searchTerm.toLowerCase())
                );

                const shouldShow = matchesPostType && matchesSearch;
                if (shouldShow) {
                    visibleNodeIds.add(ele.data.id);
                }
                return shouldShow;
            }
            return false;
        });

        // Then, include edges between visible nodes that match relationship criteria
        const edgesToShow = allElements.filter(ele => {
            if (ele.data.source) { // It's an edge
                const sourceVisible = visibleNodeIds.has(ele.data.source);
                const targetVisible = visibleNodeIds.has(ele.data.target);
                const relationshipVisible = visibleRelationships.includes(ele.data.relationship);

                if (sourceVisible && targetVisible && relationshipVisible) {
                    if (ele.data.relationship === 'shared_taxonomy' && ele.data.shared_terms) {
                        return visibleTaxonomies.length === 0 ||
                            visibleTaxonomies.includes(ele.data.shared_terms.taxonomy);
                    }
                    return true;
                }
            }
            return false;
        });

        // Combine nodes and edges while preserving positions
        const filteredElements = [...nodesToShow, ...edgesToShow];

        // Update elements while preserving positions
        const existingPositions = {};
        cyInstance.nodes().forEach(node => {
            const pos = node.position();
            existingPositions[node.id()] = pos;
        });

        setElements(filteredElements);

        // After elements update, restore positions and run a modified layout
        setTimeout(() => {
            filteredElements.forEach(ele => {
                if (!ele.data.source && existingPositions[ele.data.id]) {
                    const node = cyInstance.getElementById(ele.data.id);
                    if (node.length > 0) {
                        node.position(existingPositions[ele.data.id]);
                    }
                }
            });

            // Only run layout if it's a fresh search/filter
            if (searchTerm === '' && visiblePostTypes.length === availablePostTypes.length) {
                cyInstance.layout(layout).run();
            }
        }, 50);

    }, [cyInstance, allElements, searchTerm, visibleRelationships, visiblePostTypes, visibleTaxonomies, availablePostTypes]);

    // Effect to apply filters when filter state changes
    useEffect(() => {
        applyFilters();
    }, [searchTerm, visibleRelationships, visiblePostTypes, visibleTaxonomies]);

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

                // Extract available post types and taxonomies
                const postTypes = [...new Set(data.nodes.map(node => node.data.type))];
                const taxonomies = [...new Set(data.nodes
                    .flatMap(node => node.data.taxonomies || [])
                    .map(tax => tax.taxonomy)
                )];

                setAvailablePostTypes(postTypes);
                setAvailableTaxonomies(taxonomies);
                setVisiblePostTypes(postTypes); // Show all post types by default
                setVisibleTaxonomies(taxonomies); // Show all taxonomies by default

                const allElements = [...data.nodes, ...data.edges];
                setAllElements(allElements);
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

    // Memoize the stylesheet
    const stylesheet = useMemo(() => {
        // Get primary color with fallbacks:
        // 1. Theme color from theme.json
        // 2. WordPress admin primary color
        // 3. Default fallback
        const primaryColor = themeColors?.primary || '#2271b1'; // WP Admin blue
        const secondaryColor = themeColors?.secondary || '#1d2327'; // WP Admin dark gray

        return [
            {
                selector: 'node',
                style: {
                    label: 'data(label)',
                    'background-color': secondaryColor,
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
        ];
    }, [themeColors]);

    // Memoize the layout config but remove the key dependency
    const layout = useMemo(() => ({
        name: 'cose',
        animate: true,
        padding: 50,
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
        maxSimulationTime: 4000
    }), []); // Remove dependency on elements.length

    // Add state for container height
    const [containerHeight, setContainerHeight] = useState(800);

    // Calculate and update container height
    useEffect(() => {
        function updateHeight() {
            const MIN_HEIGHT = 400; // Minimum height in pixels
            const PADDING = 40; // Total vertical padding (20px top + 20px bottom)
            const OPTIONS_HEIGHT = 200; // Approximate height for options section

            // Calculate available height
            const viewportHeight = window.innerHeight;
            const availableHeight = viewportHeight - PADDING - OPTIONS_HEIGHT;

            // Set height respecting minimum
            setContainerHeight(Math.max(availableHeight, MIN_HEIGHT));
        }

        // Initial calculation
        updateHeight();

        // Update on window resize
        window.addEventListener('resize', updateHeight);
        return () => window.removeEventListener('resize', updateHeight);
    }, []);

    // Update container style to use dynamic height
    const containerStyle = {
        width: '100%',
        height: `${containerHeight}px`,
        border: '1px solid #ccc',
        position: 'relative',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        transition: 'height 0.2s ease-in-out', // Smooth height transitions
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

    // Update the layout effect to rerun when container height changes
    useEffect(() => {
        if (cyInstance && elements.length > 0) {
            cyInstance.layout(layout).run();
        }
    }, [elements, cyInstance, containerHeight]);

    // Update the zoom fitting effect to rerun when container height changes
    useEffect(() => {
        if (!cyInstance || loading) return;

        const timer = setTimeout(() => {
            const padding = 50;
            cyInstance.fit({
                padding: padding,
                eles: cyInstance.elements(),
            });

            const graphBounds = cyInstance.elements().boundingBox();
            const containerWidth = cyInstance.width();
            const containerHeight = cyInstance.height();

            const widthRatio = (containerWidth - 2 * padding) / graphBounds.w;
            const heightRatio = (containerHeight - 2 * padding) / graphBounds.h;
            const zoomFactor = Math.min(widthRatio, heightRatio);

            cyInstance.zoom({
                level: zoomFactor,
                renderedPosition: {
                    x: containerWidth / 2,
                    y: containerHeight / 2
                }
            });
        }, 100);

        return () => clearTimeout(timer);
    }, [cyInstance, loading, containerHeight]);

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

    // Function to reset view
    const handleResetView = useCallback(() => {
        if (!cyInstance) return;

        const padding = 50;
        cyInstance.fit({
            padding: padding,
            eles: cyInstance.elements(),
        });

        const graphBounds = cyInstance.elements().boundingBox();
        const containerWidth = cyInstance.width();
        const containerHeight = cyInstance.height();

        const widthRatio = (containerWidth - 2 * padding) / graphBounds.w;
        const heightRatio = (containerHeight - 2 * padding) / graphBounds.h;
        const zoomFactor = Math.min(widthRatio, heightRatio);

        cyInstance.zoom({
            level: zoomFactor,
            renderedPosition: {
                x: containerWidth / 2,
                y: containerHeight / 2
            }
        });
    }, [cyInstance]);

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
        <div>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                marginBottom: '15px',
                marginTop: '20px'

            }}>
                <h2 style={{
                    fontSize: '1.3em',
                    color: '#1d2327',
                    fontWeight: 'normal',
                    margin: 0,
                }}>Graph Options</h2>
                <button
                    onClick={handleResetOptions}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#2271b1',
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '13px',
                        textDecoration: 'underline'
                    }}
                >
                    Reset Options
                </button>
            </div>
            <FilterBar
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                visibleRelationships={visibleRelationships}
                onRelationshipToggle={handleRelationshipToggle}
                visiblePostTypes={visiblePostTypes}
                onPostTypeToggle={handlePostTypeToggle}
                visibleTaxonomies={visibleTaxonomies}
                onTaxonomyToggle={handleTaxonomyToggle}
                availablePostTypes={availablePostTypes}
                availableTaxonomies={availableTaxonomies}
            />
            <div style={{ ...containerStyle, marginTop: '20px' }}>
                <div style={graphContainerStyle}>
                    {loading ? (
                        <div style={loadingOverlayStyle}>
                            <span className="spinner is-active" style={{ float: 'none' }}></span>
                            <div style={loadingTextStyle}>Loading Graph Data</div>
                        </div>
                    ) : (
                        <>
                            <ResetViewButton onClick={handleResetView} />
                            <HoverInfo data={hoverData} type={hoverType} />
                            <CytoscapeComponent
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
