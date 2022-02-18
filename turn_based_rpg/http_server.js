const { throws } = require('assert');
const { createCanvas, loadImage } = require('canvas');
const { generateKey } = require('crypto');
const canvas = createCanvas(150, 300), ctx = canvas.getContext('2d');


const http = require('http'), fs = require('fs'), WebSocketServer = require('websocket').server,
    request = require('request');
var playersWaiting = [], multiplayerRooms = [];

const options_template = JSON.stringify({
    method : "GET",
    url : "https://ngeeannpolyshop-1312.restdb.io/rest/customer",
    headers: 
   { 'cache-control': 'no-cache',
     'x-apikey': 'cf334b5d66e8d2bc2414ed03e3b9615ec1728' }
});
class SkillInfo {
    constructor (skillName, targetType, skillProc) {
        this.skillName =skillName; this.targetType = targetType; this.skillProc = skillProc;
    }
}
class Player {
    constructor(player_id, websocket, level, comestic_id) {
        this.playerId = player_id; this.websocket = websocket;
        this._class = new Class('Mage', level); this.comesticId = comestic_id;
    }
}
class Class {
    constructor(className, level) {
        this.stats = cloneObject(template_class_stats[level - 1]); this.class = classes[className];
        this.statusEffects = [];
    }
    findstatusEffect(statusEffectName) {
        for (var i=0; i< this.statusEffects.length; i++) {
            if (statusEffectName == this.statusEffects[i]) {
                return i;
            }
        }
        return -1;
    }
    addstatusEffect(statusEffectName) {
        for (var i=0; i< this.statusEffects.length; i++) {
            if (undefined === this.statusEffects[i]) {
                this.statusEffects[i] = statusEffectName; return;
            }
        }
        this.statusEffects.push(statusEffectName);
    }
    applySkillEffects(enemy, skillIndex) {
        var skill = this.class.skills[skillIndex -1];
        var attackType = (undefined === skill.targetType) ? this.class.targetType : skill.targetType;
        switch (attackType) {
            case 'single': return skill.skillProc(this, enemy);
            case 'single-ally': return skill.skillProc(this);
            default:
                console.log("Invalid attackType!");
                break;
        }
    }
    dealDamage(entitycast, damage) {
        console.log('dealDamage: ' + this.stats.health);
        var combined_hitchance = (1.0 - this.stats.dodge_chance) * entitycast.stats.hit_chance;
        var doHit = Math.random() < combined_hitchance;
        if (doHit) {
            console.log("Is a hit!");
            var newHealth = Math.max(0, this.stats.health - damage);
            this.stats.health = newHealth;
        }
        else console.log("Is a miss!");
        return this.stats.health;
    }
}
class Mage {
    static fireBlastProc(entitycast, enemy) {
        var i = enemy.findstatusEffect('Frozen Blood'), damage = 432;         
        if (-1 != i)  {
            damage *= 1.75; delete enemy.statusEffects[i];
        }
        else {
            i = enemy.findstatusEffect('Scorched');
            if (-1 == i) enemy.addstatusEffect('Scorched');
        }
       return enemy.dealDamage(entitycast, damage);
    }
    static iceShardProc(entitycast, enemy) {
        var i = enemy.findstatusEffect('Scorched'), damage = 321;
        if (-1 != i) {
            damage *= 1.25; delete enemy.statusEffects[i];
        }
        else {
            i = enemy.findstatusEffect('Frozen Blood');
            if (-1 == i) enemy.addstatusEffect('Frozen Blood');
        }
        return enemy.dealDamage(entitycast, damage);
    }
    static explosionProc(entitycast, enemy) {
        return enemy.dealDamage(entitycast, 421);
    }
}
class MutliplayerGame {
    constructor(player1, player2) {
        this.firstPlayerTurn = Math.random() < 0.5; this.multiplayerRoom_id = generateUniqueMultiplayerRoomId();
        this.player1 = player1; this.player2 = player2;
        this.player1.websocket.send(JSON.stringify({ type : 'multiplayer_join', multiplayerRoom_id : this.multiplayerRoom_id,
            startFirst : this.firstPlayerTurn, startingInfo : { health : this.player1._class.stats.health, enemy_health :
                this.player2._class.stats.health, enemy_comestic_id : this.player2.comesticId } }));
        this.player2.websocket.send(JSON.stringify({ type : 'multiplayer_join',multiplayerRoom_id : this.multiplayerRoom_id, 
            startFirst : !this.firstPlayerTurn, startingInfo : { health : this.player2._class.stats.health, enemy_health : 
                this.player1._class.stats.health, enemy_comestic_id : this.player1.comesticId } }));

        this.firstwinStatus = undefined;
    }
    closeMultiplayerGame() {
        this.player1.websocket.send(JSON.stringify({ type : 'win_status', win_status : this.firstwinStatus }))
        this.player2.websocket.send(JSON.stringify({ type : 'win_status', win_status : !this.firstwinStatus }))
        for (var i=0; i<multiplayerRooms.length; i++) {
            if (this == multiplayerRooms[i]) delete multiplayerRooms[i];
        }
        console.log(multiplayerRooms);
        console.log(playersWaiting);
    }
}
const template_class_stats = JSON.parse(fs.readFileSync('template_class.json'));
const classes = { "Mage" : { targetType : 'single', skills : [new SkillInfo('Fire Blast', 'single', Mage.fireBlastProc),
        new SkillInfo('Ice Shard', 'single', Mage.iceShardProc), new SkillInfo('Explosion', 'single', Mage.explosionProc)] },
    };
var server = http.createServer(function(request, response) {
    response.writeHead(200, { 'Content-Type': 'text/plain' }); response.end();
});
server.listen(8080, function() {
console.log('Server has started listening on port 8080');
});
var wsServer = new WebSocketServer({httpServer: server});
console.log(wsServer);

wsServer.on('request', function(request) {
    var websocket = request.accept();
    websocket.on("message", function(message) {
        if (message.type === "utf8") {
            var gameMessage = JSON.parse(message.utf8Data);
            switch (gameMessage.type) {
                case 'verify_player_id' :
                    searchDatabaseforvalidPlayerID(websocket, gameMessage.player_id, gameMessage.comestic_id);
                    break;
                case 'verify_acknowledged':
                    trymatchMaking();
                    break;
                case 'proc_skill':
                    console.log(gameMessage); console.log(gameMessage.game_id);
                    if (gameMessage.skill_index > -1 && gameMessage.skill_index < 4)
                        procSkill(websocket, gameMessage.game_id, gameMessage.player_id, gameMessage.skill_index);
                    else websocket.close(4000, 'Invalid websocket behaviour');
                    break;
                case 'win_acknowledged':
                    websocket.close(4001, 'win acknowledged by websocket');
                    break;
                default:
                    websocket.close(4000, 'Invalid websocket behaviour'); 
                    break;
            }
        }
    });
    websocket.send(JSON.stringify({ type: 'verify_player_id' }));
    websocket.on("close", function(reasonCode, description) {
        switch (reasonCode) {
            case 1001:
            case 4000:
                removePlayerFromQueneandGame(websocket);
                break;
        }
    });
});
function cloneObject(object) {
    return JSON.parse(JSON.stringify(object));
}
function randBigInt() {
    return Math.floor(Number.MAX_SAFE_INTEGER * Math.random());
}
function generateUniqueMultiplayerRoomId() {
    var isUnique = false, multiplayer_room_id;
    do {
        multiplayer_room_id = randBigInt();
        for (var i=0; i < multiplayerRooms.length; i++) {
            if (undefined != multiplayerRooms[i] && multiplayerRooms[i].multiplayerRoom_id == multiplayer_room_id)
                continue;
        }
        isUnique = true;
    } while (!isUnique);
    return multiplayer_room_id;
}
function removePlayerFromQueneandGame(websocket) {
    for (var i=0; i < playersWaiting.length;i++) {
        if (undefined !== playersWaiting[i] && playersWaiting[i].websocket == websocket) {
            console.log('player found in waiting quene! removing from quene...');
            delete playersWaiting[i]; return;
        }
    }
    for (var i=0;i < multiplayerRooms.length; i++) {
        if (undefined !== multiplayerRooms[i] && multiplayerRooms[i].player1.websocket == websocket
            || multiplayerRooms[i].player2.websocket) {
            console.log('player found in multiplayer room! removing and closing game...');
            multiplayerRooms[i].closeMultiplayerGame(); return;
        }
    }
}
function searchDatabaseforvalidPlayerID(websocket, player_id, comestic_id) {
    var get_ids_request = JSON.parse(options_template);
    get_ids_request.url += "?q=" + JSON.stringify({ "_id" : player_id})
    request(get_ids_request, function(error, response, body) {
        body = JSON.parse(body);
        if (0 === body.length) {
            websocket.send(JSON.stringify({ type : 'verified', result : false }))
            websocket.close();
        }
        else {
            addnewWaitingPlayer(new Player(player_id, websocket, body[0].Level, comestic_id));
            websocket.send(JSON.stringify({ type : 'verified', result : true }));
        }
    });
}
function addnewWaitingPlayer(player) {
    for (var i=0; i<playersWaiting.length; i++) {
        if (undefined === playersWaiting[i]) {
            playersWaiting[i] = player;
            console.log(playersWaiting);
            return;
        }
    }
    playersWaiting.push(player);
    console.log(playersWaiting);
}
function trymatchMaking() {
    var player1 = undefined, player2 = undefined;
    for (var i=0; i<playersWaiting.length; i++) {
        if (undefined !== playersWaiting[i]) {
            if (undefined == player1) player1 = i;
            else if (undefined == player2) player2 = i;
            else break;
        }
    }
    console.log(player1); console.log(player2);
    if (undefined === player1 || undefined === player2) {
        console.log('Failed to find player matchmaking!');
        return;
    }
    addnewMultiplayerRoom(new MutliplayerGame(playersWaiting[player1], playersWaiting[player2]));
    delete playersWaiting[player1]; delete playersWaiting[player2];
}
function addnewMultiplayerRoom(multiplayerRoom) {
    for (var i=0; i< multiplayerRooms.length; i++) {
        if (undefined === multiplayerRooms[i]) {
            multiplayerRooms[i] = multiplayerRoom; return;
        }
    }
    multiplayerRooms.push(multiplayerRoom);
    console.log(multiplayerRooms);
}
function procSkill(websocket, game_id, player_id, skillindex) {
    var multiplayerRoom = getMultiplayerGameFromID(game_id);
    var attackingPlayer = (multiplayerRoom.firstPlayerTurn ? multiplayerRoom.player1 : multiplayerRoom.player2),
        defendingPlayer = (multiplayerRoom.firstPlayerTurn ? multiplayerRoom.player2 : multiplayerRoom.player1);
    newHealth = attackingPlayer._class.applySkillEffects(defendingPlayer._class, skillindex);
    if (0 == newHealth) {
        multiplayerRoom.firstwinStatus = multiplayerRoom.firstPlayerTurn;
        multiplayerRoom.closeMultiplayerGame();
    }
    attackingPlayer.websocket.send(JSON.stringify({ type : 'update_enemy', enemy_new_health : newHealth }));
    defendingPlayer.websocket.send(JSON.stringify({ type : 'update_self', new_health : newHealth }))

    console.log(attackingPlayer._class.stats.health); console.log(defendingPlayer._class.stats.health);

    multiplayerRoom.firstPlayerTurn = !multiplayerRoom.firstPlayerTurn;
}
function getMultiplayerGameFromID(game_id) {
    for (var i=0;i<multiplayerRooms.length; i++) {
        if (undefined !== multiplayerRooms[i] && game_id == multiplayerRooms[i].multiplayerRoom_id) {
            return multiplayerRooms[i];
        }
    }
    return undefined;
}