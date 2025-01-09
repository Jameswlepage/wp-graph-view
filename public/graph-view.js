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
            const miniGraphContainer = $('<div id="mygraphview-mini" style="width:100%; height:300px; border:1px solid #ccc; margin:1em 0;"></div>');
            $('.entry-content, .post-content').first().append(miniGraphContainer);

            // Fetch local graph data, limited to 20 edges
            const postId = myGraphViewData.currentPostId;
            const restUrl = myGraphViewData.restUrl;

            fetch(`${restUrl}/local-graph/${postId}?max_edges=20`)
                .then(response => response.json())
                .then(data => {
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
                                    'background-color': '#444444',
                                    'color': '#000000',
                                    'text-valign': 'bottom',
                                    'text-halign': 'center',
                                    'text-margin-y': '10px',
                                    'font-size': '8px',
                                    'width': function (ele) {
                                        return 15 + (ele.degree() * 2);
                                    },
                                    'height': function (ele) {
                                        return 15 + (ele.degree() * 2);
                                    },
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
                                selector: 'node[?isCurrent]',
                                style: {
                                    'background-color': '#ff0000',
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
                                    'line-color': '#cccccc',
                                    'opacity': 0.6
                                }
                            },
                            {
                                selector: 'edge.highlighted',
                                style: {
                                    'line-color': '#9370DB',
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
                    cyMini.on('mouseover', 'node', function (e) {
                        const node = e.target;
                        const connectedNodes = node.neighborhood('node');
                        const connectedEdges = node.connectedEdges();

                        // Fade all nodes and edges
                        cyMini.elements().addClass('faded');

                        // Highlight connected elements
                        connectedNodes.removeClass('faded');
                        connectedEdges.removeClass('faded').addClass('highlighted');
                        node.removeClass('faded');
                    });

                    cyMini.on('mouseout', 'node', function (e) {
                        // Reset all elements
                        cyMini.elements().removeClass('faded').removeClass('highlighted');
                    });
                })
                .catch(error => {
                    console.error('Error fetching local graph data:', error);
                });
        };

        // Start the initialization process
        initGraph();
    });
})(jQuery);
