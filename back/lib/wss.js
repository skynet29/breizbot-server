const ws = require("nodejs-websocket")
const usersModel = require('./usersModel')
const uniqid = require('uniqid')

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
	console.log('New connection', client.path)

	var id = client.path.substr(1)

	var f = id.split('.')
	if (f.length < 3) {
		client.sendText('Bad URL')
		client.close()
		return
	}
	var userName = f[1]

	//console.log('userName', userName)

	var broker = getBroker(userName)

	broker.addClient(id, client)

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


module.exports = {
	init,
	publishNotifications,
	sendNotification
}