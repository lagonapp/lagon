#!/usr/bin/env node

// Prevent exiting with code 1
process.exit = () => {};

try {
  import('./getBinary.js').then(({ getBinary }) => {
    getBinary().install();
  });
} catch (error) {
  console.error(error);
}
