const path = require('path');

module.exports = {
    entry: './App.ts',
    devtool: 'inline-source-map',
    mode: 'development',
    context: path.resolve(__dirname, 'wwwroot/scripts'),
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: [/node_modules/],
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    experiments: {
        outputModule: true
    },
    output: {
        filename: 'App.bundle.js',
        path: path.resolve(__dirname, 'wwwroot/dist'),
        library: {
            type: "module",
        },
    },
};