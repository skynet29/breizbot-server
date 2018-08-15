const EventEmitter2 = require('eventemitter2').EventEmitter2


function sendMsg(client, msg) {
		//console.log('sendMsg', msg.topic)
	client.sendText(JSON.stringify(msg))

}

class Broker {
	constructor() {
		this.notifHistory = {}

		this.clients = {}
	}

	isAppConnected(appType, appName) {
		for(var client in this.clients) {
			var f = client.split('.')
			if (appType == f[0] && appName == f[1]) {
				return true
			}

		}
		return false
	}


	addClient(id, client) {

		console.log('addClient', id)

		this.clients[id] = client

		client.id = id
		client.events = new EventEmitter2({wildcard: true})
		client.registeredTopics = {}
		client.registeredServices = {}		

		client.on('text', (text) => {

			var msg = JSON.parse(text)
			msg.src = id
			this.handleClientMsg(client, msg)

		})

	

	}

	removeClient(id) {
		console.log('removeClient', id)

		delete this.clients[id]
		this.sendStatus()
	}


	handleClientMsg(client, msg) {

		//console.log('msg', msg)
		if (typeof msg.type != 'string') {
			console.log('Missing parameter type', msg)
			return
		}	

		switch(msg.type) {
			case 'registerService': {
				const srvName = msg.srvName

				if (typeof srvName != 'string') {
					console.warn('Missing parameter srvName', msg)
					return
				}	
				let dest = this.getServiceProvider(srvName)
				if (dest != undefined) {
					console.warn(`service '${srvName}' is already registered by agent '${dest.id}'`)
					return				
				}

				client.registeredServices[srvName] = 1
			}
			break

			case 'callService': {
				const srvName = msg.srvName

				if (typeof srvName != 'string') {
					console.warn('Missing parameter srvName', msg)
					return
				}	
				let dest = this.getServiceProvider(srvName)
				if (dest != undefined) {
					sendMsg(dest, msg)
				}
				else {
					var respMsg = {type: 'callServiceResp', srvName: srvName, statusCode: 100}
					sendMsg(client, respMsg)
				}

			}
			break


			case 'cmd': 
			case 'callServiceResp':
				//console.log('msg', msg)
				let dest = this.findClient(msg.dest)
				if (dest != undefined) {
					sendMsg(dest, msg)
				}
			break

			case 'unregister':
				if (client.registeredTopics[msg.topic] != undefined) {
					console.log(`client '${msg.src}' unsubscribes to topic '${msg.topic}'`)
					delete client.registeredTopics[msg.topic]
					client.events.removeAllListeners(msg.topic)
					this.sendStatus()
				}
			break

			case 'register':
				client.registeredTopics[msg.topic] = 1
				this.sendStatus()
				client.events.on(msg.topic, (msg) => {
					sendMsg(client, msg)
				})
				console.log(`client '${msg.src}' subscribes to topic '${msg.topic}'`)
				if (msg.getLast === true) {
					var events = new EventEmitter2({wildcard: true})
					events.on(msg.topic, (msg) => {

						sendMsg(client, msg)
					})
					for(let topic in this.notifHistory) {
						//console.log('emit', topic)
						events.emit(topic, this.notifHistory[topic])
					}
					console.log('emit history')

				
				}			
			break

			case 'notif':
				this.notifHistory[msg.topic] = msg
				if (msg.data == undefined) {
					delete this.notifHistory[msg.topic]
				}			
				this.broadcastToSubscribers(msg)
			break

			default:
				console.log('Unknown msg type', msg.type)
		}

	}	


	getServiceProvider(srvName) {
		for(var id in this.clients) {
			var client = this.clients[id]
			if (client.registeredServices[srvName] != undefined) {
				return client
			}
		}
	}




	broadcastToSubscribers(msg) {
		for(var id in this.clients) {
			var client = this.clients[id]
			client.events.emit(msg.topic, msg)
		}	
	}


	findClient(id) {
		return this.clients[id]
	}	

	sendMessage(topic, data) {
		var msg = {
			src: 'master',
			time: Date.now(),
			type: 'notif',
			topic,
			data
		}	
		this.notifHistory[topic] = msg
		//console.log('status', msg)
		this.broadcastToSubscribers(msg)		
	}

	sendStatus() {

		var data = {}
		for(var id in this.clients) {
			var client = this.clients[id]
			data[id] = {
				registeredTopics: Object.keys(client.registeredTopics),
				registeredServices:  Object.keys(client.registeredServices)
			}
		}

		this.sendMessage('masterClients', data)

	}	
}

module.exports = Broker