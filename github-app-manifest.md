GitHub App manifest and install instructions

Goal
- Provide a GitHub App manifest you can use to create and install a GitHub App into your personal account. Once installed, the App can be granted fine-grained permissions (issues, contents, actions) and used for automation without sharing a PAT in chat.

What I included
- A suggested manifest JSON (below) you can paste when creating a GitHub App via the web UI or use as a reference.

Suggested manifest (use when creating a new GitHub App via Developer settings -> GitHub Apps -> New GitHub App):

{
  "name": "Copilot Usage Monitor",
  "url": "https://github.com/datphoria/copilot-usage-monitor",
  "hook_attributes": { "url": "" },
  "redirect_urls": ["https://example.com/"],
  "public": false,
  "default_permissions": {
    "contents": "write",
    "issues": "write",
    "actions": "read",
    "metadata": "read"
  },
  "default_events": []
}

Recommended permissions (explain):
- Repository contents (Read & Write) — to push the gh-pages branch and update usage.json.
- Issues (Read & Write) — create/close usage alerts.
- Actions (Read) — if you want the App to view workflows and dispatch runs (optional).
- Metadata (Read) — for installation info.

Install steps (web UI)
1. Go to: https://github.com/settings/apps (Developer settings → GitHub Apps)
2. Click “New GitHub App”
3. Fill in: Name = Copilot Usage Monitor, Homepage URL = https://github.com/datphoria/copilot-usage-monitor
4. Leave Webhook URL empty (or set to a URL you control) unless you plan to handle hooks.
5. Under Permissions, set the permissions above.
6. Under "Subscribe to events", none are required for this app.
7. Save/Create the app.
8. Install the app into your account (Install App → Install to your account) and choose "All repositories" or only the repo you want.

After install
- You will receive an App ID and can generate an installation token or a private key in the app settings. Keep the private key secure — do NOT paste it into chat.
- Locally, you can create an installation token via the app's private key and use it to run automation or to configure the fetch Action.

How I can use the App (if you want me to continue)
- If you want me to perform repo operations automatically in future runs, we will need one of the following:
  - You generate an installation token locally and run a helper script that triggers the actions I provide; OR
  - You provide the App ID and create a GitHub Action workflow that uses the app credentials stored as secrets so the Action runs with app privileges (preferred).

If you want, I will now:
- Update the repository files to add Issue alerting to the fetch Action.
- Add a small example script that uses the GitHub App credentials locally to demonstrate pushing updates (requires you to run it locally with your private key).

Tell me which of these you'd like me to do next.
