(function ($) {
    $(document).ready(function () {
        // If we are not on the My Graph View admin page, bail
        const container = document.getElementById('mygraphview-admin-graph');
        if (!container) {
            return;
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
                    elements: {
                        nodes: data.nodes,
                        edges: data.edges
                    },
                    layout: {
                        name: 'dagre',
                        rankDir: 'TB',
                        ranker: 'tight-tree',
                        padding: 50,
                        animate: true
                    },
                    style: [
                        {
                            selector: 'node',
                            style: {
                                'label': function (ele) {
                                    // Truncate labels to 20 characters + ellipsis
                                    return ele.data('label').length > 20 ?
                                        ele.data('label').substring(0, 20) + '...' :
                                        ele.data('label');
                                },
                                'background-color': '#444444',
                                'color': '#000000',
                                'text-valign': 'bottom',
                                'text-halign': 'center',
                                'text-margin-y': '10px',
                                'font-size': '10px',
                                'width': function (ele) {
                                    return 20 + (ele.degree() * 3);
                                },
                                'height': function (ele) {
                                    return 20 + (ele.degree() * 3);
                                },
                                'text-wrap': 'ellipsis',
                                'text-max-width': '80px',
                                'text-opacity': 1
                            }
                        },
                        {
                            selector: 'node:hover',
                            style: {
                                'background-color': '#9370DB'
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
                                'line-color': '#cccccc',
                                'target-arrow-shape': 'triangle',
                                'target-arrow-color': '#cccccc',
                                'curve-style': 'bezier',
                                'opacity': 0.6
                            }
                        },
                        {
                            selector: 'edge.highlighted',
                            style: {
                                'line-color': '#9370DB',
                                'target-arrow-color': '#9370DB',
                                'opacity': 1
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

                // Handle hover effects
                cy.on('mouseover', 'node', function (e) {
                    const node = e.target;
                    const connectedNodes = node.neighborhood('node');
                    const connectedEdges = node.connectedEdges();

                    // Fade all nodes and edges
                    cy.elements().addClass('faded');

                    // Highlight connected elements
                    connectedNodes.removeClass('faded');
                    connectedEdges.removeClass('faded').addClass('highlighted');
                    node.removeClass('faded');
                });

                cy.on('mouseout', 'node', function (e) {
                    // Reset all elements
                    cy.elements().removeClass('faded').removeClass('highlighted');
                });

                // When a node is tapped, open the WP editor
                cy.on('tap', 'node', function (evt) {
                    const nodeData = evt.target.data();
                    // nodeData.id is the post ID, nodeData.type is the post type
                    if (nodeData.id) {
                        // e.g. open the post editor in a new tab
                        window.open(
                            `/wp-admin/post.php?post=${nodeData.id}&action=edit`,
                            '_blank'
                        );
                    }
                });
            })
            .catch(err => console.error('Error fetching graph data:', err));
    });
})(jQuery);
