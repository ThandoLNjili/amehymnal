# AMEC Hymnal PWA

A Progressive Web App for reading AMEC hymns and liturgy, designed to work completely offline after initial installation.

## Features

- **Offline-First**: Complete hymnal data cached indefinitely for offline use
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Smart Search**: Search by page number, hymn number, lyrics, authors, and titles
- **Dark Mode**: Toggle between light and dark themes
- **Font Size Control**: Adjustable text size for accessibility
- **Touch Gestures**: Swipe navigation on mobile devices
- **Keyboard Navigation**: Arrow keys and Enter for search results

## Offline Functionality

This PWA is designed to work completely offline after the initial data download:

1. **Installation**: Install the app on your device from the browser
2. **Initial Sync**: The app will download and cache all hymnal data
3. **Offline Use**: Once cached, the app works without internet connection
4. **Data Persistence**: Hymnal data is cached indefinitely until manually cleared

## Testing Offline Mode

1. **Start the app**:
   ```bash
   cd "AMEC Hymnal"
   python -m http.server 8000
   ```

2. **Open in browser**: Navigate to `http://localhost:8000`

3. **Install PWA**:
   - Chrome: Click the install icon in the address bar
   - Firefox: Click the install button in the address bar
   - Mobile: Use the "Add to Home Screen" option

4. **Test offline**:
   - Open DevTools (F12)
   - Go to Network tab
   - Check "Offline" checkbox
   - Refresh the page - it should still work
   - Uncheck "Offline" to go back online

## Cache Management

The app uses three cache stores:
- **Static Cache**: HTML, CSS, JS, and icons (updated on app updates)
- **Data Cache**: Hymnal JSON data (cached indefinitely)
- **Dynamic Cache**: Other resources fetched during use

## Service Worker Features

- **Cache-First Strategy**: Serves cached content when available
- **Network Fallback**: Falls back to network for uncached content
- **Background Updates**: Can update data in the background when online
- **Offline Detection**: Shows offline indicator in the navbar

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari (limited PWA support)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

**App not working offline:**
- Ensure the service worker is registered (check console for "Service Worker registered")
- Clear browser cache and reinstall the PWA
- Check that all files are being served over HTTPS (required for PWA)

**Data not loading:**
- Check browser console for errors
- Ensure `hymnal_data.json` is accessible
- Try refreshing the page while online

**Installation issues:**
- Ensure the site is served over HTTPS (localhost is exempt)
- Check that manifest.json is properly configured
- Verify all icon files exist

## Development

To modify the hymnal data:
1. Edit `hymnal_data.json`
2. Update the service worker version to force cache refresh
3. Test offline functionality thoroughly

## File Structure

```
AMEC Hymnal/
├── index.html          # Main HTML file
├── app.js             # Main application logic
├── style.css          # Styling
├── sw.js              # Service worker for offline functionality
├── manifest.json      # PWA manifest
├── hymnal_data.json   # Hymnal content data
└── icons/             # PWA icons
    ├── ame-logo.svg
    ├── icon-192.svg
    ├── icon-512.svg
    └── ame-logo.webp
```