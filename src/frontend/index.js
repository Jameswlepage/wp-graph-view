import React from 'react';
import { createRoot } from 'react-dom/client';
import FrontendApp from './FrontendApp';

// We'll dynamically insert a container in the content if auto-insert is enabled.
// But let's also check if the container might exist. 
const existingContainer = document.getElementById('graphview-frontend-root');

const renderApp = (container) => {
    const root = createRoot(container);
    root.render(<FrontendApp />);
};

if (existingContainer) {
    renderApp(existingContainer);
} else {
    // Alternatively, auto-insert a container in the post content area:
    const contentAreas = document.querySelectorAll('.entry-content, .post-content, .entry, article');
    if (contentAreas.length > 0) {
        const container = document.createElement('div');
        container.id = 'graphview-frontend-root';
        contentAreas[0].appendChild(container);
        renderApp(container);
    }
}
