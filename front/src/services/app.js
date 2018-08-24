

$$.registerService('AppService', ['HttpService'], function(config, http) {


	return {
		getUserAppsInfo: function() {
			return http.get('/api/app/webapps')
		},


		list: function() {
			return http.get('/api/app')
		}

		
	}
});


	




