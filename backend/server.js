const Koa = require('koa')
let app = new Koa()
const serve = require('koa-static')
let router = require('koa-router')()
var bodyParser = require('koa-bodyparser')
var cors = require('koa-cors')
var fs = require('fs')
const timeout = require('delay')
const IO = require('koa-socket')
const io = new IO()
const CDP = require('chrome-remote-interface')

const PORT = process.env.PORT || 1337
let buffer = fs.readFileSync('buffer.png', 'utf8') || null

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

async function browser() {
	const chrome = await CDP()
    const { DOM, Emulation, Network, Page, Runtime } = chrome

    await Page.enable()
    await DOM.enable()
    await Network.enable()
	await timeout(1000)
	await Emulation.setVisibleSize({ width: 800, height: 800 })
	await Page.navigate({ url: 'http://188.166.74.97:1337/server.html' })
	await Page.loadEventFired()
	await timeout(1000)
	
	setInterval(async function() {
		const screenshot = await Page.captureScreenshot({ format: 'png' })
		buffer = new Buffer(screenshot.data, 'base64').toString('base64')
		fs.writeFileSync('buffer.png', buffer, 'utf8')
	}, 1000)
}
browser()