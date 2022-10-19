#!/usr/bin/env node

const getBinary = require('./getBinary');
const binary = getBinary();

// Try to install the binary before executing the CLI
binary.install().then(binary.run);
