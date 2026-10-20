---
title: Wolke 7000
publish: true
tags:
---


![[poster_4.png]]



This time, we'll start our dialogue system different. We need a state-machine first. Every character of wolke7000 will uses his state-machine 


## [[NIMBUS|Start Game]] 


---

![[koko_third.png]]


>[!tip]
> You havent visited [[Kokolores]] on the NIMBUS yet. 



Let's take a different approach of making dialogue happen in wolke7000. Let's add character states to our runtime, one state per character: Ajax, Ciao, Fibo, Funky, Gojan, Koko, Mia, Nero, Brah, Solo, Spasti.

Each state follows the structure:

```
characters.koko = {
  relationship: 4,
  metPlayer: true,
  flags: {
    hasBeenVisited: false,
    trustsPlayer: true,
  }
}
```

We want to trigger worldEvents, like "player-entered-nimbus" and let the runtime ask "has player been here before"?

If no: 

```
start koko-nimbus-first-welcome
mark NIMBUS visited
inform Koko/Fibo/Spasti state
```

Please extend worldEvents for places and Ships. 




---








---


## About


Made by [markus6000.com](https://markus6000.com)


