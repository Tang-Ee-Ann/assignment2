var playerid = undefined;
var websocket = undefined;
var gameid = undefined;
function sendskillIndex(skillIndex) {
    if (websocket.readyState == WebSocket.OPEN) {
        console.log('sending skill!');
        websocket.send(JSON.stringify({ type : 'proc_skill', game_id : gameid, player_id : playerid, skill_index : skillIndex }));
    }
    else {
        console.log('sendSkillIndex: websocket is closed!');
    }
}
checkSignIn('../login.html');
var settings = {
    "async": true,
    "crossDomain": true,
    "url": "https://ngeeannpolyshop-1312.restdb.io/rest/session?q=" + 
        JSON.stringify({ session_id : Number(localStorage.getItem('session_id')) }),
    "method": "GET",
    "headers": {
      "content-type": "application/json",
      "x-apikey": "61ef47c9b12f6e7084f734db",
      "cache-control": "no-cache"
    }
}
  
$.ajax(settings).done(function (response) {
    console.log(response);
    if (1 == response.length) playerid = response[0].customer_id;
});

var comesticid = 0;
function hideScreens() {
    var screens = document.getElementsByClassName('gamelayer');
    console.log(screens);
    for (var i=0; i < screens.length; i++) screens[i].style.display = 'none';
}
function showScreen(screenid) {
    var screen = document.getElementById(screenid);
    screen.style.display = 'block';
}
function hideScreen(screenid) {
    var screen = document.getElementById(screenid);
    screen.style.display = 'none';
}
function setButtonState(isDisabled) {
    var buttons = document.getElementsByClassName('skill');
    for (var i=0; i<buttons.length; i++) {
        buttons[i].disabled = isDisabled;
    }
}
function gobacktoMenu() {
    hideScreens();
    showScreen('startingscreen');
}
function selectCharacter() {
    hideScreen('startingscreen');
    var character_select = document.getElementById('character-flex-select');
    var get_comestic_ids = {
        "async": true,
        "crossDomain": true,
        "url": "https://ngeeannpolyshop-1312.restdb.io/rest/customer-cosmetic?q=" + JSON.stringify({_id : playerid }),
        "method": "GET",
        "headers": {
          "content-type": "application/json",
          "x-apikey": "61ef47c9b12f6e7084f734db",
          "cache-control": "no-cache"
        }
      }
      var button = document.createElement('button');
      button.classList.add('character-img-flex');
      button.addEventListener('click', function(e) {
          e.preventDefault();
          hideScreen('character-selectionscreen'); showScreen('startingscreen');
          comesticid = 0;
          character_select.innerHTML = '';
      });
      button.style.background = "url('client_resources/default-mage-character.png')";
      character_select.appendChild(button)
      $.ajax(get_comestic_ids).done(function (response) {
        for (var i=0; i<response.length; i++) {
            button = document.createElement('button');
            var j = i +0;
            switch (response[j].cosmetic_id) {
                case 1:
                    button.style.background = "url('client_resources/mage-character-1.png')";
                    break;
                case 2:
                    button.style.background = "url('client_resources/mage-character-2.png')";
                    break;
                case 3:
                    button.style.background = "url('client_resources/mage-character-3.png')";
                    break;
            }
            button.classList.add('character-img-flex');
            button.addEventListener('click', function(e) {
                e.preventDefault();
                hideScreen('character-selectionscreen'); showScreen('startingscreen');
                comesticid = response[j].cosmetic_id;
                character_select.innerHTML = '';
            });
            character_select.appendChild(button);
        }
        showScreen('character-selectionscreen');
      });
}
function pageInit() {
    var canvas = document.getElementById('gamecanvas'), context = canvas.getContext('2d');
    const default_mage_character = document.getElementById('mage-character-0'), mage_character_1 = document.getElementById('mage-character-1'), 
        mage_character_2 = document.getElementById('mage-character-2'), mage_character_3 = document.getElementById('mage-character-3');
    class Vector2F {
        constructor (x, y) {
            this.x = x; this.y = y;
        }
        translate(vec) {
            return new Vector2F(this.x + vec.x, this.y + vec.y);
        }
    }
    const BASE_HEIGHT = 600, playerselfPosition = new Vector2F(170, BASE_HEIGHT), playerenemyPosition = new Vector2F(canvas.width - 180, BASE_HEIGHT), 
        HEALTH_BAR_DIM = { dx : 120, dy : 10 }, HEALTH_DROP_SPEED = 0.003, ENTITY_TO_HEALTH_BAR_OFFSET = new Vector2F(-35, -35),
        ENTITY_DIM = { dx : 50, dy : 100 };
    class Animation {
        static AnimationQuene = [];
        constructor (asyncFunction, userdata) {
            this.asyncFunction = asyncFunction; this.userdata = userdata;
            this.userdata['self'] = this;
            Animation.addNewAnimation(this);
        }
        static addNewAnimation(animation) {
            for (var i=0; i<Animation.AnimationQuene.length; i++) {
                if ('undefined' == typeof(Animation.AnimationQuene[i])) {
                    Animation.AnimationQuene[i] = animation;
                }
            }
            Animation.AnimationQuene.push(animation);
        }
        static async paintAnimations() {
            for (var i=0; i <Animation.AnimationQuene.length; i++) {
                if (undefined !== Animation.AnimationQuene[i]) {
                    Animation.AnimationQuene[i].asyncFunction(Animation.AnimationQuene[i].userdata)
                }
            }
        }
        completeAnimation() {
            for (var i=0; i<Animation.AnimationQuene.length; i++) {
                if (this == Animation.AnimationQuene[i]) {
                    delete Animation.AnimationQuene[i]; return;
                }
            }
        }
    }
    class HealthBarAnimation extends Animation {
        constructor(vectorPos, maxHealth, currentHealth, newHealth) {
            vectorPos = vectorPos.translate(ENTITY_TO_HEALTH_BAR_OFFSET);
            var userdata = {'vectorPos': vectorPos,'currentHealthRatio' : currentHealth/(maxHealth * 1.0),
            'newHealthRatio' : newHealth/(maxHealth * 1.0)};
            
            context.save(); context.fillStyle = 'orange';
            context.fillRect(vectorPos.x + userdata['newHealthRatio'] * HEALTH_BAR_DIM.dx, vectorPos.y,
                (userdata['currentHealthRatio'] - userdata['newHealthRatio']) * HEALTH_BAR_DIM.dx,
                HEALTH_BAR_DIM.dy);
            context.restore();
    
            super(HealthBarAnimation.HealthBarAnimationProc, userdata);
        }
        static HealthBarAnimationProc(healthBarAnimationInfo) {
            var diff = HEALTH_DROP_SPEED;
            if (healthBarAnimationInfo['currentHealthRatio'] - 0.01 < healthBarAnimationInfo['newHealthRatio']) {
                diff = healthBarAnimationInfo['currentHealthRatio'] - healthBarAnimationInfo['newHealthRatio'];
                healthBarAnimationInfo['currentHealthRatio'] = healthBarAnimationInfo['newHealthRatio'];
            }
            else {
                healthBarAnimationInfo['currentHealthRatio'] -= HEALTH_DROP_SPEED;
            }
            
            context.save(); context.fillStyle = 'red';
            context.fillRect(healthBarAnimationInfo['vectorPos'].x + healthBarAnimationInfo['currentHealthRatio'] * HEALTH_BAR_DIM.dx,
            healthBarAnimationInfo['vectorPos'].y, diff * HEALTH_BAR_DIM.dx, HEALTH_BAR_DIM.dy);
            context.restore();
    
            if (healthBarAnimationInfo['currentHealthRatio'] == healthBarAnimationInfo['newHealthRatio']) {
                healthBarAnimationInfo['self'].completeAnimation();
            }
        }
    }
    var playerself = undefined, playerself_max = undefined, playerenemy = undefined,
        playerenemy_max = undefined; enemy_comestic_id = undefined;

    function gameInit(startingInfo) {
        playerself = startingInfo.health; playerenemy = startingInfo.enemy_health;
        playerself_max = playerself; playerenemy_max = playerenemy; enemy_comestic_id = startingInfo.enemy_comestic_id;
        context.save(); context.fillStyle = 'grey';
        var playerselfhealthbarpos = playerselfPosition.translate(ENTITY_TO_HEALTH_BAR_OFFSET),
            playerenemyhealthbarpos = playerenemyPosition.translate(ENTITY_TO_HEALTH_BAR_OFFSET);
            console.log (default_mage_character);
        function drawPlayer(vectorpos, comestic_id) {
            switch(comestic_id) {
                case 0:
                    context.drawImage(default_mage_character, vectorpos.x, vectorpos.y);
                    break;
                case 1:
                    context.drawImage(mage_character_1, vectorpos.x, vectorpos.y);
                    break;
                case 2:
                    context.drawImage(mage_character_2, vectorpos.x, vectorpos.y);
                    break;
                case 3:
                    context.drawImage(mage_character_3, vectorpos.x, vectorpos.y);
                    break;
            }
        }
        drawPlayer(playerselfPosition, comesticid);
        context.save(); context.translate(50, 0); context.scale(-1, 1);
        drawPlayer( { x: -playerenemyPosition.x, y: playerenemyPosition.y }, enemy_comestic_id);
        context.restore();

        context.fillStyle = 'green';
        context.fillRect(playerselfhealthbarpos.x, playerselfhealthbarpos.y, HEALTH_BAR_DIM.dx, HEALTH_BAR_DIM.dy);
        context.fillRect(playerenemyhealthbarpos.x, playerenemyhealthbarpos.y, HEALTH_BAR_DIM.dx, HEALTH_BAR_DIM.dy);
        context.restore();
        
        // game Info here!
        function gameloop() {
            Animation.paintAnimations();
            window.requestAnimationFrame(gameloop);
        }
        window.requestAnimationFrame(gameloop);
    }
    
    hideScreens();
    showScreen('startingscreen');
    document.getElementById('multiplayer-button').addEventListener('click', function(e) {
        e.preventDefault();
        hideScreen('startingscreen');
        showScreen('loadingscreen');
        var serverUrl = "ws://localhost:8080";

        websocket = new WebSocket(serverUrl);
        var websocketcloseEvent = function() {
            hideScreens();
            showScreen('startingscreen');
        };
        websocket.addEventListener('open', function() {
        console.log('websocket opened.');
        });
        websocket.addEventListener("message", function(message) {
            var gameMessage = JSON.parse(message.data);
            switch (gameMessage.type) {
                case 'verify_player_id':
                    websocket.send(JSON.stringify({ type: 'verify_player_id', player_id : playerid, comestic_id : comesticid }));
                    break;
                case 'multiplayer_join':
                    gameid = gameMessage.multiplayerRoom_id;
                    console.log(gameid);
                    setButtonState(!gameMessage.startFirst);
                    hideScreen('loadingscreen'); showScreen('gamescreen'); gameInit(gameMessage.startingInfo);
                    break;
                case 'verified':
                    if (gameMessage.result) websocket.send(JSON.stringify({ type: 'verify_acknowledged' }));
                    else {
                        hideScreen('loadscreening'); showScreen('startingscreen');
                    }
                    break;
                case 'update_enemy':
                    var healthanimation = new HealthBarAnimation(playerenemyPosition, playerenemy_max, playerenemy, gameMessage.enemy_new_health);
                    setButtonState(true);
                    playerenemy =  gameMessage.enemy_new_health;
                    break;
                case 'update_self':
                    var healthanimation = new HealthBarAnimation(playerselfPosition, playerself_max, playerself, gameMessage.new_health);
                    setButtonState(false);
                    playerself =  gameMessage.new_health;
                    break;
                case 'win_status':
                    if (undefined == gameMessage.win_status) {
                        hideScreen('gamescreen'); showScreen('startingscreen');
                        break;
                    }
                    websocket.removeEventListener('close', websocketcloseEvent);
                    document.getElementById('endingStatusMessage').textContent = gameMessage.win_status ? 'Victory' : 'Defeat';
                    showScreen('endingscreen');
                    websocket.send(JSON.stringify({ type : 'win_acknowledged' }));
                    break;
            }
        });
        websocket.addEventListener('close', websocketcloseEvent);
        
    });
}
window.addEventListener('load', pageInit);