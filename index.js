#!/usr/bin/env node

const App = require('./src/app');
const app = new App();
app.init(process.argv);
