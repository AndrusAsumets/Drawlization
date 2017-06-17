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

router.get('/',
    async function(next) {
        console.log('../index.html')
        this.body = fs.readFileSync('../index.html', 'utf8')
    }
)

app.use(bodyParser())
app.use(cors())
app.use(router.routes())
app.use(serve('../static'), { hidden: true })

io.attach(app)

io.on('connection', (context, data) => {
	console.log('new connection')
})

io.on('message', (context, data) => {
	io.broadcast('message', data)
})

app.listen(PORT)

console.log('Server is listening on', PORT + '.')
