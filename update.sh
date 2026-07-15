#!/usr/bin/env bash
# Update QA Agent (force reinstall from this repo)
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
VER="$(tr -d '[:space:]' < "$HERE/VERSION" 2>/dev/null || echo unknown)"
echo "QA Agent update → v$VER"
"$HERE/install.sh" --force
echo ""
echo "Update complete. Run: node scripts/doctor.js"
echo "See CHANGELOG.md for what changed."
