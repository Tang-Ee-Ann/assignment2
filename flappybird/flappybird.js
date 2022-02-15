function gameInit() {
    var canvas = document.getElementById('canvas'),
        context = canvas.getContext('2d');

    const MOVEMENT_SPEED = -1.312, UPWARD_BOOST = -1.8, DEFAULT_ACCELERATION = 0.032, PIPE_GAP = 270, PIPE_START = 500,
    CANVAS_BUFFER =  1936; var isRunning = true;
    class Vector {
        constructor(x, y) {
            this.x = x; this.y = y;
        }
        translate (x, y) {
            return new Vector(this.x + x, this.y + y);
        }
    }

    class Rectangle {
        constructor(left, top, right, bottom) {
            this.left = left; this.top = top; this.right = right; this.bottom = bottom;
        }

        hasIntersection(rect) {
            return (this.left < rect.right &&
                this.top < rect.bottom &&
                this.right > rect.left &&
                this.bottom > rect.top);
        }

        hasIntersectionLine(y) {
            return this.top < y && this.bottom > y;
        }

        translate(X, Y) {
            this.left += X; this.right += X; this.top += Y; this.bottom += Y;
        }
    }

    class FlappyBird {
        constructor (startingPosition) {
            this.boundingBox = new Rectangle(startingPosition.x - 25, startingPosition.y -25,
                startingPosition.x + 25, startingPosition.y + 25);
            this.upwardvelocity = 0.0;
            this.upwardacceleration = DEFAULT_ACCELERATION;
            this.image = document.getElementById('flappybird');
            this.image_death = document.getElementById('flappybird-death');
            this.sound = document.getElementById('flappybird-jump');
            this.isDead = false;
        }

        renderBird() {
            context.fillStyle = 'yellow';
            context.drawImage(this.isDead ? this.image_death : this.image, this.boundingBox.left, this.boundingBox.top,
                this.boundingBox.right - this.boundingBox.left, this.boundingBox.bottom -
                this.boundingBox.top);
        }
    }

    var g_flappybird = new FlappyBird(new Vector(100, 250));

    function getRandomInt(min, max) {
        return min + Math.floor(Math.random() * (max-min));
    }

    class Pipe {
        constructor (startingPosition) {
            var height = getRandomInt(300, 500);
            this.bottomBoundingBox = new Rectangle(startingPosition -50, 0, 
                startingPosition + 50, height);

            this.upperBoundingBox = new Rectangle(startingPosition -50, height + PIPE_GAP/2,
                startingPosition + 50, 900);
            this.image = document.getElementById('pipe');
            this.image2 = document.getElementById('pipe2');
            this.image_upsidedown = document.getElementById('pipe-upsidedown');
            this.image2_upsidedown = document.getElementById('pipe2-upsidedown');
        }

        renderPipe() {
            context.fillRect(this.bottomBoundingBox.left, this.bottomBoundingBox.top, 
                this.bottomBoundingBox.right - this.bottomBoundingBox.left,
                this.bottomBoundingBox.bottom - this.bottomBoundingBox.top);
            context.drawImage(this.image2_upsidedown, this.bottomBoundingBox.left - 10, this.bottomBoundingBox.bottom - 10,
                120, 10);
            context.drawImage(this.image_upsidedown, this.bottomBoundingBox.left, this.bottomBoundingBox.bottom - 100, 100, 90);
            for (var i=this.bottomBoundingBox.bottom - 100; i > 0; i-=80)
            {
                context.drawImage(this.image, 0, 10, 100, 80, this.bottomBoundingBox.left, i - 80, 100, 80);
            }
            context.drawImage(this.image2, this.upperBoundingBox.left - 10, this.upperBoundingBox.top,
                120, 10);
            context.drawImage(this.image, this.upperBoundingBox.left, this.upperBoundingBox.top + 10, 100, 90);
            for (var i=this.upperBoundingBox.top + 100; i < 1540; i+= 80)
            {
                context.drawImage(this.image, 0, 10, 100, 80, this.upperBoundingBox.left, i, 100, 80);
            }
        }

        translate(xoffset) {
            this.bottomBoundingBox.translate(xoffset, 0);
            this.upperBoundingBox.translate(xoffset, 0);
        }
    }

    var g_gamePipes = [];
    function addnewPipes(startingPosition) {
    g_gamePipes.push(new Pipe(startingPosition));
    }

    function generateNewPipes() {
        if (0 == g_gamePipes.length) {
            for (i=PIPE_START; i < CANVAS_BUFFER; i+= PIPE_GAP) {
                addnewPipes(i);
            }
            return;
        }
        if (g_gamePipes[0].bottomBoundingBox.right < 0) {
            g_gamePipes.shift();
            addnewPipes(g_gamePipes[g_gamePipes.length -1].bottomBoundingBox.right - 50 + PIPE_GAP);
        }
    }

    generateNewPipes();

    function game_update() {
        generateNewPipes();
        if (g_flappybird.boundingBox.hasIntersectionLine(838) || g_flappybird.boundingBox.hasIntersectionLine(0))
        {
            g_flappybird.isDead = true;
            isRunning = false; return;
        }
        g_gamePipes.forEach(function(item, index) {
            if (item.bottomBoundingBox.hasIntersection(g_flappybird.boundingBox) || 
                item.upperBoundingBox.hasIntersection(g_flappybird.boundingBox))
            {
                g_flappybird.isDead = true;
                isRunning = false; return;
            }
            item.translate(MOVEMENT_SPEED);
        });
        g_flappybird.upwardvelocity += g_flappybird.upwardacceleration;
        g_flappybird.boundingBox.translate(0, g_flappybird.upwardvelocity + 
            0.5 * g_flappybird.upwardacceleration);
    }
    var cloudbackground = document.getElementById('cloudbackground');
    function game_render() {
        context.drawImage(cloudbackground, 0, 0, canvas.width, canvas.height);
        g_gamePipes.forEach(function(item, index) {
            item.renderPipe();
        });
        g_flappybird.renderBird();
    }

    function MouseEvent (e) {
        if (" " == e.key) {
            e.preventDefault();
            var audio_jump = document.getElementById('jump');
            g_flappybird.upwardvelocity = UPWARD_BOOST;
            console.log(g_flappybird.sound);
            audio_jump.currentTime = 0;
            audio_jump.play();
        }
        else if ("q" == e.key) isRunning = false;
    }

    function gameloop() {
        game_update(); game_render();
        if (isRunning) window.requestAnimationFrame(gameloop);
        else {
            var audio = document.getElementById('jump');
            if (!audio.paused) audio.pause();            
            window.removeEventListener('keyup', MouseEvent);
        }
    }
    window.addEventListener('keydown', function(e) {
        if(e.key == ' ') {
          e.preventDefault();
        }
      });
    window.addEventListener('keyup', MouseEvent);
    window.requestAnimationFrame(gameloop);
}

window.addEventListener('load', gameInit);