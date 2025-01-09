const path = require('path');

module.exports = {
    entry: {
        admin: './src/admin/index.js',
        frontend: './src/frontend/index.js',
    },
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: '[name].js',
    },
    devtool: 'source-map', // or 'none' for production
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
    // If you want to externalize React & ReactDOM using WP's built-in React, 
    // you can do so here, but be sure to adjust your code accordingly.
    // externals: {
    //   react: 'React',
    //   'react-dom': 'ReactDOM',
    // },
};
