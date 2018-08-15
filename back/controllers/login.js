var usersModel = require('../lib/usersModel')
var wss = require('../lib/wss')
const colors = require('colors')

module.exports = function(app) {

	app.post('/connect', function(req, res) {
		//console.log('connect', req.body, req.path)
		var user = req.body.user

		usersModel.getUserInfo(user).then((userInfo) => {

			//console.log('userInfo', userInfo)
			if (userInfo == null) {
				res.render('login', {message: 'Unknown user', user:''})
			}
			else if (userInfo.pwd != req.body.pwd) {
				res.render('login', {message: 'Bad password', user: user})
			}

			else {

				req.session.connected = true
				console.log(`user '${user}' connected with IP:${req.ip}`.blue)

				req.session.allowedApps = userInfo.allowedApps

				if (Array.isArray(userInfo.notifications)) {
					wss.publishNotifications(user, userInfo.notifications)
				}

				wss.publishFriends(user, userInfo.friends)

				req.session.user = user
				res.redirect('/')
1			}

		}).catch((e) => {
				console.log('error', e)
				res.render('error', {message: e})
			}
		)
	})

	app.get('/disconnect', function(req, res) {
		var user = req.session.user
		console.log(`user '${user}' disconnected`.blue)
/*		delete connectedUsers[req.session.user]
*/		req.session.connected = false
		req.session.destroy()
		res.redirect('/')
/*		sendStatus()
*/
	})

}