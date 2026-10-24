const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

console.log('HTML length:', html.length);
console.log('Has original-website:', html.includes('id="original-website"'));
console.log('Has site-header:', html.includes('id="site-header"'));
console.log('Has signature-collections:', html.includes('signature-collections'));
console.log('Has showroom-visit:', html.includes('showroom-visit'));
console.log('Has footer:', html.includes('<footer'));
