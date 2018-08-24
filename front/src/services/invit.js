

$$.registerService('InvitService', ['HttpService'], function(config, http) {


	return {
		accept: function(from) {
			return http.post('/api/invit/accept/' + from)
		}

		
	}
});


	




