var sys = require('../lib/sys')
var usersModel = require('../lib/usersModel')

var routes = require('express').Router()

routes.get('/', function(req, res) {
	console.log('get /api/apps')
	sys.getAppsConfigs().then(function(appsConfig) {
		res.json(appsConfig)
	})		
	.catch((e) => {
		res.sendStatus(400)
	})
})

routes.get('/webapps', function(req, res) {

	const user = req.session.user
	const allowedApps = req.session.allowedApps
	console.log('/webapps', user, allowedApps)

	sys.readConfig().then(function(infos) {
		//console.log('infos', infos)
		var appInfos = {}
		for(var k in allowedApps) {
			if (k in infos) {
				appInfos[k] = infos[k]
			}
			
		}

		console.log('allowedAppsConfig', appInfos)

		res.json(appInfos)

	})
	.catch((e) => {
		res.status(404).send(e)
	})

})

routes.get('/config/:appName', function(req, res) {
	var userName = req.session.user
	var appName = req.params.appName
	console.log(`get /config/${appName}`, req.session)
	var allowedApps = req.session.allowedApps


	var appConfig = allowedApps[appName]

	if (appConfig == undefined) {
		res.status(404).send('Not allowed')
	}

	//console.log('appConfig', appConfig)
	if (typeof appConfig == 'string') {
		sys.getAppConfig(appName, appConfig).then((config) => {
			config.$userName = userName
			res.json(config)
		})
	}
	else {
		res.json({$userName: userName})
	}

})


module.exports = routes