

$$.registerService('NotifService', ['HttpService'], function(config, http) {


	return {
		send: function(dest, notif) {
			return http.post('/api/notif/' + dest, notif)
		},


		sendInvit(to, from) {
			return this.send(to, {
				type: 'invit',
				message: `User <strong>${from}</strong> want to be your friend`,
				from
			})
		},

		delete: function(notifId) {
			return http.delete('/api/notif/' + notifId)
		}


		
	}
});


	




