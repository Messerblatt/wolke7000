---
clan: kreuzberg
location: markthalle-9
---


```item
candytron-maintenance-sticker
```




Ich implementiere die Open Wings Logistik, und später dann die NPCs mit ihren Briefen und Interessen. 

Fangen wir klein an: Der Material-Index der EVERYTHING - Player sollen die Chance haben, sich bei Solo Mio was zu verdienen und sich auf der EVERYTHING zu bewähren, indem Player anbieten, den Material-Index zu verwalten. Aktuell besteht die EVERYTHING aus 3 Schiffen, und fürs erste parken sie nur an je unterschiedlichen Orten - dynamische Logistik füge ich später hinzu. Die Orte sind: Markthalle 9, Brandenburger Tor, Gasometer. 

Hier eine Definition für eine MaterialIndexEntry. Speichere die Logistik rund um Open Wings in der Game Runtime:

```
type MaterialIndexEntry = {
  componentId: string
  quantity: number
  shipId: string
  locationId: string

  updatedAt: number
  revision: number
}
```


Also beispielsweise: 

```
{
  "componentId": "candytron-guide-fin",
  "quantity": 3,
  "shipId": "everything-gasometer",
  "locationId": "gasometer",
  "updatedAt": 1792396842000,
  "revision": 7
}

```


Für die Open Wings Nachrichten der EVERYTHING zur Synchro ihrer Bestände sollen die Nachrichten konzeptionell ungefähr so aussehen:

```

{
  messageId: "ow-88431",
  sender: "everything-gasometer",
  destination: "brandenburger-tor",
  revision: 7,
  payload: [...]
}
```


Aufpassen: **Du brauchst nicht nur eine Nachricht, sondern eine Identität für die Meldung.**

Etwa:

```
{
  messageId: "ow-88431",
  sender: "everything-gasometer",
  destination: "brandenburger-tor",
  revision: 7,
  payload: [...]
}
```


Denn später kann passieren:

```
revision 8 arrives
revision 7 arrives afterwards
```


Wenn du nur stumpf überschreibst, springt der Index rückwärts.

```
if (incoming.revision > current.revision) {
  applyUpdate()
}
```

ist das Problem erledigt.

Gotcha: **Doppelte Zustellung.**

Taube kommt zweimal technisch nicht vor, aber deine Game Events sehr wohl — durch Reloads, SPA Navigation, Wiederholungen, IndexedDB-Replays usw.

Deshalb:

```
messageId
```

speichern und bereits verarbeitete Messages ignorieren.


Die Pigeon vom konzept: 

```

Pigeon {
  id
  homeLoft
  currentLocation
  status
}

```


z.B.: 
```
{
  "id": "ow-samsa-071",
  "homeLoft": "brandenburger-tor",
  "currentLocation": "player",
  "status": "carried"
}

```


Gotcha: **Nicht ganze Datenbank-Snapshots verschicken.**

Für MVP kannst du natürlich einfach das komplette Inventar schicken.

Langfristig würde ich aber Messages wie diese vorsehen:

```
{
  type: "inventory-delta",
  shipId: "everything-gasometer",
  changes: [
    {
      componentId: "fishing-net",
      delta: -2
    },
    {
      componentId: "sentinel-voice-chip",
      delta: +1
    }
  ]
}
```

Oder noch besser zunächst:

```
reported quantities
```

statt mathematischer Deltas, weil das robuster gegen verlorene Nachrichten ist:

```
{
  "componentId": "fishing-net",
  "quantity": 8,
  "revision": 11
}
```

Wenn Revision 10 verloren geht, ist Revision 11 trotzdem korrekt.