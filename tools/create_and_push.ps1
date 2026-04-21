param()

# Windows PowerShell helper to create the repo and push the prepared files.
# Requires: gh CLI installed and logged in (gh auth login)

$repoName = Read-Host "Repo name (default: copilot-usage-monitor)"
if([string]::IsNullOrWhiteSpace($repoName)) { $repoName = 'copilot-usage-monitor' }

Write-Host "This script will create the repo '$repoName' under your account and push the current folder contents."
$confirm = Read-Host "Continue? (y/n)"
if($confirm -ne 'y') { Write-Host 'Aborting.'; exit }

# Create repo via gh
gh repo create $repoName --public --confirm

# Initialize and push
git init
git add .
git commit -m "Initial commit: copilot-usage-monitor"
git branch -M main
git remote add origin "https://github.com/$(gh api user --jq .login)/$repoName.git"
git push -u origin main

# Prompt for PAT to set as secret
$pat = Read-Host "Enter a Personal Access Token (will be used to create secret USAGE_MONITOR_PAT)" -AsSecureString
$ptraw = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($pat))

# Create secret using gh
gh secret set USAGE_MONITOR_PAT --body "$ptraw"

Write-Host "Done. The Action will run on schedule. To force a run, go to the Actions tab -> Fetch Copilot Usage -> Run workflow."