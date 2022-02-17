function webSocketInit() {
    var websocket;
    var serverUrl = "ws://localhost:8080";
    playerid = "61f0c9136aa50d6b00343f48";

    websocket = new WebSocket(serverUrl);
    websocket.addEventListener('open', function() {
        console.log('websocket opened.');
    }) 
    websocket.addEventListener("message", function(message) {
        var object = JSON.parse(message.data);
        switch (object.type) {
            case 'verify_player_id':
                websocket.send(JSON.stringify({ type: 'verify_player_id', player_id : playerid }));
                break;
            case 'multiplayer_join':
                setButtonState(!object.startFirst);
                break;
            case 'verified':
                if (object.result) {
                    websocket.send(JSON.stringify({ type: 'verify_acknowledged' }));
                }
                break;
            case 'update_enemy':
                console.log('enemy new health: ' + object.enemy_new_health);
                setButtonState(true);
                break;
            case 'update_self':
                console.log('self new health: ' + object.new_health);
                setButtonState(false);
                break;
        }
        console.log('Message: ' + message.data);
    });
    websocket.addEventListener("close", function() {
        console.log('websocket closed!');
    });
    function setButtonState(disabled) {
        for (var i=1; i<4; i++) {
            document.getElementById('skill_' + i).disabled = disabled;
        }
    }
    function sendSkillIndex(skillIndex) {
        if (websocket.readyState === WebSocket.OPEN) {
            websocket.send(JSON.stringify({ type : 'proc_skill', skill_index : skillIndex }));
        }
        else {
            console.log('sendSkillIndex: websocket is closed!');
        }
    }
    document.getElementById('skill_1').addEventListener('click', function(e) {
        e.preventDefault();
        sendSkillIndex(1);
    });
    document.getElementById('skill_2').addEventListener('click', function(e) {
        e.preventDefault();
        sendSkillIndex(2);
    });
    document.getElementById('skill_3').addEventListener('click', function(e) {
        e.preventDefault();
        sendSkillIndex(3);
    })
}

window.addEventListener('load', webSocketInit)