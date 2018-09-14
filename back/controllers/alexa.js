var alexa = require('alexa-app')
var AmazonSpeech = require('ssml-builder/amazon_speech')

var usersModel = require('../lib/usersModel')
var wss = require('../lib/wss')

var translateMap = {
	'Service not available': "Le service n'est pas disponible",
	'Not found': "Je n'ai pas trouvé l'appareil demandé"
}



var alexaApp = new alexa.app('alexa')

alexaApp.pre = function(request, response, type) {
	//console.log('request', request.userId)
	return usersModel.findUser(request.userId).then((user) => {
		console.log('user', user)
		request.userData = {user}
	})
	.catch((e) => {
		var speech = new AmazonSpeech()
		  .say('Utilisateur non identifié')
		  .pause('500ms')
		  .say('Rendez vous sur votre application Alexa pour connaitre votre identifiant')
		  .pause('500ms')
		  .say('Renseigner cette identifiant sur votre compte breizbot')
		 
		var speechOutput = speech.ssml()
		console.log('speechOutput', speechOutput)

		const userId = request.userId//.split('.').pop()
		return response
			.card({type: 'Simple', content: `User Id: ${userId}`})
			.say(speechOutput)
		 	.send()
	})
}	

alexaApp.launch(function(request, response) {
	console.log('request.userData', request.userData)
	response.say("Jarvis est à votre service!");
})

function handleError(response, e) {
	console.log('handleError', e)
	var message = translateMap[e.message] || e.message


	var speech = new AmazonSpeech()
	  .say(message)

	if (e.code === 100) {
		speech.pause('500ms').say("Vérifier sur votre home-box que l'agent arduino est bien démarré")
	}

	 
	var speechOutput = speech.ssml()


	return response.say(speechOutput).send()	
}

function handleAction(request, response, action, args) {

  	console.log('handleAction', action, args)
  	var {user} = request.userData
  	var alias = request.slots['deviceName'].value

  	return wss.callService(user, 'arduino.findDeviceId', {alias})
  	.then((resp) => {
  		console.log('resp', resp)
  		if (resp.actions.indexOf(action) == -1) {
  			return response.say("Cette commande n'est pas pris en charge par cet appareil").send()
  		}
  		wss.sendTopic(user, 'arduino.action.' + resp.deviceId, {action, args})
  		return response.say("D'accord").send()
  	})
  	.catch((e) => {
  		handleError(response, e)
  	})

 }

alexaApp.customSlot("DeviceName", ["led rouge", "led verte", "led couleur"])

alexaApp.intent("SwitchOn", 
{
	"slots": { "deviceName": "DeviceName" },
	"utterances": ["{allume|d'allumer} {|le|la} {-|deviceName}"]
},
function(request, response) {
	console.log('intent SwitchOn')
	return handleAction(request, response, 'on')
})

const colorMaps = {
	'vert': {red:0, green:255, blue:0},
	'rouge': {red:255, green:0, blue:0},
	'bleu': {red:0, green:0, blue:255},
	'cyan': {red:0, green:255, blue:255},
	'jaune': {red:255, green:255, blue:0},
	'magenta': {red:255, green:0, blue:255},
	'blanc': {red:255, green:255, blue:255}
}


alexaApp.intent("ColorIntent", 
{
	"slots": { "deviceName": "DeviceName", "color": "AMAZON.Color" },
	"utterances": ["{allume|d'allumer} {|le|la} {-|deviceName} en {-|color}"]
},
function(request, response) {
	console.log('intent Color', request.slots)
	//return handleAction('on')(request, response)
	var color = request.slots['color'].value
	var args = colorMaps[color]

	return handleAction(request, response, 'color', args)
})

alexaApp.intent("DeviceListIntent", 
{
	"slots": {},
	"utterances": ["{|donne moi} {|la} liste {des|les} appareils {|connectés}"]
},
function(request, response) {
	console.log('intent deviceList', request.slots)
	var {user} = request.userData

  	return wss.callService(user, 'arduino.deviceList')
  	.then((resp) => {
  		console.log('resp', resp)

  		var speech = new AmazonSpeech()
	  	speech.say('Voici la liste')

	  	resp.devices.forEach((alias) => {
	  		speech.pause('500ms').say(alias)
	  	})

		return response.say(speech.ssml()).send()	  	

  	})
  	.catch((e) => {
  		handleError(response, e)
  	})})


alexaApp.intent("SwitchOff", 
{
	"slots": { "deviceName": "DeviceName" },
	"utterances": ["{éteind|d'éteindre} {|le|la} {-|deviceName}"]
},
function(request, response) {
	console.log('intent SwitchOff')
	return handleAction(request, response, 'off')
})

module.exports = alexaApp



