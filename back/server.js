var Greenlock = require('greenlock');
var redir = require('redirect-https')();
var http = require('http')
var https = require('https')
var path = require('path')

var express = require('express')
var session = require('express-session')
var bodyParser = require('body-parser')
var fileUpload = require('express-fileupload')
var FileStore = require('session-file-store')(session)

require('console-title')('WEB Server')

var sys = require('./lib/sys')
var wss = require('./lib/wss')



var usersModel = require('./lib/usersModel')

usersModel.init()
.then(dbReady)
.catch((e) => {
	console.log('Error', e)
	process.exit(1)	
})


function dbReady() {
	console.log('Ready !!')



	var app = express()	

	var store = new FileStore({path: path.join(__dirname, '/config/sessions')})


	app.use(session({
		secret: 'keyboard cat',
		//store: store,
		store,
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
	app.use('/api/notif', require('./api/notif'))
	app.use('/api/app', require('./api/app'))
	app.use('/api/invit', require('./api/invit'))
	app.use('/api/tchat', require('./api/tchat'))



	// view controllers

	require('./controllers/app')(app)
	require('./controllers/home')(app)
	require('./controllers/login')(app)

	app.use(express.static(path.join(__dirname, '../front/dist')))


	var greenlock = Greenlock.create({
	  agreeTos: true                      // Accept Let's Encrypt v2 Agreement
	, email: 'marc.delomez@free.com'           // IMPORTANT: Change email and domains
	, approveDomains: [ 'com.breizbot.ovh' ]
	, communityMember: false              // Optionally get important updates (security, api changes, etc)
	                                      // and submit stats to help make Greenlock better
	, version: 'draft-12'
	, server: 'https://acme-v02.api.letsencrypt.org/directory'
	, configDir: path.join(__dirname, 'config/certif')
	})


	http.createServer(greenlock.middleware(redir)).listen(8080)
	 
	var server = https.createServer(greenlock.tlsOptions, app).listen(8443)

	
	wss.init(greenlock.tlsOptions, store)

}






