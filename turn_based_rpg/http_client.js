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
    showScreen('multiplayer-button');
}
function gobacktoQuene() {
    document.getElementById('multiplayer-button').dispatchEvent(new MouseEvent(
        'click', {
            "view": window,
            "bubbles": true,
            "cancelable": false
        }
    ))
}
function pageInit() {
    var canvas = document.getElementById('gamecanvas'), context = canvas.getContext('2d');
    class Vector2F {
        constructor (x, y) {
            this.x = x; this.y = y;
        }
        translate(vec) {
            return new Vector2F(this.x + vec.x, this.y + vec.y);
        }
    }
    const BASE_HEIGHT = 500, playerselfPosition = new Vector2F(170, BASE_HEIGHT), playerenemyPosition = new Vector2F(canvas.width - 180, BASE_HEIGHT), 
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
        playerenemy_max = undefined;
    function gameInit(startingInfo) {
        playerself = startingInfo.health; playerenemy = startingInfo.enemy_health;
        playerself_max = playerself; playerenemy_max = playerenemy;
        context.save(); context.fillStyle = 'grey';
        var playerselfhealthbarpos = playerselfPosition.translate(ENTITY_TO_HEALTH_BAR_OFFSET),
            playerenemyhealthbarpos = playerenemyPosition.translate(ENTITY_TO_HEALTH_BAR_OFFSET);
        context.fillRect(playerselfPosition.x, playerselfPosition.y, ENTITY_DIM.dx, ENTITY_DIM.dy);
        context.fillRect(playerenemyPosition.x, playerenemyPosition.y, ENTITY_DIM.dx, ENTITY_DIM.dy);
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
    showScreen('multiplayer-button');
    document.getElementById('multiplayer-button').addEventListener('click', function(e) {
        e.preventDefault();
        hideScreen('multiplayer-button');
        showScreen('loadingscreen');
        var serverUrl = "ws://localhost:8080";
        playerid = "61f0c9136aa50d6b00343f48";

        var websocket = new WebSocket(serverUrl);
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

        websocket.addEventListener('open', function() {
        console.log('websocket opened.');
        });
        websocket.addEventListener("message", function(message) {
            var gameMessage = JSON.parse(message.data);
            switch (gameMessage.type) {
                case 'verify_player_id':
                    websocket.send(JSON.stringify({ type: 'verify_player_id', player_id : playerid }));
                    break;
                case 'multiplayer_join':
                    gameid = gameMessage.multiplayerRoom_id;
                    console.log(gameid);
                    setButtonState(!gameMessage.startFirst);
                    hideScreen('loadingscreen'); showScreen('gamescreen'); gameInit(gameMessage.startingInfo);
                    for (var i=1; i<4; i++) {
                        var copyi = JSON.parse(JSON.stringify(i));
                        document.getElementById('skill_' + copyi).addEventListener('click', function(e) {
                            e.preventDefault();
                            sendskillIndex(copyi);
                        }) 
                    }
                    break;
                case 'verified':
                    if (gameMessage.result) websocket.send(JSON.stringify({ type: 'verify_acknowledged' }));
                    else {
                        hideScreen('loadscreening'); showScreen('multiplayer-button');
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
                    document.getElementById('endingStatusMessage').textContent = gameMessage.win_status ? 'Victory' : 'Defeat';
                    showScreen('endingscreen');
                    break;
            }
        });
        websocket.addEventListener('close', function() {
            hideScreens();
            showScreen('multiplayer-button');
        })
        
    });
}

window.addEventListener('load', pageInit);
function testing() {
    var canvas = document.getElementById('gamecanvas'), context = canvas.getContext('2d');
    hideScreens();
    document.getElementById('endingStatusMessage').textContent = 'Victory';
    //context.fillRect(0, 0, canvas.width, canvas.height);
}
//window.addEventListener('load', testing);