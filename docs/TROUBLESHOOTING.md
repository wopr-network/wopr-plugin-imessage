# iMessage Troubleshooting

Common issues specific to macOS iMessage integration.

## macOS Version Issues

**"Plugin only shows 'macOS Only' warning"**
- This plugin requires macOS - it cannot run on Linux or Windows
- Requires macOS 10.15+ for best compatibility

**"Messages.app not accessible"**
- Grant Terminal/iTerm "Full Disk Access" in System Settings > Privacy & Security > Full Disk Access
- Restart Terminal after granting permission

## imsg CLI Issues

**"imsg command not found"**
```bash
# Install via Homebrew (recommended)
brew install steipete/tap/imsg

# Verify installation
which imsg
```

**"imsg returns errors"**
- Ensure Messages.app is signed into iCloud
- Check that iMessage is enabled in Messages preferences
- Try listing chats manually first: `imsg chats --limit 5`
- Check Console.app for permission-related errors

## Message Delivery Issues

**"Messages not being received"**
- Verify `imsg chats` works manually
- Check DM policy settings - `dmPolicy: "pairing"` requires approval for unknown contacts
- Check group policy settings - `groupPolicy: "allowlist"` requires explicit group allowlist
- Verify sender is in `allowFrom` or `groupAllowFrom` if using allowlist modes
- Ensure Messages.app is running

**"Messages not being sent"**
- Check Messages.app has internet connectivity
- Verify recipient can receive iMessages (blue bubbles)
- SMS (green bubbles) works if `service: "auto"` or `service: "sms"`
- Check WOPR logs for errors: `~/.wopr/logs/imessage-plugin.log`

## RPC Communication Issues

**"Failed to start imsg rpc"**
- The plugin communicates with imsg via JSON-RPC over stdio (not TCP)
- Ensure imsg is executable: `chmod +x /usr/local/bin/imsg`
- Check the `cliPath` in your config points to the correct location
- Verify Full Disk Access is granted to both your terminal and WOPR

**"imsg rpc timeout"**
- imsg may be slow on first startup while indexing the Messages database
- Check if Messages.app is responding
- Try restarting Messages.app

## Permissions Issues

**"Automation permission denied"**
- System Settings > Privacy & Security > Automation
- Ensure WOPR/Terminal can control Messages.app
- First message send will prompt for permission - watch for the dialog

**"Cannot access Messages database"**
- Full Disk Access is required to read `~/Library/Messages/chat.db`
- The `dbPath` config option can specify an alternate database location

## Configuration Issues

**"Unknown contacts not receiving responses"**
- With `dmPolicy: "pairing"`, unknown contacts are logged but not responded to
- Use `dmPolicy: "open"` to respond to all DMs
- Add specific handles to `allowFrom` array for allowlist mode
- Use `allowFrom: ["*"]` to allow all (equivalent to "open")

**"Groups not working"**
- Default `groupPolicy` is `"allowlist"` - you must configure allowed groups
- Use `groupPolicy: "open"` to respond in all groups
- Use `groupPolicy: "disabled"` to ignore all group messages

## Limitations

This plugin has known limitations:
- **macOS only** - Requires Apple hardware with Messages.app
- **Attachments optional** - Set `includeAttachments: true` and grant Full Disk Access
- **Large message chunking** - Long responses are split at 4000 chars (configurable via `textChunkLimit`)
- **SMS behavior** - SMS (green bubbles) may behave differently than iMessage (blue bubbles)
