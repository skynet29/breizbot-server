

$$.registerService('TchatService', ['HttpService'], function(config, http) {


	return {
		sendText: function(dest, text) {
			return http.post('/api/tchat/send/' + dest, {text})
		}

		
	}
});


	




