

var routes = require('express').Router()
const wss = require('../lib/wss')


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






