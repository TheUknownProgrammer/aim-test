
/** @type {HTMLCanvasElement} */

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

var canvasRect;

const Sfx = {
    shoot: new Audio("resources/sfx/shoot blaster.mp3"),
    destroy: new Audio("resources/sfx/destroy.mp3"),
    miss_target: new Audio("resources/sfx/miss_target.mp3"),
};

var colors = ["red", "green", "purple", "yellow", "white", "lime"];
var index = 0;
class Cell {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.width = size;
        this.height = size;
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }
    draw() {
        ctx.beginPath();
        ctx.strokeStyle = this.color;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
}

class Background {
    constructor() {
        this.cellSize = canvas.width / 100;
        this.background = this.getBackground();
    }
    getBackground() {
        var bc = [];
        for (let y = 0; y < canvas.height; y += this.cellSize) {
            for (let x = 0; x < canvas.width; x += this.cellSize) {
                bc.push(new Cell(x, y, this.cellSize));
            }
        }
        return bc;
    }
    drawBackground() {
        for (let i = 0; i < this.background.length; i++) {
            this.background[i].draw();
        }
    }
}

var background;

var fps = 0;
var lastTime = 0;
var frame = 0;

var score = 0;

var bullets = [];
var bulletRadius = 7.5;

var targets = [];
var afterTargets = [];

var targetTime = Math.floor(Math.random() * 50) + 50;

var totalMisses = 0;
var totalShootBullets = 0;
var totalShotTargets = 0;

const mouse = { x: undefined, y: undefined, width: 0.1, height: 0.1 };

var cursorTargetWidth = 40;
var cursorTargetHeight = 40;

var enableTargetCursor = undefined;

const targetCursor = {
    img: new Image(),
    x: 0,
    y: 0,
    width: cursorTargetWidth,
    height: cursorTargetHeight,
    draw() {
        if (enableTargetCursor) {
            if (mouse.x != undefined && mouse.y != undefined) {
                this.x = mouse.x;
                this.y = mouse.y;
                ctx.beginPath();
                ctx.drawImage(
                    this.img,
                    this.x - this.width / 2,
                    this.y - this.height / 2,
                    this.width,
                    this.height
                );
            }
        }
    },
};

function shoot(e) {
    var clicked_on_target = false;
    var target = undefined;

    for (let i = 0; i < targets.length && !clicked_on_target; i++) {
        if (checkClick(mouse, targets[i]) && !targets[i].popped) {
            clicked_on_target = true;
            target = targets[i];
        }
    }



    if (clicked_on_target) {
        target.pop(e.x, e.y);

        totalShotTargets++;
    } else {
        bullets.push(new Bullet(mouse.x, mouse.y));
    }
    totalShootBullets++;


}

class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = bulletRadius;
        this.opacity = 1.0;
        this.decreaseO = 5;
        this.markedForDeletion = false;
        if (!Sfx.shoot.paused) {
            Sfx.shoot.currentTime = 0;
        }
        Sfx.shoot.play();
    }
    draw() {
        ctx.beginPath();
        ctx.globalAlpha = this.opacity;
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = "black";
        ctx.fill();
        ctx.globalAlpha = 1;
    }
    fade() {

        if (frame % this.decreaseO == 0) {
            this.opacity -= 0.1;
        }
        if (this.opacity <= 0) {
            this.markedForDeletion = true;
        }
    }
}

class Target {
    constructor() {
        this.radius = randomInt(10, 15);
        this.maxRadius = this.radius * 2;
        this.x = randomInt(this.radius, canvas.width - this.radius);
        this.y = randomInt(this.radius, canvas.height - this.radius);
        this.growShrink = 0.1;
        this.rewardScore = randomInt(2, 5);
        this.markedForDeletion = false;
        this.popped = false;
        this.missedSound = Sfx.miss_target.cloneNode();
        this.poppedSound = Sfx.destroy.cloneNode();

    }
    draw() {
        if (!this.popped) {
            ctx.beginPath();
            ctx.fillStyle = "orange";
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "#fad6a5";
            ctx.stroke();

            ctx.beginPath();
            ctx.fillStyle = "white";
            ctx.arc(this.x, this.y, this.radius / 5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.fillStyle = "blue";
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "white";
            ctx.stroke();

            ctx.beginPath();
            ctx.fillStyle = "black";
            ctx.arc(this.clickedX, this.clickedY, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
    update() {
        if (!this.popped) {
            this.radius += this.growShrink;
            if (this.radius >= this.maxRadius) {
                this.growShrink *= -1;
            }
            if (this.radius <= 0) {
                this.missedSound.play();
                totalMisses++;
                this.markedForDeletion = true;
            }
        }
    }
    pop(x, y) {
        score += this.rewardScore;
        this.popped = true;
        this.poppedSound.play();
        this.clickedX = x;
        this.clickedY = y;
        window.setTimeout((e) => {
            this.markedForDeletion = true;
        }, this.poppedSound.duration * 1000);
    }
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function handleBullets() {
    for (let i = 0; i < bullets.length; i++) {
        bullets[i].draw();
        bullets[i].fade();
    }
    bullets = bullets.filter((bullet) => !bullet.markedForDeletion);
}

function handleTargets() {
    for (let i = 0; i < targets.length; i++) {
        targets[i].draw();
        targets[i].update();
    }

    if (frame % targetTime == 0) {
        targets.push(new Target());
        targetTime = Math.floor(Math.random() * 56) + 50;

    }
    targets = targets.filter((target) => !target.markedForDeletion);
}

function drawData() {
    ctx.save();
    ctx.beginPath();
    ctx.font = "bold 25px monospace";
    ctx.textBaseline = "top";

    const textInScreen = [
        `Score: ${score}`,
        `Accuracy: ${(totalShotTargets / totalShootBullets) * 100
            ? ((totalShotTargets / totalShootBullets) * 100).toFixed(1) + "%"
            : "N/A"
        }`,
        `Total Shot Targets: ${totalShotTargets}`,
        `Total Missed Targets ${totalMisses}`,
        `Fps: ${fps.toFixed(1)}`,
    ];

    var offsetX = 15;
    var offsetY = 30;

    for (let i = 1; i <= textInScreen.length; i++) {

        var currentY = i * offsetY;
        var currentText = textInScreen[i - 1];

        ctx.fillStyle = "lightblue";
        ctx.fillRect(
            offsetX,
            currentY,
            ctx.measureText(currentText).width,
            25
        );

        ctx.strokeStyle = "azure";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(
            offsetX,
            currentY,
            ctx.measureText(currentText).width,
            25
        );

        ctx.fillStyle = "white";
        ctx.fillText(currentText, offsetX, currentY);

        ctx.strokeStyle = "black";
        ctx.lineWidth = 0.85;
        ctx.strokeText(currentText, offsetX, currentY);
    }

    ctx.restore();
}

function Render(timestamp) {
    if (frame % 10 == 0) {
        fps = 1000 / (timestamp - lastTime);
    }
    var deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    background.drawBackground();
    drawData();

    handleBullets();
    handleTargets();
    targetCursor.draw();
    for (let i = 0; i < background.background.length; i++) {
        if (collisionDetection(mouse, background.background[i])) {
            background.background[i].color =
                colors[Math.floor(Math.random() * colors.length)];
        }
    }
    frame++;
    requestAnimationFrame(Render);
}

function startGame() {
    if (confirm("Did You Want Target Cursor?")) {
        enableTargetCursor = true;
    } else {
        enableTargetCursor = false;
    }

    setInterval(() => {
        background.background[index].color =
            colors[Math.floor(Math.random() * colors.length)];
        index++;
        if (index >= background.background.length) {
            index = 0;
        }
    }, 100);

    setInterval(() => {
        background.background[
            Math.floor(Math.random() * background.background.length)
        ].color = colors[Math.floor(Math.random() * colors.length)];
    }, 750);

    canvas.removeEventListener("click", startGame);
    canvas.addEventListener("click", shoot);

    if (enableTargetCursor) canvas.style.cursor = "none";
    else canvas.style.cursor = "auto";

    requestAnimationFrame(Render);
}

function initText() {
    ctx.save();

    var fontSize = 50;
    var txt = "Click To Start A New Game.";

    ctx.beginPath();
    ctx.font = `${fontSize}px Arial`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";

    ctx.fillStyle = "green";
    ctx.fillRect(
        canvas.width / 2 - ctx.measureText(txt).width / 2,
        canvas.height / 2 - fontSize / 2,
        ctx.measureText(txt).width,
        fontSize
    );

    ctx.fillStyle = "white";
    ctx.fillText(txt, canvas.width / 2, canvas.height / 2);

    ctx.strokeStyle = "black";
    ctx.strokeText(txt, canvas.width / 2, canvas.height / 2);

    ctx.restore();
}

function mouseTrackLocation(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;

}

function init() {
    canvas.addEventListener("click", startGame);
    canvas.addEventListener("mousemove", mouseTrackLocation);

    canvas.addEventListener("mouseleave", function () {
        mouse.x = undefined;
        mouse.y = undefined;
    });

    canvas.width = window.screen.availWidth;
    canvas.height = window.innerHeight;

    background = new Background();

    window.addEventListener("resize", function () {
        canvas.width = window.screen.availWidth;
        canvas.height = window.innerHeight;

        if (enableTargetCursor == undefined) {
            initText();
        }
    });

    canvas.style.cursor = "pointer";
    targetCursor.img.src = "resources/images/cursor_target.png";

    initText();
}

window.addEventListener("load", init);

const checkClick = (mouse, circle) =>
    Math.sqrt(
        Math.pow(mouse.x - circle.x, 2) + Math.pow(mouse.y - circle.y, 2)
    ) <= circle.radius;

const collisionDetection = (rect1, rect2) =>
    rect1.width + rect1.x >= rect2.x &&
    rect1.x <= rect2.x + rect2.width &&
    rect1.height + rect1.y >= rect2.y &&
    rect1.y <= rect2.y + rect2.height;


