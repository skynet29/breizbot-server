$$.configReady(function(config) {

	console.log('configReady')

	$$.startApp('MainControl')
});

$$.registerControlEx('MainControl', {
	deps: ['WebSocketService', 'HttpService', 'UserService'],
	
	init: function(elt, options, client, http, usrSrv) {

		var userName = usrSrv.getName()
		console.log('userName', userName)

		var ctrl = $$.viewController(elt, {
			template: "<div style=\"display: flex;flex-direction: column;flex: 1\">\n	\n\n	<form style=\"padding: 5px;display: flex;\" bn-event=\"submit: onInvit\">\n		<input type=\"text\" name=\"userName\" placeholder=\"user name\" required=\"\" class=\"w3-input w3-border\">\n		<button class=\"w3-btn w3-blue w3-bar-item w3-right\" type=\"submit\">Invit</button>\n	</form>		\n\n\n\n\n	<div style=\"display: flex; flex:1;\">\n		\n		<div style=\"flex: 1\" class=\"w3-card-4 w3-margin\"></div>\n		<div bn-control=\"FriendsPanelControl\" style=\"width: 200px\" class=\"w3-card-4 w3-margin\" bn-iface=\"friendsCtrl\"></div>\n	</div>\n\n</div>",

			events: {
				onInvit: function(ev) {
					ev.preventDefault()
					var data = $(this).getFormData()
					console.log('onInvit', data)

					
					var myFriends = ctrl.scope.friendsCtrl.getFriends()
					console.log('friends', myFriends)
					var friend = myFriends.find((item) => {
						return item.name == data.userName
					})

					console.log('friend', friend)

					if (friend != undefined) {
						$(this).resetForm()
						$$.showAlert(`User '${data.userName}' is already your friend !`)
						return
					}

					http.post('/api/notif/' + data.userName, {
						type: 'invit',
						message: `User <strong>${userName}</strong> want to be your friend`,
						from: userName
					}).catch((e) => {
						//console.log('Error', e)
						$$.showAlert(e.responseText)
					})
				}
			}
		})
	}
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIkJC5jb25maWdSZWFkeShmdW5jdGlvbihjb25maWcpIHtcblxuXHRjb25zb2xlLmxvZygnY29uZmlnUmVhZHknKVxuXG5cdCQkLnN0YXJ0QXBwKCdNYWluQ29udHJvbCcpXG59KTtcbiIsIiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdNYWluQ29udHJvbCcsIHtcblx0ZGVwczogWydXZWJTb2NrZXRTZXJ2aWNlJywgJ0h0dHBTZXJ2aWNlJywgJ1VzZXJTZXJ2aWNlJ10sXG5cdFxuXHRpbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMsIGNsaWVudCwgaHR0cCwgdXNyU3J2KSB7XG5cblx0XHR2YXIgdXNlck5hbWUgPSB1c3JTcnYuZ2V0TmFtZSgpXG5cdFx0Y29uc29sZS5sb2coJ3VzZXJOYW1lJywgdXNlck5hbWUpXG5cblx0XHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xuXHRcdFx0dGVtcGxhdGU6IFwiPGRpdiBzdHlsZT1cXFwiZGlzcGxheTogZmxleDtmbGV4LWRpcmVjdGlvbjogY29sdW1uO2ZsZXg6IDFcXFwiPlxcblx0XFxuXFxuXHQ8Zm9ybSBzdHlsZT1cXFwicGFkZGluZzogNXB4O2Rpc3BsYXk6IGZsZXg7XFxcIiBibi1ldmVudD1cXFwic3VibWl0OiBvbkludml0XFxcIj5cXG5cdFx0PGlucHV0IHR5cGU9XFxcInRleHRcXFwiIG5hbWU9XFxcInVzZXJOYW1lXFxcIiBwbGFjZWhvbGRlcj1cXFwidXNlciBuYW1lXFxcIiByZXF1aXJlZD1cXFwiXFxcIiBjbGFzcz1cXFwidzMtaW5wdXQgdzMtYm9yZGVyXFxcIj5cXG5cdFx0PGJ1dHRvbiBjbGFzcz1cXFwidzMtYnRuIHczLWJsdWUgdzMtYmFyLWl0ZW0gdzMtcmlnaHRcXFwiIHR5cGU9XFxcInN1Ym1pdFxcXCI+SW52aXQ8L2J1dHRvbj5cXG5cdDwvZm9ybT5cdFx0XFxuXFxuXFxuXFxuXFxuXHQ8ZGl2IHN0eWxlPVxcXCJkaXNwbGF5OiBmbGV4OyBmbGV4OjE7XFxcIj5cXG5cdFx0XFxuXHRcdDxkaXYgc3R5bGU9XFxcImZsZXg6IDFcXFwiIGNsYXNzPVxcXCJ3My1jYXJkLTQgdzMtbWFyZ2luXFxcIj48L2Rpdj5cXG5cdFx0PGRpdiBibi1jb250cm9sPVxcXCJGcmllbmRzUGFuZWxDb250cm9sXFxcIiBzdHlsZT1cXFwid2lkdGg6IDIwMHB4XFxcIiBjbGFzcz1cXFwidzMtY2FyZC00IHczLW1hcmdpblxcXCIgYm4taWZhY2U9XFxcImZyaWVuZHNDdHJsXFxcIj48L2Rpdj5cXG5cdDwvZGl2PlxcblxcbjwvZGl2PlwiLFxuXG5cdFx0XHRldmVudHM6IHtcblx0XHRcdFx0b25JbnZpdDogZnVuY3Rpb24oZXYpIHtcblx0XHRcdFx0XHRldi5wcmV2ZW50RGVmYXVsdCgpXG5cdFx0XHRcdFx0dmFyIGRhdGEgPSAkKHRoaXMpLmdldEZvcm1EYXRhKClcblx0XHRcdFx0XHRjb25zb2xlLmxvZygnb25JbnZpdCcsIGRhdGEpXG5cblx0XHRcdFx0XHRcblx0XHRcdFx0XHR2YXIgbXlGcmllbmRzID0gY3RybC5zY29wZS5mcmllbmRzQ3RybC5nZXRGcmllbmRzKClcblx0XHRcdFx0XHRjb25zb2xlLmxvZygnZnJpZW5kcycsIG15RnJpZW5kcylcblx0XHRcdFx0XHR2YXIgZnJpZW5kID0gbXlGcmllbmRzLmZpbmQoKGl0ZW0pID0+IHtcblx0XHRcdFx0XHRcdHJldHVybiBpdGVtLm5hbWUgPT0gZGF0YS51c2VyTmFtZVxuXHRcdFx0XHRcdH0pXG5cblx0XHRcdFx0XHRjb25zb2xlLmxvZygnZnJpZW5kJywgZnJpZW5kKVxuXG5cdFx0XHRcdFx0aWYgKGZyaWVuZCAhPSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRcdCQodGhpcykucmVzZXRGb3JtKClcblx0XHRcdFx0XHRcdCQkLnNob3dBbGVydChgVXNlciAnJHtkYXRhLnVzZXJOYW1lfScgaXMgYWxyZWFkeSB5b3VyIGZyaWVuZCAhYClcblx0XHRcdFx0XHRcdHJldHVyblxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGh0dHAucG9zdCgnL2FwaS9ub3RpZi8nICsgZGF0YS51c2VyTmFtZSwge1xuXHRcdFx0XHRcdFx0dHlwZTogJ2ludml0Jyxcblx0XHRcdFx0XHRcdG1lc3NhZ2U6IGBVc2VyIDxzdHJvbmc+JHt1c2VyTmFtZX08L3N0cm9uZz4gd2FudCB0byBiZSB5b3VyIGZyaWVuZGAsXG5cdFx0XHRcdFx0XHRmcm9tOiB1c2VyTmFtZVxuXHRcdFx0XHRcdH0pLmNhdGNoKChlKSA9PiB7XG5cdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdFcnJvcicsIGUpXG5cdFx0XHRcdFx0XHQkJC5zaG93QWxlcnQoZS5yZXNwb25zZVRleHQpXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pXG5cdH1cbn0pO1xuIl19
