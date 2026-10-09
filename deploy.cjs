const fs = require('fs');
const path = require('path');
const https = require('https');

const mcpConfigPath = 'C:/Users/BraulioAM/.gemini/config/mcp_config.json';
let githubToken = '';

try {
  if (fs.existsSync(mcpConfigPath)) {
    const config = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
    githubToken = config?.mcpServers?.['github-mcp-server']?.env?.GITHUB_PERSONAL_ACCESS_TOKEN || '';
  }
} catch (e) {
  console.error('Error reading MCP config:', e.message);
}

if (!githubToken) {
  console.error('No GitHub token found!');
  process.exit(1);
}

const OWNER = 'brau450unab';
const REPOS = ['cordano-pms-oficial', 'cordano-pms-respaldo'];
const BRANCH = 'main';

const IGNORED = [
  '.git',
  'node_modules',
  'dist',
  '.next',
  '.gemini',
  'deploy.js'
];

function makeRequest(pathName, method, data) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const req = https.request({
      hostname: 'api.github.com',
      path: pathName,
      method: method,
      headers: {
        'User-Agent': 'NodeJS-Antigravity',
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body || '{}'));
          } catch (err) {
            resolve(body);
          }
        } else {
          console.error(`Error response from ${method} ${pathName}: ${body}`);
          reject(new Error(`GitHub API ${method} returned ${res.statusCode}`));
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  files.forEach(file => {
    if (IGNORED.includes(file)) return;
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
}

async function uploadFileBlob(repo, filePath) {
  const relPath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  const buffer = fs.readFileSync(filePath);
  
  const isBinary = /[^\x00-\x7F]/.test(buffer.slice(0, 1000).toString('binary'));
  let content, encoding;
  if (isBinary || filePath.match(/\.(png|jpg|jpeg|gif|ico|pdf|ttf|woff|woff2)$/i)) {
    content = buffer.toString('base64');
    encoding = 'base64';
  } else {
    content = buffer.toString('utf8');
    encoding = 'utf-8';
  }

  const res = await makeRequest(`/repos/${OWNER}/${repo}/git/blobs`, 'POST', {
    content,
    encoding
  });

  return {
    path: relPath,
    mode: '100644',
    type: 'blob',
    sha: res.sha
  };
}

async function syncRepo(repo, allFiles) {
  console.log(`\n--- Syncing to ${OWNER}/${repo} ---`);
  try {
    const refRes = await makeRequest(`/repos/${OWNER}/${repo}/git/ref/heads/${BRANCH}`, 'GET');
    const latestCommitSha = refRes.object.sha;
    
    const treeItems = [];
    const BATCH_SIZE = 25;
    for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
      const batch = allFiles.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(batch.map(f => uploadFileBlob(repo, f)));
      treeItems.push(...results);
      process.stdout.write(`Uploaded blobs: ${treeItems.length} / ${allFiles.length}\n`);
    }
    console.log('\nCreating tree...');
    const treeRes = await makeRequest(`/repos/${OWNER}/${repo}/git/trees`, 'POST', { tree: treeItems });
    
    console.log('Creating commit...');
    const commitRes = await makeRequest(`/repos/${OWNER}/${repo}/git/commits`, 'POST', {
      message: 'Deploy: Oficializacion de version estable Localhost',
      tree: treeRes.sha,
      parents: [latestCommitSha],
      author: {
        name: 'Braulio Arancibia',
        email: 'b.arancibiamuoz@uandresbello.edu',
        date: new Date().toISOString()
      }
    });
    
    console.log('Updating ref...');
    await makeRequest(`/repos/${OWNER}/${repo}/git/refs/heads/${BRANCH}`, 'PATCH', {
      sha: commitRes.sha,
      force: true
    });
    console.log(`✅ Successfully synced ${repo}!`);
  } catch (err) {
    console.error(`❌ Failed to sync ${repo}:`, err.message);
  }
}

async function main() {
  const allFiles = getAllFiles(process.cwd());
  console.log(`Found ${allFiles.length} files to push.`);
  for (const repo of REPOS) {
    await syncRepo(repo, allFiles);
  }
}

main();
