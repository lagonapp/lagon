#!/usr/bin/env node

import { createRequire } from 'node:module';
import updateNotifier from 'update-notifier';
import { getBinary } from './getBinary.js';

const customRequire = createRequire(import.meta.url);
const pkg = customRequire('../package.json');

updateNotifier({ pkg }).notify();

getBinary().run();
