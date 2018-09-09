var alexa = require('alexa-app')

var usersModel = require('../lib/usersModel')
var wss = require('../lib/wss')


module.exports = function(app) {

	var alexaApp = new alexa.app('alexa')

	alexaApp.pre = function(request, response, type) {
		//console.log('request', request.userId)
		return usersModel.findUser(request.userId).then((user) => {
			console.log('user', user)
			request.userData = {user}
		})
		.catch((e) => {
			response.say('Utilisateur non identifié !')
			return response.send()
		})
	}	

	alexaApp.launch(function(request, response) {
		console.log('request.userData', request.userData)
		response.say("Jarvis est à votre service!");
	})


	function handleAction(action) {

	  return function(request, response) {
	  	console.log('handleAction', action)
	  	var {user} = request.userData
	  	var alias = request.slots['deviceName'].value

	  	return wss.callService(user, 'arduino.findDeviceId', {alias})
	  	.then((resp) => {
	  		console.log('deviceId', resp.deviceId)
	  		wss.sendTopic(user, 'arduino.action.' + resp.deviceId, {action})
	  		return response.say("D'accord").send()
	  	})
	  	.catch((e) => {
	  		console.log('Error', e)
	  		return response.say(`je ne trouve pas l'appareil ${alias}`).send()
	  	})

	   
	  }
	}

	alexaApp.intent("SwitchOn", function(request, response) {
		console.log('intent SwitchOn')
		return handleAction('on')(request, response)
	})

	alexaApp.intent("SwitchOff", function(request, response) {
		console.log('intent SwitchOff')
		return handleAction('off')(request, response)
	})


	alexaApp.express({expressApp: app})

}