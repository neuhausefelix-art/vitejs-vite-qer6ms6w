# Lapbook für Windows

Lapbook als eigene Windows-App, im gleichen Design wie im Browser. Dazu kommt: **Runden aus F1 25 werden automatisch gespeichert**, mit Strecke, Team, Rundenzeit, Reifen, Wetter sowie Luft- und Streckentemperatur.

Die App liest nur die offizielle UDP-Telemetrie, die F1 25 selbst sendet. Sie greift nicht ins Spiel ein und verändert keinen Speicher.

---

## 1. App installieren

Du hast zwei Möglichkeiten:

### A) Portable Version (ohne Installation)
1. Entpacke **`Lapbook-1.0.0-portable.zip`** in einen Ordner, z. B. `C:\Spiele\Lapbook`. Rechtsklick → „Alle extrahieren…“.
2. Starte **`Lapbook.exe`**.
3. Windows zeigt eventuell **„Der Computer wurde durch Windows geschützt“**, weil die App nicht kostenpflichtig signiert ist. Klicke auf **„Weitere Informationen“** und dann auf **„Trotzdem ausführen“**.
4. Tipp: Rechtsklick auf `Lapbook.exe` → „Weitere Optionen anzeigen“ → „Senden an“ → „Desktop (Verknüpfung erstellen)“.

### B) Installer (Setup mit Startmenü-Eintrag)
Den Installer baut GitHub automatisch, sobald der Code im Repo liegt:
1. Öffne auf GitHub das Repo → Reiter **Actions** → Workflow **„Lapbook Windows build“** → den neuesten grünen Lauf.
2. Lade unten unter **Artifacts** die Datei **„Lapbook-Windows“** herunter und entpacke sie.
3. Starte **`Lapbook-Setup-1.0.0.exe`**. Für den Windows-Hinweis gilt dasselbe wie oben.

> Deine Daten liegen nicht im App-Ordner, sondern in deinem Windows-Benutzerprofil. Updates oder ein Wechsel des Ordners löschen also nichts.

---

## 2. F1 25 einstellen (einmalig)

Im Spiel: **Einstellungen → Telemetrie-Einstellungen** (Settings → Telemetry Settings)

| Einstellung | Wert |
|---|---|
| UDP-Telemetrie | **Ein** |
| UDP-Broadcast-Modus | **Aus** |
| UDP-IP-Adresse | **127.0.0.1** |
| UDP-Port | **20777** |
| UDP-Senderate | **20 Hz** |
| UDP-Format | **2025** |
| Your Telemetry | **Public** (nur online wichtig) |

Dann:
1. **Erst Lapbook starten, dann F1 25.** Oben rechts in Lapbook steht **„○ F1 25 waiting“**.
2. Fahre eine Session, egal ob Zeitfahren, Training, Qualifying oder Rennen. Sobald Daten kommen, steht dort **„● F1 25 live“** in Grün.
3. Jede **fertige, gültige Runde** wird automatisch gespeichert. Unten erscheint z. B. „F1 25 · Monza: 01:21.200, new record by 0.300“.

**Windows-Firewall:** Fragt Windows beim ersten Start, ob Lapbook kommunizieren darf, klicke auf **„Zulassen“**.

---

## 3. Einstellungen in der App

Klicke oben rechts auf **„F1 25 live / waiting“**. Dort kannst du:
- den **UDP-Port** ändern. Das ist nötig, wenn ein anderes Programm wie SimHub schon Port 20777 nutzt. Stelle dann im Spiel denselben Port ein.
- **ungültige Runden** mitspeichern. Standardmäßig werden sie übersprungen.
- angeben, ob das Spiel auf **einem anderen Gerät** läuft, z. B. PlayStation, Xbox oder einem zweiten PC. Dann trägst du im Spiel die IP-Adresse deines PCs ein.
- den **Backup-Ordner** öffnen.

---

## 4. Deine bisherigen Daten übernehmen

Wenn du Lapbook schon im Browser bzw. auf claude.ai benutzt hast:
1. Öffne dort Lapbook → **Data → Download**. Du bekommst eine Datei `lapbook-JJJJ-MM-TT.json`.
2. Öffne in der Windows-App **Data → Upload** und wähle diese Datei.

**Achtung:** Upload **ersetzt** die Daten in der App. Mach das am besten direkt nach der Installation, bevor du die ersten Runden fährst.

---

## 5. Sicherung

- Die App speichert automatisch eine Sicherung in **`Dokumente\Lapbook`**: `lapbook-autosave.json` und eine Kopie pro Tag (die letzten 14 Tage).
- Wiederherstellen: **Data → Upload** und eine dieser Dateien wählen.
- Die Synchronisierung zwischen Geräten über claude.ai gibt es in der Windows-App nicht. Oben steht deshalb „Saved on this PC“.

---

## 6. Was automatisch erkannt wird

| | |
|---|---|
| Strecke | ✅ alle F1-25-Strecken inkl. Reverse-Layouts |
| Auto | ✅ als Team, z. B. „McLaren F1 25“, „Ferrari F1 25“. Bei „My Team“ steht „My Team F1 25“. |
| Rundenzeit | ✅ inkl. Gültigkeit (ungültige werden übersprungen) |
| Reifen | ✅ Soft / Medium / Hard / Intermediate / Wet |
| Wetter, Temperaturen | ✅ |
| Session | ✅ als Notiz, z. B. „Time Trial · auto“ |

Doppelte Runden (gleiche Strecke, gleiches Auto, gleiche Zeit am selben Tag) werden nur einmal gespeichert.

---

## 7. Probleme?

| Problem | Lösung |
|---|---|
| Bleibt bei „waiting“ | Prüfe die Telemetrie-Einstellungen im Spiel. Sie müssen **Ein**, **127.0.0.1** und den gleichen Port wie in Lapbook haben. |
| „F1 25: error … port already used“ | Ein anderes Programm wie SimHub nutzt den Port. Nimm in Lapbook und im Spiel z. B. **20778**. Oder aktiviere in SimHub die UDP-Weiterleitung an Port 20778. |
| Runden fehlen | Ungültige Runden werden übersprungen. Das lässt sich im Telemetrie-Fenster ändern. |
| Windows blockiert den Start | „Weitere Informationen“ → „Trotzdem ausführen“. |

---

## Für Entwickler

```bash
cd desktop
npm install
npm test        # Tests für den F1-25-Parser
npm start       # App starten
npm run dist    # Installer + portable ZIP bauen (unter Windows)
```

Aufbau:
- `main.js`: Fenster, UDP-Empfang und Sicherung
- `f1-25.js`: liest die F1-25-Pakete (Session, Participants, Session History)
- `preload.js`: sichere Brücke zur Oberfläche
- `app/lapbook.html`: die unveränderte Lapbook-Seite
- `app/desktop-bridge.js`: trägt die Runden ein und zeigt den Telemetrie-Status

Den Installer baut GitHub Actions bei jedem Push (`.github/workflows/lapbook-windows.yml`).
