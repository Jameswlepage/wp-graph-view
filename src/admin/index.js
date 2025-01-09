import React from 'react';
import { createRoot } from 'react-dom/client';
import AdminApp from './AdminApp';

// This is the DOM node we created in `render_graph()`.
const adminRoot = document.getElementById('mygraphview-admin-root');

if (adminRoot) {
    const root = createRoot(adminRoot);
    root.render(<AdminApp />);
}
