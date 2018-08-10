

var routes = require('express').Router()
const wss = require('../lib/wss')


routes.post('/send/:to', function(req, res) {

	var from = req.session.user
	var to = req.params.to
	var text = req.body.text

	wss.sendMessage(from, to, text)
	res.sendStatus(200)


})



module.exports = routes






