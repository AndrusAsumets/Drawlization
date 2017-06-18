const Koa = require('koa')
let app = new Koa()
const serve = require('koa-static')
let router = require('koa-router')()
var bodyParser = require('koa-bodyparser')
var cors = require('koa-cors')
var fs = require('fs')
const IO = require('koa-socket')
const io = new IO()

const PORT = process.env.PORT || 1337
let buffer = null

app.use(bodyParser())
app.use(cors())
app.use(router.routes())
app.use(serve('../public'), { hidden: true })

io.attach(app)

io.on('connection', (context, data) => {
	console.log('new connection')
	
	io.broadcast('buffer', buffer)
})

io.on('message', (context, data) => {
	io.broadcast('message', data)
})

app.listen(PORT)

console.log('Server is listening on', PORT + '.')


(async function() {
	const chrome = await launchChrome();
	const protocol = await CDP({ port: chrome.port })
	
	// Extract the DevTools protocol domains we need and enable them.
	// See API docs: https://chromedevtools.github.io/devtools-protocol/
	const { Page, Runtime } = protocol
	await Promise.all([Page.enable(), Runtime.enable()])
	
	setTimeout(function() {
		Page.navigate({ url: 'http://localhost:1337/' })
	
		Page.loadEventFired(async () => {
			setInterval(function() {
				const screenshot = await Page.captureScreenshot({'png'})
				buffer = new Buffer(screenshot.data, 'base64')
			}, 100)
		})
	}, 1000)
})()