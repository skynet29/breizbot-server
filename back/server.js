var express = require('express')
var session = require('express-session')
var bodyParser = require('body-parser')
//var db = require('./lib/db.js')
var fileUpload = require('express-fileupload')
//var MongoDBStore = require('connect-mongodb-session')(session);
var path = require('path')
var fs = require('fs')
var sys = require('./lib/sys')


var port = process.env.PORT || 9000
var dbUrl = process.env.DB_URL ||  'redis://127.0.0.1:6379/0'


var usersModel = require('./lib/usersModelRedis')

usersModel.init(dbUrl)
.then(dbReady)
.catch((e) => {
	console.log('Error', e)
	process.exit(1)	
})


function dbReady() {
	console.log('Ready !!')

	var app = express()	


	app.use(session({
		secret: 'keyboard cat',
		//store: store,
		//store: new FileStore({path: path.join(__dirname, '/config/sessions')}),
		resave: true,
		saveUninitialized: true,
		cookie: {maxAge: null}
	})) // maxAge infini :)

	app.use(bodyParser.urlencoded({extended: false}))
	app.use(bodyParser.json())
	app.use(fileUpload())

	app.set('view engine', 'ejs')
	app.set('views', path.join(__dirname, 'views'))	


	// forbid acces to REST API when no user connected
	app.all('/api/*' , function(req, res, next) {
		//console.log('url', req.url)
		if (!req.session.connected) {
			res.sendStatus('401')
		}
		else { 
			next()
		}
	})




	app.use('/api/users', require('./api/users'))
	app.use('/api/file', require('./api/file'))

	app.get('/api/apps', function(req, res) {
		console.log('get /api/apps')
		sys.getAppsConfigs().then(function(appsConfig) {
			res.json(appsConfig)
		})		
	})

	// view controllers

	require('./controllers/app')(app)
	require('./controllers/home')(app)
	require('./controllers/login')(app)

	app.use(express.static(path.join(__dirname, '../front/dist')))


	app.listen(port, function() {
		console.log('WEB Server listening on port',  port)
	})



}





