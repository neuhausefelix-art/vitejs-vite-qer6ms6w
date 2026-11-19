# Lapbook für Windows – Anleitung (Version 1.1.0)

Lapbook als eigene Windows-App, im gleichen Design wie im Browser. Neu gegenüber dem Browser:
- **Live-Tracking für F1 25:** Jede gefahrene Runde wird automatisch gespeichert, mit Strecke, Team, Zeit, Reifen, Wetter und Temperaturen.
- **Updates per Drag & Drop:** Update-Datei ins Fenster ziehen, fertig.
- **Automatische Sicherung** in `Dokumente\Lapbook`.

Die App liest nur die offizielle Telemetrie, die F1 25 selbst sendet. Sie greift nicht ins Spiel ein.

---

## 1. Installieren

1. Entpacke **`Lapbook-1.1.0-portable.zip`**: Rechtsklick → **„Alle extrahieren…“**. Wähle einen festen Ordner, z. B. `C:\Spiele\Lapbook`.
2. Öffne den Ordner und starte **`Lapbook.exe`**.
3. Zeigt Windows **„Der Computer wurde durch Windows geschützt“**: Klicke auf **„Weitere Informationen“** und dann auf **„Trotzdem ausführen“**. Die Meldung kommt nur, weil die App nicht kostenpflichtig signiert ist.
4. Fragt die **Windows-Firewall** nach, klicke auf **„Zulassen“**.
5. Für eine Desktop-Verknüpfung: Rechtsklick auf `Lapbook.exe` → **„Weitere Optionen anzeigen“** → **„Senden an“** → **„Desktop (Verknüpfung erstellen)“**.

**Du hast schon Version 1.0.0?** Lösche den Inhalt des alten Ordners und entpacke 1.1.0 dorthin, oder nimm einen neuen Ordner. **Deine Runden bleiben erhalten**, denn sie liegen nicht im App-Ordner, sondern in deinem Windows-Profil. Ab 1.1.0 brauchst du das nicht mehr, dann kommen Updates per Drag & Drop (siehe Punkt 4).

---

## 2. Live-Tracking einrichten (einmalig, ca. 2 Minuten)

Auf der Startseite von Lapbook steht oben die Karte **„Set up live tracking for F1 25“** mit drei Schritten, die sich von selbst abhaken:

1. ✓ **Lapbook is ready on port 20777.** Das passiert automatisch.
2. **In F1 25 einstellen:** Einstellungen → Telemetrie-Einstellungen (Settings → Telemetry Settings). Nimm die Werte genau so, wie Lapbook sie anzeigt:

   | Einstellung | Wert |
   |---|---|
   | UDP Telemetry | **On** |
   | UDP Broadcast Mode | **Off** |
   | UDP IP Address | **127.0.0.1** |
   | UDP Port | **20777** (oder die Zahl, die Lapbook anzeigt) |
   | UDP Send Rate | **20Hz** |
   | UDP Format | **2025** |

3. **Eine Runde fahren.** Sie erscheint von selbst in Lapbook.

Danach:
- Während du fährst, zeigt die Karte **„● Live · F1 25“** mit Strecke, Auto, Session und deiner letzten Rundenzeit. Mit **„Open Monza“** (bzw. der aktuellen Strecke) springst du direkt zur Strecke.
- Oben rechts zeigt **„● Live“** in Grün, dass Daten ankommen.
- Ungültige Runden werden übersprungen. In den Einstellungen kannst du das ändern.

**Port belegt?** Nutzt ein anderes Programm wie SimHub schon Port 20777, wechselt Lapbook **automatisch** auf den nächsten freien Port, z. B. 20778. Die Karte sagt dir dann, welchen Port du im Spiel eintragen musst.

**Reihenfolge:** am besten erst Lapbook starten, dann F1 25.

---

## 3. Einstellungen

Klicke oben rechts auf **„Live“** oder auf der Karte auf **„Settings“**. Dort kannst du:
- den **Port** ändern,
- **ungültige Runden** mitspeichern,
- einstellen, ob F1 25 auf **einem anderen Gerät** läuft (PlayStation, Xbox oder ein zweiter PC). Dann trägst du im Spiel statt 127.0.0.1 die IP-Adresse deines PCs ein.
- den **Backup-Ordner** öffnen.

---

## 4. Updates installieren

Von mir bekommst du künftig eine Datei wie **`Lapbook-Update-1.2.0.lapbook-update`**.

1. Starte Lapbook.
2. **Ziehe die Datei einfach ins Lapbook-Fenster.** Alternativ klickst du oben auf **„Update“** und dann auf **„Choose file“**.
3. Lapbook zeigt die Version und was neu ist. Klicke auf **„Install and restart“**.
4. Lapbook startet neu, fertig. **Deine Runden bleiben erhalten.**

Sicherheit:
- Lapbook prüft jede Datei mit Prüfsummen. Beschädigte oder fremde Dateien werden abgelehnt.
- **Zurück zur vorherigen Version:** oben auf **„Update“** klicken, dann **„Back to version …“** (zum Bestätigen zweimal klicken).
- Startet ein Update nicht richtig, geht Lapbook von selbst zur eingebauten Version zurück und sagt dir Bescheid.
- Installiere nur Update-Dateien, die du von mir bekommen hast.

---

## 5. Bisherige Daten übernehmen

Wenn du Lapbook schon im Browser bzw. auf claude.ai benutzt hast:
1. Öffne dort Lapbook → **Data → Download**. Du bekommst eine Datei `lapbook-JJJJ-MM-TT.json`.
2. Öffne in der Windows-App **Data → Upload** und wähle diese Datei.

**Achtung:** Upload **ersetzt** die Daten in der App. Mach das also direkt am Anfang, bevor du die ersten Runden live aufzeichnest.

---

## 6. Sicherung

- Lapbook speichert automatisch nach **`Dokumente\Lapbook`**: `lapbook-autosave.json` und eine Kopie pro Tag (die letzten 14 Tage).
- Wiederherstellen: **Data → Upload** und eine dieser Dateien wählen.
- Neuer PC oder Windows neu installiert? Kopiere vorher den Ordner `Dokumente\Lapbook` weg, oder nutze OneDrive.

---

## 7. Probleme?

| Problem | Lösung |
|---|---|
| Karte bleibt bei Schritt 2 | Prüfe die Werte im Spiel: Telemetry **On**, IP **127.0.0.1**, **derselbe Port**, den Lapbook anzeigt. |
| „Live tracking needs attention“ | Die Karte nennt den Grund. Meistens hilft „Settings“ → anderen Port wählen, z. B. 20790, und denselben im Spiel eintragen. |
| Eine Runde fehlt | Sie war wahrscheinlich ungültig. In den Einstellungen auf „Save them too“ stellen. |
| Windows blockiert den Start | „Weitere Informationen“ → „Trotzdem ausführen“. |
| Update wird abgelehnt | Die Meldung sagt warum, z. B. „damaged“: Datei neu herunterladen. |

---

## Für Entwickler

```bash
cd desktop
npm install
npm test                     # Parser- und Update-Tests
npm start                    # App starten
npm run dist                 # Installer + portable ZIP bauen (unter Windows)
npm run update -- "Neu: …"   # Update-Paket dist/Lapbook-Update-<version>.lapbook-update bauen
```

Aufbau:
- `boot.js`: startet ein installiertes Update oder die eingebaute Version (mit automatischem Zurückfallen)
- `updates.js`: Update-Pakete lesen, prüfen, installieren und zurücksetzen
- `main.js`: Fenster, UDP-Empfang (mit automatischem Port-Ausweichen) und Sicherung
- `f1-25.js`: liest die F1-25-Pakete
- `preload.js`: sichere Brücke zur Oberfläche
- `app/lapbook.html`: die unveränderte Lapbook-Seite
- `app/desktop-bridge.js`: Live-Karte, Update-Fenster, Drag & Drop, Eintragen der Runden

Update-Pakete enthalten nur die App-Dateien, nicht Electron selbst. Ein Electron-Update braucht weiterhin einmal die neue komplette App (`minShell` im Paket).
