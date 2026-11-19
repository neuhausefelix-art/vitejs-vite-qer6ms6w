# Lapbook für Windows – Anleitung (Version 1.5.0)

Lapbook als eigene Windows-App, im gleichen Design wie im Browser. Neu gegenüber dem Browser:
- **Live-Tracking für F1 25, Assetto Corsa und Forza Horizon:** Jede gefahrene Runde wird automatisch gespeichert.
- **Overlay im Spiel im TV-Stil:** laufende Runde, Live-Delta zur Bestzeit, Sektoren in Lila/Grün/Gelb, Position im Rennen.
- **Sektorzeiten, Rennen automatisch, Session-Rückblick.**
- **Breites Layout** für große und Ultra-Wide-Monitore.
- **Updates per Drag & Drop:** Update-Datei ins Fenster ziehen, fertig.
- **Automatische Sicherung** in `Dokumente\Lapbook`.

Die App liest nur die offizielle Telemetrie, die F1 25 und Assetto Corsa selbst senden. Sie greift nicht ins Spiel ein.

---

## 0. Update auf 1.5.0

Du hast Lapbook 1.1.0 oder neuer schon installiert? Dann brauchst du nur die Datei **`Lapbook-Update-1.5.0.lapbook-update`**:
1. Starte Lapbook.
2. Ziehe die Datei ins Lapbook-Fenster.
3. Klicke auf **„Install and restart“**. Fertig, deine Runden bleiben erhalten.

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
| Data Out Packet Format | **Car Dash**, falls die Auswahl angeboten wird |

**Microsoft Store / Game Pass:** Bei dieser Version blockiert Windows anfangs die Daten an Lapbook. Klicke in der Live-Karte im Reiter „Forza“ einmal auf **„Allow Forza“**. Windows fragt nach Administratorrechten, klicke auf **„Ja“** und starte danach Forza neu. Die **Steam-Version** braucht das nicht.

**So funktioniert es:**
- Forza sendet **keinen Auto- und keinen Streckennamen**, nur eine Auto-Nummer und die Position auf der Karte. Deshalb fragt Lapbook nach der ersten Runde **einmal**:
  - **„Which car is this?“**: den Autonamen eingeben, z. B. „Porsche 911 GT3 RS“
  - **„Name this race“**: den Namen des Rennens eingeben, z. B. „Goliath“
- Danach erkennt Lapbook das Auto an seiner Nummer und das Rennen an der Stelle der Ziellinie, und zwar dauerhaft.
- Gespeichert werden **Rundenrennen**, also Rundkurse. Bei jeder fertigen Runde wird die Zeit gespeichert. Sprints von A nach B ohne Runden erkennt Lapbook noch nicht.
- Klasse und PI werden als Notiz mitgespeichert, z. B. „S1 812 · auto“.
- Lapbook erkennt selbst, ob Forza Horizon 6 oder 5 läuft. Falls nicht, stellst du es unter **Settings → Forza Horizon → Game** ein.
- Namen ändern: **Live → Settings → Forza Horizon**.

---

## 2d. Overlay im Spiel

Ein Zeitenpanel im Stil der TV-Grafiken, das über dem Spiel liegt:

```
┌ LAPBOOK │ MONZA  McLaren MCL40              P4/20 ┐
│▌ 0:40.800                              [+0.300] │   laufende Runde · Live-Delta
│ S1 27.350 │ S2 ––.––– │ S3 ––.–––                │   Sektoren mit Farbbalken
│ LAST 1:21.000 −1.000          BEST 1:21.000     │
└──────────────────────────────────────────────────┘
```

- **Live-Delta:** grün = schneller als deine Bestzeit an dieser Stelle der Runde, rot = langsamer. Verglichen wird mit deiner **schnellsten gültigen Runde** mit diesem Auto auf dieser Strecke, auch aus früheren Sessions. Lapbook zeichnet dafür jede Runde mit. Das Delta erscheint also ab der **zweiten** Runde, die du mit Lapbook fährst.
- **Sektoren**, die Farben wie im TV: **Lila** = deine beste Zeit überhaupt, **Grün** = beste dieser Session, **Gelb** = langsamer.
  - F1 25: die echten Sektoren aus dem Spiel
  - Assetto Corsa: AC sendet seine Sektoren nicht. Lapbook teilt die Runde deshalb in **drei gleich lange Drittel** (⅓, ⅔, 3/3). Sie weichen von den Sektoren im Spiel ab, sind aber untereinander gut vergleichbar.
  - Forza: keine Sektoren, aber Live-Delta ab der zweiten Runde eines Rennens
- **Position** (P4/20) in F1-25-Rennen und Forza-Rennen
- Der farbige Streifen links neben der Zeit ist die **Teamfarbe** deines Autos.

**Einschalten:** oben in Lapbook auf **„Overlay“** klicken oder **Strg+Umschalt+O** drücken, das geht auch im Spiel.

**Verschieben und Größe ändern:**
1. **Strg+Umschalt+L** drücken. Das Overlay bekommt einen gestrichelten Rahmen.
2. Mit der Maus an die gewünschte Stelle ziehen, an den Rändern die Größe ändern.
3. Noch einmal **Strg+Umschalt+L**, dann ist es fest. Klicks gehen dann wieder ans Spiel.

Größe (S/M/L/XL) und Hintergrund stellst du unter **Live → Settings → In-game overlay** ein. Dort findest du auch „Reset position“.

**Wichtig:** Das Overlay ist nur sichtbar, wenn das Spiel im Anzeigemodus **„Randlos“** bzw. **„Vollbild (Fenster)“** läuft:
- **F1 25:** Einstellungen → Grafik → Anzeigemodus → **Randloses Fenster** (Borderless)
- **Assetto Corsa / Content Manager:** Einstellungen → Assetto Corsa → Video → Display mode: **Fullscreen** ausschalten und **Borderless** bzw. „Windowed“ mit Bildschirmauflösung wählen

Das Overlay ist ein normales Fenster, das über dem Spiel liegt. Es greift nicht ins Spiel ein.

---

## 2f. Sektoren, Rennen und Session-Rückblick

**Sektoren auf der Streckenseite:** Über der Rangliste steht der Block **„Sectors“** (bei AC „Splits“). Er zeigt die Sektoren deiner Bestzeit, deine besten Sektoren und die **theoretische Bestzeit**. Das ist die Zeit, die du mit allen besten Sektoren zusammen fahren würdest.

**Rennen automatisch (F1 25):** Wenn ein F1-25-Rennen zu Ende ist, speichert Lapbook es im Reiter **„Races“** mit Startplatz, Endplatz, Gegnerzahl, Runden und Boxenstopps. Deine **Fahrerwertung** wird automatisch berechnet. Die Gegnerstärke steht auf „Even“, das kannst du beim Rennen über „Edit“ ändern.

**Session-Rückblick:** Hast du 45 Sekunden lang nicht mehr gefahren oder wechselst du Strecke oder Auto, zeigt Lapbook eine Zusammenfassung:
- Bestzeit (mit „new personal best“, falls es eine ist) und Vergleich mit der Bestzeit davor
- Durchschnitt und **Konstanz**, also die Streuung deiner Runden (Ausrutscher über 107 % werden ignoriert)
- alle Runden als Balken, die beste in Lila, ungültige in Rot
- beste Sektoren und theoretische Bestzeit

Ältere Rückblicke findest du auf der Startseite in der Live-Karte unter **„View recap“** und dann **„Earlier sessions“**.

---

## 2e. Forza Horizon 6

**In Forza einstellen (einmalig):** Einstellungen → **HUD und Gameplay** → ganz nach unten zu **Data Out**:

| Einstellung | Wert |
|---|---|
| Data Out | **An** |
| Data Out IP Address | **127.0.0.1** |
| Data Out IP Port | **5300** (oder die Zahl, die Lapbook anzeigt) |
| Data Out Packet Format | **Car Dash**, falls die Auswahl angeboten wird |

**Microsoft Store / Game Pass:** Bei dieser Version blockiert Windows anfangs die Daten an Lapbook. Klicke in der Live-Karte im Reiter „Forza“ einmal auf **„Allow Forza“**. Windows fragt nach Administratorrechten, klicke auf **„Ja“** und starte danach Forza neu. Die **Steam-Version** braucht das nicht.

**So funktioniert es:**
- Forza sendet **keinen Auto- und keinen Streckennamen**, nur eine Auto-Nummer und die Position auf der Karte. Deshalb fragt Lapbook nach der ersten Runde **einmal**:
  - **„Which car is this?“**: den Autonamen eingeben, z. B. „Porsche 911 GT3 RS“
  - **„Name this race“**: den Namen des Rennens eingeben, z. B. „Goliath“
- Danach erkennt Lapbook das Auto an seiner Nummer und das Rennen an der Stelle der Ziellinie, und zwar dauerhaft.
- Gespeichert werden **Rundenrennen**, also Rundkurse. Bei jeder fertigen Runde wird die Zeit gespeichert. Sprints von A nach B ohne Runden erkennt Lapbook noch nicht.
- Klasse und PI werden als Notiz mitgespeichert, z. B. „S1 812 · auto“.
- Lapbook erkennt selbst, ob Forza Horizon 6 oder 5 läuft. Falls nicht, stellst du es unter **Settings → Forza Horizon → Game** ein.
- Namen ändern: **Live → Settings → Forza Horizon**.

---

## 2d. Overlay im Spiel

Ein kleines, halbtransparentes Fenster, das über dem Spiel liegt:

| Zeile | Bedeutung |
|---|---|
| groß oben | **aktuelle Runde**. Bei F1 25 kommt die Zeit live aus dem Spiel. Bei Assetto Corsa wird ab der letzten fertigen Runde mitgezählt („approx.“), deshalb läuft die Zeit dort auch im Pausenmenü weiter. |
| Last | letzte Runde, daneben der Abstand zu deiner bisherigen Bestzeit mit diesem Auto (grün = schneller) |
| Best | deine Bestzeit auf dieser Strecke mit diesem Auto, daneben die Runden dieser Session |
| Record | Streckenrekord mit einem anderen Auto, falls schneller |

**Einschalten:** oben in Lapbook auf **„Overlay“** klicken oder **Strg+Umschalt+O** drücken, das geht auch im Spiel.

**Verschieben und Größe ändern:**
1. **Strg+Umschalt+L** drücken. Das Overlay bekommt einen gestrichelten Rahmen.
2. Mit der Maus an die gewünschte Stelle ziehen, an den Rändern die Größe ändern.
3. Noch einmal **Strg+Umschalt+L**, dann ist es fest. Klicks gehen dann wieder ans Spiel.

Lapbook merkt sich die Position. Größe (S/M/L/XL) und Hintergrund (durchsichtig bis deckend) stellst du unter **Live → Settings → In-game overlay** ein. Dort findest du auch „Reset position“.

**Wichtig:** Das Overlay ist nur sichtbar, wenn das Spiel im Anzeigemodus **„Randlos“** bzw. **„Vollbild (Fenster)“** läuft:
- **F1 25:** Einstellungen → Grafik → Anzeigemodus → **Randloses Fenster** (Borderless)
- **Assetto Corsa / Content Manager:** Einstellungen → Assetto Corsa → Video → Display mode: **Fullscreen** ausschalten und **Borderless** bzw. „Windowed“ mit Bildschirmauflösung wählen

Im exklusiven Vollbild zeichnet Windows das Spiel über alle anderen Fenster, dann siehst du das Overlay nicht. In VR geht es ebenfalls nicht.

Das Overlay ist ein normales Fenster, das über dem Spiel liegt. Es greift nicht ins Spiel ein.

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
