(function ($) {
    $(document).ready(function () {
        // Check if the plugin data object is present
        if (!window.myGraphViewData || !myGraphViewData.currentPostId) {
            return;
        }

        // Wait for both Cytoscape and the layout plugin to be available
        const initGraph = () => {
            if (typeof cytoscape === 'undefined') {
                console.log('Waiting for Cytoscape...');
                setTimeout(initGraph, 100);
                return;
            }

            // Insert a mini-graph container after the main content
            const miniGraphContainer = $('<div id="mygraphview-mini" style="width:100%; height:300px; border:1px solid #ccc; margin:1em 0; position:relative;"></div>');
            $('.entry-content, .post-content').first().append(miniGraphContainer);

            // Add loading overlay
            const loadingOverlay = $('<div class="mygraphview-loading"></div>').css({
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 20
            }).appendTo(miniGraphContainer);

            loadingOverlay.append('<div style="text-align:center;"><div class="spinner" style="float:none;width:20px;height:20px;margin:10px auto;"></div><div>Loading graph...</div></div>');

            // Fetch local graph data, limited to 20 edges
            const postId = myGraphViewData.currentPostId;
            const restUrl = myGraphViewData.restUrl;

            fetch(`${restUrl}/local-graph/${postId}?max_edges=20`)
                .then(response => response.json())
                .then(data => {
                    // Only render if we have enough relationships
                    if (data.nodes.length < 2) {
                        miniGraphContainer.remove();
                        return;
                    }

                    const cyMini = cytoscape({
                        container: document.getElementById('mygraphview-mini'),
                        elements: {
                            nodes: data.nodes,
                            edges: data.edges
                        },
                        layout: {
                            name: 'concentric',
                            concentric: function (node) {
                                return node.degree();
                            },
                            levelWidth: function (nodes) {
                                return 2;
                            },
                            padding: 50,
                            animate: true
                        },
                        style: [
                            {
                                selector: 'node',
                                style: {
                                    'label': 'data(label)',
                                    'text-wrap': 'wrap',
                                    'background-color': myGraphViewData.themeColors.secondary,
                                    'color': '#000000',
                                    'text-valign': 'bottom',
                                    'text-halign': 'center',
                                    'text-margin-y': '10px',
                                    'font-size': '8px',
                                    'width': function (ele) {
                                        const baseSize = 20;
                                        const maxVariation = baseSize * 0.2; // 20% variation
                                        const connections = ele.degree();
                                        const allNodes = ele.cy().nodes();
                                        let maxConnections = 0;
                                        allNodes.forEach(node => {
                                            maxConnections = Math.max(maxConnections, node.degree());
                                        });
                                        const scale = maxConnections ? connections / maxConnections : 0;
                                        return baseSize + (scale * maxVariation);
                                    },
                                    'height': function (ele) {
                                        const baseSize = 20;
                                        const maxVariation = baseSize * 0.2; // 20% variation
                                        const connections = ele.degree();
                                        const allNodes = ele.cy().nodes();
                                        let maxConnections = 0;
                                        allNodes.forEach(node => {
                                            maxConnections = Math.max(maxConnections, node.degree());
                                        });
                                        const scale = maxConnections ? connections / maxConnections : 0;
                                        return baseSize + (scale * maxVariation);
                                    },
                                    'text-opacity': 1
                                }
                            },
                            {
                                selector: 'node:hover',
                                style: {
                                    'background-color': myGraphViewData.themeColors.primary
                                }
                            },
                            {
                                selector: 'node.faded',
                                style: {
                                    'opacity': 0.5
                                }
                            },
                            {
                                selector: 'node[?isCurrent]',
                                style: {
                                    'background-color': myGraphViewData.themeColors.primary,
                                    'border-width': '3px',
                                    'border-color': '#000000',
                                    'width': function (ele) {
                                        return 20 + (ele.degree() * 2);
                                    },
                                    'height': function (ele) {
                                        return 20 + (ele.degree() * 2);
                                    }
                                }
                            },
                            {
                                selector: 'edge',
                                style: {
                                    'width': 1,
                                    'line-color': '#e0e0e0',
                                    'opacity': 0.8
                                }
                            },
                            {
                                selector: 'edge.highlighted',
                                style: {
                                    'line-color': myGraphViewData.themeColors.primary,
                                    'opacity': 1,
                                    'width': 2
                                }
                            },
                            {
                                selector: 'edge.faded',
                                style: {
                                    'opacity': 0
                                }
                            }
                        ]
                    });

                    // Create relationship info overlay
                    const relationshipInfo = $('<div></div>').css({
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        padding: '8px 12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '12px',
                        display: 'none',
                        zIndex: 10,
                        maxWidth: '300px'
                    }).appendTo('#mygraphview-mini');

                    // Handle node hover effects
                    cyMini.on('mouseover', 'node', function (e) {
                        const node = e.target;
                        const nodeData = node.data();
                        const connectedNodes = node.neighborhood('node');
                        const connectedEdges = node.connectedEdges();

                        // Build node information
                        let info = `<strong>${nodeData.label}</strong><br>`;
                        info += `<em>${nodeData.type}</em><br>`;
                        if (nodeData.excerpt) {
                            info += `<p>${nodeData.excerpt}</p>`;
                        }

                        // Add top 3 taxonomies
                        if (nodeData.taxonomies && nodeData.taxonomies.length > 0) {
                            info += '<p><strong>Categories & Tags:</strong><br>';
                            nodeData.taxonomies.slice(0, 3).forEach(tax => {
                                info += `${tax.taxonomy}: ${tax.terms.join(', ')}<br>`;
                            });
                            info += '</p>';
                        }

                        // Update and show relationship info
                        relationshipInfo.html(info).show();

                        // Fade all nodes and edges
                        cyMini.elements().addClass('faded');

                        // Highlight connected elements
                        connectedNodes.removeClass('faded');
                        connectedEdges.removeClass('faded').addClass('highlighted');
                        node.removeClass('faded');
                    });

                    // Handle edge hover effects
                    cyMini.on('mouseover', 'edge', function (e) {
                        const edge = e.target;
                        const sourceNode = edge.source();
                        const targetNode = edge.target();
                        const relType = edge.data('relationship');

                        // Build edge information
                        let info = '<strong>Relationship:</strong><br>';
                        info += `${sourceNode.data('label')} ${getRelationshipDescription(relType, true)} ${targetNode.data('label')}`;

                        // Update and show relationship info
                        relationshipInfo.html(info).show();

                        // Highlight this edge and connected nodes
                        cyMini.elements().addClass('faded');
                        edge.removeClass('faded').addClass('highlighted');
                        sourceNode.removeClass('faded');
                        targetNode.removeClass('faded');
                    });

                    cyMini.on('mouseout', 'node, edge', function (e) {
                        // Hide relationship info
                        relationshipInfo.hide();

                        // Reset all elements
                        cyMini.elements().removeClass('faded').removeClass('highlighted');
                    });

                    // Helper function to get relationship description
                    function getRelationshipDescription(type, isOutgoing) {
                        switch (type) {
                            case 'parent':
                                return isOutgoing ? 'is parent of' : 'is child of';
                            case 'child':
                                return isOutgoing ? 'is child of' : 'is parent of';
                            case 'internal_link':
                                return isOutgoing ? 'links to' : 'is linked from';
                            case 'shared_taxonomy':
                                return 'shares taxonomy with';
                            default:
                                return type;
                        }
                    }

                    // Remove loading overlay once graph is ready
                    loadingOverlay.remove();
                })
                .catch(error => {
                    console.error('Error fetching local graph data:', error);
                });
        };

        // Start the initialization process
        initGraph();
    });
})(jQuery);
