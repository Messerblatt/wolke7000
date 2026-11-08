
![[imgs/icon_openWing.png]]


The **Open Wings** Foundation is a non-profit organization dedicated to message delivery and information coordination in Neu Berlin. It operates a carrier pigeon network—also called "Open Wings"—that connects the city’s various districts, as well as numerous outposts along Neu Berlin’s waterways. Open Wings is considered one of the oldest still-active institutions in the city and is destined to go down in the history of Neu Berlin as "Internet 1." Unlike the "Internet 0" of the Old World, Open Wings exclusively transports physical message capsules. The foundation upholds the principles of freedom, verifiability, and independence in the exchange of information. Open Wings operates free from central control and is coordinated by the [[Tempelhof Diskoord]].

### History

The founding of Open Wings dates back to the year 2108 and is credited to the three admins of the Tempelhof Diskoord: [[Salt Brah]], [[Ciao Von Bella]], and [[funky (dot) blend|Funky.blend]].

The catalyst was Salt Brah’s growing frustration with the state of the internet as it existed previously. Autoplaying videos, cookie banners, targeted advertising, phishing campaigns, scammers, and "AI slop" had, in his view, turned the internet into a "cesspool of mutual exploitation." This gave rise to Salt Brah’s vision: to reimagine the internet by returning to its original core concept—establishing it within the domain zones of Neu Berlin as an information network carried by pigeons.

### The First Pigeons

Together with the falconer **Ciao Von Bella**, a flock consisting of Neu Berlin’s fastest pigeons was assembled. The first test flight took place on October 12, 2109, and was a success. This also provided an opportunity to embarrass the internet’s predecessor by staging a race: at exactly 12 o’clock, two identical versions of the message "FF" (standing for "Flieg Frei" — "Fly Free" — the motto of the Open Wings Foundation) were dispatched simultaneously from the roof of the Tempelhof "Diskoord": the first via traditional email, the second via an Open Wings carrier pigeon. The message was sent to a computer located in the rooftop headquarters of Schönhausen Palace in Neu-Berlin Pankow. To help the pigeon identify the location of the computer, flags had been placed on the roof of the palace.

>[!info]
> The carrier pigeon was the first to complete this 11.7 km (as the crow flies) route, securing a race victory for Open Wings. This significantly boosted the reputation of Open Wings.

This "Castle Race"—as it was frequently referred to in the log files of later Open Wings versions—dealt a serious blow to the reputation of the "Old Internet." Through a tactic of "letter flooding," the Open Wings Foundation inundated the residents of New Berlin with pigeon-delivered mail, in which the Old Internet was dismissed as "officially lame."

In the years that followed, Open Wings became widely established throughout New Berlin. Funky.blend played a pivotal role in optimizing the underlying network topology of the flight paths, enabling the system to handle high volumes of traffic. As of July 2126, Open Wings coordinates an active flock of approximately 22,000 carrier pigeons across New Berlin.

### Organization

Open Wings explicitly defines itself not as a postal service, but as a piece of public infrastructure. The Foundation transports only letters; it does not carry physical goods.

Instead, Open Wings functions as a communication layer operating above the city’s water-based transport network. For instance, if a workshop requires a specific valve, a message is sent via Open Wings to the material index of [[EVERYTHING|EVERYTHING]]. The system then identifies which barge is carrying the requested item and determines its current channel location. Only then is a supply boat dispatched to retrieve it.

The integration between Open Wings and EVERYTHING is considered one of New Berlin’s fundamental logistical systems—often compared to the relationship between data networks and physical transport networks in the Old World.

Open Wings enjoys widespread acceptance throughout New Berlin and is regarded as the preferred system for transmitting messages.

## Homing Pigeons


Homing pigeons possess magnetic receptors in their heads and beaks, which make them sensitive to the Earth’s magnetic field. They use the position of the sun and an internal clock to make course corrections. Furthermore, homing pigeons imprint on the scent patterns of their home region; in a figurative sense, they "smell" their way back home. In doing so, they also orient themselves by following the paths of rivers, road networks, large buildings, and distinct color patterns. Through carefully structured training flights, Ciao Von Bella even succeeded in teaching the "Open Wings" homing pigeons to recognize flags.

In experiments, homing pigeons are often able to locate their home loft with an accuracy of just a few meters—even from hundreds of kilometers away.

Homing pigeons do not navigate toward a specific *person*, but rather toward a *location* that they recognize as their home base. They cannot distinguish a person’s face from the air, nor can they fly toward a specific individual. They are unable to fly to unfamiliar recipients, nor can they identify specific human beings from the air.

Through flock behavior, internal hierarchies, and the distribution of roles (such as lead birds and follower birds), homing pigeons are capable of organizing themselves. "Flock hubs" can serve as gathering points where the pigeons rest; at these locations, messages may be collected or passed on. By using scent markers, the pigeons can align themselves with different "communication channels."---

## Topology of Flight Routes

Each neighborhood maintains **pigeon lofts**, comparable to the "server nodes" of the old internet. Each pigeon knows exactly *one loft* to which it always returns. Messages are transported as **physical data packets** (scrolls of paper, capsules).

Since pigeons can only fly *home*, intermediate stops are necessary—much like a "hop-by-hop" transmission in the old internet. For instance, to transport a message from Treptow to Prenzlauer Berg, pigeons—which may not know the entire route home—must head to intermediate stops (i.e., their own home lofts). At these points, the message is handed off to the next carrier pigeon, which then sets off for the next loft.

The rule here is: 1 segment = 1 pigeon.

---

## Routing

Messages are passed between **pigeon lofts** distributed throughout "Neu Berlin." Because carrier pigeons always return to their home loft, the actual route planning is handled by humans. Consequently, every station keeps up-to-date maps of all reachable lofts, as well as information regarding blocked waterways, collapsed buildings, or temporarily relocated stations.

## Error Correction

Occasionally, a message might go missing. The carrier pigeon—having done its absolute best—will naturally feel sorry about this. Nevertheless, to be on the safe side, you can dispatch multiple pigeons with the same message (creating backup copies). This minimizes the risk of a message being lost.

---

## The Pigeon Network of EVERYTHING

Every major station houses several pigeon lofts. The pigeons kept at each location belong to different stations:

If a package needs to go from Köpenick to Wedding, no single pigeon needs to know both locations:

The package is transferred at each station. The pigeons act as the **links**, the lofts serve as the **routers**, and humans or mechanical sorting systems execute the algorithm.

### Distance Vector: Each station only knows its neighbors

Every station maintains a handwritten **routing table**:

|Destination|Next Loft|Estimated Duration|
|---|---|---|
|Wedding|Alexanderhafen|70 minutes|
|Spandau|Moabitdock|110 minutes|
|Köpenick|Treptower Schleuse|95 minutes|

The station does not need to know the entire network. It simply asks:

> "Which of my neighbors is most likely to bring the package closer to its destination?"

This corresponds to a distance-vector approach—a distributed version of the Bellman-Ford algorithm. Real-world routing protocols, such as Babel, are built on this principle and include mechanisms to prevent routing loops.

In "New Berlin," these tables could be updated once a day via courier messages. An entry might look like this:

Problems arise if a station fails while others still hold outdated information; a package could end up being sent in circles. To prevent this, every container includes a **hop counter**: after, say, six transfers, it is no longer forwarded but instead sent to the "EVERYTHING" lost-and-found office.

### Link-State Routing: The comprehensive network map

Larger, more affluent hub stations could operate based on the OSPF principle. Each station regularly reports:

- which connections are open,
- how many pigeons are available,
- which flight corridors are obstructed by storms, smoke, or birds of prey,
- the current transit time. These reports are used to construct a complete map of the network. Each main station then calculates the most efficient route for itself. Link-state protocols operate on this very principle: nodes exchange status information and subsequently calculate the shortest paths.

In New Berlin, the process could look something like this:

- Each station records its status onto a thin card.
- Carrier pigeons distribute copies to all main stations.
- Cartographers update the data on large brass boards.
- Weights are adjusted using movable markers.
- A mechanical route calculator—or Fibo himself—determines the paths.

While slower than digital routing, this method would be remarkably robust.

### Flooding: Broadcasting to Everyone in an Emergency

In the event of a storm surge, an epidemic, or an attack, a message is not routed to a specific destination. Instead, each station forwards it to **all neighboring stations**, which in turn pass it on.

This is known as "flooding."

To prevent the same message from circulating indefinitely, it is assigned:

- a unique serial number,
- a timestamp,
- a maximum number of forwards.

Each station checks: "Have I already seen message 7-114-B?" If so, it is not forwarded again.

This approach is suitable for:

- evacuation warnings,
- reports of missing ships,
- water contamination,
- fires,
- manhunts by the Sentinel Seven,
- public announcements.

The downside: flooding consumes a great many pigeons.