---
location: "[[Mont Klamott]]"
ship: "[[EVERYTIME]]"
wings-hub: true
class: ship
---
Solo Mio's captaining Ship

```letter
husonaut-56
from: [[Solo Mio]]
recipient: [[Mia]]
destination: [[die-maxista]]
content: Willste den 4. Pfau jetzt noch auf die Rechnung nehmen? In zehn Minuten ist es zu spät.
```

```wings
send(letter-id, location)
```


## Material Index


Also: Bestellung aus den Places kommt bei der EVERYTIME rein. Wir checken den Index. Bestellung auf Lager? -> Post an EVERYWHERE, bitte aus dem Lager holen und an folgende Adresse schicken.

EVERYWHERE disponiert und liefert, gleichzeitig Post an EVERYTIME: Disposition buchen.



## Lost and Found




## Dovecote

aktuelle Karten sämtlicher erreichbarer Schläge sowie Informationen über Sperrungen von Wasserwegen, eingestürzte Gebäude oder vorübergehend verlegte Stationen.


## Network Card

Melde regelmäßig:

- welche Verbindungen offen sind,
- wie viele Tauben bereitstehen,
- welche Flugkorridore durch Sturm, Rauch oder Raubvögel gestört sind,
- wie hoch die aktuelle Transportzeit ist.

Aus diesen Meldungen wird eine vollständige Karte des Netzes erstellt. Danach berechnet jede Hauptstation selbst die günstigste Route. Link-State-Protokolle funktionieren genau nach diesem Grundprinzip: Die Knoten tauschen Zustandsinformationen aus und berechnen anschließend kürzeste Wege.

In NeuBerlin könnte das vollkommen analog aussehen:

- Jede Station stanzt ihren Zustand auf eine dünne Karte.
- Rundflug-Tauben verteilen Kopien an alle Hauptstationen.
- Kartografen stecken die Daten auf großen Messingtafeln um.
- Gewichte werden mit verschiebbaren Marken aktualisiert.
- Ein mechanischer Routenrechner oder Fibo selbst bestimmt die Wege.

Das wäre langsamer als digitales Routing, aber erstaunlich robust.

