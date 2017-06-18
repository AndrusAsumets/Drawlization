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

const CDP = require('chrome-remote-interface')

async function browser() {
	console.log('test', 0)
	const chrome = await CDP()
	console.log('test', 1)
	console.log('test', 1.1)
    const {DOM, Emulation, Network, Page, Runtime} = client
    console.log('test', 1.2)

    // Enable events on domains we are interested in.
    await Page.enable()
    console.log('test', 1.3)
    await DOM.enable()
    console.log('test', 1.4)
    await Network.enable()
	console.log('test', 2)
	
	console.log('test', 5)
	
	await timeout(1000)
	
	await Page.navigate({ url: 'http://188.166.74.97:1337/' })
	console.log('test', 6)
	await Page.loadEventFired()
	console.log('test', 7)
	await timeout(1000)
	console.log('test', 8)
	
	console.log(Page)
	const screenshot = await Page.captureScreenshot('png')
	console.log('test', 9)
	buffer = new Buffer(screenshot.data, 'base64')
	console.log('test', 10)
}
browser()