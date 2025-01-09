(function ($) {
    $(document).ready(function () {
        // If we are not on the My Graph View admin page, bail
        const container = document.getElementById('mygraphview-admin-graph');
        if (!container) {
            return;
        }

        // Ensure container has relative positioning for proper overlay containment
        $(container).css('position', 'relative');

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
        }).appendTo(container);

        loadingOverlay.append('<div style="text-align:center;"><div class="spinner" style="float:none;width:20px;height:20px;margin:10px auto;"></div><div>Loading graph data...</div></div>');

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

        // Fetch full-graph data
        fetch(`${myGraphViewAdminData.restUrl}/full-graph`, {
            headers: {
                'X-WP-Nonce': myGraphViewAdminData.nonce
            }
        })
            .then(response => response.json())
            .then(data => {
                // Initialize Cytoscape
                const cy = cytoscape({
                    container: container,
                    elements: data,
                    style: [
                        {
                            selector: 'node',
                            style: {
                                'label': function (ele) {
                                    return ele.data('label').length > 20 ?
                                        ele.data('label').substring(0, 20) + '...' :
                                        ele.data('label');
                                },
                                'background-color': myGraphViewAdminData.themeColors.secondary,
                                'color': '#000000',
                                'text-valign': 'bottom',
                                'text-halign': 'center',
                                'text-margin-y': '10px',
                                'font-size': '10px',
                                'width': function (ele) {
                                    const baseSize = 30;
                                    const maxVariation = baseSize * 0.2;
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
                                    const baseSize = 30;
                                    const maxVariation = baseSize * 0.2;
                                    const connections = ele.degree();
                                    const allNodes = ele.cy().nodes();
                                    let maxConnections = 0;
                                    allNodes.forEach(node => {
                                        maxConnections = Math.max(maxConnections, node.degree());
                                    });
                                    const scale = maxConnections ? connections / maxConnections : 0;
                                    return baseSize + (scale * maxVariation);
                                },
                                'text-wrap': 'ellipsis',
                                'text-max-width': '80px',
                                'text-opacity': 1
                            }
                        },
                        {
                            selector: 'node:hover',
                            style: {
                                'background-color': myGraphViewAdminData.themeColors.primary
                            }
                        },
                        {
                            selector: 'node.faded',
                            style: {
                                'opacity': 0.5
                            }
                        },
                        {
                            selector: 'edge',
                            style: {
                                'width': 1,
                                'line-color': '#e0e0e0',
                                'target-arrow-shape': 'triangle',
                                'target-arrow-color': '#e0e0e0',
                                'curve-style': 'bezier',
                                'opacity': 0.8
                            }
                        },
                        {
                            selector: 'edge.highlighted',
                            style: {
                                'line-color': myGraphViewAdminData.themeColors.primary,
                                'target-arrow-color': myGraphViewAdminData.themeColors.primary,
                                'opacity': 1,
                                'width': 2
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
                }).appendTo(container);

                // Handle node hover effects
                cy.on('mouseover', 'node', function (e) {
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
                    cy.elements().addClass('faded');

                    // Highlight connected elements
                    connectedNodes.removeClass('faded');
                    connectedEdges.removeClass('faded').addClass('highlighted');
                    node.removeClass('faded');
                });

                // Handle edge hover effects
                cy.on('mouseover', 'edge', function (e) {
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
                    cy.elements().addClass('faded');
                    edge.removeClass('faded').addClass('highlighted');
                    sourceNode.removeClass('faded');
                    targetNode.removeClass('faded');
                });

                cy.on('mouseout', 'node, edge', function (e) {
                    // Hide relationship info
                    relationshipInfo.hide();

                    // Reset all elements
                    cy.elements().removeClass('faded').removeClass('highlighted');
                });

                // When a node is tapped, open the WP editor
                cy.on('tap', 'node', function (evt) {
                    const nodeData = evt.target.data();
                    if (nodeData.id) {
                        window.open(
                            `/wp-admin/post.php?post=${nodeData.id}&action=edit`,
                            '_blank'
                        );
                    }
                });

                // Run layout
                cy.layout({
                    name: 'dagre',
                    rankDir: 'TB',
                    ranker: 'tight-tree',
                    padding: 50,
                    animate: true,
                    animationDuration: 500,
                    stop: function () {
                        loadingOverlay.remove();
                    }
                }).run();
            })
            .catch(err => {
                console.error('Error fetching graph data:', err);
                loadingOverlay.find('div').last().text('Error loading graph data. Please try refreshing the page.');
                loadingOverlay.css('backgroundColor', 'rgba(255, 200, 200, 0.9)');
            });
    });
})(jQuery);
