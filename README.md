
# Explorer

Explorer parses the game transaction log in colonist.io to keep track of which player has which resources. 
No data is used to determine this that isn't clearly visible in the game.

In the event that a player robs another player, and you aren't involved in it, it may be unknown which resource
was stolen. Explorer will automatically keep track of this and show you. For example, "1 (2)" means that the player
has 1 of that resource, unless they stole one of that resource, in which case they would have 2. As more plays are made, Explorer figures out what was in fact stolen and updates the table accordingly. 

**Note that Explorer will not run unless it's left open for the entire game.** Refreshing or reconnecting to the
game will clear the transaction log, making it impossible to re-calculate the player resource distribution.

Feel free to report any bug and/or PR a fix!



## Thinking through the robber.

Say there are 3 players. Player 1 is robbed twice, once by Player 2 and once by Player 3.
Given initial resources, Player 1's row will look like:

* Ore: 3 (1)
* Grain: 1 (-1)
* Wool: 1 (-1)
* Brick: 0
* Lumber: 0

How can we "solve" the resource taken in this theft? Let's first focus on Player 1's actions. 

If Player 1 buys a dev card, their row looks like:

* Ore: 2 (0)
* Grain: 0 (-2)
* Wool: 0 (-2)
* Brick: 0
* Lumber: 0

The only way P1 could have done this is if both P2 and P3 had stolen ore. How do we encode this mathematically?

We say "if the player builds something that requires"