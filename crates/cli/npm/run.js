#!/usr/bin/env node

import { createRequire } from 'node:module';
import updateNotifier from 'update-notifier';
import { getBinary } from './getBinary.js';

const customRequire = createRequire(import.meta.url);
const pkg = customRequire('../package.json');

updateNotifier({ pkg }).notify();

const binary = getBinary();

// Try to install the binary before executing the CLI
binary.install({}, true).then(() => binary.run());
