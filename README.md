# WOPR iMessage Plugin

iMessage/SMS integration for WOPR on macOS using the `imsg` CLI tool.

## ⚠️ macOS Only

This plugin **only works on macOS** with Messages.app configured.

## Prerequisites

1. **macOS** with Messages.app signed in to iMessage
2. **imsg CLI** - Install via Homebrew:
   ```bash
   brew install steipete/tap/imsg
   ```
3. **Full Disk Access** - WOPR needs access to `~/Library/Messages/chat.db`
4. **Automation Permission** - Grant when prompted for Messages.app control

## Installation

```bash
wopr plugin install wopr-plugin-imessage
```

## Configuration

### Minimal Config

```json
{
  "channels": {
    "imessage": {
      "enabled": true,
      "cliPath": "/usr/local/bin/imsg"
    }
  }
}
```

### Full Config

```json
{
  "channels": {
    "imessage": {
      "enabled": true,
      "cliPath": "/usr/local/bin/imsg",
      "dbPath": "/Users/<you>/Library/Messages/chat.db",
      "service": "auto",
      "region": "US",
      "dmPolicy": "pairing",
      "allowFrom": ["+15555550123", "user@example.com"],
      "groupPolicy": "allowlist",
      "groupAllowFrom": ["+15555550123"],
      "includeAttachments": false,
      "mediaMaxMb": 16,
      "textChunkLimit": 4000
    }
  }
}
```

## Security Policies

### DM Policies

- **pairing** (default) - Unknown contacts must be approved
- **allowlist** - Only respond to configured handles
- **open** - Accept all DMs
- **closed** - Ignore all DMs

### Group Policies

- **allowlist** (default) - Only respond in configured groups
- **open** - Respond in all groups
- **disabled** - Ignore all groups

## Setup Instructions

1. **Install imsg CLI**:
   ```bash
   brew install steipete/tap/imsg
   ```

2. **Grant Full Disk Access**:
   - System Settings → Privacy & Security → Full Disk Access
   - Add your terminal app and WOPR process

3. **Test imsg**:
   ```bash
   imsg chats --limit 5
   ```

4. **Configure WOPR**:
   ```bash
   wopr onboard  # Or edit ~/.wopr/config.json
   ```

5. **Approve Permissions**:
   - First message will prompt for Automation access
   - Grant permission for WOPR to control Messages.app

## Dedicated Bot User (Optional)

For a separate iMessage identity from your personal account:

1. Create a new macOS user (e.g., `woprbot`)
2. Sign into Messages with a dedicated Apple ID
3. Enable Remote Login (SSH)
4. Set up SSH key authentication
5. Create a wrapper script:
   ```bash
   #!/bin/bash
   exec ssh woprbot@localhost /usr/local/bin/imsg "$@"
   ```
6. Set `cliPath` to your wrapper script

## Remote Mac via SSH

If WOPR runs on Linux but iMessage needs to be on a Mac:

```json
{
  "channels": {
    "imessage": {
      "enabled": true,
      "cliPath": "/path/to/imsg-ssh-wrapper",
      "remoteHost": "user@mac-host"
    }
  }
}
```

SSH wrapper script:
```bash
#!/bin/bash
exec ssh -T user@mac-host /usr/local/bin/imsg "$@"
```

## Commands

List recent chats:
```bash
imsg chats --limit 20
```

Send test message:
```bash
imsg send --to "+15555550123" "Hello from WOPR"
```

## Troubleshooting

### "imsg not found"
- Install: `brew install steipete/tap/imsg`
- Check path: `which imsg`

### "Failed to start imsg rpc"
- Grant Full Disk Access to your terminal/IDE
- Ensure Messages.app is signed in
- Check Console.app for permission prompts

### Messages not received
- Check `imsg chats` works manually
- Verify DM/group policies in config
- Check WOPR logs: `~/.wopr/logs/imessage-plugin.log`

### Automation permission denied
- System Settings → Privacy & Security → Automation
- Ensure WOPR can control Messages.app

## Development

```bash
npm install
npm run build
npm run watch
```

## License

MIT
