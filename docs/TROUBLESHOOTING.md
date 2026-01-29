# iMessage Troubleshooting

Common issues specific to macOS iMessage integration.

## macOS Version Issues

**"Plugin only shows 'macOS Only' warning"**
- This plugin requires macOS - it cannot run on Linux or Windows
- Requires macOS 10.15+ for best compatibility

**"Messages.app not accessible"**
- Grant Terminal/iTerm "Full Disk Access" in System Preferences → Security & Privacy
- Restart Terminal after granting permission

## imsg CLI Issues

**"imsg command not found"**
```bash
# Install via Homebrew
brew install imsg

# Or install from source
git clone https://github.com/atomantic/imsg
cd imsg && npm install -g
```

**"imsg returns errors"**
- Ensure Messages.app is signed into iCloud
- Check that iMessage is enabled in Messages preferences
- Try sending a test message manually first

## Message Delivery Issues

**"Messages not being received"**
- Check that the sender is in your contacts
- Verify phone number format (use E.164: +1234567890)
- Ensure Messages.app is running

**"Messages not being sent"**
- Check Messages.app has internet connectivity
- Verify recipient can receive iMessages (blue bubbles)
- SMS (green bubbles) may have different behavior

## JSON-RPC Issues

**"Connection refused"**
- imsg daemon may not be running
- Check port availability (default: 4567)
- Restart WOPR daemon

## Limitations

This plugin has known limitations:
- **No media support** - Images/videos not supported
- **macOS only** - Requires Apple hardware
- **No group chat** - Individual messages only
- **iMessage only** - SMS may not work reliably
