checkSignIn('../login.html');
function pageInit() {
    var canvas = document.getElementById('canvas'), context = canvas.getContext('2d');
    var pinImage = document.getElementById('pin'), wheelImage = document.getElementById('wheel');
    var angle = Math.random() * 6.26, angle_velocity = 0.2;

    document.getElementById('canvas').style.display = 'block';
    function drawwheel() {
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.save();
        context.translate(canvas.width/2, canvas.height/2);
        context.rotate(angle);
        context.drawImage(wheelImage, - wheelImage.width/2,
            - wheelImage.height/2);
        context.restore();
        context.drawImage(pinImage, canvas.width/2 - pinImage.width/2, 
            canvas.height/2 - pinImage.height/2 - 150);
    }
    function pickrandomwin() {
        if (0.99 < Math.random()) {
            document.getElementById('winscreen').style.display = 'block';
            var random_win = Math.random(), comestic_win = undefined;
            if (0.33 < random_win) {
                comestic_win = 1;
            }
            else if (0.66 < random_win) {
                comestic_win = 2;
            }
            else {
                comestic_win = 3;
            }
            var settings = {
                "async": true,
                "crossDomain": true,
                "url": "https://ngeeannpolyshop-1312.restdb.io/rest/session?q=" + 
                    JSON.stringify({ session_token : localStorage.getItem('session_id') }),
                "method": "GET",
                "headers": {
                  "content-type": "application/json",
                  "x-apikey": "61ef47c9b12f6e7084f734db",
                  "cache-control": "no-cache"
                }
            }
              
            $.ajax(settings).done(function (response) {
                if (1 == response.length) {
                    var playerid = response[0].customer_id;
                    var jsondata = { cosmetic_id : comestic_win, customer_id : player_id }
                    var settings = {
                        "async": true,
                        "crossDomain": true,
                        "url": "https://ngeeannpolyshop-1312.restdb.io/rest/customer-cosmetic",
                        "method": "POST",
                        "headers": {
                            "content-type": "application/json",
                            "x-apikey": "61ef47c9b12f6e7084f734db",
                            "cache-control": "no-cache"
                        },
                        "processData": false,
                        "data": JSON.stringify(jsondata)
                    }
                    $.ajax(settings).done(function (response) {
                        console.log(response);
                    });
                }
            });
        }
        document.getElementById('losescreen').style.display = 'block';
    }
    function draweventloop() {
        drawwheel();
        angle += angle_velocity;
        angle_velocity -= 0.0002;
        if (angle_velocity > 0) window.requestAnimationFrame(draweventloop);
        else pickrandomwin();
    }
    drawwheel();
    document.getElementById('startingscreen').style.display = 'block';
    function spinwheelonSpace(e) {
        if (' ' == e.key ) {
            e.preventDefault();
            document.getElementById('startingscreen').style.display = 'none';
            window.requestAnimationFrame(draweventloop);
            window.removeEventListener('keyup', spinwheelonSpace);
        }
    }
    window.addEventListener('keyup', spinwheelonSpace);
}
window.addEventListener('load', pageInit);