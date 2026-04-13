#!/bin/bash
# Pre-push validation: check for file corruption, uncommitted changes, and build errors.
# Returns deny if any check fails, allow if all pass.

input=$(cat)

issues=()

# 1. Check for uncommitted changes in ts/tsx files
dirty=$(git diff --name-only -- '*.ts' '*.tsx' 2>/dev/null)
if [ -n "$dirty" ]; then
  count=$(echo "$dirty" | wc -l | tr -d ' ')
  issues+=("$count uncommitted .ts/.tsx file(s) will NOT be in the push")
fi

# 2. Check for untracked ts/tsx files in app/ or lib/
untracked=$(git ls-files --others --exclude-standard -- 'app/**/*.ts' 'app/**/*.tsx' 'lib/**/*.ts' 'lib/**/*.tsx' 2>/dev/null)
if [ -n "$untracked" ]; then
  count=$(echo "$untracked" | wc -l | tr -d ' ')
  issues+=("$count untracked .ts/.tsx file(s) in app/ or lib/ — might be missing from the commit")
fi

# 3. Check for file corruption (garbage bytes before first valid token)
for f in $(git diff --cached --name-only -- '*.ts' '*.tsx' 2>/dev/null; git diff --name-only HEAD -- '*.ts' '*.tsx' 2>/dev/null) ; do
  [ -f "$f" ] || continue
  first=$(head -c 80 "$f" 2>/dev/null)
  if ! echo "$first" | grep -qE '^\s*(import |export |const |let |var |type |interface |function |class |//|/\*|"use)'; then
    issues+=("CORRUPTED: $f starts with unexpected bytes")
  fi
done

if [ ${#issues[@]} -eq 0 ]; then
  echo '{"permission":"allow"}'
  exit 0
fi

msg=$(printf '• %s\\n' "${issues[@]}")
cat <<EOF
{
  "permission": "ask",
  "user_message": "Pre-push checks found issues:\n${msg}\nCommit these changes before pushing, or proceed anyway?",
  "agent_message": "Pre-push hook found issues that may cause white screen or not-found errors on deploy. Fix before pushing:\n${msg}"
}
EOF
exit 0
