#!/usr/bin/env node

/**
 * 🎬 SOCIAL MEDIA DEMO SCRIPT
 * 
 * Demonstrates the longurl-js npm package
 * Shows how developers can integrate URL shortening into their apps
 */

const { generateBase62Id } = require('./dist/utils.js');
const fs = require('fs');

// Get the sample URL from the markdown file
const sampleUrl = fs.readFileSync('./devdocs/url-sample.md', 'utf8').trim();

console.log('URL Shortening Demo\n');

// Original URL
console.log('BEFORE:');
console.log(sampleUrl);
console.log(`Length: ${sampleUrl.length} characters\n`);

// Generate shortened URL
const urlId = generateBase62Id(6);
const shortUrl = `https://shop.com/${urlId}`;

console.log('AFTER:');
console.log(shortUrl);
console.log(`Length: ${shortUrl.length} characters\n`);

// Results
const charactersSaved = sampleUrl.length - shortUrl.length;
const compressionRatio = ((sampleUrl.length - shortUrl.length) / sampleUrl.length * 100);

console.log('RESULTS:');
console.log(`Saved: ${charactersSaved} characters`);
console.log(`Compression: ${compressionRatio.toFixed(1)}%\n`);

console.log('USAGE:');
console.log('npm install longurl-js');
console.log('');
console.log('const { LongURL } = require("longurl-js");');
console.log('const longurl = new LongURL({ baseUrl: "https://yourapp.com" });');
console.log('const result = await longurl.shorten("product", "123", originalUrl);'); 