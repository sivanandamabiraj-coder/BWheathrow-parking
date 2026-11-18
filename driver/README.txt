ParkDesk Driver (PWA) — deployment
1. Upload this whole "driver" folder next to parking-supabase.html on your HTTPS host
   (it must be a folder of its own so the app has its own scope), e.g. https://yoursite/driver/
2. Drivers open that address in Chrome on Android, sign in with their normal ParkDesk contractor
   email + password, then Menu > "Install app" (or Chrome's ⋮ > Add to Home screen).
3. To release a new version later, upload the new files and bump CACHE in sw.js (parkdesk-driver-v2...).
Files: index.html (app), manifest.json, sw.js (offline shell), icon-*.png
