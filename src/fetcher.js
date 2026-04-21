const fetch = require('node-fetch');
const fs = require('fs');

// Config: environment variables set by the Action/locally
const GITHUB_API = 'https://api.github.com';
const PAT = process.env.USAGE_MONITOR_PAT || process.env.GITHUB_TOKEN;
if(!PAT){
  console.error('Missing USAGE_MONITOR_PAT or GITHUB_TOKEN');
  process.exit(2);
}

const headers = {
  'Authorization': `token ${PAT}`,
  'Accept': 'application/vnd.github+json',
  'User-Agent': 'copilot-usage-monitor'
};

async function getCopilotUsage(){
  // Personal account usage endpoints for Copilot are not publicized as a single endpoint for all users.
  // We'll query billing/usage endpoints that are commonly available: /users/:username/billing or /site_admin endpoints won't work.
  // Best-effort: call the /user/marketplace_purchases or check invoices via the billing API where available.

  // The Action will pass the username via env if needed. Try the /user endpoint as base.
  const me = await (await fetch(GITHUB_API + '/user', { headers })).json();
  const login = me.login;

  // Attempt to use the billing usage endpoint for copilot (best-effort). If it fails, return the raw response for inspection.
  // Endpoint used by some billing APIs: /users/:username/settings/billing or /users/:username/copilot/usage (not official)
  const candidateUrls = [
    `${GITHUB_API}/users/${login}/copilot/usage`,
    `${GITHUB_API}/users/${login}/settings/billing`,
    `${GITHUB_API}/users/${login}/copilot`,
  ];

  let usage = null;
  for(const url of candidateUrls){
    try{
      const res = await fetch(url, { headers });
      if(res.ok){
        const j = await res.json();
        usage = { url, ok: true, data: j };
        break;
      } else {
        const txt = await res.text();
        usage = usage || { url, ok: false, status: res.status, text: txt };
      }
    } catch(e){
      usage = usage || { url, ok: false, error: String(e) };
    }
  }

  return { login, usage };
}

(async ()=>{
  try{
    const out = await getCopilotUsage();
    const now = new Date().toISOString();
    const payload = { fetched_at: now, result: out };
    fs.writeFileSync('usage.json', JSON.stringify(payload, null, 2));
    console.log('Wrote usage.json');
  } catch(e){
    console.error('Fetch failed', e);
    process.exit(3);
  }
})();
