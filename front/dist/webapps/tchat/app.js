$$.configReady(function(config) {

	console.log('configReady')

	$$.startApp('MainControl')
});

$$.registerControlEx('MainControl', {
	deps: ['WebSocketService'],
	
	init: function(elt, options, client) {

		var ctrl = $$.viewController(elt, {
			template: "<div style=\"display: flex; flex:1\">\r\n	\r\n	<div style=\"flex: 1\"></div>\r\n	<div bn-control=\"FriendsPanelControl\" style=\"width: 200px\" class=\"w3-border\"></div>\r\n</div>",
		})
	}
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIiQkLmNvbmZpZ1JlYWR5KGZ1bmN0aW9uKGNvbmZpZykge1xyXG5cclxuXHRjb25zb2xlLmxvZygnY29uZmlnUmVhZHknKVxyXG5cclxuXHQkJC5zdGFydEFwcCgnTWFpbkNvbnRyb2wnKVxyXG59KTtcclxuIiwiJCQucmVnaXN0ZXJDb250cm9sRXgoJ01haW5Db250cm9sJywge1xyXG5cdGRlcHM6IFsnV2ViU29ja2V0U2VydmljZSddLFxyXG5cdFxyXG5cdGluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucywgY2xpZW50KSB7XHJcblxyXG5cdFx0dmFyIGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihlbHQsIHtcclxuXHRcdFx0dGVtcGxhdGU6IFwiPGRpdiBzdHlsZT1cXFwiZGlzcGxheTogZmxleDsgZmxleDoxXFxcIj5cXHJcXG5cdFxcclxcblx0PGRpdiBzdHlsZT1cXFwiZmxleDogMVxcXCI+PC9kaXY+XFxyXFxuXHQ8ZGl2IGJuLWNvbnRyb2w9XFxcIkZyaWVuZHNQYW5lbENvbnRyb2xcXFwiIHN0eWxlPVxcXCJ3aWR0aDogMjAwcHhcXFwiIGNsYXNzPVxcXCJ3My1ib3JkZXJcXFwiPjwvZGl2PlxcclxcbjwvZGl2PlwiLFxyXG5cdFx0fSlcclxuXHR9XHJcbn0pO1xyXG4iXX0=
