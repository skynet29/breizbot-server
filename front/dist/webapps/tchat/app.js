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
			template: "<div style=\"display: flex;flex-direction: column;flex: 1\">\n	\n\n	<form style=\"padding: 5px;\" bn-event=\"submit: onInvit\">\n		<input type=\"text\" name=\"userName\" placeholder=\"user name\" required=\"\">\n		<button class=\"w3-button w3-blue\" type=\"submit\">Invit</button>\n	</form>\n\n	<div style=\"display: flex; flex:1\">\n		\n		<div style=\"flex: 1\"></div>\n		<div bn-control=\"FriendsPanelControl\" style=\"width: 200px\" class=\"w3-border\" bn-iface=\"friendsCtrl\"></div>\n	</div>\n\n</div>",

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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIkJC5jb25maWdSZWFkeShmdW5jdGlvbihjb25maWcpIHtcblxuXHRjb25zb2xlLmxvZygnY29uZmlnUmVhZHknKVxuXG5cdCQkLnN0YXJ0QXBwKCdNYWluQ29udHJvbCcpXG59KTtcbiIsIiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdNYWluQ29udHJvbCcsIHtcblx0ZGVwczogWydXZWJTb2NrZXRTZXJ2aWNlJywgJ0h0dHBTZXJ2aWNlJywgJ1VzZXJTZXJ2aWNlJ10sXG5cdFxuXHRpbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMsIGNsaWVudCwgaHR0cCwgdXNyU3J2KSB7XG5cblx0XHR2YXIgdXNlck5hbWUgPSB1c3JTcnYuZ2V0TmFtZSgpXG5cdFx0Y29uc29sZS5sb2coJ3VzZXJOYW1lJywgdXNlck5hbWUpXG5cblx0XHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xuXHRcdFx0dGVtcGxhdGU6IFwiPGRpdiBzdHlsZT1cXFwiZGlzcGxheTogZmxleDtmbGV4LWRpcmVjdGlvbjogY29sdW1uO2ZsZXg6IDFcXFwiPlxcblx0XFxuXFxuXHQ8Zm9ybSBzdHlsZT1cXFwicGFkZGluZzogNXB4O1xcXCIgYm4tZXZlbnQ9XFxcInN1Ym1pdDogb25JbnZpdFxcXCI+XFxuXHRcdDxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBuYW1lPVxcXCJ1c2VyTmFtZVxcXCIgcGxhY2Vob2xkZXI9XFxcInVzZXIgbmFtZVxcXCIgcmVxdWlyZWQ9XFxcIlxcXCI+XFxuXHRcdDxidXR0b24gY2xhc3M9XFxcInczLWJ1dHRvbiB3My1ibHVlXFxcIiB0eXBlPVxcXCJzdWJtaXRcXFwiPkludml0PC9idXR0b24+XFxuXHQ8L2Zvcm0+XFxuXFxuXHQ8ZGl2IHN0eWxlPVxcXCJkaXNwbGF5OiBmbGV4OyBmbGV4OjFcXFwiPlxcblx0XHRcXG5cdFx0PGRpdiBzdHlsZT1cXFwiZmxleDogMVxcXCI+PC9kaXY+XFxuXHRcdDxkaXYgYm4tY29udHJvbD1cXFwiRnJpZW5kc1BhbmVsQ29udHJvbFxcXCIgc3R5bGU9XFxcIndpZHRoOiAyMDBweFxcXCIgY2xhc3M9XFxcInczLWJvcmRlclxcXCIgYm4taWZhY2U9XFxcImZyaWVuZHNDdHJsXFxcIj48L2Rpdj5cXG5cdDwvZGl2PlxcblxcbjwvZGl2PlwiLFxuXG5cdFx0XHRldmVudHM6IHtcblx0XHRcdFx0b25JbnZpdDogZnVuY3Rpb24oZXYpIHtcblx0XHRcdFx0XHRldi5wcmV2ZW50RGVmYXVsdCgpXG5cdFx0XHRcdFx0dmFyIGRhdGEgPSAkKHRoaXMpLmdldEZvcm1EYXRhKClcblx0XHRcdFx0XHRjb25zb2xlLmxvZygnb25JbnZpdCcsIGRhdGEpXG5cblx0XHRcdFx0XHRcblx0XHRcdFx0XHR2YXIgbXlGcmllbmRzID0gY3RybC5zY29wZS5mcmllbmRzQ3RybC5nZXRGcmllbmRzKClcblx0XHRcdFx0XHRjb25zb2xlLmxvZygnZnJpZW5kcycsIG15RnJpZW5kcylcblx0XHRcdFx0XHR2YXIgZnJpZW5kID0gbXlGcmllbmRzLmZpbmQoKGl0ZW0pID0+IHtcblx0XHRcdFx0XHRcdHJldHVybiBpdGVtLm5hbWUgPT0gZGF0YS51c2VyTmFtZVxuXHRcdFx0XHRcdH0pXG5cblx0XHRcdFx0XHRjb25zb2xlLmxvZygnZnJpZW5kJywgZnJpZW5kKVxuXG5cdFx0XHRcdFx0aWYgKGZyaWVuZCAhPSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRcdCQodGhpcykucmVzZXRGb3JtKClcblx0XHRcdFx0XHRcdCQkLnNob3dBbGVydChgVXNlciAnJHtkYXRhLnVzZXJOYW1lfScgaXMgYWxyZWFkeSB5b3VyIGZyaWVuZCAhYClcblx0XHRcdFx0XHRcdHJldHVyblxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGh0dHAucG9zdCgnL2FwaS9ub3RpZi8nICsgZGF0YS51c2VyTmFtZSwge1xuXHRcdFx0XHRcdFx0dHlwZTogJ2ludml0Jyxcblx0XHRcdFx0XHRcdG1lc3NhZ2U6IGBVc2VyIDxzdHJvbmc+JHt1c2VyTmFtZX08L3N0cm9uZz4gd2FudCB0byBiZSB5b3VyIGZyaWVuZGAsXG5cdFx0XHRcdFx0XHRmcm9tOiB1c2VyTmFtZVxuXHRcdFx0XHRcdH0pLmNhdGNoKChlKSA9PiB7XG5cdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdFcnJvcicsIGUpXG5cdFx0XHRcdFx0XHQkJC5zaG93QWxlcnQoZS5yZXNwb25zZVRleHQpXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pXG5cdH1cbn0pO1xuIl19
