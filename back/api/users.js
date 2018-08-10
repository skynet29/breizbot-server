var sys = require('../lib/sys')
var usersModel = require('../lib/usersModel')

var routes = require('express').Router()


routes.get('/', function(req, res) {

	console.log('getUserList')
	usersModel.getUserList().then((docs) => {
		console.log('docs', docs)
		res.json(docs)
	})
	.catch(() => {
		res.sendStatus(400)
	})

})

routes.get('/:userName', function(req, res) {

	var userName = req.params.userName

	usersModel.getUserInfo(userName).then((doc) => {
		console.log('doc', doc)
		res.json(doc)
	})	
	.catch(() => {
		res.sendStatus(400)
	})
})

routes.put('/:userName', function(req, res) {

	var userName = req.params.userName

	usersModel.updateUserInfo(userName, req.body).then((doc) => {
		res.sendStatus(201)
	})	
	.catch(() => {
		res.sendStatus(400)
	})

})

routes.post('/', function(req, res) {

	usersModel.createUser(req.body.userName).then((doc) => {
		res.sendStatus(201)
	})	
	.catch((e) => {
		res.status(400).send(e)
	})	

})

routes.delete('/:userName',function deleteUser(req, res) {

	var userName = req.params.userName

	usersModel.deleteUser(userName).then((doc) => {
		res.sendStatus(200)
	})	
	.catch(() => {
		res.sendStatus(400)
	})	

})






module.exports = routes






