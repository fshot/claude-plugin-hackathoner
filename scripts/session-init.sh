#!/usr/bin/env bash
set -euo pipefail

# Hackathoner session-init: detect hackathon state and report status
# Called by SessionStart hook to provide context to Claude

CONTEXT=""

# Check if we're in a hackathon project (has tracking issue reference)
if [ -f ".claude/CLAUDE.md" ] && grep -q "hackathon" ".claude/CLAUDE.md" 2>/dev/null; then
  CONTEXT="Active hackathon project detected."

  # Check if gh CLI is available and authenticated
  if command -v gh &>/dev/null && gh auth status &>/dev/null 2>&1; then
    REPO=$(gh repo view --json nameWithOwner -q '.nameWithOwner' 2>/dev/null || echo "")
    if [ -n "$REPO" ]; then
      # Fetch tracking issue #1
      ISSUE_BODY=$(gh issue view 1 --json body,title,state -q '.title + "\nState: " + .state + "\n" + .body' 2>/dev/null || echo "")
      if [ -n "$ISSUE_BODY" ]; then
        CONTEXT="${CONTEXT}\n\nTracking Issue #1:\n${ISSUE_BODY}"
      else
        CONTEXT="${CONTEXT}\n\nNo tracking issue #1 found. Run /hack to initialize."
      fi
    fi
  else
    CONTEXT="${CONTEXT}\n\ngh CLI not available or not authenticated. Some features require gh."
  fi
else
  CONTEXT="No hackathon project detected in current directory. Run /hack in a hackathon project to get started."
fi

# Escape for JSON output
ESCAPED=$(printf '%s' "$CONTEXT" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))")

cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": ${ESCAPED}
  }
}
EOF

exit 0
