#!/bin/sh
set -e

cd /app

# Ensure required MCP servers are registered before starting the API.
# Skip registration if the server already exists.
ensure_mcp_server() {
  NAME="$1"
  URL="$2"
  TRANSPORT="$3"

  if ! claude mcp get "$NAME" >/dev/null 2>&1; then
    echo "Registering MCP server: $NAME ($URL)"
    claude mcp add -t "$TRANSPORT" "$NAME" "$URL"
  fi
}

ensure_mcp_server netsuite_mcp "https://source-netsuite.fastmcp.app/mcp" http

# Include all the files of agents from claude_agents folder without the folder itself in the .claude/agents directory
if [ -d "/app/claude_agents" ]; then
    mkdir -p /home/app/.claude/agents/
    cp -r /app/claude_agents/* /home/app/.claude/agents/
    echo "Agents copied"
fi

exec "$@"
