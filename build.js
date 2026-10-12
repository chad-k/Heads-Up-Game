import {access} from 'node:fs/promises';import {WORDS} from './public/words.js';
for(const f of ['public/index.html','public/style.css','public/app.js','public/engine.js','server.js'])await access(f);
if(new Set(WORDS.map(x=>x.word)).size!==WORDS.length||WORDS.some(x=>!/^\p{L}+$/u.test(x.word)))throw Error('Word bank is not unique single words');
console.log(WORDS.length+' unique single words. Ready to deploy.');
