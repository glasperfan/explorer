
# Explorer

![image](https://user-images.githubusercontent.com/6545534/82131862-63e88b00-979f-11ea-97a7-f251fc1c7e50.png)

Explorer parses the game transaction log in colonist.io to keep track of which player has which resources. 
No data is used to determine this that isn't clearly visible in the game.

In the event that a player robs another player, and you aren't involved in it, it may be unknown which resource
was stolen. Explorer will automatically keep track of this and show you. For example, "1 (2)" means that the player
has 1 of that resource, unless they stole one of that resource, in which case they would have 2. As more plays are made, Explorer figures out what was in fact stolen and updates the table accordingly. 

**Note that Explorer will not run unless it's left open for the entire game.** Refreshing or reconnecting to the
game will clear the transaction log, making it impossible to re-calculate the player resource distribution.

Feel free to report any bug and/or PR a fix!
