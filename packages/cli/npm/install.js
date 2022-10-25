#!/usr/bin/env node

try {
  import('./getBinary.js').then(({ getBinary }) => {
    getBinary().install();
  });
} catch (error) {
  console.error(error);
}
