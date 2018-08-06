

var routes = require('express').Router()
const wss = require('../lib/wss')


routes.post('/:userName', function(req, res) {

	var notif = req.body
	var userName = req.params.userName

	wss.sendNotification(userName, notif).then( () => {
		res.sendStatus(200)
	})
	.catch(() => {
		res.sendStatus(400)
	})	

})

routes.delete('/:id', function(req, res) {
	var user = req.session.user
	var notifId = req.params.id

	wss.removeNotification(user, notifId).then( () => {
		res.sendStatus(200)
	})
	.catch((e) => {
		res.sendStatus(400)
	})
})


module.exports = routes






