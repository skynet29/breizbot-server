$$.configReady(function(config) {

	console.log('configReady')

	$$.startApp('MainControl')
});

$$.registerControlEx('MainControl', {
	deps: ['WebSocketService', 'TchatService', 'UserService', 'NotifService'],
	
	init: function(elt, options, client, tchatSrv, usrSrv, notifSrv) {

		var userName = usrSrv.getName()
		console.log('userName', userName)

		client.register('masterMessage', false, function(msg) {
			var data = msg.data
			var tabCtrl = ctrl.scope.tabCtrl

			console.log('masterMessage', data)

			var panel = tabCtrl.getTabPanelByTitle(data.from)
			if (panel.length == 0) {
				var idx = tabCtrl.addTab(data.from, {
					removable: true,
					template: `<p class="w3-right-align">${data.text}</p>`
				})

				if (tabCtrl.getTabCount() == 1) {
					tabCtrl.setActive(idx)
				}

				
			}
			else {
				addMessage(panel, data.text)
			}

			console.log('panel', panel)
		})

		function addMessage(panel, text, isOwner) {
			console.log('addMessage', text, isOwner)
			if (isOwner === true) {
				panel.append(`<p>${text}</p>`)
			}
			else {
				panel.append(`<p class="w3-right-align">${text}</p>`)
			} 
				
		}

		var ctrl = $$.viewController(elt, {
			template: "<div style=\"display: flex;flex-direction: column;flex: 1\">\n	\n\n	<form style=\"padding: 5px;display: flex;\" bn-event=\"submit: onInvit\">\n		<input type=\"text\" name=\"userName\" placeholder=\"user name\" required=\"\" class=\"w3-input w3-border\">\n		<button class=\"w3-btn w3-blue w3-bar-item w3-right\" type=\"submit\">Invit</button>\n	</form>		\n\n\n\n\n	<div class=\"bn-flex-row bn-flex-1\">\n		\n		<div class=\"bn-flex-col bn-flex-1\" class=\"w3-card-4 w3-margin\">\n			<div bn-control=\"TabControl\" style=\"flex: 1\" bn-iface=\"tabCtrl\"></div>\n\n			<form style=\"padding: 5px;display: flex;\" bn-event=\"submit: onSend\">\n				<input type=\"text\" name=\"message\" placeholder=\"your message\" required=\"\" class=\"w3-input w3-border\">\n				<button class=\"w3-btn w3-blue w3-bar-item w3-right\" type=\"submit\">Send</button>\n			</form>				\n		</div>\n		<div bn-control=\"FriendsPanelControl\" style=\"width: 200px\" class=\"w3-card-4 w3-margin\" bn-iface=\"friendsCtrl\" bn-event=\"friendSelected: onFriendSelected\"></div>\n	</div>\n\n</div>",

			events: {
				onFriendSelected: function(ev, data) {
					console.log('onFriendSelected', data)
					if (!data.isConnected) {
						$$.showAlert(`User '${data.name}' is not connected`)
						return
					}

					var tabCtrl = ctrl.scope.tabCtrl

					var idx = tabCtrl.getTabIndexByTitle(data.name)
					console.log('idx', idx)

					if (idx < 0) {
						idx = tabCtrl.addTab(data.name, {removable: true})
					}

					
					tabCtrl.setActive(idx)
				},
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

					notifSrv.sendInvit(data.userName, userName).catch((e) => {
						//console.log('Error', e)
						$$.showAlert(e.responseText)
					})
				},

				onSend: function(ev) {
					ev.preventDefault()

					var tabCtrl = ctrl.scope.tabCtrl

					var tabIdx = tabCtrl.getActive()
					console.log('tabIdx', tabIdx)

					var dest = tabCtrl.getTitleByIndex(tabIdx)
					console.log('dest', dest)
					if (dest == undefined) {
						$$.showAlert('Please select a user first')
						return

					}



					var data = $(this).getFormData()
					console.log('data', data)

					$(this).resetForm()
			
					var panel = tabCtrl.getTabPanelByTitle(dest)
					addMessage(panel, data.message, true)

					tchatSrv.sendText(dest, data.message).catch((e) => {
						//console.log('Error', e)
						$$.showAlert(e.responseText)
					})

				}
			}
		})
	}
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIiQkLmNvbmZpZ1JlYWR5KGZ1bmN0aW9uKGNvbmZpZykge1xuXG5cdGNvbnNvbGUubG9nKCdjb25maWdSZWFkeScpXG5cblx0JCQuc3RhcnRBcHAoJ01haW5Db250cm9sJylcbn0pO1xuIiwiJCQucmVnaXN0ZXJDb250cm9sRXgoJ01haW5Db250cm9sJywge1xuXHRkZXBzOiBbJ1dlYlNvY2tldFNlcnZpY2UnLCAnVGNoYXRTZXJ2aWNlJywgJ1VzZXJTZXJ2aWNlJywgJ05vdGlmU2VydmljZSddLFxuXHRcblx0aW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zLCBjbGllbnQsIHRjaGF0U3J2LCB1c3JTcnYsIG5vdGlmU3J2KSB7XG5cblx0XHR2YXIgdXNlck5hbWUgPSB1c3JTcnYuZ2V0TmFtZSgpXG5cdFx0Y29uc29sZS5sb2coJ3VzZXJOYW1lJywgdXNlck5hbWUpXG5cblx0XHRjbGllbnQucmVnaXN0ZXIoJ21hc3Rlck1lc3NhZ2UnLCBmYWxzZSwgZnVuY3Rpb24obXNnKSB7XG5cdFx0XHR2YXIgZGF0YSA9IG1zZy5kYXRhXG5cdFx0XHR2YXIgdGFiQ3RybCA9IGN0cmwuc2NvcGUudGFiQ3RybFxuXG5cdFx0XHRjb25zb2xlLmxvZygnbWFzdGVyTWVzc2FnZScsIGRhdGEpXG5cblx0XHRcdHZhciBwYW5lbCA9IHRhYkN0cmwuZ2V0VGFiUGFuZWxCeVRpdGxlKGRhdGEuZnJvbSlcblx0XHRcdGlmIChwYW5lbC5sZW5ndGggPT0gMCkge1xuXHRcdFx0XHR2YXIgaWR4ID0gdGFiQ3RybC5hZGRUYWIoZGF0YS5mcm9tLCB7XG5cdFx0XHRcdFx0cmVtb3ZhYmxlOiB0cnVlLFxuXHRcdFx0XHRcdHRlbXBsYXRlOiBgPHAgY2xhc3M9XCJ3My1yaWdodC1hbGlnblwiPiR7ZGF0YS50ZXh0fTwvcD5gXG5cdFx0XHRcdH0pXG5cblx0XHRcdFx0aWYgKHRhYkN0cmwuZ2V0VGFiQ291bnQoKSA9PSAxKSB7XG5cdFx0XHRcdFx0dGFiQ3RybC5zZXRBY3RpdmUoaWR4KVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0YWRkTWVzc2FnZShwYW5lbCwgZGF0YS50ZXh0KVxuXHRcdFx0fVxuXG5cdFx0XHRjb25zb2xlLmxvZygncGFuZWwnLCBwYW5lbClcblx0XHR9KVxuXG5cdFx0ZnVuY3Rpb24gYWRkTWVzc2FnZShwYW5lbCwgdGV4dCwgaXNPd25lcikge1xuXHRcdFx0Y29uc29sZS5sb2coJ2FkZE1lc3NhZ2UnLCB0ZXh0LCBpc093bmVyKVxuXHRcdFx0aWYgKGlzT3duZXIgPT09IHRydWUpIHtcblx0XHRcdFx0cGFuZWwuYXBwZW5kKGA8cD4ke3RleHR9PC9wPmApXG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0cGFuZWwuYXBwZW5kKGA8cCBjbGFzcz1cInczLXJpZ2h0LWFsaWduXCI+JHt0ZXh0fTwvcD5gKVxuXHRcdFx0fSBcblx0XHRcdFx0XG5cdFx0fVxuXG5cdFx0dmFyIGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihlbHQsIHtcblx0XHRcdHRlbXBsYXRlOiBcIjxkaXYgc3R5bGU9XFxcImRpc3BsYXk6IGZsZXg7ZmxleC1kaXJlY3Rpb246IGNvbHVtbjtmbGV4OiAxXFxcIj5cXG5cdFxcblxcblx0PGZvcm0gc3R5bGU9XFxcInBhZGRpbmc6IDVweDtkaXNwbGF5OiBmbGV4O1xcXCIgYm4tZXZlbnQ9XFxcInN1Ym1pdDogb25JbnZpdFxcXCI+XFxuXHRcdDxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBuYW1lPVxcXCJ1c2VyTmFtZVxcXCIgcGxhY2Vob2xkZXI9XFxcInVzZXIgbmFtZVxcXCIgcmVxdWlyZWQ9XFxcIlxcXCIgY2xhc3M9XFxcInczLWlucHV0IHczLWJvcmRlclxcXCI+XFxuXHRcdDxidXR0b24gY2xhc3M9XFxcInczLWJ0biB3My1ibHVlIHczLWJhci1pdGVtIHczLXJpZ2h0XFxcIiB0eXBlPVxcXCJzdWJtaXRcXFwiPkludml0PC9idXR0b24+XFxuXHQ8L2Zvcm0+XHRcdFxcblxcblxcblxcblxcblx0PGRpdiBjbGFzcz1cXFwiYm4tZmxleC1yb3cgYm4tZmxleC0xXFxcIj5cXG5cdFx0XFxuXHRcdDxkaXYgY2xhc3M9XFxcImJuLWZsZXgtY29sIGJuLWZsZXgtMVxcXCIgY2xhc3M9XFxcInczLWNhcmQtNCB3My1tYXJnaW5cXFwiPlxcblx0XHRcdDxkaXYgYm4tY29udHJvbD1cXFwiVGFiQ29udHJvbFxcXCIgc3R5bGU9XFxcImZsZXg6IDFcXFwiIGJuLWlmYWNlPVxcXCJ0YWJDdHJsXFxcIj48L2Rpdj5cXG5cXG5cdFx0XHQ8Zm9ybSBzdHlsZT1cXFwicGFkZGluZzogNXB4O2Rpc3BsYXk6IGZsZXg7XFxcIiBibi1ldmVudD1cXFwic3VibWl0OiBvblNlbmRcXFwiPlxcblx0XHRcdFx0PGlucHV0IHR5cGU9XFxcInRleHRcXFwiIG5hbWU9XFxcIm1lc3NhZ2VcXFwiIHBsYWNlaG9sZGVyPVxcXCJ5b3VyIG1lc3NhZ2VcXFwiIHJlcXVpcmVkPVxcXCJcXFwiIGNsYXNzPVxcXCJ3My1pbnB1dCB3My1ib3JkZXJcXFwiPlxcblx0XHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwidzMtYnRuIHczLWJsdWUgdzMtYmFyLWl0ZW0gdzMtcmlnaHRcXFwiIHR5cGU9XFxcInN1Ym1pdFxcXCI+U2VuZDwvYnV0dG9uPlxcblx0XHRcdDwvZm9ybT5cdFx0XHRcdFxcblx0XHQ8L2Rpdj5cXG5cdFx0PGRpdiBibi1jb250cm9sPVxcXCJGcmllbmRzUGFuZWxDb250cm9sXFxcIiBzdHlsZT1cXFwid2lkdGg6IDIwMHB4XFxcIiBjbGFzcz1cXFwidzMtY2FyZC00IHczLW1hcmdpblxcXCIgYm4taWZhY2U9XFxcImZyaWVuZHNDdHJsXFxcIiBibi1ldmVudD1cXFwiZnJpZW5kU2VsZWN0ZWQ6IG9uRnJpZW5kU2VsZWN0ZWRcXFwiPjwvZGl2Plxcblx0PC9kaXY+XFxuXFxuPC9kaXY+XCIsXG5cblx0XHRcdGV2ZW50czoge1xuXHRcdFx0XHRvbkZyaWVuZFNlbGVjdGVkOiBmdW5jdGlvbihldiwgZGF0YSkge1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCdvbkZyaWVuZFNlbGVjdGVkJywgZGF0YSlcblx0XHRcdFx0XHRpZiAoIWRhdGEuaXNDb25uZWN0ZWQpIHtcblx0XHRcdFx0XHRcdCQkLnNob3dBbGVydChgVXNlciAnJHtkYXRhLm5hbWV9JyBpcyBub3QgY29ubmVjdGVkYClcblx0XHRcdFx0XHRcdHJldHVyblxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHZhciB0YWJDdHJsID0gY3RybC5zY29wZS50YWJDdHJsXG5cblx0XHRcdFx0XHR2YXIgaWR4ID0gdGFiQ3RybC5nZXRUYWJJbmRleEJ5VGl0bGUoZGF0YS5uYW1lKVxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCdpZHgnLCBpZHgpXG5cblx0XHRcdFx0XHRpZiAoaWR4IDwgMCkge1xuXHRcdFx0XHRcdFx0aWR4ID0gdGFiQ3RybC5hZGRUYWIoZGF0YS5uYW1lLCB7cmVtb3ZhYmxlOiB0cnVlfSlcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcblx0XHRcdFx0XHR0YWJDdHJsLnNldEFjdGl2ZShpZHgpXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9uSW52aXQ6IGZ1bmN0aW9uKGV2KSB7XG5cdFx0XHRcdFx0ZXYucHJldmVudERlZmF1bHQoKVxuXHRcdFx0XHRcdHZhciBkYXRhID0gJCh0aGlzKS5nZXRGb3JtRGF0YSgpXG5cdFx0XHRcdFx0Y29uc29sZS5sb2coJ29uSW52aXQnLCBkYXRhKVxuXG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0dmFyIG15RnJpZW5kcyA9IGN0cmwuc2NvcGUuZnJpZW5kc0N0cmwuZ2V0RnJpZW5kcygpXG5cdFx0XHRcdFx0Y29uc29sZS5sb2coJ2ZyaWVuZHMnLCBteUZyaWVuZHMpXG5cdFx0XHRcdFx0dmFyIGZyaWVuZCA9IG15RnJpZW5kcy5maW5kKChpdGVtKSA9PiB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gaXRlbS5uYW1lID09IGRhdGEudXNlck5hbWVcblx0XHRcdFx0XHR9KVxuXG5cdFx0XHRcdFx0Y29uc29sZS5sb2coJ2ZyaWVuZCcsIGZyaWVuZClcblxuXHRcdFx0XHRcdGlmIChmcmllbmQgIT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0XHQkKHRoaXMpLnJlc2V0Rm9ybSgpXG5cdFx0XHRcdFx0XHQkJC5zaG93QWxlcnQoYFVzZXIgJyR7ZGF0YS51c2VyTmFtZX0nIGlzIGFscmVhZHkgeW91ciBmcmllbmQgIWApXG5cdFx0XHRcdFx0XHRyZXR1cm5cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRub3RpZlNydi5zZW5kSW52aXQoZGF0YS51c2VyTmFtZSwgdXNlck5hbWUpLmNhdGNoKChlKSA9PiB7XG5cdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdFcnJvcicsIGUpXG5cdFx0XHRcdFx0XHQkJC5zaG93QWxlcnQoZS5yZXNwb25zZVRleHQpXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0fSxcblxuXHRcdFx0XHRvblNlbmQ6IGZ1bmN0aW9uKGV2KSB7XG5cdFx0XHRcdFx0ZXYucHJldmVudERlZmF1bHQoKVxuXG5cdFx0XHRcdFx0dmFyIHRhYkN0cmwgPSBjdHJsLnNjb3BlLnRhYkN0cmxcblxuXHRcdFx0XHRcdHZhciB0YWJJZHggPSB0YWJDdHJsLmdldEFjdGl2ZSgpXG5cdFx0XHRcdFx0Y29uc29sZS5sb2coJ3RhYklkeCcsIHRhYklkeClcblxuXHRcdFx0XHRcdHZhciBkZXN0ID0gdGFiQ3RybC5nZXRUaXRsZUJ5SW5kZXgodGFiSWR4KVxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCdkZXN0JywgZGVzdClcblx0XHRcdFx0XHRpZiAoZGVzdCA9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRcdCQkLnNob3dBbGVydCgnUGxlYXNlIHNlbGVjdCBhIHVzZXIgZmlyc3QnKVxuXHRcdFx0XHRcdFx0cmV0dXJuXG5cblx0XHRcdFx0XHR9XG5cblxuXG5cdFx0XHRcdFx0dmFyIGRhdGEgPSAkKHRoaXMpLmdldEZvcm1EYXRhKClcblx0XHRcdFx0XHRjb25zb2xlLmxvZygnZGF0YScsIGRhdGEpXG5cblx0XHRcdFx0XHQkKHRoaXMpLnJlc2V0Rm9ybSgpXG5cdFx0XHRcblx0XHRcdFx0XHR2YXIgcGFuZWwgPSB0YWJDdHJsLmdldFRhYlBhbmVsQnlUaXRsZShkZXN0KVxuXHRcdFx0XHRcdGFkZE1lc3NhZ2UocGFuZWwsIGRhdGEubWVzc2FnZSwgdHJ1ZSlcblxuXHRcdFx0XHRcdHRjaGF0U3J2LnNlbmRUZXh0KGRlc3QsIGRhdGEubWVzc2FnZSkuY2F0Y2goKGUpID0+IHtcblx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ0Vycm9yJywgZSlcblx0XHRcdFx0XHRcdCQkLnNob3dBbGVydChlLnJlc3BvbnNlVGV4dClcblx0XHRcdFx0XHR9KVxuXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KVxuXHR9XG59KTtcbiJdfQ==
