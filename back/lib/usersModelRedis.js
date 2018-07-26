var redis = require('redis')
var client  = null
var bluebird = require('bluebird')

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);



const admin = {
	pwd: 'admin',
	allowedApps: {
		users: true
	}
}


function init(dbUrl) {

		console.log('initDb', dbUrl)

		client = redis.createClient({url: dbUrl})

		client.on('error', (err) => {
			console.log('redis error', err)
		})

		client.on('ready', () => {
			console.log('database ready !')
		})

		return client.existsAsync('admin').then((res) => {
			if (res == 0) {
				console.log('create admin user')
				return client.setAsync('admin', JSON.stringify(admin))
			}
			else {
				return Promise.resolve('Ready!!')
			}
		})




}

module.exports =  {
	init,

	getUserList: function() {

		console.log('getUserList')
		return client.keysAsync('*')
	},

	getUserInfo: function(userName) {

		console.log('getUserInfo', userName)
		return client.getAsync(userName).then((res) => {
			console.log('res', res)
			return JSON.parse(res)
		})
	},


	updateUserInfo: function(userName, data) {

		console.log(`updateUserInfo`, userName, data)

		return client.existsAsync(userName)
		.then((res) => {
			if (res == 0) {
				return Promise.reject('unknown user')
			}

			return client.setAsync(userName, JSON.stringify(data))
		})		

	},

	createUser: function(userName) {

		console.log(`createUser`, userName)
		return client.existsAsync(userName)
		.then((res) => {
			if (res == 1) {
				return Promise.reject('user already created')
			}

			var data = {pwd: 'welcome', allowedApps: {}}
			return client.setAsync(userName, JSON.stringify(data))
		})	



	},


	deleteUser: function(userName) {

		console.log(`deleteUser`, userName)

		return client.delAsync(userName)
	}

}


