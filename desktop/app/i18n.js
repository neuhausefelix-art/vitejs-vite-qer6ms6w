/* Lapbook in German. The app is written in English; this file translates
   every text the moment it appears on screen (pages, dialogs, messages,
   placeholders and tooltips). Your own data (circuits, cars, setup names)
   is never touched: only texts from the dictionary below are replaced.
   Numbers are placeholders, so "12 laps" uses the entry "{0} laps".
   Switch: Lapbook → sidebar → DE / EN (stored as lapbook.lang). */
(function () {
  "use strict";
  let lang = "de";
  try { lang = localStorage.getItem("lapbook.lang") || "de"; } catch (e) {}
  window.LAPBOOK_LANG = lang;

  const DE = {
    // ---- navigation and frame ----
    "Overview": "Übersicht", "Live tracking": "Live-Tracking", "Overlay": "Overlay", "Setups": "Setups", "Games": "Spiele", "Analyse": "Analyse",
    "Progress": "Fortschritt", "Duel": "Duell", "Strategy": "Strategie", "Career": "Karriere", "Driver & races": "Fahrer & Rennen", "Achievements": "Erfolge",
    "Data & backup": "Daten & Sicherung", "Update": "Update", "Saved on this PC": "Auf diesem PC gespeichert", "Local only": "Nur lokal",
    "Lapbook {0} · Saved on this PC": "Lapbook {0} · Auf diesem PC gespeichert", "{0} more games": "{0} weitere Spiele", "Fewer games": "Weniger Spiele",
    "Show fewer": "Weniger zeigen", "{0} more": "{0} weitere", "Close": "Schließen", "Cancel": "Abbrechen", "Save": "Speichern", "Delete": "Löschen", "Edit": "Bearbeiten",
    "Add": "Hinzufügen", "Later": "Später", "Settings": "Einstellungen", "Details": "Details", "Undo": "Rückgängig", "Data ▾": "Daten ▾", "Upload": "Hochladen", "Download": "Herunterladen", "Text": "Text",
    "yes": "ja", "no": "nein", "partly": "teilweise", "or": "oder", "On": "An", "Off": "Aus", "on": "an", "off": "aus", "auto": "auto", "None": "Keine",
    // ---- overview ----
    "Your circuits": "Deine Strecken", "most recently driven": "zuletzt gefahren", "Recent laps": "Letzte Runden", "Progress ›": "Fortschritt ›", "laps": "Runden", "circuits": "Strecken", "cars": "Autos", "rating ›": "Wertung ›",
    "No laps yet": "Noch keine Runden", "{0} lap": "{0} Runde", "{0} laps": "{0} Runden", "{0} lap · {1} circuit": "{0} Runde · {1} Strecke", "{0} laps · {1} circuit": "{0} Runden · {1} Strecke", "{0} laps · {1} circuits": "{0} Runden · {1} Strecken",
    "No laps yet. Start a game with live tracking, or open a game and add a lap.": "Noch keine Runden. Starte ein Spiel mit Live-Tracking oder öffne ein Spiel und trag eine Runde ein.",
    "today": "heute", "record · today": "Rekord · heute", "record · {0}": "Rekord · {0}", "log your next lap": "nächste Runde eintragen", "+ Lap": "+ Runde", "Lap": "Runde",
    "· {0} of {1} achievement tiers ›": "· {0} von {1} Erfolgsstufen ›",
    "Live tracking is ready": "Live-Tracking ist bereit", "Live tracking needs attention": "Live-Tracking braucht Aufmerksamkeit", "Set up (2 min)": "Einrichten (2 Min.)",
    "Start a game and drive. Every finished lap is saved by itself.": "Starte ein Spiel und fahr los. Jede fertige Runde wird von selbst gespeichert.",
    "Lapbook can save your laps by itself while you drive. Set it up once per game.": "Lapbook speichert deine Runden beim Fahren von selbst. Einmal pro Spiel einrichten.",
    "In-game overlay ·": "Overlay im Spiel ·", "In-game overlay": "Overlay im Spiel", "· Ctrl+Shift+O": "· Strg+Umschalt+O", "Customise": "Anpassen", "Last session:": "Letzte Session:", "View recap": "Rückblick ansehen",
    "Finish a lap and it appears here.": "Fahr eine Runde zu Ende, dann erscheint sie hier.", "last lap · {0} saved": "letzte Runde · {0} gespeichert", "last lap · {0} saved, {1} invalid skipped": "letzte Runde · {0} gespeichert, {1} ungültige übersprungen",
    "Waiting for track": "Warte auf Strecke", "Drive a lap, it is saved by itself": "Fahr eine Runde, sie wird von selbst gespeichert", "Driving": "Fahren",
    // ---- live tracking page ----
    "Laps are saved by themselves while you drive. Pick a game to set it up.": "Runden werden beim Fahren von selbst gespeichert. Wähle ein Spiel, um es einzurichten.",
    "Customise overlay": "Overlay anpassen", "live": "live", "game found": "Spiel gefunden", "waiting for the game": "wartet auf das Spiel", "1 step to do": "1 Schritt offen",
    "Session recaps": "Session-Rückblicke", "a summary after every session": "eine Zusammenfassung nach jeder Session",
    "After your first session with live tracking, its recap shows up here.": "Nach deiner ersten Session mit Live-Tracking erscheint hier ihr Rückblick.",
    "What Lapbook reads": "Was Lapbook liest", "hover a dot for details": "für Details mit der Maus auf einen Punkt", "Lap times": "Rundenzeiten", "saved by themselves": "werden von selbst gespeichert",
    "Car and circuit": "Auto und Strecke", "named automatically": "automatisch benannt", "Sectors": "Sektoren", "S1, S2, S3": "S1, S2, S3", "Invalid laps": "Ungültige Runden", "track limits": "Track Limits",
    "Live delta": "Live-Delta", "in the overlay": "im Overlay", "Race position": "Rennposition", "Race results": "Rennergebnisse", "for your rating": "für deine Fahrerwertung",
    "Championship": "Meisterschaft", "career: all sessions, points": "Karriere: alle Sessions, Punkte", "Car setup": "Auto-Setup", "every option, to compare": "alle Optionen, zum Vergleichen",
    "Assetto Corsa sends no sectors, Lapbook uses thirds of the lap": "Assetto Corsa sendet keine Sektoren, Lapbook nimmt Drittel der Runde", "time trials and drag runs that you mark once": "Zeitfahren und Drag-Runs, die du einmal anlegst",
    "you name a car once, the game sends only a number": "du benennst ein Auto einmal, das Spiel sendet nur eine Nummer", "only if the game's interface reports it": "nur wenn die Schnittstelle des Spiels es meldet",
    "in time trials and drag runs": "bei Zeitfahren und Drag-Runs", "sent by the game": "vom Spiel gesendet", "from the setup files you saved": "aus deinen gespeicherten Setup-Dateien", "typed in by you": "von dir eingetragen",
    "F1 25 career (Driver Career and My Team): practice, qualifying, sprint and race of every driver, points as in the game": "F1-25-Karriere (Driver Career und My Team): Training, Qualifying, Sprint und Rennen aller Fahrer, Punkte wie im Spiel",
    "Lapbook is ready on port {0}": "Lapbook ist bereit auf Port {0}", "Turn on UDP telemetry in F1 25 with these settings, then start a session:": "Schalte in F1 25 die UDP-Telemetrie mit diesen Einstellungen ein und starte eine Session:",
    "In F1 25: Settings → Telemetry Settings. Start Lapbook first, then the game.": "In F1 25: Einstellungen → Telemetrie-Einstellungen. Starte zuerst Lapbook, dann das Spiel.",
    "Drive one full lap. It is saved by itself.": "Fahr eine volle Runde. Sie wird von selbst gespeichert.", "Drive one full lap. It is saved with car, circuit and sectors.": "Fahr eine volle Runde. Sie wird mit Auto, Strecke und Sektoren gespeichert.",
    "Lapbook is ready for Assetto Corsa": "Lapbook ist bereit für Assetto Corsa",
    "Start a session (for example through Content Manager). Nothing to set in the game: Lapbook connects once you are on track.": "Starte eine Session (zum Beispiel über Content Manager). Im Spiel ist nichts einzustellen: Lapbook verbindet sich, sobald du auf der Strecke bist.",
    "Assetto Corsa folder not found, so names are shown as folder names.": "Assetto-Corsa-Ordner nicht gefunden, deshalb werden Ordnernamen angezeigt.", "Choose folder": "Ordner wählen",
    "Car and track names come from your Assetto Corsa folder.": "Auto- und Streckennamen kommen aus deinem Assetto-Corsa-Ordner.",
    "ACC's broadcasting interface is off (start ACC once so it creates its settings). Lapbook can switch it on for you:": "Die Broadcasting-Schnittstelle von ACC ist aus (starte ACC einmal, damit es seine Einstellungen anlegt). Lapbook kann sie für dich einschalten:",
    "ACC's broadcasting interface is off. Lapbook can switch it on for you:": "Die Broadcasting-Schnittstelle von ACC ist aus. Lapbook kann sie für dich einschalten:", "Switch on": "Einschalten",
    "This writes port 9000 into Documents\\Assetto Corsa Competizione\\Config\\broadcasting.json (a copy of the old file is kept). Restart ACC afterwards.": "Dabei wird Port 9000 in Dokumente\\Assetto Corsa Competizione\\Config\\broadcasting.json eingetragen (eine Kopie der alten Datei bleibt erhalten). Starte ACC danach neu.",
    "ACC broadcasting is on (port {0}). This is ACC's official interface for TV overlays.": "ACC-Broadcasting ist an (Port {0}). Das ist die offizielle Schnittstelle von ACC für TV-Overlays.",
    "Start ACC and drive out of the pits. Lapbook connects by itself.": "Starte ACC und fahr aus der Box. Lapbook verbindet sich von selbst.",
    "Nothing to set up: Lapbook reads LMU's own local interface (the one its menus use, port {0}).": "Nichts einzurichten: Lapbook liest die eigene lokale Schnittstelle von LMU (die auch die Menüs nutzen, Port {0}).",
    "Start Le Mans Ultimate and drive onto the track.": "Starte Le Mans Ultimate und fahr auf die Strecke.",
    "In Project CARS 2: Options → System:": "In Project CARS 2: Optionen → System:", "1 (fastest) to 4": "1 (am schnellsten) bis 4",
    "Lapbook is ready for Forza on port {0}": "Lapbook ist bereit für Forza auf Port {0}", "Turn on Data Out in Forza with these settings:": "Schalte in Forza Data Out mit diesen Einstellungen ein:",
    "In Forza: Settings → HUD and Gameplay → scroll down to Data Out.": "In Forza: Einstellungen → HUD und Gameplay → ganz nach unten zu Data Out.",
    "Microsoft Store / Game Pass version? Windows blocks the data until you allow it once:": "Microsoft-Store- / Game-Pass-Version? Windows blockiert die Daten, bis du sie einmal erlaubst:", "Allow Forza": "Forza erlauben", "(Steam: not needed)": "(Steam: nicht nötig)",
    "Record a time trial: press": "Zeitfahren anlegen: drück", "at the start, drive, press it again at the finish. Standing still at the start makes it a drag run. After that every run through the same start is timed by itself.": "am Start, fahr, und drück es im Ziel noch einmal. Stehst du am Start still, wird es ein Drag-Run. Danach wird jede Fahrt durch denselben Start von selbst gestoppt.",
    "Car Dash (if offered)": "Car Dash (falls angeboten)", "Start here": "Hier starten", "Cancel recording": "Aufnahme abbrechen",
    "No time trials recorded yet.": "Noch keine Zeitfahren angelegt.", "Recording a time trial…": "Zeitfahren wird aufgenommen…", "Recording a drag run: launch when you are ready": "Drag-Run wird aufgenommen: starte, wenn du bereit bist",
    // ---- setups (live card, picker, page) ----
    "Setup ·": "Setup ·", "none": "keins", "(saved file)": "(gespeicherte Datei)", "(from the game)": "(vom Spiel)", "(typed in)": "(eingetragen)", "(comes from the game)": "(kommt vom Spiel)", "(no saved setup found)": "(kein gespeichertes Setup gefunden)",
    "Change": "Ändern", "Choose setup": "Setup wählen", "Show": "Anzeigen", "Show all its options": "Alle Optionen anzeigen", "No setup": "Kein Setup", "+ New setup": "+ Neues Setup", "New setup": "Neues Setup",
    "In Lapbook": "In Lapbook", "No setups yet.": "Noch keine Setups.", "active": "aktiv", "Use": "Verwenden", "every circuit": "jede Strecke", "saved file": "gespeicherte Datei", "from the game": "vom Spiel", "typed in": "eingetragen", "file": "Datei",
    "Drive one session first, then Lapbook knows the game folder of this car.": "Fahr zuerst eine Session, dann kennt Lapbook den Spielordner dieses Autos.",
    "No setup saved for this car on this circuit. Save one in the game's setup menu.": "Für dieses Auto auf dieser Strecke ist kein Setup gespeichert. Speichere eins im Setup-Menü des Spiels.",
    "Your setups": "Deine Setups", "All": "Alle", "Every setup with all its options. Pick one before you drive, compare them afterwards.": "Jedes Setup mit allen Optionen. Vor dem Fahren eins wählen, danach vergleichen.",
    "No setups yet. Create one with “+ New setup”, or drive: Assetto Corsa and ACC take your saved setup files, F1 25 sends its setup by itself.": "Noch keine Setups. Leg eins an mit „+ Neues Setup“, oder fahr los: Assetto Corsa und ACC nehmen deine gespeicherten Setup-Dateien, F1 25 schickt sein Setup von selbst.",
    "How it works": "So funktioniert's", "Before you drive:": "Vor dem Fahren:", "While you drive:": "Beim Fahren:", "Afterwards:": "Danach:",
    "pick the setup for your car and circuit (here, or in the live card under “Setup”).": "wähle das Setup für dein Auto und deine Strecke (hier oder in der Live-Karte unter „Setup“).",
    "every lap remembers the setup.": "jede Runde merkt sich das Setup.", "see which setup was faster, in which sector and what you changed.": "sieh, welches Setup schneller war, in welchem Sektor und was du geändert hast.",
    "Use for the next session": "Für die nächste Session verwenden", "Duplicate": "Duplizieren", "Really delete?": "Wirklich löschen?", "Circuit": "Strecke", "Setup name": "Setup-Name",
    "best lap": "Bestrunde", "average": "Schnitt", "spread": "Streuung", "no laps with this setup yet": "noch keine Runden mit diesem Setup", "vs. {0}": "vs. {0}",
    "Notes": "Notizen", "What you changed and why, for example: more rear wing for sector 2": "Was du geändert hast und warum, zum Beispiel: mehr Heckflügel für Sektor 2",
    "Extra option (mod cars)": "Zusätzliche Option (Mod-Autos)", "Value": "Wert", "Compare": "Vergleichen", "with another setup…": "mit einem anderen Setup…",
    "Pick a setup to see the times and every option that differs.": "Wähle ein Setup, um die Zeiten und jede abweichende Option zu sehen.", "Create a second setup for this car to compare.": "Leg ein zweites Setup für dieses Auto an, um zu vergleichen.",
    "Times show up once both setups have laps.": "Zeiten erscheinen, sobald beide Setups Runden haben.", "Both setups have the same options.": "Beide Setups haben dieselben Optionen.",
    "best lap": "Bestrunde", "average,": "Schnitt,", "sectors": "Sektoren", "Game": "Spiel", "Car": "Auto", "Name": "Name", "Start from": "Beginnen mit", "Create setup": "Setup anlegen",
    "empty: every option of the game": "leer: alle Optionen des Spiels", "for example Monza low downforce": "zum Beispiel Monza wenig Abtrieb", "for example Porsche 911 GT3 R": "zum Beispiel Porsche 911 GT3 R",
    "Saved setup files show up here once you drove this car on this circuit with live tracking.": "Gespeicherte Setup-Dateien erscheinen hier, sobald du dieses Auto auf dieser Strecke mit Live-Tracking gefahren bist.",
    "{0} saved setup file found for this car and circuit.": "{0} gespeicherte Setup-Datei für dieses Auto und diese Strecke gefunden.", "{0} saved setup files found for this car and circuit.": "{0} gespeicherte Setup-Dateien für dieses Auto und diese Strecke gefunden.",
    "Give laps a setup": "Runden ein Setup geben", "{0} of {1} laps have a setup": "{0} von {1} Runden haben ein Setup", "{0} setups": "{0} Setups", "{0} setup": "{0} Setup",
    "Pick a setup in the live card before you drive (AC and ACC take the newest saved file by themselves, F1 25 sends it), or give your laps a setup here. Then Lapbook shows which setup was faster.": "Wähle vor dem Fahren ein Setup in der Live-Karte (AC und ACC nehmen von selbst die neueste gespeicherte Datei, F1 25 schickt es), oder gib deinen Runden hier ein Setup. Dann zeigt Lapbook, welches Setup schneller war.",
    "gap to the fastest": "Abstand zum schnellsten", "fastest": "am schnellsten", "was": "war", "{0} s faster": "{0} s schneller", "{0} s slower": "{0} s langsamer", "{0} s as fast": "{0} s gleich schnell",
    "on the best lap and": "auf der Bestrunde und", "on average than": "im Schnitt als", "({0} vs. {1} laps).": "({0} vs. {1} Runden).", "Still few laps, drive a few more for a safe answer.": "Noch wenige Runden, fahr ein paar mehr für eine sichere Antwort.",
    "Options · {0} changed": "Optionen · {0} geändert", "Show all options": "Alle Optionen zeigen", "Only changes": "Nur Änderungen", "B − A": "B − A", "sum": "Summe",
    "Pick the setup you drove each session with. Laps from live tracking already have one.": "Wähle für jede Session das Setup, mit dem du gefahren bist. Runden aus dem Live-Tracking haben schon eins.",
    "(several, keep)": "(mehrere, behalten)", "no setup": "kein Setup", "Session setup": "Setup der Session", "setup": "Setup",
    "Show every option of {0}": "Alle Optionen zeigen", "the setup you drive with, next to the car": "das Setup, mit dem du fährst, neben dem Auto",
    // setup areas and options
    "Tyres": "Reifen", "Alignment": "Fahrwerksgeometrie", "Aero": "Aerodynamik", "Suspension": "Federung", "Dampers": "Dämpfer", "Drivetrain": "Antrieb", "Brakes": "Bremsen", "Electronics": "Elektronik", "Hybrid": "Hybrid", "Fuel & strategy": "Sprit & Strategie", "Other": "Sonstiges",
    "Compound": "Mischung", "Pressure": "Druck", "Camber": "Sturz", "Toe": "Spur", "Caster": "Nachlauf", "Steering ratio": "Lenkübersetzung", "Steering lock": "Lenkeinschlag", "Splitter": "Splitter",
    "Spring rate": "Federrate", "Ride height (rod length)": "Fahrhöhe (Stangenlänge)", "Packers": "Packer", "Bump stop rate": "Bump-Stop-Rate", "Bump stop": "Bump-Stop", "Anti-roll bar front": "Stabilisator vorne", "Anti-roll bar rear": "Stabilisator hinten",
    "Heave spring front": "Heave-Feder vorne", "Heave spring rear": "Heave-Feder hinten", "Heave spring": "Heave-Feder", "Fast bump": "Schnelle Druckstufe", "Fast rebound": "Schnelle Zugstufe", "Slow bump": "Langsame Druckstufe", "Slow rebound": "Langsame Zugstufe",
    "Diff power": "Differenzial Zug", "Diff coast": "Differenzial Schub", "Diff preload": "Differenzial-Vorspannung", "Final drive": "Achsübersetzung", "Gear set": "Getriebesatz", "Gearing": "Übersetzung",
    "Brake bias (front)": "Bremsbalance (vorne)", "Brake power": "Bremskraft", "Brake ducts": "Bremsbelüftung", "Brake pads": "Bremsbeläge", "Brake pressure": "Bremsdruck", "Front brake bias": "Bremsbalance vorne", "Brake bias": "Bremsbalance",
    "ABS": "ABS", "Traction control": "Traktionskontrolle", "Engine brake": "Motorbremse", "Engine map": "Motor-Map", "Engine braking": "Motorbremse", "TC slip": "TC-Schlupf", "TC cut": "TC-Cut",
    "Fuel": "Sprit", "Ballast": "Ballast", "Restrictor": "Restriktor", "Radiator / cooling": "Kühler / Kühlung", "Radiator": "Kühler", "Virtual energy": "Virtuelle Energie", "Regen level": "Rekuperation", "Electric motor map": "E-Motor-Map",
    "Front wing": "Frontflügel", "Rear wing": "Heckflügel", "Front wing / splitter": "Frontflügel / Splitter", "Ride height": "Fahrhöhe", "Rod length": "Stangenlänge", "Wheel rate": "Radrate", "Bump stop rate up": "Bump-Stop-Rate oben", "Bump stop rate down": "Bump-Stop-Rate unten", "Bump stop range": "Bump-Stop-Weg",
    "Bump stops / packers": "Bump-Stops / Packer", "Differential on throttle": "Differenzial unter Last", "Differential off throttle": "Differenzial ohne Last", "Front camber": "Sturz vorne", "Rear camber": "Sturz hinten", "Front toe": "Spur vorne", "Rear toe": "Spur hinten",
    "Front suspension": "Federung vorne", "Rear suspension": "Federung hinten", "Front anti-roll bar": "Stabilisator vorne", "Rear anti-roll bar": "Stabilisator hinten", "Front ride height": "Fahrhöhe vorne", "Rear ride height": "Fahrhöhe hinten",
    "Traction control (TC1)": "Traktionskontrolle (TC1)", "TC cut (TC2)": "TC-Cut (TC2)", "ECU map": "ECU-Map", "Fuel mix": "Spritmischung", "Telemetry laps": "Telemetrie-Runden", "Pit stops": "Boxenstopps", "Tyre set": "Reifensatz", "Brake pads front": "Bremsbeläge vorne", "Brake pads rear": "Bremsbeläge hinten", "Fuel per lap": "Sprit pro Runde", "Caster left": "Nachlauf links", "Caster right": "Nachlauf rechts", "Static camber": "Statischer Sturz", "Toe (linear)": "Spur (linear)",
    "Wing {0}": "Flügel {0}", "Gear {0}": "Gang {0}", "Turbo {0}": "Turbo {0}", "clicks": "Klicks", "index": "Stufe", "level": "Stufe", "map": "Map", "Front": "Vorne", "Rear": "Hinten",
    // ---- overlay settings ----
    "Shows over the game in": "Wird über dem Spiel angezeigt im Modus", "borderless": "randlos", "windowed fullscreen": "Vollbild im Fenster", "Preview · example data": "Vorschau · Beispieldaten",
    "Position on screen": "Position auf dem Bildschirm", "Pick a spot on the screen, then fine-tune with the arrows.": "Wähle eine Stelle auf dem Bildschirm und justiere mit den Pfeilen nach.", "Screen": "Bildschirm",
    "Move it while you drive": "Beim Fahren verschieben", "unlocks it, it gets a red frame": "entsperrt es, es bekommt einen roten Rahmen", "drag it with the mouse or use": "zieh es mit der Maus oder nutze", "again locks it, clicks go to the game": "sperrt es wieder, Klicks gehen ans Spiel",
    "Unlock to drag with the mouse": "Entsperren, um es mit der Maus zu ziehen", "Lock it": "Sperren", "Style": "Stil", "What it shows": "Was es zeigt", "Delta": "Delta", "Corners": "Ecken", "Accent colour": "Akzentfarbe", "Size": "Größe", "Font": "Schrift", "Background": "Hintergrund",
    "Clean": "Clean", "Calm panel, time and delta first": "Ruhiges Panel, Zeit und Delta im Vordergrund", "Broadcast": "Broadcast", "TV graphics with a team band": "TV-Grafik mit Team-Band", "Glass": "Glass", "Light, airy and rounded": "Hell, luftig und abgerundet",
    "Minimal": "Minimal", "No panel, floating numbers": "Kein Panel, schwebende Zahlen", "Strip": "Strip", "One thin row for a screen edge": "Eine schmale Zeile für den Bildschirmrand", "Compact": "Compact", "Only lap time and delta": "Nur Rundenzeit und Delta",
    "name of the circuit and your car": "Name der Strecke und deines Autos", "P4/20 in races": "P4/20 im Rennen", "live gap to your best lap": "Live-Abstand zu deiner Bestrunde", "purple, green, yellow like on TV": "Lila, Grün, Gelb wie im TV",
    "Best and last lap": "Beste und letzte Runde", "with the gap of the last lap": "mit dem Abstand der letzten Runde", "Number": "Zahl", "Number + bar": "Zahl + Balken", "Rounded": "Abgerundet", "Sharp": "Eckig",
    "Team": "Team", "Red": "Rot", "White": "Weiß", "Blue": "Blau", "Green": "Grün", "Yellow": "Gelb", "Purple": "Lila", "Sport": "Sport", "Mono": "Mono", "See-through": "Durchsichtig", "Normal": "Normal", "Solid": "Deckend",
    "Overlay on (Ctrl+Shift+O)": "Overlay an (Strg+Umschalt+O)", "Overlay off (Ctrl+Shift+O)": "Overlay aus (Strg+Umschalt+O)", "Up": "Hoch", "Down": "Runter", "Left": "Links", "Right": "Rechts", "Close dialog": "Schließen",
    // ---- live tracking settings ----
    "Live tracking settings": "Einstellungen Live-Tracking", "UDP port": "UDP-Port", "Skip them": "Überspringen", "Save them too": "Auch speichern", "Invalid laps (F1, ACC, LMU, PC2)": "Ungültige Runden (F1, ACC, LMU, PC2)",
    "F1 25 runs on": "F1 25 läuft auf", "This PC": "diesem PC", "Another device (console or second PC)": "einem anderen Gerät (Konsole oder zweiter PC)", "F1 25 car names": "F1-25-Autonamen",
    "Give a team number its own name. Laps you already drove with it are renamed too.": "Gib einer Teamnummer einen eigenen Namen. Schon gefahrene Runden werden mit umbenannt.", "Team no.": "Team-Nr.", "Name, for example Konnersport": "Name, zum Beispiel Konnersport",
    "Assetto Corsa": "Assetto Corsa", "Folder:": "Ordner:", "not found": "nicht gefunden", "Assetto Corsa Competizione, Le Mans Ultimate, Project CARS 2": "Assetto Corsa Competizione, Le Mans Ultimate, Project CARS 2", "Project CARS 2 port": "Port für Project CARS 2",
    "Data Out port": "Data-Out-Port", "Normal races": "Normale Rennen", "Do not save their laps": "Ihre Runden nicht speichern", "Save every lap of every race": "Jede Runde jedes Rennens speichern", "Find out by itself": "Selbst erkennen",
    "Position, size and style:": "Position, Größe und Stil:", "Overlay settings": "Overlay-Einstellungen", "Open backup folder": "Sicherungsordner öffnen",
    // ---- data, update ----
    "Your laps are saved on this PC. A backup is written to Documents\\Lapbook every 30 seconds (one copy per day, last 14 days).": "Deine Runden sind auf diesem PC gespeichert. Alle 30 Sekunden wird eine Sicherung nach Dokumente\\Lapbook geschrieben (eine Kopie pro Tag, die letzten 14 Tage).",
    "Download backup": "Sicherung herunterladen", "Save all your data as a file": "Alle Daten als Datei speichern", "Load a backup": "Sicherung laden", "Replaces the data in the app": "Ersetzt die Daten in der App", "Documents\\Lapbook": "Dokumente\\Lapbook",
    "Copy as text": "Als Text kopieren", "JSON or CSV": "JSON oder CSV", "App update": "App-Update", "You have Lapbook": "Du hast Lapbook", ". Your laps stay where they are.": ". Deine Runden bleiben, wo sie sind.",
    "Drag the update file here": "Zieh die Update-Datei hierher", "It ends in .lapbook-update": "Sie endet auf .lapbook-update", "Choose file": "Datei wählen", "Drop to install the update": "Loslassen, um das Update zu installieren", "Lapbook update files end in .lapbook-update": "Lapbook-Update-Dateien enden auf .lapbook-update",
    "Checking the file…": "Datei wird geprüft…", "Install and restart": "Installieren und neu starten", "Install anyway and restart": "Trotzdem installieren und neu starten", "Installing…": "Wird installiert…", "Installed. Lapbook restarts in a moment…": "Installiert. Lapbook startet gleich neu…",
    "This is the version you already have.": "Das ist die Version, die du schon hast.", "You can still install it.": "Du kannst sie trotzdem installieren.", "Going back, Lapbook restarts…": "Zurück zur alten Version, Lapbook startet neu…",
    // ---- session recap ----
    "Session recap": "Session-Rückblick", "new personal best": "neue persönliche Bestzeit", "first time": "erstes Mal", "on this circuit with this car": "auf dieser Strecke mit diesem Auto", "average lap": "Rundenschnitt", "consistency (spread)": "Konstanz (Streuung)",
    "valid / all laps": "gültige / alle Runden", "vs. best before ({0})": "vs. Bestzeit vorher ({0})", "Earlier sessions": "Frühere Sessions", "1st third": "1. Drittel", "2nd third": "2. Drittel", "3rd third": "3. Drittel",
    "Put your best sectors together and you would do": "Setzt du deine besten Sektoren zusammen, schaffst du", "Put your best thirds together and you would do": "Setzt du deine besten Drittel zusammen, schaffst du", "Lap times of the session": "Rundenzeiten der Session",
    "Lap {0}: {1}": "Runde {0}: {1}", "Lap {0}: {1} (invalid)": "Runde {0}: {1} (ungültig)",
    // ---- circuit page ----
    "Splits": "Abschnitte", "thirds of the lap": "Drittel der Runde", "best of every lap with sector times": "Bestwert aller Runden mit Sektorzeiten", "1st": "1.", "2nd": "2.", "3rd": "3.", "lap": "Runde", "best": "Bestwert",
    "Theoretical best:": "Theoretische Bestzeit:", "Where your best lap loses time": "Wo deine Bestrunde Zeit verliert", "Your best lap already has all your best sectors.": "Deine Bestrunde hat schon alle deine besten Sektoren.", "Your best lap already has all your best thirds.": "Deine Bestrunde hat schon alle deine besten Drittel.",
    "Scoreboard": "Rangliste", "Best lap per car. Edge shows how much conditions, tires and tuning helped (+) or hurt (−) a lap.": "Bestrunde pro Auto. „Vorteil“ zeigt, wie sehr Bedingungen, Reifen und Tuning einer Runde geholfen (+) oder geschadet (−) haben.",
    "Fair": "Fair", "Raw": "Roh", "Fastest –": "Schnellster –", "Ahead –": "Davor –", "Behind –": "Dahinter –", "Circuit record": "Streckenrekord", "Latest record": "Letzter Rekord", "History": "Verlauf", "Add lap": "Runde eintragen", "Save lap": "Runde speichern",
    "Lap time": "Rundenzeit", "Type 123456 or 1:23.456, Enter saves": "Tippe 123456 oder 1:23.456, Enter speichert", "Pick or type a car": "Auto wählen oder eintippen", "Pick or type a circuit": "Strecke wählen oder eintippen", "Date": "Datum",
    "Weather": "Wetter", "Track condition": "Streckenzustand", "Tires": "Reifen", "Tuning": "Tuning", "Not set": "Nicht gesetzt", "Stage": "Stage", "Stage {0}": "Stage {0}", "Conditions ▾": "Bedingungen ▾", "Tire model ▾": "Reifenmodell ▾",
    "Conditions edge: + helped this lap, − hurt it": "Vorteil durch Bedingungen: + hat dieser Runde geholfen, − geschadet", "Edge {0}": "Vorteil {0}", "Save and close": "Speichern und schließen", "Notes (optional)": "Notizen (optional)",
    "Up is faster. Lines are the best time so far per car (top 4 cars), rings mark a new circuit record.": "Oben ist schneller. Die Linien zeigen die bisherige Bestzeit pro Auto (die 4 besten Autos), Ringe markieren einen neuen Streckenrekord.",
    "Lap time progression, up is faster": "Entwicklung der Rundenzeit, oben ist schneller", "since first lap": "seit der ersten Runde", "new records": "neue Rekorde", "last record": "letzter Rekord", "last {0} vs {1} before": "letzte {0} vs. {1} davor",
    "Delete lap": "Runde löschen", "Delete circuit": "Strecke löschen", "New circuit name": "Neuer Streckenname", "New car name": "Neuer Autoname", "Circuit type": "Streckentyp",
    "Sunny": "Sonnig", "Rain": "Regen", "Light rain": "Leichter Regen", "Cloudy": "Bewölkt", "Scattered clouds": "Aufgelockert bewölkt", "Partly sunny": "Teilweise sonnig", "Snow": "Schnee", "Storm": "Gewitter",
    "Optimal": "Optimal", "Damp": "Feucht", "Wet": "Nass", "Soft": "Soft", "Medium": "Medium", "Hard": "Hard", "Intermediate": "Intermediate", "Street": "Straße", "Rallye": "Rallye", "Offroad": "Offroad", "Winter": "Winter", "Drag": "Drag", "Drift": "Drift", "Offroad / Dirt": "Offroad / Schotter",
    "Compounds": "Mischungen", "Road": "Straße", "Wet weather": "Nässe", "Rally & dirt": "Rallye & Schotter", "Drag & drift": "Drag & Drift", "Summer": "Sommer", "Autumn": "Herbst", "Spring": "Frühling", "Season": "Jahreszeit", "Today": "Heute",
    // ---- game page ----
    "Circuits": "Strecken", "Cars": "Autos", "Races": "Rennen", "Championships": "Meisterschaften", "Search circuits": "Strecken suchen", "Search cars": "Autos suchen", "Sort": "Sortieren", "Sort circuits": "Strecken sortieren", "Filter by type": "Nach Typ filtern",
    "Recently driven": "Zuletzt gefahren", "Most laps": "Meiste Runden", "A to Z": "A bis Z", "All types": "Alle Typen", "Pick a circuit to fill in your own lap times.": "Wähle eine Strecke, um deine Rundenzeiten einzutragen.", "Add a car": "Auto hinzufügen", "Add car": "Auto hinzufügen",
    "Log a race": "Rennen eintragen", "Log race": "Rennen eintragen", "Save race": "Rennen speichern", "Edit race": "Rennen bearbeiten", "Delete race": "Rennen löschen", "Recent races": "Letzte Rennen",
    "No races yet. Log one to start building your driver rating.": "Noch keine Rennen. Trag eins ein, um deine Fahrerwertung aufzubauen.", "Race distance (laps)": "Renndistanz (Runden)", "Start position": "Startplatz", "Finish position": "Zielplatz", "Opponents": "Gegner", "Field strength": "Stärke des Felds",
    "Weaker than me": "Schwächer als ich", "Even": "Gleich stark", "Stronger than me": "Stärker als ich", "Did not finish": "Nicht im Ziel", "Did not finish: no": "Nicht im Ziel: nein", "Did not finish: yes": "Nicht im Ziel: ja", "Strategy, incidents, what to improve": "Strategie, Zwischenfälle, was besser werden soll",
    "from P{0}": "von P{0}", "from P{0}, {1}": "von P{0}, {1}", "P{0} from P{1}, {2} laps": "P{0} von P{1}, {2} Runden", "Not raced yet": "Noch nicht gefahren", "Race it": "Fahren", "DNF": "DNF",
    // ---- championships ----
    "New championship": "Neue Meisterschaft", "Type": "Typ", "Solo, you drive alone": "Solo, du fährst allein", "Team, you and up to 2 teammates": "Team, du und bis zu 2 Teamkollegen", "Points system": "Punktesystem", "Your car": "Dein Auto", "Your team (team type)": "Dein Team (Team-Modus)",
    "Create championship": "Meisterschaft anlegen", "No championships yet.": "Noch keine Meisterschaften.", "Standings": "Wertung", "Calendar": "Kalender", "Teams": "Teams", "Drivers": "Fahrer", "Delete championship": "Meisterschaft löschen",
    "F1 (25-18-15-12-10-8-6-4-2-1)": "F1 (25-18-15-12-10-8-6-4-2-1)", "Sprint (10-6-4-3-2-1)": "Sprint (10-6-4-3-2-1)", "Linear (field size down to 1)": "Linear (Feldgröße bis 1)", "Solo": "Solo", "Team, F1": "Team, F1", "Solo, F1": "Solo, F1", "Team, Linear": "Team, Linear", "Solo, Linear": "Solo, Linear",
    "{0} of {1} rounds scored": "{0} von {1} Runden gewertet", "Round {0}": "Runde {0}", "Round {0} · Sprint": "Runde {0} · Sprint", "Add round": "Runde hinzufügen", "Round circuit": "Strecke der Runde", "Round date": "Datum der Runde", "Race distance in laps": "Renndistanz in Runden", "Delete round": "Runde löschen",
    "Results of the other drivers": "Ergebnisse der anderen Fahrer", "Pos": "Pos.", "Add other teams first.": "Leg zuerst andere Teams an.", "No rounds yet. Add the races of your season above.": "Noch keine Runden. Trag oben die Rennen deiner Saison ein.",
    "Add a team": "Team hinzufügen", "Add team": "Team hinzufügen", "Team name": "Teamname", "First car": "Erstes Auto", "First driver": "Erster Fahrer", "Add a driver": "Fahrer hinzufügen", "Add driver": "Fahrer hinzufügen", "Remove car": "Auto entfernen", "Remove driver": "Fahrer entfernen", "Delete team": "Team löschen",
    "Driver name": "Fahrername", "Driver car": "Auto des Fahrers", "Driver rating": "Fahrerwertung", "You": "Du", "you": "du",
    "Every team has 1 to 3 drivers and 1 to 3 cars. Add more once the team exists. Driver ratings feed your own rating when you race them.": "Jedes Team hat 1 bis 3 Fahrer und 1 bis 3 Autos. Weitere fügst du hinzu, sobald das Team existiert. Die Wertungen der Fahrer fließen in deine eigene Wertung ein, wenn du gegen sie fährst.",
    "Cars {0} of {1}": "Autos {0} von {1}", "Drivers {0} of {1}": "Fahrer {0} von {1}", "{0} driver, {1} car": "{0} Fahrer, {1} Auto", "{0} drivers, {1} car": "{0} Fahrer, {1} Auto", "{0} drivers, {1} cars": "{0} Fahrer, {1} Autos",
    "F1 25 Career": "F1 25 Karriere", "Standings ›": "Wertung ›", "leading the championship": "führt die Meisterschaft an", "Enter the current standings": "Aktuellen Stand eintragen", "Filled in by F1 25.": "Von F1 25 ausgefüllt.",
    "Practice, qualifying, sprint and race results come in by themselves, points as in the game.": "Ergebnisse von Training, Qualifying, Sprint und Rennen kommen von selbst, Punkte wie im Spiel.", "Edit starting standings": "Startstand bearbeiten", "Enter starting standings": "Startstand eintragen",
    "New F1 25 career season": "Neue F1-25-Karrieresaison", "Yes, start at zero": "Ja, bei null anfangen", "The table starts empty": "Die Tabelle beginnt leer", "No, the season is running": "Nein, die Saison läuft schon", "Copy the current points from the game once": "Die aktuellen Punkte einmal aus dem Spiel übernehmen",
    "Lapbook builds the championship from every session you drive: practice, qualifying, sprint and race, with the points from the game. Is this the first race weekend of the season?": "Lapbook baut die Meisterschaft aus jeder Session auf, die du fährst: Training, Qualifying, Sprint und Rennen, mit den Punkten aus dem Spiel. Ist das das erste Rennwochenende der Saison?",
    "Standings before Lapbook": "Stand vor Lapbook", "Type in the points every driver had in the game before Lapbook started counting (Career → Standings in F1 25). Leave a field empty for 0. Lapbook adds every new session on top.": "Trag die Punkte ein, die jeder Fahrer im Spiel hatte, bevor Lapbook mitgezählt hat (in F1 25: Karriere → Wertung). Leeres Feld = 0. Lapbook rechnet jede neue Session dazu.",
    "Rounds already driven before Lapbook": "Schon gefahrene Rennen vor Lapbook", "Save standings": "Stand speichern", "Practice": "Training", "Qualifying": "Qualifying", "Sprint Shootout": "Sprint Shootout", "Sprint": "Sprint", "Race": "Rennen",
    "Practice {0}": "Training {0}", "Q{0}": "Q{0}", "Sprint Shootout {0}": "Sprint Shootout {0}", "Season {0}": "Saison {0}", "P{0} · {1} pts": "P{0} · {1} Pkt.", "{0} pts": "{0} Pkt.", "pts": "Pkt.",
    // ---- driver, achievements, analysis ----
    "Driver": "Fahrer", "Peak rating": "Höchste Wertung", "Wins": "Siege", "Podiums": "Podien", "Average finish": "Durchschnittlicher Zielplatz", "Average places gained": "Durchschnittlich gewonnene Plätze", "Rating history": "Verlauf der Wertung", "after each race": "nach jedem Rennen",
    "How the rating works": "So funktioniert die Wertung", "{0} rating": "{0} Wertung",
    "Each race compares your result with the field, like an Elo rating. Finishing ahead of stronger drivers earns the most, and losing to weaker ones costs the most. Wins and podiums add a bonus. Gaining places from your start adds points, and losing places costs 1.5 times as much. A DNF costs extra. In championships, the ratings you set for the other drivers are used.": "Jedes Rennen vergleicht dein Ergebnis mit dem Feld, ähnlich wie eine Elo-Wertung. Vor stärkeren Fahrern ins Ziel zu kommen bringt am meisten, gegen schwächere zu verlieren kostet am meisten. Siege und Podien geben einen Bonus. Gewonnene Plätze ab dem Start bringen Punkte, verlorene kosten 1,5-mal so viel. Ein DNF kostet extra. In Meisterschaften zählen die Wertungen, die du für die anderen Fahrer festgelegt hast.",
    "Market value follows your rating: every 50 rating points multiplies it by 1.4, and it falls the same way when your rating drops.": "Der Marktwert folgt deiner Wertung: Alle 50 Wertungspunkte steigt er um das 1,4-Fache und fällt genauso, wenn deine Wertung sinkt.",
    "Milestones for how you drive: pace, consistency, racing, dedication and variety.": "Meilensteine dafür, wie du fährst: Tempo, Konstanz, Rennen, Fleiß und Vielfalt.", "Your rank": "Dein Rang", "Up next": "Als Nächstes", "Everything done. Impressive.": "Alles geschafft. Beeindruckend.",
    "{0} of {1} tiers": "{0} von {1} Stufen", "{0} tiers": "{0} Stufen", "{0} more tier to": "Noch {0} Stufe bis", "{0} more tiers to": "Noch {0} Stufen bis", ". Every tier of every milestone counts.": ". Jede Stufe jedes Meilensteins zählt.", "Top rank reached.": "Höchster Rang erreicht.",
    "Pace": "Tempo", "Consistency": "Konstanz", "Racing": "Rennen", "Dedication": "Fleiß", "Explorer": "Entdecker", "Personal bests": "Persönliche Bestzeiten", "Found time": "Zeit gefunden", "Perfect lap": "Perfekte Runde", "Metronome": "Metronom",
    "Overtaker": "Überholer", "Laps": "Runden", "Driving days": "Fahrtage", "On a roll": "Lauf", "Garage": "Garage", "Multi-sim": "Multi-Sim",
    "Times you beat your own best lap on a circuit": "Wie oft du deine eigene Bestrunde auf einer Strecke geschlagen hast", "Circuits where you got at least 1 % faster than your first lap": "Strecken, auf denen du mindestens 1 % schneller als in deiner ersten Runde wurdest",
    "Circuits where your best lap is within 0.1 s of your theoretical best": "Strecken, auf denen deine Bestrunde höchstens 0,1 s über deiner theoretischen Bestzeit liegt", "Sessions of 5+ laps where your laps spread less than 0.4 %": "Sessions mit 5+ Runden, deren Zeiten weniger als 0,4 % streuen",
    "Races you won": "Gewonnene Rennen", "Races you finished in the top 3": "Rennen, die du in den Top 3 beendet hast", "Places gained from the start, all races together": "Gewonnene Plätze ab dem Start, alle Rennen zusammen", "Laps driven": "Gefahrene Runden",
    "Days with at least one lap": "Tage mit mindestens einer Runde", "Longest run of days in a row with a lap": "Längste Serie von Tagen hintereinander mit einer Runde", "Different circuits driven": "Verschiedene gefahrene Strecken", "Different cars driven": "Verschiedene gefahrene Autos", "Different games with laps": "Verschiedene Spiele mit Runden",
    "Bronze": "Bronze", "Silver": "Silber", "Gold": "Gold", "Platinum": "Platin", "Bronze: {0}": "Bronze: {0}", "Silver: {0}": "Silber: {0}", "Gold: {0}": "Gold: {0}", "Platinum: {0}": "Platin: {0}",
    "{0} / {1} for Bronze": "{0} / {1} für Bronze", "{0} / {1} for Silver": "{0} / {1} für Silber", "{0} / {1} for Gold": "{0} / {1} für Gold", "{0} / {1} for Platinum": "{0} / {1} für Platin", "{0} · all tiers done": "{0} · alle Stufen geschafft",
    "{0} to go for Bronze": "noch {0} bis Bronze", "{0} to go for Silver": "noch {0} bis Silber", "{0} to go for Gold": "noch {0} bis Gold", "{0} to go for Platinum": "noch {0} bis Platin",
    "Rookie": "Rookie", "Club racer": "Clubfahrer", "Semi-pro": "Halbprofi", "Pro": "Profi", "Elite": "Elite", "Legend": "Legende",
    "Log laps with at least two different cars in one game to start a duel.": "Trag in einem Spiel Runden mit mindestens zwei verschiedenen Autos ein, um ein Duell zu starten.", "All games": "Alle Spiele", "Any circuit": "Jede Strecke",
    "circuits improved": "Strecken verbessert", "Biggest gain": "Größter Fortschritt", "records this month": "Rekorde in diesem Monat", "Pace vs fastest, %": "Tempo vs. Schnellster, %",
    "Race strategy": "Rennstrategie", "Plan strategy": "Strategie planen", "Race length (laps)": "Renndistanz (Runden)", "Time lost in the pit lane (seconds)": "Zeitverlust in der Boxengasse (Sekunden)", "Race lap time": "Rundenzeit im Rennen",
    "Enter a race lap time, or tap one of your times above.": "Gib eine Rundenzeit im Rennen ein oder tippe auf eine deiner Zeiten oben.", "Use 2 compounds": "2 Mischungen nutzen", "Wet race": "Regenrennen", "Fuel limit": "Spritlimit", "Max laps": "Max. Runden", "Best plans": "Beste Pläne", "Suggested:": "Vorschlag:",
    "Wear per lap, %": "Abnutzung pro Runde, %", "Wear is how much slower each lap gets on that set. Empty fields use the defaults shown. Change them to match what you feel in game.": "Abnutzung heißt, um wie viel jede Runde auf diesem Satz langsamer wird. Leere Felder nutzen die angezeigten Standardwerte. Pass sie an das an, was du im Spiel spürst.",
    "Import list": "Liste importieren", "avg finish": "Ø Zielplatz", "podiums": "Podien", "wins": "Siege", "races": "Rennen", "Rivals": "Rivalen", "Max": "Max",
    // ---- tyre advice on the lap form (joined into one text) ----
    "Circuit track.": "Rundstrecke.", "Drag track.": "Drag-Strecke.", "Drift track.": "Drift-Strecke.", "Offroad / Dirt track.": "Offroad-Strecke.", "Stage track.": "Etappe.",
    "Wet surface: slicks lose grip.": "Nasser Belag: Slicks verlieren Grip.", "Damp surface: go easy on slicks.": "Feuchter Belag: vorsichtig mit Slicks.", "Snow: winter tires.": "Schnee: Winterreifen.", "Winter: cold, low grip.": "Winter: kalt, wenig Grip.",
    "Autumn: leaves, cooler tarmac.": "Herbst: Laub, kühlerer Asphalt.", "Summer: warm tarmac suits slicks.": "Sommer: warmer Asphalt passt zu Slicks.", "Light wet: intermediates.": "Leicht nass: Intermediates.", "Heavy wet: full wets.": "Stark nass: Regenreifen.",
    "Hot and sunny: harder compounds last.": "Heiß und sonnig: härtere Mischungen halten länger.", "Mild day: mediums balance grip and life.": "Milder Tag: Medium bietet Grip und Haltbarkeit.", "Cool and cloudy: softs come in easily.": "Kühl und bewölkt: Softs kommen leicht auf Temperatur.",
    "Short race ({0} laps): the soft's grip pays off.": "Kurzes Rennen ({0} Runden): Der Grip der Soft lohnt sich.", "Mid-length race ({0} laps): medium balances pace and wear.": "Mittellanges Rennen ({0} Runden): Medium verbindet Tempo und Abnutzung.",
    "Long race ({0} laps): hard lasts, plan a stop and consider medium then hard.": "Langes Rennen ({0} Runden): Hard hält, plane einen Stopp, z. B. erst Medium, dann Hard.", "Long race ({0} laps): semi slicks hold up better.": "Langes Rennen ({0} Runden): Semi-Slicks halten besser.",
    "Mid-length race ({0} laps): semi slicks stay consistent.": "Mittellanges Rennen ({0} Runden): Semi-Slicks bleiben konstant.", "Short race: go for maximum grip.": "Kurzes Rennen: maximaler Grip.",
    "Horizon Semi Slick": "Horizon Semi-Slick", "Horizon Slick": "Horizon Slick", "Setup, feel, what to try next": "Setup, Gefühl, was du als Nächstes probierst",
    // ---- leftovers ----
    "{0} to record": "{0} zum Rekord", "{0} faster": "{0} schneller", "{0} slower": "{0} langsamer", "Circuit and car": "Strecke und Auto", "Folder: not found": "Ordner: nicht gefunden",
    "Soft max laps": "Soft max. Runden", "Medium max laps": "Medium max. Runden", "Hard max laps": "Hard max. Runden", "Soft pace": "Tempo Soft", "Medium pace": "Tempo Medium", "Hard pace": "Tempo Hard", "Soft wear": "Abnutzung Soft", "Medium wear": "Abnutzung Medium", "Hard wear": "Abnutzung Hard",
    "New circuit record": "Neuer Streckenrekord", "less": "weniger", "more": "mehr", "updates as you type": "aktualisiert sich beim Tippen",
    "Lapbook is ready for Project CARS {0} on port {1}. If Windows asks about the firewall, allow it for private networks.": "Lapbook ist bereit für Project CARS {0} auf Port {1}. Fragt Windows nach der Firewall, erlaube den Zugriff für private Netzwerke.",
    "Ready for Project CARS {0} on port {1}": "Bereit für Project CARS {0} auf Port {1}",
    ": best lap": ": Bestrunde", ", average": ", Schnitt", "({0} vs. {1} laps), sectors": "({0} vs. {1} Runden), Sektoren", "({0} vs. {1} laps).": "({0} vs. {1} Runden).", "vs.": "vs.",
    "Ctrl+Shift+L": "Strg+Umschalt+L", "Ctrl+Shift+O": "Strg+Umschalt+O", "Ctrl+Shift+T": "Strg+Umschalt+T", "Ctrl+Shift+arrows": "Strg+Umschalt+Pfeile",
    // ---- toasts (fixed) ----
    "Assetto Corsa connected. Laps are saved automatically.": "Assetto Corsa verbunden. Runden werden automatisch gespeichert.", "F1 25 connected. Laps are saved automatically.": "F1 25 verbunden. Runden werden automatisch gespeichert.",
    "Car name saved": "Autoname gespeichert", "Name saved": "Name gespeichert", "Race name saved": "Rennname gespeichert", "Recording cancelled": "Aufnahme abgebrochen", "Live tracking settings saved": "Einstellungen gespeichert",
    "Championship started. Every session is added by itself.": "Meisterschaft gestartet. Jede Session kommt von selbst dazu.", "Copy created: change what you like": "Kopie angelegt: ändere, was du willst", "Enter the car first": "Gib zuerst das Auto ein", "Give the setup a name first": "Gib dem Setup zuerst einen Namen",
    "Pick the circuit of this setup first": "Wähle zuerst die Strecke dieses Setups", "Setup deleted, its laps keep their times": "Setup gelöscht, seine Runden behalten ihre Zeiten", "Setups assigned": "Setups zugeordnet", "No data from Forza yet": "Noch keine Daten von Forza",
    "Too short, nothing saved (at least 2 s and 50 m)": "Zu kurz, nichts gespeichert (mindestens 2 s und 50 m)", "Type a name first": "Gib zuerst einen Namen ein", "Type the car's name first": "Gib zuerst den Namen des Autos ein", "Type the race's name first": "Gib zuerst den Namen des Rennens ein",
    "That did not work": "Das hat nicht geklappt", "Windows asks for permission. Click Yes, then restart Forza.": "Windows fragt nach der Berechtigung. Klick auf Ja und starte Forza neu.", "Could not read that file. Use Choose file instead.": "Diese Datei konnte nicht gelesen werden. Nutze stattdessen „Datei wählen“.",
    "Drag run: launch when ready, press Ctrl+Shift+T at the finish": "Drag-Run: starte, wenn du bereit bist, und drück im Ziel Strg+Umschalt+T", "Recording: press Ctrl+Shift+T at the finish": "Aufnahme: drück im Ziel Strg+Umschalt+T", "Overlay off": "Overlay aus", "Overlay on. Ctrl+Shift+O switches it in the game too.": "Overlay an. Strg+Umschalt+O schaltet es auch im Spiel.",
    "A team needs a name, one car and one driver": "Ein Team braucht einen Namen, ein Auto und einen Fahrer", "A team needs at least one car": "Ein Team braucht mindestens ein Auto", "A team needs at least one driver": "Ein Team braucht mindestens einen Fahrer", "CSV copied": "CSV kopiert", "Car added": "Auto hinzugefügt", "Car removed": "Auto entfernt",
    "Championship created. Add the calendar and the other teams.": "Meisterschaft angelegt. Trag den Kalender und die anderen Teams ein.", "Championship deleted": "Meisterschaft gelöscht", "Circuit added": "Strecke hinzugefügt", "Circuit deleted": "Strecke gelöscht", "Copied": "Kopiert", "Couldn't read that file": "Die Datei konnte nicht gelesen werden",
    "Download started. If nothing appears, use Text.": "Download gestartet. Falls nichts erscheint, nutze „Text“.", "Driver removed": "Fahrer entfernt", "Enter a car and a time like 1:23.456": "Gib ein Auto und eine Zeit wie 1:23.456 ein", "Enter a car name": "Gib einen Autonamen ein", "Enter a circuit name": "Gib einen Streckennamen ein",
    "Enter a name and your car": "Gib einen Namen und dein Auto ein", "Enter the circuit for the round": "Gib die Strecke der Runde ein", "Enter the driver's name": "Gib den Namen des Fahrers ein", "Fill in circuit, car, laps and opponents. Start and finish must fit the field.": "Fülle Strecke, Auto, Runden und Gegner aus. Start- und Zielplatz müssen zum Feld passen.",
    "Lap deleted": "Runde gelöscht", "No lap data found in that text": "In diesem Text wurden keine Rundendaten gefunden", "Nothing to undo": "Nichts rückgängig zu machen", "Race deleted": "Rennen gelöscht", "Round added": "Runde hinzugefügt", "Round deleted": "Runde gelöscht", "Team added": "Team hinzugefügt", "Team deleted": "Team gelöscht",
    "That car already exists": "Dieses Auto gibt es schon", "That circuit already exists": "Diese Strecke gibt es schon", "You can't remove yourself": "Du kannst dich nicht selbst entfernen", "{0} laps added": "{0} Runden hinzugefügt", "{0} lap added": "{0} Runde hinzugefügt", "Loaded {0} laps": "{0} Runden geladen",
  };
  // texts with names inside: regular expressions, applied when no entry fits
  const RULES = [
    // several sentences in one text (the tyre advice): translate one by one
    [/^\. (.+\.)$/, m => ". " + m[1].split(/(?<=\.) (?=[A-Z])/).map(x => tr(x)).join(" ")],
    [/^record · (.+)$/, m => `Rekord · ${m[1]}`],
    [/^Open (.+)$/, m => `${m[1]} öffnen`],
    [/^Setups of your laps at (.+)$/, m => `Setups deiner Runden in ${m[1]}`],
    [/^Setup for (.+)$/, m => `Setup für ${m[1]}`],
    [/^Show every option of (.+?)( \(now: only the ones this setup has\))?$/, m => `Alle Optionen von ${m[1]} zeigen${m[2] ? " (jetzt nur die dieses Setups)" : ""}`],
    [/^(.+) · laps you drive from now on count for the setup you pick\.$/, m => `${m[1]} · Runden, die du ab jetzt fährst, zählen für das Setup, das du wählst.`],
    [/^Saved in (.+)$/, m => `Gespeichert in ${m[1]}`],
    [/^(generic · )?saved (.+) · (\d+) options$/, m => `${m[1] ? "generisch · " : ""}gespeichert ${m[2]} · ${m[3]} Optionen`],
    [/^(.+) · (Datei|file|from the game|typed in) · (\d+) laps?$/, m => `${tr(m[1])} · ${tr(m[2])} · ${m[3]} ${m[3] === "1" ? "Runde" : "Runden"}`],
    [/^(.+) · (saved file|from the game|typed in)$/, m => `${tr(m[1])} · ${tr(m[2])}`],
    [/^saved file · (.+)$/, m => `gespeicherte Datei · ${m[1]}`],
    [/^copy of: (.+)$/, m => `Kopie von: ${m[1]}`], [/^saved file: (.+)$/, m => `gespeicherte Datei: ${m[1]}`],
    [/^(.+) copy$/, m => `${m[1]} Kopie`],
    [/^Every option of the (.+) setup menu\. Leave out what you did not change\.(.*)$/, m => `Alle Optionen aus dem Setup-Menü von ${m[1]}. Was du nicht geändert hast, lässt du leer.${m[2] ? " Werte wie im Spiel (Klicks)." : ""}`],
    [/^Live · (.+)$/, m => `Live · ${m[1]}`],
    [/^(.+) behind (.+)$/, m => (/^\d+$/.test(m[1]) ? `${m[1]} hinter ${m[2]}` : null)],
    [/^(.+) · (\d+) races? · last: (.+?)( sprint)?$/, m => `${m[1]} · ${m[2]} ${m[2] === "1" ? "Rennen" : "Rennen"} · zuletzt: ${m[3]}${m[4] ? " Sprint" : ""}`],
    [/^(.+), (\d+) wins?, (\d+) podiums?$/, m => `${m[1]}, ${m[2]} ${m[2] === "1" ? "Sieg" : "Siege"}, ${m[3]} ${m[3] === "1" ? "Podium" : "Podien"}`],
    [/^(Solo|Team), (\d+) of (\d+) rounds, (\d+) drivers?$/, m => `${m[1]}, ${m[2]} von ${m[3]} Runden, ${m[4]} Fahrer`],
    [/^(.+), (\d+) laps, (\d+) cars, (.+)$/, m => `${m[1]}, ${m[2]} Runden, ${m[3]} Autos, ${m[4]}`],
    [/^(.+), P(\d+) from P(\d+)$/, m => `${m[1]}, P${m[2]} von P${m[3]}`],
    [/^(.+), (\d+) laps, (\d+) records?, last (.+)$/, m => `${m[1]}, ${m[2]} Runden, ${m[3]} ${m[3] === "1" ? "Rekord" : "Rekorde"}, zuletzt ${m[4]}`],
    [/^(\d+) laps?, (\d+) cars?, last (\d+) avg (.+)$/, m => `${m[1]} Runden, ${m[2]} Autos, Schnitt der letzten ${m[3]}: ${m[4]}`],
    [/^(\d+) laps?, last (.+)$/, m => `${m[1]} Runden, zuletzt ${m[2]}`],
    [/^(.+) – (\d+) laps?, last (.+)$/, m => `${tr(m[1])} – ${m[2]} ${m[2] === "1" ? "Runde" : "Runden"}, zuletzt ${m[3]}`],
    [/^(.+) · (\d+) laps? · (.+)$/, m => `${m[1]} · ${m[2]} ${m[2] === "1" ? "Runde" : "Runden"} · ${tr(m[3])}`],
    [/^· (\d+) laps? · best (.+)$/, m => `· ${m[1]} ${m[1] === "1" ? "Runde" : "Runden"} · Bestzeit ${m[2]}`],
    [/^(\d+) laps? · best (.+)$/, m => `${m[1]} ${m[1] === "1" ? "Runde" : "Runden"} · Bestzeit ${m[2]}`],
    [/^(.+) · (.+) · (\d{4}-\d\d-\d\d|.+) · (\d+) laps$/, m => `${m[1]} · ${m[2]} · ${m[3]} · ${m[4]} Runden`],
    [/^(.+), race$/, m => `${m[1]}, Rennen`],
    [/^\| (.+)$/, m => `| ${tr(m[1])}`],
    [/^setup · (.+) vs\. (.+)$/, m => `Setup · ${m[1]} vs. ${m[2]}`],
    [/^(.+?) ?\+([\d.]+) to record$/, m => `${m[1] ? m[1] + " " : ""}+${m[2]} zum Rekord`],
    [/^(.+?) · (.+): ([\d:.]+)(?:, (?:new record by ([\d.]+)|(first lap here)|\+([\d.]+) to record))?( \(invalid\))?$/, m => `${m[1]} · ${m[2]}: ${m[3]}${m[4] ? `, neuer Rekord um ${m[4]}` : m[5] ? ", erste Runde hier" : m[6] ? `, +${m[6]} zum Rekord` : ""}${m[7] ? " (ungültig)" : ""}`],
    [/^(.+): invalid lap not saved$/, m => `${m[1]}: ungültige Runde nicht gespeichert`],
    [/^(Race|Sprint) saved: (DNF|P\d+) at (.+) · P(\d+) in the championship with (\d+) pts · rating (.+)$/, m => `${m[1] === "Race" ? "Rennen" : "Sprint"} gespeichert: ${m[2]} in ${m[3]} · P${m[4]} in der Meisterschaft mit ${m[5]} Pkt. · Wertung ${m[6]}`],
    [/^Race saved: (DNF|P\d+) from P(\d+) at (.+), rating (.+)$/, m => `Rennen gespeichert: ${m[1]} von P${m[2]} in ${m[3]}, Wertung ${m[4]}`],
    [/^(.+) saved: P(\d+) at (.+)$/, m => `${tr(m[1])} gespeichert: P${m[2]} in ${m[3]}`],
    [/^(\d+) F1 25 laps? got their car name$/, m => `${m[1]} F1-25-Runden haben ihren Autonamen bekommen`],
    [/^(Drag run|Time trial) saved\. Give it a name in Lapbook\.$/, m => `${m[1] === "Drag run" ? "Drag-Run" : "Zeitfahren"} gespeichert. Gib ihm in Lapbook einen Namen.`],
    [/^(.+) is used for (.+) at (.+)\. New laps count for it\.$/, m => `${m[1]} wird für ${m[2]} in ${m[3]} verwendet. Neue Runden zählen dafür.`],
    [/^F1 25 setup saved as "(.+)"\. Rename it on the circuit page\.$/, m => `F1-25-Setup als „${m[1]}“ gespeichert. Umbenennen kannst du es unter Setups.`],
    [/^Setup changed in the game: laps now count for (.+)$/, m => `Setup im Spiel geändert: Runden zählen jetzt für ${m[1]}`],
    [/^Setup: (.+) \(newest saved\)\. Change it in the live card\.$/, m => `Setup: ${m[1]} (zuletzt gespeichert). Ändern kannst du es in der Live-Karte.`],
    [/^Setup chosen: (.+)$/, m => `Setup gewählt: ${m[1]}`],
    [/^Setup "(.+)" saved\. New laps count for it\.$/, m => `Setup „${m[1]}“ gespeichert. Neue Runden zählen dafür.`],
    [/^Standings saved(?:: you are P(\d+) with (\d+) pts)?$/, m => `Stand gespeichert${m[1] ? `: du bist P${m[1]} mit ${m[2]} Pkt.` : ""}`],
    [/^New F1 25 career season found: (.+)$/, m => `Neue F1-25-Karrieresaison gefunden: ${m[1]}`],
    [/^Session recap ready: (.+)$/, m => `Session-Rückblick bereit: ${m[1]}`],
    [/^ACC broadcasting switched on \(port (\d+)\)\. Restart ACC once\.$/, m => `ACC-Broadcasting eingeschaltet (Port ${m[1]}). Starte ACC einmal neu.`],
    [/^(.+) connected\. (Race laps|Laps) are saved automatically\.$/, m => `${m[1]} verbunden. ${m[2] === "Race laps" ? "Rennrunden" : "Runden"} werden automatisch gespeichert.`],
    [/^Which car is this \((.+)\)\?$/, m => `Welches Auto ist das (${m[1].replace("team", "Team").replace("Forza car", "Forza-Auto")})?`],
    [/^Back to version (.+)$/, m => `Zurück zu Version ${m[1]}`], [/^Really go back to (.+)\?$/, m => `Wirklich zurück zu ${m[1]}?`],
    [/^This is older than your version (.+)\.$/, m => `Diese Version ist älter als deine (${m[1]}).`],
    [/^This session: (\d+) F1 25 and (\d+) Assetto Corsa laps? saved\. Lapbook (.+)\.$/, m => `Diese Session: ${m[1]} F1-25- und ${m[2]} Assetto-Corsa-Runden gespeichert. Lapbook ${m[3]}.`],
    [/^Invalid laps follow the setting above\. ACC reads its port from broadcasting\.json(.*)\.$/, m => `Ungültige Runden folgen der Einstellung oben. ACC liest seinen Port aus broadcasting.json${m[1]}.`],
    [/^Port (\d+) is used by another program \(for example SimHub\), so Lapbook switched to$/, m => `Port ${m[1]} wird von einem anderen Programm benutzt (zum Beispiel SimHub), deshalb hat Lapbook gewechselt auf`],
    [/^\. Set UDP Port$/, () => `. Stell als UDP-Port`], [/^in F1 25\.$/, () => `in F1 25 ein.`],
    [/^Includes your standings from (\d+) earlier rounds?\.$/, m => `Enthält deinen Stand aus ${m[1]} früheren Rennen.`],
    [/^Driver Career$/, () => "Driver Career"],
    [/^(\p{Extended_Pictographic}\uFE0F?\s)(.+)$/u, m => { const r = tr(m[2]); return r !== m[2] ? m[1] + r : null; }],
    [/^(.+?)( · .+)+$/, m => { const parts = m[0].split(" · "), out = parts.map(x => tr(x)); return out.some((x, i) => x !== parts[i]) ? out.join(" · ") : null; }],
    [/^Live tracking for (.+) is off\. Switch it on in$/, m => `Live-Tracking für ${m[1]} ist aus. Schalte es ein unter`],
  ];

  const NUM = /[-+−±]?\d+(?:[:.,]\d+)*%?/g;
  const PAT = {};
  for (const [k, v] of Object.entries(DE)) if (k.includes("{0}")) PAT[k] = v;
  function tr(s) {
    if (lang !== "de" || !s) return s;
    const m = String(s).match(/^(\s*)([\s\S]*?)(\s*)$/), core = m[2].replace(/\s+/g, " ");
    if (!core || !/[A-Za-z]/.test(core)) return s;
    let out = DE[core];
    if (out === undefined) {
      const nums = [];
      const k = core.replace(NUM, x => { nums.push(x); return "{" + (nums.length - 1) + "}"; });
      if (PAT[k] !== undefined) out = PAT[k].replace(/\{(\d)\}/g, (_, i) => nums[i]);
    }
    if (out === undefined) for (const [re, f] of RULES) { const x = core.match(re); if (x) { const r = f(x); if (r !== null && r !== undefined) { out = r; break; } } }
    return out === undefined ? s : m[1] + out + m[3];
  }
  window.lapbookT = tr;
  if (lang !== "de") return;
  document.documentElement.lang = "de";

  // translate a piece of the page; options without a value keep their English text as value
  const ATTR = ["placeholder", "title", "aria-label"];
  const skip = el => el && (el.closest("[data-notr]") || el.isContentEditable);
  function textNode(n) {
    const p = n.parentNode;
    if (!p || p.nodeType !== 1 || /^(SCRIPT|STYLE|TEXTAREA)$/.test(p.tagName) || skip(p)) return;
    const v = n.nodeValue, t = tr(v);
    if (t === v) return;
    if (p.tagName === "OPTION" && !p.hasAttribute("value")) p.setAttribute("value", v.trim());
    n.nodeValue = t;
  }
  function element(el) {
    if (skip(el)) return;
    for (const a of ATTR) { const v = el.getAttribute && el.getAttribute(a); if (v) { const t = tr(v); if (t !== v) el.setAttribute(a, t); } }
  }
  function walk(root) {
    if (root.nodeType === 3) return textNode(root);
    if (root.nodeType !== 1) return;
    element(root);
    const it = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let n;
    while ((n = it.nextNode())) (n.nodeType === 3 ? textNode : element)(n);
  }
  let busy = false;
  const obs = new MutationObserver(list => {
    if (busy) return;
    busy = true;
    try {
      for (const m of list) {
        if (m.type === "characterData") textNode(m.target);
        else if (m.type === "attributes") element(m.target);
        else m.addedNodes.forEach(walk);
      }
    } finally { obs.takeRecords(); busy = false; }
  });
  const start = () => { walk(document.body); obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTR }); };
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
})();
