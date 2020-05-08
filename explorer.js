
console.log("STARTED...");

var logElement;
var initialPlacementMade = false;
var initialPlacementDoneMessage = "Giving out starting resources";
var placeInitialSettlementSnippet = "turn to place";
var receivedResourcesSnippet = "got:";
var builtSnippet = "built a";
var boughtSnippet = " bought ";
var tradeBankGaveSnippet = "gave bank:";
var tradeBankTookSnippet = "and took";
var stoleAllOfSnippet = "stole all of";
var discardedSnippet = "discarded";
var tradedWithSnippet = " traded with: ";
var tradeWantsToGiveSnippet = "wants to give:";
var tradeGiveForSnippet = "for:";
var stoleFromYouSnippet = "stole:";
var stoleFromSnippet = " stole  from: "; // extra space from icon

var wood = "wood";
var stone = "stone";
var wheat = "wheat";
var brick = "brick";
var sheep = "sheep";
var resourceTypes = [wood, stone, wheat, brick, sheep];

// Players
var players = [];

// Per player per resource
var resources = {};

// Message offset
var MSG_OFFSET = 0;

// First, delete the discord signs
function deleteDiscordSigns() {
    var allPageImages = document.getElementsByTagName('img'); 
    for(var i = 0; i < allPageImages.length; i++) {
        if (allPageImages[i].src.includes("discord")) {
            allPageImages[i].remove();
        }
    }
}


/**
* Renders the table with the counts.
*/
function render() {
    var existingTbl = document.getElementById("explorer");
    try {
        if (existingTbl) {
            existingTbl.remove();
        }
    } catch (e) {
        console.warning("had an issue deleting the table", e);
    }
    var body = document.getElementsByTagName("body")[0];
    var tbl = document.createElement("table");
    tbl.id = "explorer";
    
    // Header row - one column per resource, plus player column
    var header = tbl.createTHead();
    var headerRow = header.insertRow(0);
    var playerHeaderCell = headerRow.insertCell(0);
    playerHeaderCell.innerHTML = "<b>Player</b>";
    for (var i = 0; i < resourceTypes.length; i++) {
        var resourceType = resourceTypes[i];
        var resourceHeaderCell = headerRow.insertCell(i + 1);
        resourceHeaderCell.innerHTML = resourceType;
    }

    // Row per player
    for (var i = 0; i < players.length; i++) {
        var player = players[i];
        var row = tbl.insertRow(i + 1); // +1, after header row
        var playerRowCell = row.insertCell(0);
        playerRowCell.innerHTML = player;
        for (var j = 0; j < resourceTypes.length; j++) {
            var cell = row.insertCell(j + 1);
            var resourceType = resourceTypes[j];
            cell.innerHTML = "" + resources[player][resourceType];
        }
    }

    // put <table> in the <body>
    body.appendChild(tbl);
    // tbl border attribute to 
    tbl.setAttribute("border", "2");
}

/**
* Process a "got resource" message: [user icon] [user] got: ...[resource images]
*/
function parseGotMessage(pElement) {
    var textContent = pElement.textContent;
    if (!textContent.includes(receivedResourcesSnippet)) {
        return;
    }
    var player = textContent.replace(receivedResourcesSnippet, "").split(" ")[0];
    if (!resources[player]) {
        console.log("Failed to parse player...", player, resources);
        return;
    }
    var images = collectionToArray(pElement.getElementsByTagName('img'));
    for (var img of images) {
        if (img.src.includes("card_wool")) {
            resources[player][sheep] += 1;
        } else if (img.src.includes("card_lumber")) {
            resources[player][wood] += 1;
        } else if (img.src.includes("card_brick")) {
            resources[player][brick] += 1;
        } else if (img.src.includes("card_ore")) {
            resources[player][stone] += 1; 
        } else if (img.src.includes("card_grain")) {
            resources[player][wheat] += 1;
        }
    }
}

/**
 * Process a "built" message: [user icon] [user] built a [building/road]
 */
function parseBuiltMessage(pElement) {
    var textContent = pElement.textContent;
    if (!textContent.includes(builtSnippet)) {
        return;
    }
    var images = collectionToArray(pElement.getElementsByTagName('img'));
    var player = textContent.split(" ")[0];
    if (!resources[player]) {
        console.log("Failed to parse player...", player, resources);
        return;
    }
    for (var img of images) {
        if (img.src.includes("road")) {
            resources[player][wood] -= 1;
            resources[player][brick] -= 1;
        } else if (img.src.includes("settlement")) {
            resources[player][wood] -= 1;
            resources[player][brick] -= 1;
            resources[player][sheep] -= 1;
            resources[player][wheat] -= 1;
        } else if (img.src.includes("city")) {
            resources[player][stone] -= 3;
            resources[player][wheat] -= 2;
        }
    }
}

/**
 * Process a "bought" message: [user icon] [user] built
 */
function parseBoughtMessage(pElement) {
    var textContent = pElement.textContent;
    if (!textContent.includes(boughtSnippet)) {
        return;
    }
    var images = collectionToArray(pElement.getElementsByTagName('img'));
    var player = textContent.split(" ")[0];
    if (!resources[player]) {
        console.log("Failed to parse player...", player, resources);
        return;
    }
    for (var img of images) {
        if (img.src.includes("card_devcardback")) {
            resources[player][sheep] -= 1;
            resources[player][wheat] -= 1;
            resources[player][stone] -= 1;
        }
    }
}

/**
 * Process a trade with the bank message: [user icon] [user] gave bank: ...[resources] and took ...[resources]
 */
function parseTradeBankMessage(pElement) {
    var textContent = pElement.textContent;
    if (!textContent.includes(tradeBankGaveSnippet)) {
        return;
    }
    var player = textContent.split(" ")[0];
    if (!resources[player]) {
        console.log("Failed to parse player...", player, resources);
        return;
    }
    // We have to split on the text, which isn't wrapped in tags, so we parse innerHTML, which prints the HTML and the text.
    var innerHTML = pElement.innerHTML;
    var gavebank = innerHTML.slice(innerHTML.indexOf(tradeBankGaveSnippet), innerHTML.indexOf(tradeBankTookSnippet)).split("<img");
    var andtook = innerHTML.slice(innerHTML.indexOf(tradeBankTookSnippet)).split("<img");
    for (var imgStr of gavebank) {
        if (imgStr.includes("card_wool")) {
            resources[player][sheep] -= 1;
        } else if (imgStr.includes("card_lumber")) {
            resources[player][wood] -= 1;
        } else if (imgStr.includes("card_brick")) {
            resources[player][brick] -= 1;
        } else if (imgStr.includes("card_ore")) {
            resources[player][stone] -= 1; 
        } else if (imgStr.includes("card_grain")) {
            resources[player][wheat] -= 1;
        }
    }
    for (var imgStr of andtook) {
        if (imgStr.includes("card_wool")) {
            resources[player][sheep] += 1;
        } else if (imgStr.includes("card_lumber")) {
            resources[player][wood] += 1;
        } else if (imgStr.includes("card_brick")) {
            resources[player][brick] += 1;
        } else if (imgStr.includes("card_ore")) {
            resources[player][stone] += 1; 
        } else if (imgStr.includes("card_grain")) {
            resources[player][wheat] += 1;
        }
    }
}

function stealAllOfResource(receivingPlayer, resource) {
    for (var plyr of players) {
        if (plyr !== receivingPlayer) {
            resources[receivingPlayer][resource] += resources[plyr][resource];
            resources[plyr][resource] = 0;
        }
    }
}

/**
 * Parse monopoly card ("stole all of" some resource): [user] used [monopoly icon] & stole all of: [resource icon]
 */
function parseStoleAllOfMessage(pElement) {
    var textContent = pElement.textContent;
    if (!textContent.includes(stoleAllOfSnippet)) {
        return;
    }
    var player = textContent.split(" ")[0];
    if (!resources[player]) {
        console.log("Failed to parse player...", player, resources);
        return;
    }
    var images = collectionToArray(pElement.getElementsByTagName('img'));
    // there will only be 1 resource icon
    for (var img of images) {
        if (img.src.includes("card_wool")) {
            stealAllOfResource(player, sheep);
        } else if (img.src.includes("card_lumber")) {
            stealAllOfResource(player, wood);
        } else if (img.src.includes("card_brick")) {
            stealAllOfResource(player, brick);
        } else if (img.src.includes("card_ore")) {
            stealAllOfResource(player, stone);
        } else if (img.src.includes("card_grain")) {
            stealAllOfResource(player, wheat);
        }
    }
}

/**
 * When the user has to discard cards because of a robber.
 */
function parseDiscardedMessage(pElement) {
    var textContent = pElement.textContent;
    if (!textContent.includes(discardedSnippet)) {
        return;
    }
    var player = textContent.replace(receivedResourcesSnippet, "").split(" ")[0];
    if (!resources[player]) {
        console.log("Failed to parse player...", player, resources);
        return;
    }
    var images = collectionToArray(pElement.getElementsByTagName('img'));
    for (var img of images) {
        if (img.src.includes("card_wool")) {
            resources[player][sheep] -= 1;
        } else if (img.src.includes("card_lumber")) {
            resources[player][wood] -= 1;
        } else if (img.src.includes("card_brick")) {
            resources[player][brick] -= 1;
        } else if (img.src.includes("card_ore")) {
            resources[player][stone] -= 1; 
        } else if (img.src.includes("card_grain")) {
            resources[player][wheat] -= 1;
        }
    }
}

function tradeResource(srcPlayer, destPlayer, resource, quantity = 1) {
    resources[srcPlayer][resource] -= quantity;
    resources[destPlayer][resource] += quantity;
}

/**
 * Message T-1: [user1] wants to give: ...[resources] for: ...[resources]
 * Message T: [user1] traded with: [user2]
 */
function parseTradedMessage(pElement, prevElement) {
    var textContent = pElement.textContent;
    if (!textContent.includes(tradedWithSnippet)) {
        return;
    }
    var tradingPlayer = textContent.split(tradedWithSnippet)[0];
    var agreeingPlayer = textContent.split(tradedWithSnippet)[1];
    if (!resources[tradingPlayer] || !resources[agreeingPlayer]) {
        console.log("Failed to parse player...", tradingPlayer, agreeingPlayer, pElement.textContent, prevElement.textContent, resources);
        return;
    }
    // We have to split on the text, which isn't wrapped in tags, so we parse innerHTML, which prints the HTML and the text.
    var innerHTML = prevElement.innerHTML; // on the trade description msg
    var wantstogive = innerHTML.slice(innerHTML.indexOf(tradeWantsToGiveSnippet), innerHTML.indexOf(tradeGiveForSnippet)).split("<img");
    var givefor = innerHTML.slice(innerHTML.indexOf(tradeGiveForSnippet)).split("<img");
    for (var imgStr of wantstogive) {
        if (imgStr.includes("card_wool")) {
            tradeResource(tradingPlayer, agreeingPlayer, sheep);
        } else if (imgStr.includes("card_lumber")) {
            tradeResource(tradingPlayer, agreeingPlayer, wood);
        } else if (imgStr.includes("card_brick")) {
            tradeResource(tradingPlayer, agreeingPlayer, brick);
        } else if (imgStr.includes("card_ore")) {
            tradeResource(tradingPlayer, agreeingPlayer, stone);
        } else if (imgStr.includes("card_grain")) {
            tradeResource(tradingPlayer, agreeingPlayer, wheat);
        }
    }
    for (var imgStr of givefor) {
        if (imgStr.includes("card_wool")) {
            tradeResource(agreeingPlayer, tradingPlayer, sheep);
        } else if (imgStr.includes("card_lumber")) {
            tradeResource(agreeingPlayer, tradingPlayer, wood);
        } else if (imgStr.includes("card_brick")) {
            tradeResource(agreeingPlayer, tradingPlayer, brick);
        } else if (imgStr.includes("card_ore")) {
            tradeResource(agreeingPlayer, tradingPlayer, stone);
        } else if (imgStr.includes("card_grain")) {
            tradeResource(agreeingPlayer, tradingPlayer, wheat);
        }
    }
}

/**
 * Message T-1: [stealingPlayer] stole [resource] from: [targetPlayer]
 * Message T: [stealingPlayer] stole: [resource]
 */
function parseStoleFromYouMessage(pElement, prevElement) {
    var textContent = pElement.textContent;
    if (!textContent.includes(stoleFromYouSnippet)) {
        return;
    }
    var involvedPlayers = prevElement.textContent.replace(stoleFromSnippet, " ").split(" ");
    var stealingPlayer = involvedPlayers[0];
    var targetPlayer = involvedPlayers[1];
    if (!resources[stealingPlayer] || !resources[targetPlayer]) {
        console.log("Failed to parse player...", stealingPlayer, targetPlayer, resources);
        return;
    }
    var images = collectionToArray(pElement.getElementsByTagName('img'));
    for (var img of images) {
        if (img.src.includes("card_wool")) {
            tradeResource(targetPlayer, stealingPlayer, sheep);
        } else if (img.src.includes("card_lumber")) {
            tradeResource(targetPlayer, stealingPlayer, wood);
        } else if (img.src.includes("card_brick")) {
            tradeResource(targetPlayer, stealingPlayer, brick);
        } else if (img.src.includes("card_ore")) {
            tradeResource(targetPlayer, stealingPlayer, stone);
        } else if (img.src.includes("card_grain")) {
            tradeResource(targetPlayer, stealingPlayer, wheat);
        }
    }
}

var ALL_PARSERS = [
    parseGotMessage,
    parseBuiltMessage,
    parseBoughtMessage,
    parseTradeBankMessage,
    parseStoleAllOfMessage,
    parseDiscardedMessage,
    parseTradedMessage,
    parseStoleFromYouMessage,
];

/**
 * Parses the latest messages and re-renders the table.
 */
function parseLatestMessages() {
    var allMessages = getAllMessages();
    var newOffset = allMessages.length;
    var newMessages = allMessages.slice(MSG_OFFSET);
    ALL_PARSERS.forEach(parser => newMessages.forEach((msg, idx) => {
        var prevMessage = idx > 0 ? newMessages[idx - 1] : allMessages[MSG_OFFSET - 1];
        parser(msg, prevMessage);
    }));
    MSG_OFFSET = newOffset;
    render();
}

function startWatchingMessages() {
    setInterval(parseLatestMessages, 500);
}

/**
* Log initial resource distributions.
*/
function tallyInitialResources() {
    var allMessages = getAllMessages();
    MSG_OFFSET = allMessages.length;
    allMessages.forEach(parseGotMessage);
    deleteDiscordSigns();
    render();
    deleteDiscordSigns(); // idk why but it takes 2 runs to delete both signs
    startWatchingMessages();
}

/**
* Once initial settlements are placed, determine the players.
*/
function recognizeUsers() {
    var placementMessages = getAllMessages()
    .map(p => p.textContent)
    .filter(msg => msg.includes(placeInitialSettlementSnippet));
    console.log("total placement messages", placementMessages.length);
    for (var msg of placementMessages) {
        username = msg.replace(placeInitialSettlementSnippet, "").split(" ")[0];
        console.log(username);
        if (!resources[username]) {
            players.push(username);
            resources[username] = {
                [wood]: 0,
                [stone]: 0,
                [wheat]: 0,
                [brick]: 0,
                [sheep]: 0,
            };
        }
    }
    console.log(resources);
}

function loadCounter() {
    setTimeout(() => {
        recognizeUsers();
        tallyInitialResources();
    }, 500); // wait for inital resource distribution to be logged
}

function getAllMessages() {
    if (!logElement) {
        throw Error("Log element hasn't been found yet.");
    }
    return collectionToArray(logElement.children);
}

function collectionToArray(collection) {
    return Array.prototype.slice.call(collection);
}

/**
* Wait for players to place initial settlements so we can determine who the players are.
*/
function waitForInitialPlacement() {
    var interval = setInterval(() => {
        if (initialPlacementMade) {
            clearInterval(interval);
            loadCounter();
        } else {
            var messages = Array.prototype.slice.call(logElement.children).map(p => p.textContent);
            if (messages.some(m => m === initialPlacementDoneMessage)) {
                initialPlacementMade = true;
            }
        }
    }, 500);
}

/**
* Find the transcription.
*/
function findTranscription() {
    var interval = setInterval(() => {
        if (logElement) {
            console.log("Logs loaded...");
            clearInterval(interval);
            waitForInitialPlacement();
        } else {
            logElement = document.getElementById("game-log-text");
        }
    }, 500);
}


findTranscription();
