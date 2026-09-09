#!/usr/bin/env python3
"""
Figma MCP Helper — fetch design context from the Figma Desktop MCP server.

Usage:
  python3 scripts/figma-mcp.py <node-id> [file-key]
  python3 scripts/figma-mcp.py 102:30652
  python3 scripts/figma-mcp.py 102:30652 S84HaAL9hckSZcWm8k2Vk2

The node-id is from the Figma URL: ?node-id=102-30652 → use "102:30652"
(replace the dash with a colon).

The file-key is the ID in the Figma URL path:
  https://www.figma.com/design/<FILE_KEY>/...

If file-key is omitted, it defaults to the Handoff file.

Requires Figma Desktop app running with MCP enabled (http://127.0.0.1:3845/mcp).
"""

import json
import sys
import urllib.request

MCP_URL = "http://127.0.0.1:3845/mcp"
DEFAULT_FILE_KEY = "S84HaAL9hckSZcWm8k2Vk2"  # Handoff file

HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/event-stream",
}


def call_mcp(payload, session_id=None):
    """Send a JSON-RPC request to the Figma MCP server."""
    hdrs = dict(HEADERS)
    if session_id:
        hdrs["Mcp-Session-Id"] = session_id
    req = urllib.request.Request(
        MCP_URL, data=json.dumps(payload).encode(), headers=hdrs, method="POST"
    )
    try:
        resp = urllib.request.urlopen(req)
        sid = resp.headers.get("Mcp-Session-Id")
        body = resp.read().decode()
        for line in body.split("\n"):
            if line.startswith("data: "):
                return json.loads(line[6:]), sid
        return None, sid
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return None, None


def initialize():
    """Initialize an MCP session. Returns the session ID."""
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "kiro-figma-helper", "version": "1.0"},
        },
    }
    result, session_id = call_mcp(payload)
    if not session_id:
        print("Failed to initialize MCP session. Is Figma Desktop running?", file=sys.stderr)
        sys.exit(1)
    return session_id


def get_design_context(session_id, node_id, file_key=None):
    """Fetch design context for a node."""
    fk = file_key or DEFAULT_FILE_KEY
    payload = {
        "jsonrpc": "2.0",
        "id": 3,
        "method": "tools/call",
        "params": {
            "name": "get_design_context",
            "arguments": {
                "fileKey": fk,
                "nodeId": node_id,
                "disableCodeConnect": False,
            },
        },
    }
    result, _ = call_mcp(payload, session_id)
    if result:
        content = result.get("result", {}).get("content", [])
        for item in content:
            if item.get("type") == "text":
                return item["text"]
    return None


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    node_id = sys.argv[1]
    file_key = sys.argv[2] if len(sys.argv) > 2 else None

    # Normalize node-id: Figma URLs use dash, MCP uses colon
    node_id = node_id.replace("-", ":")

    print(f"Fetching node {node_id}...", file=sys.stderr)
    session_id = initialize()
    text = get_design_context(session_id, node_id, file_key)

    if text:
        print(text)
    else:
        print("No design context returned.", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
