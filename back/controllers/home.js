
module.exports = function(app) {
	
	app.get('/', function(req, res) {
		if (req.session.connected) {
			res.render('home', {user: req.session.user})		
		}
		else {
			res.render('login', {message: '', user: ''})
		}
	})

}
