const ws = require("nodejs-websocket")
const usersModel = require('./usersModel')
const uniqid = require('uniqid')
const colors = require('colors')

var Broker = require('./broker')

var brokers = {}

function init(options) {
	options.secure = true

	const wss = ws.createServer(options, onConnect)

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

function onConnect(client) {
	

	var id = client.path.substr(1)

	console.log(`New connection ${id}`.green)

	var f = id.split('.')
	if (f.length < 3) {
		client.sendText('Bad URL')
		client.close()
		return
	}
	var userName = f[1]
	var appName = f[2]
	var appType = f[0]

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
		//readAndPublishFriends(userName)
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

function sendMessage(from, to, text) {
	console.log('sendMessage', from, to, text)

	var broker = getBroker(to)
	broker.sendMessage('masterMessage', {from, to, text})
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
	sendMessage
}