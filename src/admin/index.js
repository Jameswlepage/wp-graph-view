import React from 'react';
import { createRoot } from 'react-dom/client';
import AdminApp from './AdminApp';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Graph View Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', color: '#d63638' }}>
                    <h2>Something went wrong.</h2>
                    <pre style={{ whiteSpace: 'pre-wrap' }}>
                        {this.state.error?.toString()}
                    </pre>
                </div>
            );
        }

        return this.props.children;
    }
}

// This is the DOM node we created in `render_graph()`.
const adminRoot = document.getElementById('mygraphview-admin-root');

if (adminRoot) {
    console.log('Found admin root, mounting React app...');
    const root = createRoot(adminRoot);
    root.render(
        <ErrorBoundary>
            <AdminApp />
        </ErrorBoundary>
    );
} else {
    console.error('Admin root element not found!');
}
