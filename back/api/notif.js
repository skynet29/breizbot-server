

var routes = require('express').Router()
const wss = require('../lib/wss')


routes.post('/:userName', function(req, res) {

	var notif = req.body
	var userName = req.params.userName

	wss.sendNotification(userName, notif).then( () => {
		es.sendStatus(200)
	})
	.catch(() => {
		res.sendStatus(400)
	})	

})


module.exports = routes






