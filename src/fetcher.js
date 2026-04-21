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
    // alternative shapes and guesses
    `${GITHUB_API}/users/${login}/settings/billing/copilot`,
    `${GITHUB_API}/users/${login}/billing/copilot`,
    `${GITHUB_API}/users/${login}/subscriptions`,
  ];

  let usage = null;
  const attempts = [];
  for(const url of candidateUrls){
    try{
      const res = await fetch(url, { headers });
      const txt = await res.text();
      let j = null;
      try{ j = JSON.parse(txt); }catch(e){ /* not JSON */ }
      const attempt = { url, status: res.status };
      if(j) attempt.body = j; else attempt.text = txt;
      attempts.push(attempt);

      if(res.ok){
        usage = { url, ok: true, status: res.status, data: j || txt };
        break;
      } else {
        usage = usage || { url, ok: false, status: res.status, text: txt };
      }
    } catch(e){
      attempts.push({ url, error: String(e) });
      usage = usage || { url, ok: false, error: String(e) };
    }
  }

  // Attach attempts for debugging
  if(usage) usage.attempts = attempts;

  // Try to compute percent_used if the data includes cap/used fields in known shapes
  if(usage && usage.ok && usage.data){
    const d = usage.data;
    // common possible shapes: { cap: number, used: number } or { cap: { amount: n }, used: { amount: n } } or { total: { included: n, consumed: n } }
    let cap = null, used = null;
    if(typeof d.cap === 'number') cap = d.cap;
    if(typeof d.used === 'number') used = d.used;
    if(d.cap && typeof d.cap.amount === 'number') cap = d.cap.amount;
    if(d.used && typeof d.used.amount === 'number') used = d.used.amount;
    if(d.total && typeof d.total.included === 'number') cap = d.total.included;
    if(d.total && typeof d.total.consumed === 'number') used = d.total.consumed;

    if(cap != null && used != null && cap > 0){
      usage.computed = usage.computed || {};
      usage.computed.percent_used = Math.round((used / cap) * 10000) / 100; // two decimals
      usage.computed.cap = cap;
      usage.computed.used = used;
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
