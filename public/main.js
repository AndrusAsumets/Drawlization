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

// Create lower canvas, to draw on
var canvas1 = createHiDPICanvas(800, 800);
canvas1.style.position = 'absolute';
canvas1.style.zIndex = 1;
document.body.appendChild(canvas1);
var ctx1 = canvas1.getContext("2d");

// Create higher canvas, to overlay the image
var canvas2 = createHiDPICanvas(800, 800);
canvas2.style.position = 'absolute';
canvas2.style.zIndex = 2;
document.body.appendChild(canvas2);
var ctx2 = canvas2.getContext("2d");

// Load and draw image
var image = new Image();
image.onload = function () {
    ctx2.drawImage(this, 0, 0, this.naturalWidth / 2, this.naturalHeight / 2);
};
image.src = '/mandala.png';

drawableLayer = new DrawableLayer({canvas: canvas1, ctx: ctx1});

canvas2.addEventListener("mousemove", function (e) {
    drawableLayer.drawTick('move', e);
}, false);
canvas2.addEventListener("mousedown", function (e) {
    drawableLayer.drawTick('down', e);
}, false);
canvas2.addEventListener("mouseup", function (e) {
    drawableLayer.drawTick('up', e);
}, false);
canvas2.addEventListener("mouseout", function (e) {
    drawableLayer.drawTick('out', e);
}, false);

var socket = io.connect('http://188.166.74.97:1337');

socket.on('connect', function() {
	console.log('connected')

	socket.emit('message', 'Hello World!')
});

socket.on('message', function(msg) {
	console.log(msg)
});

function DrawableLayer (options) {
    this.flag = false;
    this.prevX = 0;
    this.currX = 0;
    this.prevY = 0;
    this.currY = 0;
    this.dot_flag = false;
    this.x = "red";
    this.y = 2;

    this.drawTick = function(action, e) {
        if (action == 'down') {
            this.prevX = this.currX;
            this.prevY = this.currY;
            this.currX = e.clientX - options.canvas.offsetLeft;
            this.currY = e.clientY - options.canvas.offsetTop;

            this.flag = true;
            this.dot_flag = true;
            if (this.dot_flag) {
                options.ctx.beginPath();
                options.ctx.fillStyle = this.x;
                options.ctx.fillRect(this.currX, this.currY, 2, 2);
                options.ctx.closePath();
                this.dot_flag = false;
            }
        }
        if (action == 'up' || action == "out") {
            this.flag = false;
        }
        if (action == 'move') {
            if (this.flag) {
                this.prevX = this.currX;
                this.prevY = this.currY;
                this.currX = e.clientX - options.canvas.offsetLeft;
                this.currY = e.clientY - options.canvas.offsetTop;
                this.draw();
            }
        }
    }
    this.draw = function () {
        options.ctx.beginPath();
        options.ctx.moveTo(this.prevX, this.prevY);
        options.ctx.lineTo(this.currX, this.currY);
        options.ctx.strokeStyle = this.x;
        options.ctx.lineWidth = this.y;
        options.ctx.stroke();
        options.ctx.closePath();
    }
}

function color(obj) {
    switch (obj.id) {
        case "green":
            drawableLayer.x = "green";
            break;
        case "blue":
            drawableLayer.x = "blue";
            break;
        case "red":
            drawableLayer.x = "red";
            break;
        case "yellow":
            drawableLayer.x = "yellow";
            break;
        case "orange":
            drawableLayer.x = "orange";
            break;
        case "black":
            drawableLayer.x = "black";
            break;
        case "white":
            drawableLayer.x = "white";
            break;
    }
    if (drawableLayer.x == "white") drawableLayer.y = 14;
    else drawableLayer.y = 2;
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
