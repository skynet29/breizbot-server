

var routes = require('express').Router()
const wss = require('../lib/wss')


routes.post('/:userName', function(req, res) {

	var notif = req.body
	var userName = req.params.userName

	wss.sendNotification(userName, notif).then( () => {
		res.sendStatus(200)
	})
	.catch((e) => {
		console.log('Error', req.url, e)
		res.status(400).send(e)
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

routes.post('/accept/:from', function(req, res) {

	var userName = req.session.user
	var from = req.params.from

	wss.acceptInvit(userName, from).then( () => {
		res.sendStatus(200)
	})
	.catch(() => {
		res.sendStatus(400)
	})	

})


module.exports = routes






