# Habit Time Tracker

Eine kleine persönliche PWA für:
- mehrere Habits
- Stoppuhr
- Zeiten nachtragen
- tägliche Streaks
- Gesamtstunden pro Habit
- Backup / Restore als JSON
- Offline-Nutzung nach dem ersten Laden

## Kostenlos online stellen: GitHub Pages

1. Erstelle einen kostenlosen GitHub-Account.
2. Erstelle ein neues Repository, z. B. `habit-tracker`.
3. Lade `index.html`, `manifest.webmanifest`, `sw.js` und `icon.svg` hoch.
4. Öffne im Repository: Settings → Pages.
5. Unter "Build and deployment" wähle:
   - Source: Deploy from a branch
   - Branch: main / root
6. Nach kurzer Zeit erscheint deine persönliche URL.

## iPhone
Öffne die GitHub-Pages-URL in Safari → Teilen → "Zum Home-Bildschirm".

## Wichtig zu den Daten
Die Daten werden lokal im Browser via IndexedDB gespeichert.
Das heißt:
- kein Konto
- keine Kreditkarte
- keine externe Datenbank
- funktioniert offline
- Daten sind NICHT automatisch zwischen iPhone und PC synchronisiert

Nutze deshalb gelegentlich "Backup". Die JSON-Datei kannst du später mit "Restore" wieder einspielen.

## Lokal testen
Einfach `index.html` direkt zu öffnen reicht für fast alles. Für PWA/Service Worker sollte die Seite über HTTPS oder localhost laufen.
