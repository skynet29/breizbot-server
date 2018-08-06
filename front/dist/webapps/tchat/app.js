$$.configReady(function(config) {

	console.log('configReady')

	$$.startApp('MainControl')
});

$$.registerControlEx('MainControl', {
	deps: ['WebSocketService'],
	template: "<div></div>",
	init: function(elt, options, client) {

		client.register('masterFriends', true, onFriends)

		function onFriends(msg) {
			console.log('onFriends', msg.data)
		}
	}
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIkJC5jb25maWdSZWFkeShmdW5jdGlvbihjb25maWcpIHtcclxuXHJcblx0Y29uc29sZS5sb2coJ2NvbmZpZ1JlYWR5JylcclxuXHJcblx0JCQuc3RhcnRBcHAoJ01haW5Db250cm9sJylcclxufSk7XHJcbiIsIiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdNYWluQ29udHJvbCcsIHtcclxuXHRkZXBzOiBbJ1dlYlNvY2tldFNlcnZpY2UnXSxcclxuXHR0ZW1wbGF0ZTogXCI8ZGl2PjwvZGl2PlwiLFxyXG5cdGluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucywgY2xpZW50KSB7XHJcblxyXG5cdFx0Y2xpZW50LnJlZ2lzdGVyKCdtYXN0ZXJGcmllbmRzJywgdHJ1ZSwgb25GcmllbmRzKVxyXG5cclxuXHRcdGZ1bmN0aW9uIG9uRnJpZW5kcyhtc2cpIHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ29uRnJpZW5kcycsIG1zZy5kYXRhKVxyXG5cdFx0fVxyXG5cdH1cclxufSk7XHJcbiJdfQ==
