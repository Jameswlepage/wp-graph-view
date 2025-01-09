import React from 'react';
import ReactDOM from 'react-dom';
import FrontendApp from './FrontendApp';

// We'll dynamically insert a container in the content if auto-insert is enabled.
// But let's also check if the container might exist. 
const existingContainer = document.getElementById('mygraphview-frontend-root');

if (existingContainer) {
    ReactDOM.render(<FrontendApp />, existingContainer);
} else {
    // Alternatively, auto-insert a container in the post content area:
    const contentAreas = document.querySelectorAll('.entry-content, .post-content, .entry, article');
    if (contentAreas.length > 0) {
        const container = document.createElement('div');
        container.id = 'mygraphview-frontend-root';
        contentAreas[0].appendChild(container);
        ReactDOM.render(<FrontendApp />, container);
    }
}
