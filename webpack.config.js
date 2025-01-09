const path = require('path');

module.exports = {
    entry: {
        admin: './src/admin/index.js',
        frontend: './src/frontend/index.js',
        gutenberg: './src/gutenberg/index.js',
    },
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: '[name].js',
    },
    devtool: 'source-map',
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            '@babel/preset-env',
                            '@babel/preset-react',
                        ],
                    },
                },
            },
        ],
    },
    resolve: {
        extensions: ['.js', '.jsx'],
    },
    externals: {
        '@wordpress/plugins': 'wp.plugins',
        '@wordpress/edit-post': 'wp.editPost',
        '@wordpress/components': 'wp.components',
        '@wordpress/i18n': 'wp.i18n',
        '@wordpress/data': 'wp.data',
        '@wordpress/element': 'wp.element',
        react: 'React',
        'react-dom': 'ReactDOM',
        '@wordpress/icons': ['wp', 'icons'],
        '@wordpress/primitives': ['wp', 'primitives']
    },
};
