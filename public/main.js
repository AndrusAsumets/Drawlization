var PIXEL_RATIO = (function () {
    var ctx = document.createElement("canvas").getContext("2d"),
        dpr = window.devicePixelRatio || 1,
        bsr = ctx.webkitBackingStorePixelRatio ||
              ctx.mozBackingStorePixelRatio ||
              ctx.msBackingStorePixelRatio ||
              ctx.oBackingStorePixelRatio ||
              ctx.backingStorePixelRatio || 1;

    return dpr / bsr;
})();

var cursor = document.getElementById('cursor');

// Create lower canvas, to draw on
var canvas1 = createHiDPICanvas(800, 800);
canvas1.style.position = 'absolute';
canvas1.style.zIndex = 1;
document.body.appendChild(canvas1);
var ctx1 = canvas1.getContext("2d");

// Create higher canvas, to overlay the image
var canvas2 = createHiDPICanvas(800, 800);
canvas2.style.position = 'absolute';
canvas2.style.zIndex = 3;
document.body.appendChild(canvas2);
var ctx2 = canvas2.getContext("2d");

// Load and draw image
var image = new Image();
image.onload = function () {
    ctx2.drawImage(this, 0, 0, this.naturalWidth / 2, this.naturalHeight / 2);
};
image.src = '/mandala.png';

var players = {};
var currentPlayer = new DrawablePlayer({canvas: canvas1, ctx: ctx1});
players[currentPlayer.id] = currentPlayer;

var isMouseDown = false
canvas2.addEventListener("mousemove", function (e) {
	onMove(e);
}, false);
canvas2.addEventListener("mousedown", function (e) { isMouseDown = true; console.log('isMouseDown2', isMouseDown); }, false);
canvas2.addEventListener("mouseup", function (e) { onUp(e) }, false);
canvas2.addEventListener("mouseout", function (e) { onUp(e) }, false);

canvas2.addEventListener("touchmove", function (e) { onMove(e) }, false);
canvas2.addEventListener("touchstart", function (e) { isMouseDown = true; console.log('isMouseDown', isMouseDown) }, false);
canvas2.addEventListener("touchup", function (e) { onUp(e) }, false);
canvas2.addEventListener("touchout", function (e) { onUp(e) }, false);
// canvas2.addEventListener("touchcancel", function (e) { onUp(e) }, false);
canvas2.addEventListener("touchend", function (e) { onUp(e) }, false);

function onMove(e) {
    // Move cursor along
    cursor.style.left = (e.clientX - (currentPlayer.size / 2)) + 'px';
    cursor.style.top = (e.clientY - (currentPlayer.size / 2)) + 'px';
    cursor.style.display = 'block';
    cursor.style.width = currentPlayer.size + 'px';
    cursor.style.height = currentPlayer.size + 'px';

    if (!isMouseDown) {
        return;
    }

	e.preventDefault();

	var action = {
		action: 'move',
		data: {
            playerId: currentPlayer.id,
			offsetX: e.offsetX || e.touches[0].clientX - canvas2.offsetLeft,
			offsetY: e.offsetY || e.touches[0].clientY - canvas2.offsetTop,
			clientX: e.clientX,
			clientY: e.clientY,
            color: currentPlayer.color,
            size: currentPlayer.size,
            lineCap: currentPlayer.lineCap
		}
    };

	socket.emit('message', action)
	currentPlayer.drawTick('move', action.data);
}

function onUp(e) {
	e.preventDefault();

	isMouseDown = false
	socket.emit('message', { action: 'out', data: { playerId: currentPlayer.id }});
	currentPlayer.drawTick('out', { action: 'out'});
}

var socket = io.connect('http://188.166.74.97:1337');

socket.on('connect', function() {
	console.log('connected')
    socket.emit('message', {action: 'player joins', data: {playerId: currentPlayer.id}});
});

socket.on('message', function(msg) {
    console.log('message', msg.action);
    // ...
	if (msg.action == 'move') {
        drawTick('move', msg.data);
    }
    // ...
    else if (msg.action == 'out') {
        drawTick('out', msg.data);
    }
    // On new player joining
    else if (msg.action == 'player joins') {
        addPlayer(msg.data);
    }
    // Existing player introducing themselves
    else if (msg.action == 'player introduces') {
        addPlayer(msg.data);
    }
});

function drawTick (action, data) {
    console.log('action', action)
    if (data.playerId === currentPlayer.id) return;
    console.log('Draw', action, data.playerId);
    if (data.color) {
        players[data.playerId].color = data.color;
    }
    if (data.size) {
        players[data.playerId].size = data.size;
    }

    if (data.lineCap) {
        players[data.playerId].lineCap = data.lineCap;
    }
    players[data.playerId].drawTick(action, data);
}

function addPlayer (options) {
    // Don't add the current player
    if (options.playerId === currentPlayer.id) return;
    // Don't add already added players
    if (players[options.playerId]) return;

    console.log('New player', options.playerId);

    var drawablePlayer = new DrawablePlayer({id: options.playerId, canvas: canvas1, ctx: ctx1});
    players[drawablePlayer.id] = drawablePlayer;

    // New player added? Introduce current player to the new player
    socket.emit('message', {action: 'player introduces', data: {playerId: currentPlayer.id}});
}

function DrawablePlayer (options) {
    this.id = options.id || Math.floor(Math.random() * 1000000000);
    this.flag = false;
    this.prevX = 0;
    this.currX = 0;
    this.prevY = 0;
    this.currY = 0;
    this.dot_flag = false;
    this.color = "red";
    this.size = 20;
    this.lineCap = "round";

    this.drawTick = function(action, e) {
        if (action == 'down') {
            this.currX = e.clientX - options.canvas.offsetLeft;
            this.currY = e.clientY - options.canvas.offsetTop;
            this.prevX = this.currX;
            this.prevY = this.currY;

            this.flag = true;
            this.dot_flag = true;
            if (this.dot_flag) {
                options.ctx.beginPath();
                options.ctx.fillStyle = this.color;
                options.ctx.fillRect(this.currX, this.currY, 2, 2);
                options.ctx.closePath();
                this.dot_flag = false;
            }
        }
        if (action == 'up' || action == "out") {
            this.flag = false;
            this.prevX = null
            this.prevY = null
        }
        if (action == 'move') {
				if (!this.prevX) this.prevX = e.offsetX
				if (!this.prevY) this.prevY = e.offsetY
				this.currX = e.offsetX;
				this.currY = e.offsetY;

				this.flag = true
				this.draw();
				this.prevX = e.offsetX
				this.prevY = e.offsetY
        }
    }
    this.draw = function () {
        options.ctx.beginPath();
        options.ctx.moveTo(this.prevX, this.prevY);
        options.ctx.lineTo(this.currX, this.currY);
        options.ctx.lineCap = this.lineCap;
        options.ctx.strokeStyle = this.color;
        options.ctx.lineWidth = this.size;
        options.ctx.stroke();
        options.ctx.closePath();
    }
}

function color(obj) {
    switch (obj.id) {
        case "green":
            currentPlayer.color = "green";
            break;
        case "blue":
            currentPlayer.color = "blue";
            break;
        case "red":
            currentPlayer.color = "red";
            break;
        case "yellow":
            currentPlayer.color = "yellow";
            break;
        case "orange":
            currentPlayer.color = "orange";
            break;
        case "black":
            currentPlayer.color = "black";
            break;
        case "white":
            currentPlayer.color = "white";
            break;
    }
    //if (currentPlayer.color == "white") currentPlayer.size = 14;
    //else currentPlayer.size = 2;
}

function size(obj) {
    switch (obj.id) {
        case "size30":
            currentPlayer.size = 30;
            break;
        case "size20":
            currentPlayer.size = 20;
            break;
        case "size10":
            currentPlayer.size = 10;
            break;
        case "size5":
            currentPlayer.size = 5;
            break;
        case "size3":
            currentPlayer.size = 3;
            break;
    }
    //if (currentPlayer.color == "white") currentPlayer.size = 14;
    //else currentPlayer.size = 2;

}
function setLineCap(obj) {
        console.log(obj);
        currentPlayer.lineCap = obj.id;
    }


function createHiDPICanvas (w, h, ratio) {
    if (!ratio) { ratio = PIXEL_RATIO; }
    var can = document.createElement("canvas");
    can.width = w * ratio;
    can.height = h * ratio;
    can.style.width = w + "px";
    can.style.height = h + "px";
    can.getContext("2d").setTransform(ratio, 0, 0, ratio, 0, 0);
    return can;
}
