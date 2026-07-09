import { cpSync, mkdirSync } from 'node:fs';
mkdirSync('dist/emails', { recursive: true });
cpSync('src/emails', 'dist/emails', { recursive: true });
console.log('copied email templates -> dist/emails');
