const ws = require("nodejs-websocket")
const usersModel = require('./usersModel')
const uniqid = require('uniqid')
const colors = require('colors')
var auth = require('basic-auth')
var cookie = require('cookie')

var Broker = require('./broker')

var brokers = {}

function init(options, store) {
	options.secure = true

	const wss = ws.createServer(options, function(client) {
		onConnect(client, store)
	})

	wss.listen(8090, () => {
		console.log(`WebSocket server start listening on port 8090`)
	})
}

function getBroker(userName) {
	var broker = brokers[userName]
	if (broker == undefined) {
		broker = brokers[userName] = new Broker()
	}
	return broker	
}

function sendError(client, text) {
	console.log('sendError', text)
	var msg = {
		type: 'notif',
		topic: 'masterError',
		data: text
	}
	client.sendText(JSON.stringify(msg))
}

function onConnect(client, store) {
	

	var id = client.path.substr(1)

	console.log(`New connection ${id}`.green)

	var f = id.split('.')
	if (f.length < 2) {
		sendError(client, 'Bad URL')
		return
	}
	var [appType, appName] = f

	var headers = client.headers

	//console.log('Headers', client.headers)
	if (appType === 'box') {
		var authorization = headers.authorization
		if (authorization == undefined) {
			sendError(client, 'Missing authorization')
			return
		}		

		var credentials = auth.parse(headers.authorization)
		console.log('credentials', credentials)
		var userName = credentials.name
		usersModel.getUserInfo(userName)
		.then((userInfo) => {
			var pwd = userInfo.pwd
			if (pwd === credentials.pass) {
				addClient(userName, id, client)
			}
			else {
				sendError(client, 'Bad password')
			}
		})
		.catch((e) => {			
			sendError(client, e)
		})
	}

	else if (appType === 'hmi') {

		if (headers.origin !== 'https://com.breizbot.ovh') {
			sendError(client, 'Bad origin')
			return
		}

		if (headers.cookie == undefined) {
			sendError(client, 'Missing cookie')
			return
		}


		var cookies = cookie.parse(headers.cookie)
		//console.log('cookies', cookies)
		
		var sid = cookies['connect.sid']
		if (sid == undefined) {
			sendError(client, 'Missing sid')
		}



		sid = sid.split(/[:.]+/)[1]
		console.log('sid', sid)

		store.get(sid, function(err, session) {
			console.log('err', err)
			//console.log('session', session)
			if (err != null || session == null) {
				sendError(client, 'Unknown session')
				return
			}
			var userName = session.user
			addClient(userName, id, client)

		})



	}
	else {
		sendError(client, 'Unknown appType')
	}
}

function addClient(userName, id, client) {

	console.log('addClient', userName, id)

	var [appType, appName] = id.split('.')

	var broker = getBroker(userName)


	//console.log('userName', userName)
	client.on('close', (code)  => {
		console.log(`Client '${id}' disconnected`.red)
		broker.removeClient(id)

		if (appType == 'hmi' && appName == 'tchat') {
			// warn all friends of that client
			getFriends(userName).then((friends) => {
				(friends || []).forEach((friend) => {
					readAndPublishFriends(friend)
				})
				
			})
		}
		
	})

	client.on('error', (err) => {
		console.log('connection error')
	})		

	

	broker.addClient(id, client)

	if (appType == 'hmi' && appName == 'tchat') {
		readAndPublishFriends(userName)
		getFriends(userName).then((friends) => {
			(friends || []).forEach((friend) => {
				readAndPublishFriends(friend)
			})
			
		})	
	}	

}

function publishNotifications(userName, notif) {
	console.log('publishNotifications', userName, notif)
	var broker = getBroker(userName)

	broker.sendMessage('masterNotifications', notif)
}

function sendNotification(userName, notif) {
	console.log('sendNotification', userName, notif)
	return usersModel.getUserInfo(userName).then((userInfo) => {
		if (!Array.isArray(userInfo.notifications)) {
			userInfo.notifications = []
		}
		notif.id = uniqid()
		userInfo.notifications.push(notif)
		publishNotifications(userName, userInfo.notifications)
		return usersModel.updateUserInfo(userName, userInfo)

	})

}

function sendTopic(user, topic, data) {
	console.log('sendTopic', user, topic, data)

	var broker = getBroker(user)
	broker.sendMessage(topic, data)

}

function sendMessage(from, to, text) {
	console.log('sendMessage', from, to, text)

	sendTopic(to, 'masterMessage', {from, to, text})

}
function callService(user, serviceName, data) {
	var broker = getBroker(user)
	return broker.callService(serviceName, data)
}

function removeNotification(userName, notifId) {
	console.log('removeNotification', userName, notifId)
	return usersModel.getUserInfo(userName).then((userInfo) => {
		if (Array.isArray(userInfo.notifications)) {

			var idx = userInfo.notifications.findIndex((item) => {
				return item.id == notifId
			})

			 userInfo.notifications.splice(idx, 1)

			publishNotifications(userName, userInfo.notifications)
			return usersModel.updateUserInfo(userName, userInfo)			 
		}

	})	
}

function addFriend(userName, friend) {
	console.log('addFriend', userName, friend)
	return usersModel.getUserInfo(userName).then((userInfo) => {
		if (!Array.isArray(userInfo.friends)) {
			userInfo.friends = []
		}
		userInfo.friends.push(friend)
		publishFriends(userName, userInfo.friends)
		return usersModel.updateUserInfo(userName, userInfo)

	})	
}

function acceptInvit(userName, from) {
	console.log('acceptInvit', userName, from)
	addFriend(userName, from).then(() => {
			return addFriend(from, userName)
		})

}

function getFriends(userName) {
	console.log('getFriends', userName)
	return usersModel.getUserInfo(userName).then((userInfo) => {
		return userInfo.friends
	})	
}

function readAndPublishFriends(userName) {
	console.log('readAndPublishFriends', userName)
	return getFriends(userName).then((friends) => {

		publishFriends(userName, friends)

	})
}

function publishFriends(userName, friends) {
	console.log('publishFriends', userName, friends)

	if (Array.isArray(friends)) {
		var data = friends.map((friendName) => {
			var broker = getBroker(friendName)

			return {name: friendName, isConnected: broker.isAppConnected('hmi', 'tchat')}
		})

		getBroker(userName).sendMessage('masterFriends', data)
	}


}

module.exports = {
	init,
	publishNotifications,
	sendNotification,
	removeNotification,
	acceptInvit,
	publishFriends,
	sendMessage,
	sendTopic,
	callService
}