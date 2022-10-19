#!/usr/bin/env node

try {
  const getBinary = require('./getBinary');
  getBinary().uninstall();
} catch (error) {
  console.error(error);
}
