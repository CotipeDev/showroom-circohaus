const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const start = html.indexOf('const API_PRODUCCION_URL=');
const end = html.indexOf('let productosData=', start);
assert.ok(start > 0 && end > start);
const source = html.slice(start, end);
const production = 'https://script.google.com/macros/s/AKfycbzUs7BN54n-1snXDYlxUimolaZw3FQSMe5FS_lOF7X1B3NBAyKCzui6DuRIVo3NhtrgrA/exec';
const test = 'https://script.google.com/macros/s/AKfycbyO3hwM4xPLdzLgqdUkhcwOhVH9wX8X0sZIItMHZPnUi7AcHgBqc92mip5tATBK0blw/exec';

function selected(hostname, search) {
  const context = {URL, URLSearchParams, location: {hostname, search}};
  vm.createContext(context);
  return vm.runInContext(source + '\n({API_URL,API_ES_LOCAL})', context);
}

assert.equal(selected('circohaus.netlify.app', '?api_url=' + encodeURIComponent(test)).API_URL, production);
assert.equal(selected('showroomcircohaus.netlify.app', '').API_URL, production);
assert.equal(selected('feature-ventas-v2--showroomcircohaus.netlify.app', '').API_URL, test);
assert.equal(selected('feature-ventas-v2--showroomcircohaus.netlify.app', '?api_url=' + encodeURIComponent(production)).API_URL, test);
assert.equal(selected('127.0.0.1', '?api_url=' + encodeURIComponent(test)).API_URL, test);
assert.equal(selected('localhost', '').API_URL, null);
assert.equal(selected('localhost', '?api_url=' + encodeURIComponent('https://evil.example/exec')).API_URL, null);
assert.equal(selected('localhost', '?api_url=' + encodeURIComponent('http://script.google.com/macros/s/TEST/exec')).API_URL, null);
assert.equal(selected('localhost', '?api_url=' + encodeURIComponent(production + '?action=login')).API_URL, null);
assert.equal(selected('localhost', '?api_url=' + encodeURIComponent(production)).API_URL, null);

assert.match(html, /async function apiGet\(a\)\{\s*exigirApiConfigurada\(\)/);
assert.match(html, /async function apiPost\(a,b\)\{\s*exigirApiConfigurada\(\)/);
assert.match(html, /const LOGIN_KEY=API_ES_LOCAL\?'circohaus_auth_local_'/);
assert.match(html, /try\{exigirApiConfigurada\(\);const r=await fetch\(`\$\{API_URL\}\?action=login`/);

console.log('Conexión local aislada de producción OK');
