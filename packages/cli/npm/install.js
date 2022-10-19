#!/usr/bin/env node

try {
  const getBinary = require('./getBinary');
  getBinary().install();
} catch (error) {
  console.error(error);
}
