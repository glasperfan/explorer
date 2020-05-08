
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
deleteDiscordSigns();


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
    var images = collectionToArray(pElement.getElementsByTagName('img'));
    var player = textContent.replace(receivedResourcesSnippet, "").split(" ")[0];
    if (!resources[player]) {
        console.log("Failed to parse player...", player, resources);
    }
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

var ALL_PARSERS = [
    parseGotMessage,
    parseBuiltMessage,
    parseBoughtMessage,
    parseTradeBankMessage,
];

/**
 * Parses the latest messages and re-renders the table.
 */
function parseLatestMessages() {
    var allMessages = getAllMessages();
    var newOffset = allMessages.length;
    var newMessages = allMessages.slice(MSG_OFFSET);
    ALL_PARSERS.forEach(parser => newMessages.forEach(parser));
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
    render();
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
