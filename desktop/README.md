# Lapbook für Windows – Anleitung (Version 2.5.0)

Lapbook als eigene Windows-App, im gleichen Design wie im Browser. Neu gegenüber dem Browser:
- **Live-Tracking für 7 Spiele:** F1 25, Assetto Corsa, Assetto Corsa Competizione, Le Mans Ultimate, Project CARS 2, Forza Horizon 5 und 6. Jede gefahrene Runde wird automatisch gespeichert.
- **Overlay im Spiel im TV-Stil:** laufende Runde, Live-Delta zur Bestzeit, Sektoren in Lila/Grün/Gelb, Position im Rennen. Mit einem Schalter in der Seitenleiste an und aus.
- **Sektorzeiten, Rennen automatisch, Session-Rückblick.**
- **Auf Deutsch:** Die ganze App ist übersetzt. Umschalten unten in der Seitenleiste: **Deutsch / English**.
- **Setups vergleichen:** Mit welchem Setup warst du schneller, in welchem Sektor, und was hast du geändert? Alle Setup-Optionen, bei AC und ACC direkt aus deinen gespeicherten Setups.
- **F1 25 Karriere-WM automatisch:** Training, Qualifying, Sprint und Rennen aller Fahrer, WM-Stand für Fahrer und Teams mit den Punkten aus dem Spiel.
- **Aufgeräumtes Layout mit Seitenleiste**, ausgelegt für große und Ultra-Wide-Monitore.
- **Updates per Drag & Drop:** Update-Datei ins Fenster ziehen, fertig.
- **Automatische Sicherung** in `Dokumente\Lapbook`.

Die App liest nur die offiziellen Schnittstellen, die die Spiele selbst anbieten. Sie greift nicht ins Spiel ein.

---

## 0. Update auf 2.5.0

Du hast Lapbook 1.1.0 oder neuer schon installiert? Dann brauchst du nur die Datei **`Lapbook-Update-2.5.0.lapbook-update`**:
1. Starte Lapbook.
2. Ziehe die Datei ins Lapbook-Fenster.
3. Klicke auf **„Installieren und neu starten“**. Fertig, deine Runden bleiben erhalten.

---

## So ist die App aufgebaut

Links steht die **Seitenleiste**. Von dort erreichst du alles mit einem Klick:

| Bereich | Was du dort findest |
|---|---|
| **Übersicht** | Startseite: Live-Status, deine zuletzt gefahrenen Strecken, deine Spiele, Kennzahlen (Runden, Strecken, Autos, Fahrerwertung) und die letzten Runden |
| **Live-Tracking** | oben eine Leiste mit allen Spielen und ihrem Status (live, Spiel gefunden, wartet, 1 Schritt offen, aus). Klick auf ein Spiel zeigt seine Einrichtung Schritt für Schritt. Daneben die Tabelle **„Was Lapbook liest“** und darunter alle **Session-Rückblicke** |
| **Setups** | alle deine Setups an einem Ort: links nach Auto sortiert, rechts das gewählte Setup mit **allen Optionen**, aufgeteilt in Reiter wie im Setup-Menü des Spiels (siehe 2l) |
| **Overlay** | der **Schalter** rechts daneben macht das Overlay sofort an oder aus. Ein Klick auf „Overlay“ öffnet die Einstellungen mit **Vorschau** |
| **Spiele** | deine Spiele mit Rundenzahl. Darunter liegen Strecken, Autos, Rennen und Meisterschaften. Weitere Spiele klappst du mit „… more games“ auf. |
| **Analyse** | **Fortschritt** (Verbesserung über die Zeit), **Duell** (Auto gegen Auto), **Strategie** (Boxenstopp-Rechner) |
| **Karriere** | **Fahrer & Rennen** (Fahrerwertung, Rennen), **Erfolge** (Meilensteine und Rang, siehe 2g) |
| **Daten & Sicherung** | Sicherung herunterladen, Sicherung laden, Backup-Ordner öffnen, als Text kopieren, Rückgängig |
| **Update** | Update-Datei installieren oder zur vorherigen Version zurück |

Unten in der Seitenleiste stehen die Versionsnummer und „Auf diesem PC gespeichert“. Ist das Fenster schmal, zeigt die Seitenleiste nur noch Symbole. Fährst du mit der Maus darüber, siehst du den Namen.

Auf jeder Strecke findest du: Rekord, „Runde eintragen“, Sektoren, Rangliste, Vergleich zweier Autos, Fortschrittskurve und den Verlauf aller Runden. Auf breiten Bildschirmen ist das in zwei Spalten aufgeteilt.

---

## Was kann welches Spiel?

Für ACC, Le Mans Ultimate und Project CARS 2 gilt: Runden, Auto, Strecke, Sektoren, Live-Delta und Position werden automatisch gelesen (Details in 2h bis 2j). Die Tabelle zeigt die drei ersten Spiele ausführlich. Eine Kurzfassung für alle Spiele steht in der App unter **Live tracking → „Was Lapbook liest“**.

| | F1 25 | Assetto Corsa | Forza Horizon 5 / 6 |
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

## 1. Installieren (neu, z. B. auf einem anderen PC)

1. Lade die aktuelle Version von GitHub: Repo → Reiter **Actions** → Workflow **„Lapbook Windows build“** → neuester grüner Lauf → unten unter **Artifacts** auf **„Lapbook-Windows“** klicken.
2. Entpacke die ZIP. Darin liegen der Installer **`Lapbook-Setup-…exe`** und eine portable Version **`Lapbook-…-portable.zip`**. Du brauchst nur eins davon.
3. Starte den Installer bzw. entpacke die portable Version und starte **`Lapbook.exe`**.
4. Zeigt Windows **„Der Computer wurde durch Windows geschützt“**: Klicke auf **„Weitere Informationen“** und dann auf **„Trotzdem ausführen“**. Die Meldung kommt nur, weil die App nicht kostenpflichtig signiert ist.
5. Fragt die **Windows-Firewall** nach, klicke auf **„Zulassen“**.

Deine Runden liegen nicht im App-Ordner, sondern in deinem Windows-Profil. Eine Neuinstallation oder ein neuer Ordner löscht also nichts.

---

## 2. Live-Tracking einrichten (einmalig, ca. 2 Minuten)

Klicke in der Seitenleiste auf **„Live-Tracking“**. Dort hat jedes Spiel eine eigene Karte mit drei Schritten, die sich von selbst abhaken. Für F1 25:

1. ✓ **Lapbook is ready on port 20777.** Das passiert automatisch.
2. **In F1 25 einstellen:** Einstellungen → Telemetrie-Einstellungen (Settings → Telemetry Settings). Nimm die Werte genau so, wie Lapbook sie anzeigt:

   | Einstellung | Wert |
   |---|---|
   | UDP Telemetry | **An** |
   | UDP Broadcast Mode | **Aus** |
   | UDP IP Address | **127.0.0.1** |
   | UDP Port | **20777** (oder die Zahl, die Lapbook anzeigt) |
   | UDP Send Rate | **20Hz** |
   | UDP Format | **2025** |

3. **Eine Runde fahren.** Sie erscheint von selbst in Lapbook.

Danach:
- Während du fährst, zeigt die Live-Karte in der Übersicht **„● Live · F1 25“** mit Strecke, Auto, Session und deiner letzten Rundenzeit. Mit **„Monza öffnen“** (bzw. der aktuellen Strecke) springst du direkt zur Strecke.
- In der Seitenleiste zeigt ein **grüner Punkt** neben „Live-Tracking“, dass Daten ankommen.
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

**Echte Namen für Autos und Strecken:** Lapbook sucht deinen Assetto-Corsa-Ordner von selbst, z. B. `C:\Program Files (x86)\Steam\steamapps\common\assettocorsa`, und liest dort die Namen, also „Ferrari 488 GT3“ statt `ks_ferrari_488_gt3`. Findet es den Ordner nicht, klicke in der Live-Karte oder in den Einstellungen auf **„Ordner wählen“** und wähle den Ordner `assettocorsa`.

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

## 2d. Overlay im Spiel

Ein Zeitenpanel über dem Spiel. Sechs Stile stehen zur Wahl, unten das Beispiel **Clean**:

**Clean** (Standard):
```
MONZA  McLaren MCL40                    P4/20
0:42.200                              −0.234      ← laufende Runde · Live-Delta (grün/rot)
▬▬▬▬▬▬▬▬     ▬▬▬▬▬▬▬▬     ▬▬▬▬▬▬▬▬               ← Sektoren als Farbbalken
27.350       –            –
Best 1:21.000                   Last 1:21.150 +0.150
```
| Stil | So sieht er aus |
|---|---|
| **Clean** (Standard) | ruhiges dunkles Panel, Zeit und Delta am größten |
| **Broadcast** | wie eine TV-Grafik: farbiges Band in der Teamfarbe mit Position, Delta als grünes oder rotes Feld |
| **Glass** | hell und durchscheinend, stark abgerundet |
| **Minimal** | kein Panel, nur schwebende Zahlen mit Schatten |
| **Strip** | eine schmale Zeile mit allem nebeneinander, gut für den oberen oder unteren Bildschirmrand |
| **Compact** | nur laufende Runde und Delta |

- **Live-Delta:** grün = schneller als deine Bestzeit an dieser Stelle der Runde, rot = langsamer. Verglichen wird mit deiner schnellsten gültigen Runde mit diesem Auto auf dieser Strecke, auch aus früheren Sessions. Das Delta erscheint ab der **zweiten** Runde, die du mit Lapbook fährst.
- **Sektorfarben** wie im TV: **Lila** = deine beste Zeit überhaupt, **Grün** = beste dieser Session, **Weiß/Gelb** = langsamer.
  - F1 25: echte Sektoren
  - Assetto Corsa: drei gleich lange Drittel der Runde (AC sendet seine Sektoren nicht)
  - Forza: keine Sektoren, aber Live-Delta bei Zeitfahren
- **Position** (P4/20) in F1-25- und Forza-Rennen.
- Der farbige Strich am linken Rand ist die **Teamfarbe** deines Autos.

**An und aus:** In der Seitenleiste steht neben „Overlay“ ein **Schalter**. Ein Klick darauf macht das Overlay sofort an oder aus, ohne Menü. Den gleichen Schalter gibt es auf der Startseite in der Live-Karte und oben auf der Seite „Live-Tracking“. Im Spiel geht es weiter mit **Strg+Umschalt+O**.

**Vorschau:** Oben in den Overlay-Einstellungen siehst du das Overlay mit Beispieldaten. Jede Änderung (Stil, Anzeige, Farbe, Größe, Hintergrund) siehst du dort sofort.

### Einstellen
Klicke in der Seitenleiste auf **„Overlay“**. Links siehst du eine große **Vorschau** über einer Rennszene und die Position, rechts alle Einstellungen:
- **Ein/Aus-Schalter** oben rechts (oder **Strg+Umschalt+O**, auch im Spiel)
- **Style:** sechs Karten mit einer kleinen Live-Vorschau des jeweiligen Stils
- **What it shows:** Schalter für Strecke und Auto, Rennposition, Delta, Sektoren, Best und Last. Das Fenster passt seine Größe automatisch an.
- **Delta:** als Zahl oder als Zahl mit Balken (Mitte = gleich schnell, grün nach links = schneller, rot nach rechts = langsamer, voller Ausschlag = 1 Sekunde)
- **Corners:** abgerundet oder eckig
- **Accent colour:** Teamfarbe, Rot, Weiß, Blau, Grün, Gelb, Lila oder keine
- **Size:** S, M, L, XL
- **Font:** Sport (Standard), Clean oder Mono
- **Background:** See-through, Normal, Solid
- **Position on screen:** Klicke auf dem kleinen Bildschirm auf eine der 9 Stellen, z. B. unten Mitte. Mit den **Pfeilen** daneben verschiebst du es in 20-px-Schritten. Bei mehreren Monitoren wählst du den **Bildschirm**.

### Im Spiel verschieben
1. Drücke **Strg+Umschalt+L**. Das Overlay bekommt einen **roten Rahmen**.
2. Zieh es mit der Maus an die gewünschte Stelle oder drücke **Strg+Umschalt+Pfeiltasten**.
3. Drücke wieder **Strg+Umschalt+L**. Jetzt ist es fest, und Klicks gehen wieder ans Spiel.

Die Pfeiltasten-Kürzel gibt es nur, solange das Overlay entsperrt ist, damit das Spiel sie sonst normal bekommt. Lapbook merkt sich die Position.

**Wichtig:** Das Overlay ist nur sichtbar, wenn das Spiel im Anzeigemodus **„Randlos“** bzw. **„Vollbild (Fenster)“** läuft:
- **F1 25:** Einstellungen → Grafik → Anzeigemodus → **Randloses Fenster** (Borderless)
- **Assetto Corsa / Content Manager:** Einstellungen → Assetto Corsa → Video → Display mode: **Fullscreen** ausschalten und **Borderless** bzw. „Windowed“ mit Bildschirmauflösung wählen

Das Overlay ist ein normales Fenster, das über dem Spiel liegt. Es greift nicht ins Spiel ein.

---

## 2f. Sektoren, Rennen und Session-Rückblick

**Sektoren auf der Streckenseite:** Über der Rangliste steht der Block **„Sektoren“** (bei AC „Abschnitte“). Er zeigt die Sektoren deiner Bestzeit, deine besten Sektoren und die **theoretische Bestzeit**. Das ist die Zeit, die du mit allen besten Sektoren zusammen fahren würdest.

**Rennen automatisch (F1 25):** Wenn ein F1-25-Rennen zu Ende ist, speichert Lapbook es im Reiter **„Rennen“** mit Startplatz, Endplatz, Gegnerzahl, Runden und Boxenstopps. Deine **Fahrerwertung** wird automatisch berechnet. Die Gegnerstärke steht auf „Gleich stark“, das kannst du beim Rennen über „Bearbeiten“ ändern.

**Session-Rückblick:** Hast du 45 Sekunden lang nicht mehr gefahren oder wechselst du Strecke oder Auto, zeigt Lapbook eine Zusammenfassung:
- Bestzeit (mit „neue persönliche Bestzeit“, falls es eine ist) und Vergleich mit der Bestzeit davor
- Durchschnitt und **Konstanz**, also die Streuung deiner Runden (Ausrutscher über 107 % werden ignoriert)
- alle Runden als Balken, die beste in Lila, ungültige in Rot
- beste Sektoren und theoretische Bestzeit

Alle Rückblicke findest du auf der Seite **„Live-Tracking“** unten unter **„Session-Rückblicke“**.

---

## 2g. Erfolge und Fahrerwertung

**Erfolge** sind **13 Meilensteine**, die mit deinem Fahren zu tun haben. Jeder hat vier Stufen: **Bronze, Silber, Gold, Platin**.

| Bereich | Meilenstein | Was zählt |
|---|---|---|
| Pace | Personal bests | wie oft du deine eigene Bestzeit auf einer Strecke verbessert hast |
| Pace | Found time | Strecken, auf denen du mindestens 1 % schneller bist als bei deiner ersten Runde |
| Pace | Perfect lap | Strecken, auf denen deine Bestzeit höchstens 0,1 s über deiner theoretischen Bestzeit liegt |
| Consistency | Metronome | Sessions mit 5+ Runden, deren Zeiten weniger als 0,4 % streuen |
| Racing | Wins / Podiums | Siege und Top-3-Plätze |
| Racing | Overtaker | gutgemachte Plätze vom Start aus, über alle Rennen |
| Dedication | Laps / Driving days / On a roll | Runden, Tage mit Runden, längste Serie an Tagen hintereinander |
| Explorer | Circuits / Garage / Multi-sim | verschiedene Strecken, Autos und Spiele |

- Aus allen erreichten Stufen ergibt sich dein **Rang**: Rookie → Club racer → Semi-pro → Pro → Elite → Legend.
- **„Als Nächstes“** zeigt die drei Meilensteine, die du als Nächstes am ehesten schaffst.
- Alles wird aus deinen gespeicherten Runden und Rennen berechnet, also auch aus älteren.

**Fahrerwertung (Fahrer & Rennen):** Sie funktioniert wie eine Elo-Wertung. Jedes Rennen vergleicht dein Ergebnis mit dem Feld. Siege, Podien und gutgemachte Plätze bringen Punkte, ein Ausfall kostet Punkte. F1-25-Rennen werden automatisch eingetragen, andere Rennen trägst du im Spiel unter „Rennen“ selbst ein.

---

## 2e. Forza Horizon 5 und 6

Beide Teile funktionieren gleich. Lapbook erkennt am laufenden Programm, ob FH5 oder FH6 läuft, und speichert die Runden beim richtigen Spiel.

**In Forza einstellen (einmalig):** Einstellungen → **HUD und Gameplay** → ganz nach unten zu **Data Out**:

| Einstellung | Wert |
|---|---|
| Data Out | **An** |
| Data Out IP Address | **127.0.0.1** |
| Data Out IP Port | **5300** (oder die Zahl, die Lapbook anzeigt) |

**Microsoft Store / Game Pass:** Bei dieser Version blockiert Windows anfangs die Daten an Lapbook. Klicke auf der Seite **„Live-Tracking“** in der Forza-Karte einmal auf **„Forza erlauben“**. Windows fragt nach Administratorrechten, klicke auf **„Ja“** und starte Forza neu. Die **Steam-Version** braucht das nicht.

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
- **Normale Rennen werden nicht gespeichert.** Wenn du das doch willst: **Live-Tracking → Einstellungen → Forza Horizon → Normale Rennen → „Jede Runde jedes Rennens speichern“**.
- Pausierst du während eines Zeitfahrens, zählt die Fahrt nicht.
- Kürzer als 2 Sekunden oder 50 Meter wird nicht gespeichert.
- Statt Strg+Umschalt+T kannst du in der Live-Karte auch auf **„Hier starten“** klicken, wenn Lapbook sichtbar ist.
- Speed Traps, Speed Zones, Danger Signs und Drift Zones messen Geschwindigkeit, Weite oder Punkte, aber keine Zeit. Diese Werte sendet Forza nicht, deshalb kann Lapbook sie nicht übernehmen.
- Autos benennst du einmal: Lapbook fragt **„Which car is this?“**.
- Namen ändern oder ein Zeitfahren löschen (Namen leeren): **Live-Tracking → Einstellungen → Forza Horizon**.

---

## 2h. Assetto Corsa Competizione

ACC hat eine offizielle **Broadcasting-Schnittstelle** (die nutzen TV-Overlays und Rennleitungen). Lapbook meldet sich dort als Zuschauer an, nur lesend.

1. In Lapbook auf **Live-Tracking → ACC** klicken.
2. Steht dort „1 Schritt offen“: auf **„Einschalten“** klicken. Lapbook trägt Port 9000 in `Dokumente\Assetto Corsa Competizione\Config\broadcasting.json` ein. Die alte Datei bleibt als `broadcasting.json.lapbook-backup` erhalten. Gibt es die Datei noch nicht, starte ACC einmal und schließe es wieder.
3. **ACC neu starten** (die Datei wird nur beim Start gelesen) und auf die Strecke fahren. Die Kachel zeigt dann „live“.

Gelesen werden: Rundenzeit, **echte Sektoren**, ungültige Runden, Auto (z. B. Ferrari 296 GT3), Strecke, Session-Art und Position. Lapbook nimmt das Auto, auf das die Kamera zeigt. Beim Fahren ist das immer dein Auto, in Wiederholungen speichert Lapbook nichts.

## 2i. Le Mans Ultimate

**Nichts einzustellen.** LMU hat eine eingebaute lokale Schnittstelle (über sie laufen auch die Menüs des Spiels, Port 6397). Lapbook fragt sie mehrmals pro Sekunde ab, nur lesend.

1. LMU starten und auf die Strecke fahren.
2. Die Kachel **LMU** zeigt „live“. Jede fertige Runde wird gespeichert.

Gelesen werden: Rundenzeit, Sektoren, Auto, Klasse (z. B. Hypercar), Strecke, Session-Art und Position. **Ungültige Runden:** Ob LMU sie über diese Schnittstelle meldet, konnte ich nicht sicher prüfen. Runden ohne Zeit werden nicht gespeichert.

## 2j. Project CARS 2

**Im Spiel einstellen (einmalig):** Options → **System**:

| Einstellung | Wert |
|---|---|
| UDP Frequency | **1** (am schnellsten) bis 4. 0 bedeutet aus |
| UDP Protocol Version | **Project CARS 2** |

Project CARS 2 sendet seine Daten ins ganze Heimnetz. Fragt die Windows-Firewall beim ersten Start nach Lapbook, erlaube den Zugriff für **private Netzwerke**. Lapbook teilt sich den Port 5606 mit Programmen wie SimHub oder CrewChief.

Gelesen werden: Rundenzeit, Sektoren, ungültige Runden, Auto, Strecke mit Variante (z. B. „Brands Hatch Indy“), Session-Art und Position.

---

## 2k. F1 25 Karriere-WM

In der **Karriere** (Driver Career und My Team) baut Lapbook die ganze Saison selbst auf. Andere Modi (Grand Prix, Zeitfahren, Online) landen wie bisher nur im Rennprotokoll.

**Was übernommen wird:**
- Jede Session des Wochenendes: **Training, Qualifying (Q1, Q2, Q3), Sprint Shootout, Sprint und Rennen**, mit der Ergebnisliste **aller Fahrer** (Position, beste Runde, Startplatz, Punkte, DNF).
- Der **WM-Stand für Fahrer und Teams**, mit den Punkten, die das Spiel vergibt. Der Sprint zählt also richtig.
- Deine Rennen und Sprints kommen ins Rennprotokoll und in die **Fahrerwertung**, gegen die echten Gegner des Rennens.

**So sieht es aus:**
- **Übersicht:** rechts die Karte **„F1 25 Karriere“** mit deiner WM-Position, deinen Punkten und dem Abstand zum Führenden.
- **F1 25 → Meisterschaften → deine Saison:**
  - **Wertung:** die Tabelle der Fahrer und Teams.
  - **Kalender:** jede Runde. Jede Session lässt sich aufklappen und zeigt die ganze Ergebnisliste. Ein Sprint ist eine eigene Runde vor seinem Grand Prix.

**Eine Saison läuft schon?** F1 25 schickt keine fertige WM-Tabelle, nur die Ergebnisse der Sessions, die du mit Lapbook fährst. Bei der ersten Session einer neuen Saison fragt Lapbook deshalb nach:
- **„Ja, bei null anfangen“:** Die Saison beginnt gerade.
- **„Nein, die Saison läuft schon“:** Trag einmal die aktuellen Punkte aus dem Spiel ein (Karriere → Wertung), dazu die Zahl der schon gefahrenen Rennen. Danach zählt Lapbook automatisch weiter.

Ändern kannst du das später mit **„Startstand bearbeiten“** auf der Seite der Saison.

**Gut zu wissen:**
- Eine **Session musst du zu Ende fahren** (oder vorspulen lassen), damit das Spiel das Ergebnis schickt.
- Fehlt beim Training einmal das Endergebnis, nimmt Lapbook die letzte Reihenfolge auf der Strecke.
- Fährst du ein Rennen ohne Lapbook, fehlt es in der Tabelle. Dann gleichst du den Stand mit „Startstand bearbeiten“ wieder an.

---

## 2l. Setups vergleichen

Du musst nichts einstellen, einfach fahren. Lapbook merkt sich bei jeder Runde das **Setup**. Fährst du das gleiche Auto auf der gleichen Strecke ein anderes Mal mit einem anderen Setup, zeigt Lapbook, **wie viel schneller oder langsamer** du warst und **was du geändert hast**.

**Beispiel:**
1. Montag fährst du den Porsche in Monza mit dem Setup `high_df`, das du im Spiel gespeichert hast.
2. Mittwoch speicherst du ein geändertes Setup `low_df` und fährst wieder.
3. Lapbook zeigt: **„Mit low_df warst du 0.650 s schneller als mit high_df.“** Darunter steht, was geändert wurde, z. B. „Flügel 2 9 → 3“ oder „Druck alle 4 26 → 27“.

**Woher das Setup kommt:**

| Spiel | So geht's |
|---|---|
| **Assetto Corsa** | automatisch aus deinen gespeicherten Setups (`Dokumente\Assetto Corsa\setups\<Auto>\<Strecke>`, auch `generic`) |
| **ACC** | automatisch aus `Dokumente\Assetto Corsa Competizione\Setups` |
| **F1 25** | ganz automatisch, das Spiel schickt sein Setup mit |
| **LMU, Project CARS 2, Forza** | Diese Spiele melden ihr Setup nicht. Klick in der Live-Karte einmal auf **„Setup benennen“** und gib einen Namen ein, z. B. „wenig Abtrieb“. |

**Wichtig bei AC und ACC:** Das Spiel meldet nicht, welches Setup gerade geladen ist.
- Lapbook nimmt deshalb das Setup, das du **zuletzt gespeichert** hast.
- Speicherst du ein Setup neu, auch während der Session, zählen die Runden ab dann dafür.
- Gleiche Werte ergeben dasselbe Setup, auch wenn die Datei anders heißt.
- Lädst du ein älteres Setup, ohne es zu speichern, liegt Lapbook falsch. Dann klickst du in der Live-Karte auf **„Falsch?“** und wählst das richtige. Noch einfacher: Setup vor dem Fahren kurz speichern.

**Wo du den Vergleich siehst:**
- **Live-Karte:** Bestzeit mit diesem Setup und der Abstand zum vorherigen Setup, z. B. „−0.650 s ggü. high_df“.
- **Session-Rückblick:** Setup der Session und der Abstand zum Setup davor.
- **Seite „Setups“** (Seitenleiste): eine Karte pro Auto und Strecke. Oben steht das Ergebnis „dieses Mal gegen letztes Mal“, darunter alle Setups nach Bestzeit sortiert. Ein Klick auf ein Setup zeigt, was im Vergleich zum schnellsten anders war, die Sektoren und den Knopf **„Alle Werte“**.
- **Seite der Strecke:** derselbe Vergleich im Abschnitt „Setups“.

**Alle Werte:** Lapbook übernimmt jeden Wert aus der Setup-Datei, auch von Mod-Autos. Unter „Alle Werte“ stehen sie nach Bereichen wie im Spiel, und dort kannst du sie auch ändern. **„+ Setup eintragen“** oben auf der Seite legt ein Setup komplett von Hand an. Das brauchst du normalerweise nicht.

Lapbook liest die Setup-Ordner der Spiele nur. Es ändert oder speichert dort nie etwas.

---

## 3. Einstellungen

Klicke auf der Seite **„Live-Tracking“** oben rechts auf **„Einstellungen“**. Dort kannst du:
- den **Port** ändern,
- **ungültige Runden** mitspeichern,
- einstellen, ob F1 25 auf **einem anderen Gerät** läuft (PlayStation, Xbox oder ein zweiter PC). Dann trägst du im Spiel statt 127.0.0.1 die IP-Adresse deines PCs ein.
- den **Backup-Ordner** öffnen,
- F1-25-**Autonamen** vergeben oder ändern,
- Assetto Corsa **ein- oder ausschalten** und den **AC-Ordner** wählen,
- Forza-Einstellungen, Zeitfahren und Autos umbenennen.

Das **Overlay** stellst du in der Seitenleiste unter **„Overlay“** ein (siehe 2d).

---

## 4. Updates installieren

Von mir bekommst du Dateien wie **`Lapbook-Update-2.5.0.lapbook-update`**.

1. Starte Lapbook.
2. **Ziehe die Datei einfach ins Lapbook-Fenster.** Alternativ klickst du in der Seitenleiste unten auf **„Update“** und dann auf **„Datei wählen“**.
3. Lapbook zeigt die Version und was neu ist. Klicke auf **„Installieren und neu starten“**.
4. Lapbook startet neu, fertig. **Deine Runden bleiben erhalten.**

Sicherheit:
- Lapbook prüft jede Datei mit Prüfsummen. Beschädigte oder fremde Dateien werden abgelehnt.
- **Zurück zur vorherigen Version:** in der Seitenleiste auf **„Update“** klicken, dann **„Zurück zu Version …“** (zum Bestätigen zweimal klicken).
- Startet ein Update nicht richtig, geht Lapbook von selbst zur eingebauten Version zurück und sagt dir Bescheid.
- Installiere nur Update-Dateien, die du von mir bekommen hast.

---

## 5. Bisherige Daten übernehmen

Wenn du Lapbook schon im Browser bzw. auf claude.ai benutzt hast:
1. Öffne dort Lapbook → **Data → Download**. Du bekommst eine Datei `lapbook-JJJJ-MM-TT.json`.
2. Öffne in der Windows-App in der Seitenleiste **Daten & Sicherung → Sicherung laden** und wähle diese Datei.

**Achtung:** Upload **ersetzt** die Daten in der App. Mach das also direkt am Anfang, bevor du die ersten Runden live aufzeichnest.

---

## 6. Sicherung

- Lapbook speichert automatisch nach **`Dokumente\Lapbook`**: `lapbook-autosave.json` und eine Kopie pro Tag (die letzten 14 Tage).
- Wiederherstellen: **Daten & Sicherung → Sicherung laden** und eine dieser Dateien wählen.
- Neuer PC oder Windows neu installiert? Kopiere vorher den Ordner `Dokumente\Lapbook` weg, oder nutze OneDrive.

---

## 7. Probleme?

| Problem | Lösung |
|---|---|
| Karte bleibt bei Schritt 2 | Prüfe die Werte im Spiel: Telemetry **An**, IP **127.0.0.1**, **derselbe Port**, den Lapbook anzeigt. |
| „Live-Tracking braucht Aufmerksamkeit“ | Die Karte nennt den Grund. Meistens hilft „Einstellungen“ → anderen Port wählen, z. B. 20790, und denselben im Spiel eintragen. |
| Eine Runde fehlt | Sie war wahrscheinlich ungültig. In den Einstellungen auf „Auch speichern“ stellen. |
| Windows blockiert den Start | „Weitere Informationen“ → „Trotzdem ausführen“. |
| Assetto Corsa: „Live“ erscheint nicht | Du musst auf der Strecke sein, im Menü sendet AC nichts. Prüfe in den Einstellungen, ob Assetto Corsa auf „An“ steht. |
| AC zeigt Ordnernamen wie „Ks Ferrari 488 GT3“ | „Ordner wählen“ und den `assettocorsa`-Ordner wählen. |
| Overlay nicht zu sehen | Spiel auf „Randlos“ / „Borderless“ stellen. Mit Strg+Umschalt+O prüfen, ob es an ist. In Lapbook unter „Overlay“ eine Ecke im Raster anklicken. |
| Klicks im Spiel landen im Overlay | Strg+Umschalt+L drücken, um es wieder festzustellen. |
| Forza: Zeitfahren startet nicht | Durch den Startpunkt in **derselben Richtung** fahren wie beim Anlegen (ca. 20 m Toleranz). Beim Drag-Run vorher am Start **stehen bleiben**. |
| Forza: nichts kommt an | Data Out **An**, IP **127.0.0.1**, Port wie in Lapbook. Bei Game Pass: „Forza erlauben“ klicken und Forza neu starten. |
| Forza: „packets of … bytes“ | Diese Forza-Version sendet ein anderes Format. Sag mir die Zahl, dann passe ich es an. |
| ACC: Kachel bleibt bei „wartet auf das Spiel“ | Hast du ACC nach „Einschalten“ neu gestartet? Du musst auf der Strecke sein. Steht ein Fehler wie „Wrong password“ da, stimmt das Passwort in broadcasting.json nicht mehr: noch einmal „Einschalten“ klicken. |
| LMU: nichts kommt an | LMU muss laufen und du musst auf der Strecke sein. Andere Tools (z. B. TinyPedal) stören nicht. |
| Project CARS 2: nichts kommt an | UDP Frequency nicht auf 0, Protocol Version „Project CARS 2“. Firewall-Abfrage erlauben. |
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
