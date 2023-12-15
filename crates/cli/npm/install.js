#!/usr/bin/env node

// Prevent exiting with code 1 when
// the changeset PR is created
process.exit = () => {};

import { getBinary } from './getBinary.js';
getBinary().install();
