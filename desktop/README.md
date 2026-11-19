# Lapbook für Windows – Anleitung (Version 1.6.0)

Lapbook als eigene Windows-App, im gleichen Design wie im Browser. Neu gegenüber dem Browser:
- **Live-Tracking für F1 25, Assetto Corsa und Forza Horizon:** Jede gefahrene Runde wird automatisch gespeichert.
- **Overlay im Spiel im TV-Stil:** laufende Runde, Live-Delta zur Bestzeit, Sektoren in Lila/Grün/Gelb, Position im Rennen.
- **Sektorzeiten, Rennen automatisch, Session-Rückblick.**
- **Breites Layout** für große und Ultra-Wide-Monitore.
- **Updates per Drag & Drop:** Update-Datei ins Fenster ziehen, fertig.
- **Automatische Sicherung** in `Dokumente\Lapbook`.

Die App liest nur die offizielle Telemetrie, die F1 25 und Assetto Corsa selbst senden. Sie greift nicht ins Spiel ein.

---

## 0. Update auf 1.6.0

Du hast Lapbook 1.1.0 oder neuer schon installiert? Dann brauchst du nur die Datei **`Lapbook-Update-1.6.0.lapbook-update`**:
1. Starte Lapbook.
2. Ziehe die Datei ins Lapbook-Fenster.
3. Klicke auf **„Install and restart“**. Fertig, deine Runden bleiben erhalten.

---

## Was kann welches Spiel?

| | F1 25 | Assetto Corsa | Forza Horizon 6 |
|---|---|---|---|
| Runden automatisch speichern | ✅ jede fertige Runde | ✅ jede fertige Runde | ✅ deine **Zeitfahren und Drag-Runs**; normale Rennrunden nur, wenn eingeschaltet |
| Strecke erkannt | ✅ automatisch | ✅ automatisch (Name aus dem AC-Ordner) | ⚠️ du benennst jedes Zeitfahren einmal |
| Auto erkannt | ✅ echter Name (z. B. McLaren MCL40) | ✅ echter Name aus dem AC-Ordner | ⚠️ du benennst jedes Auto einmal |
| Ungültige Runden erkannt | ✅ werden übersprungen | ❌ AC sendet das nicht | ❌ Forza sendet das nicht |
| Reifen | ✅ | ❌ | ❌ |
| Wetter, Luft- und Streckentemperatur | ✅ | ❌ | ❌ |
| Session-Art (Training, Quali, Rennen, Zeitfahren) | ✅ | ❌ | ❌ |
| Klasse und PI | – | – | ✅ als Notiz |
| Sektorzeiten | ✅ echte Sektoren | ⚠️ Drittel der Runde (AC sendet seine Sektoren nicht) | ❌ |
| Live-Delta zur Bestzeit | ✅ | ✅ | ✅ bei Zeitfahren und Drag-Runs |
| Laufende Rundenzeit im Overlay | ✅ | ✅ | ✅ |
| Position im Overlay | ✅ im Rennen | ❌ | ✅ in Rennen |
| Rennen automatisch (Start, Ziel, Gegner, Fahrerwertung) | ✅ | ❌ | ❌ |
| Session-Rückblick | ✅ | ✅ | ✅ |
| Im Spiel einstellen | UDP-Telemetrie | nichts | Data Out |

---

## 1. Installieren (neu)

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

## 2b. Assetto Corsa (über Content Manager)

Im Spiel musst du **nichts einstellen**. Assetto Corsa hat eine eingebaute Telemetrie-Schnittstelle (UDP-Port 9996), mit der sich Lapbook von selbst verbindet.

1. Starte Lapbook.
2. Starte eine Session in Assetto Corsa, z. B. über Content Manager: Übungsfahrt, Hotlap oder Rennen.
3. Sobald du auf der Strecke bist, zeigt Lapbook **„● Live · Assetto Corsa“** mit Strecke und Auto.
4. Jede fertige Runde wird automatisch gespeichert.

**Echte Namen für Autos und Strecken:** Lapbook sucht deinen Assetto-Corsa-Ordner von selbst, z. B. `C:\Program Files (x86)\Steam\steamapps\common\assettocorsa`, und liest dort die Namen, also „Ferrari 488 GT3“ statt `ks_ferrari_488_gt3`. Findet es den Ordner nicht, klicke in der Live-Karte oder in den Einstellungen auf **„Choose folder“** und wähle den Ordner `assettocorsa`.

**Gut zu wissen:**
- Assetto Corsa sendet nicht mit, ob eine Runde ungültig war, z. B. wegen Abkürzen. Lapbook speichert deshalb alle Runden.
- Reifen und Wetter sendet AC über diese Schnittstelle nicht.
- Ein anderes Programm, das gleichzeitig mit AC über Port 9996 spricht, kann sich mit Lapbook in die Quere kommen.

---

## 2c. F1 25: Autonamen

Lapbook kennt die echten Fahrzeugnamen:

| 2025 | 2026 |
|---|---|
| McLaren MCL39 | McLaren MCL40 |
| Ferrari SF-25 | Ferrari SF-26 |
| Red Bull Racing RB21 | Red Bull Racing RB22 |
| Mercedes W16 | Mercedes W17 |
| Aston Martin AMR25 | Aston Martin AMR26 |
| Alpine A525 | Alpine A526 |
| Williams FW47 | Williams FW48 |
| Racing Bulls VCARB 02 | Racing Bulls VCARB 03 |
| Haas VF-25 | Haas VF-26 |
| Kick Sauber C45 | Audi R26 |
| – | Cadillac (noch ohne Modellnamen) |

- Runden, die du mit älteren Versionen gespeichert hast, z. B. als „McLaren 2026“ oder „F1 25 car (team 228)“, werden **automatisch umbenannt**.
- Ein Hinweis zu den 2026er-Autos: Sicher bekannt ist nur, dass Team 228 der McLaren ist. Die anderen Nummern sind aus derselben Reihenfolge abgeleitet. Steht bei einem Auto etwas Falsches, korrigiere es einmal unter **Live → Settings → F1 25 car names**. Dort gibst du die Teamnummer und den richtigen Namen ein, die Runden werden mit umbenannt.
- Ganz unbekannte Autos, z. B. Fantasie-Teams oder F2, fragt die Live-Karte einmal ab: **„Which car is this?“**.

---

## 2e. Forza Horizon 6

**In Forza einstellen (einmalig):** Einstellungen → **HUD und Gameplay** → ganz nach unten zu **Data Out**:

| Einstellung | Wert |
|---|---|
| Data Out | **An** |
| Data Out IP Address | **127.0.0.1** |
| Data Out IP Port | **5300** (oder die Zahl, die Lapbook anzeigt) |

**Microsoft Store / Game Pass:** Bei dieser Version blockiert Windows anfangs die Daten an Lapbook. Klicke in der Live-Karte im Reiter „Forza“ einmal auf **„Allow Forza“**. Windows fragt nach Administratorrechten, klicke auf **„Ja“** und starte Forza neu. Die **Steam-Version** braucht das nicht.

### Warum eigene Zeitfahren?
Forza sendet **nicht mit, was du gerade machst**. Für Lapbook sehen Rennen, Trailblazer, Drag-Strip und freies Fahren gleich aus. Deshalb legst du deine Zeitfahren **einmal selbst an**. Danach misst Lapbook sie automatisch, ähnlich wie Segmente bei Strava.

### Ein Zeitfahren anlegen (z. B. für einen Trailblazer oder eine Lieblingsstrecke)
1. Fahr auf den Start zu und drücke **genau an der Startlinie** **Strg+Umschalt+T**. Im Overlay steht „● REC“.
2. Fahr die Strecke.
3. Drücke **an der Ziellinie** wieder **Strg+Umschalt+T**. Die Zeit dieser Fahrt wird gleich als erste Zeit gespeichert.
4. In Lapbook erscheint **„Name this time trial“**: Namen eingeben, z. B. „Fuji Trailblazer“.

**Ab jetzt:** Jedes Mal, wenn du **in derselben Richtung** durch den Startpunkt fährst, startet die Zeit von selbst. Im Overlay siehst du das Live-Delta zu deiner Bestzeit. Am Ziel wird die Zeit gespeichert. Welchen Weg du dazwischen nimmst, ist egal, genau wie bei einem Trailblazer.

### Einen Drag-Run anlegen (z. B. Drag-Strip)
1. **Bleib an der Startlinie stehen** und drücke **Strg+Umschalt+T**. Im Overlay steht „READY“.
2. Fahr los. Die Zeit startet in dem Moment, in dem sich das Auto bewegt.
3. Drücke **an der Ziellinie** wieder **Strg+Umschalt+T** und gib dem Drag-Run einen Namen.

**Ab jetzt:** Jedes Mal, wenn du an diesem Start **stehen bleibst und losfährst**, wird die Zeit bis zum Ziel gemessen.

### Gut zu wissen
- **Normale Rennen werden nicht gespeichert.** Wenn du das doch willst: **Settings → Forza Horizon → Normal races → „Save every lap of every race“**.
- Pausierst du während eines Zeitfahrens, zählt die Fahrt nicht.
- Kürzer als 2 Sekunden oder 50 Meter wird nicht gespeichert.
- Statt Strg+Umschalt+T kannst du in der Live-Karte auch auf **„Start here“** klicken, wenn Lapbook sichtbar ist.
- Speed Traps, Speed Zones, Danger Signs und Drift Zones messen Geschwindigkeit, Weite oder Punkte, aber keine Zeit. Diese Werte sendet Forza nicht, deshalb kann Lapbook sie nicht übernehmen.
- Autos benennst du einmal: Lapbook fragt **„Which car is this?“**.
- Namen ändern oder ein Zeitfahren löschen (Namen leeren): **Live → Settings → Forza Horizon**.

---

## 3. Einstellungen

Klicke oben rechts auf **„Live“** oder auf der Karte auf **„Settings“**. Dort kannst du:
- den **Port** ändern,
- **ungültige Runden** mitspeichern,
- einstellen, ob F1 25 auf **einem anderen Gerät** läuft (PlayStation, Xbox oder ein zweiter PC). Dann trägst du im Spiel statt 127.0.0.1 die IP-Adresse deines PCs ein.
- den **Backup-Ordner** öffnen,
- F1-25-**Autonamen** vergeben oder ändern,
- Assetto Corsa **ein- oder ausschalten** und den **AC-Ordner** wählen.

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
| Assetto Corsa: „Live“ erscheint nicht | Du musst auf der Strecke sein, im Menü sendet AC nichts. Prüfe in den Einstellungen, ob Assetto Corsa auf „On“ steht. |
| AC zeigt Ordnernamen wie „Ks Ferrari 488 GT3“ | „Choose folder“ und den `assettocorsa`-Ordner wählen. |
| Overlay nicht zu sehen | Spiel auf „Randlos“ / „Borderless“ stellen. Mit Strg+Umschalt+O prüfen, ob es an ist, und unter Settings „Reset position“ drücken. |
| Klicks im Spiel landen im Overlay | Strg+Umschalt+L drücken, um es wieder festzustellen. |
| Forza: Zeitfahren startet nicht | Durch den Startpunkt in **derselben Richtung** fahren wie beim Anlegen (ca. 20 m Toleranz). Beim Drag-Run vorher am Start **stehen bleiben**. |
| Forza: nichts kommt an | Data Out **An**, IP **127.0.0.1**, Port wie in Lapbook. Bei Game Pass: „Allow Forza“ klicken und Forza neu starten. |
| Forza: „packets of … bytes“ | Diese Forza-Version sendet ein anderes Format. Sag mir die Zahl, dann passe ich es an. |
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
- `app/overlay.html`, `overlay-preload.js`: das Overlay-Fenster
- `delta.js`: Live-Delta (Aufzeichnung der schnellsten Runde) und Sektorfarben
- `forza.js`: Forza Data Out (Runden, Auto-Nummern, Rennen anhand der Ziellinie)
- `ac.js`, `acnames.js`: Assetto-Corsa-Telemetrie und echte Namen aus dem AC-Ordner
- `preload.js`: sichere Brücke zur Oberfläche
- `app/lapbook.html`: die unveränderte Lapbook-Seite
- `app/desktop-bridge.js`: Live-Karte, Update-Fenster, Drag & Drop, Eintragen der Runden

Update-Pakete enthalten nur die App-Dateien, nicht Electron selbst. Ein Electron-Update braucht weiterhin einmal die neue komplette App (`minShell` im Paket).
