$$.configReady(function(config) {

	console.log('configReady')

	$$.startApp('MainControl')
});

$$.registerControlEx('MainControl', {
	deps: ['WebSocketService', 'HttpService', 'UserService'],
	
	init: function(elt, options, client, http, usrSrv) {

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
					template: `<p>${data.text}</p>`
				})

				if (tabCtrl.getTabCount() == 1) {
					tabCtrl.setActive(idx)
				}

				
			}
			else {
				panel.append(`<p>${data.text}</p>`)
			}

			console.log('panel', panel)
		})

		var ctrl = $$.viewController(elt, {
			template: "<div style=\"display: flex;flex-direction: column;flex: 1\">\n	\n\n	<form style=\"padding: 5px;display: flex;\" bn-event=\"submit: onInvit\">\n		<input type=\"text\" name=\"userName\" placeholder=\"user name\" required=\"\" class=\"w3-input w3-border\">\n		<button class=\"w3-btn w3-blue w3-bar-item w3-right\" type=\"submit\">Invit</button>\n	</form>		\n\n\n\n\n	<div class=\"bn-flex-row bn-flex-1\">\n		\n		<div class=\"bn-flex-col bn-flex-1\" class=\"w3-card-4 w3-margin\">\n			<div bn-control=\"TabControl\" style=\"flex: 1\" bn-iface=\"tabCtrl\"></div>\n\n			<form style=\"padding: 5px;display: flex;\" bn-event=\"submit: onSend\">\n				<input type=\"text\" name=\"message\" placeholder=\"your message\" required=\"\" class=\"w3-input w3-border\">\n				<button class=\"w3-btn w3-blue w3-bar-item w3-right\" type=\"submit\">Send</button>\n			</form>				\n		</div>\n		<div bn-control=\"FriendsPanelControl\" style=\"width: 200px\" class=\"w3-card-4 w3-margin\" bn-iface=\"friendsCtrl\" bn-event=\"friendSelected: onFriendSelected\"></div>\n	</div>\n\n</div>",

			events: {
				onFriendSelected: function(ev, data) {
					console.log('onFriendSelected', data)
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

					http.post('/api/notif/' + data.userName, {
						type: 'invit',
						message: `User <strong>${userName}</strong> want to be your friend`,
						from: userName
					}).catch((e) => {
						//console.log('Error', e)
						$$.showAlert(e.responseText)
					})
				},

				onSend: function(ev) {
					ev.preventDefault()

					var tabCtrl = ctrl.scope.tabCtrl

					var tabIdx = tabCtrl.getActive()
					console.log('tabIdx', tabIdx)

					var userName = tabCtrl.getTitleByIndex(tabIdx)
					console.log('userName', userName)
					if (userName == undefined) {
						$$.showAlert('Please select a user first')
						return

					}

					var data = $(this).getFormData()
					console.log('data', data)

					$(this).resetForm()

					http.post('/api/tchat/send/' + userName, {
						text: data.message
					}).catch((e) => {
						//console.log('Error', e)
						$$.showAlert(e.responseText)
					})

				}
			}
		})
	}
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIiQkLmNvbmZpZ1JlYWR5KGZ1bmN0aW9uKGNvbmZpZykge1xuXG5cdGNvbnNvbGUubG9nKCdjb25maWdSZWFkeScpXG5cblx0JCQuc3RhcnRBcHAoJ01haW5Db250cm9sJylcbn0pO1xuIiwiJCQucmVnaXN0ZXJDb250cm9sRXgoJ01haW5Db250cm9sJywge1xuXHRkZXBzOiBbJ1dlYlNvY2tldFNlcnZpY2UnLCAnSHR0cFNlcnZpY2UnLCAnVXNlclNlcnZpY2UnXSxcblx0XG5cdGluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucywgY2xpZW50LCBodHRwLCB1c3JTcnYpIHtcblxuXHRcdHZhciB1c2VyTmFtZSA9IHVzclNydi5nZXROYW1lKClcblx0XHRjb25zb2xlLmxvZygndXNlck5hbWUnLCB1c2VyTmFtZSlcblxuXHRcdGNsaWVudC5yZWdpc3RlcignbWFzdGVyTWVzc2FnZScsIGZhbHNlLCBmdW5jdGlvbihtc2cpIHtcblx0XHRcdHZhciBkYXRhID0gbXNnLmRhdGFcblx0XHRcdHZhciB0YWJDdHJsID0gY3RybC5zY29wZS50YWJDdHJsXG5cblx0XHRcdGNvbnNvbGUubG9nKCdtYXN0ZXJNZXNzYWdlJywgZGF0YSlcblxuXHRcdFx0dmFyIHBhbmVsID0gdGFiQ3RybC5nZXRUYWJQYW5lbEJ5VGl0bGUoZGF0YS5mcm9tKVxuXHRcdFx0aWYgKHBhbmVsLmxlbmd0aCA9PSAwKSB7XG5cdFx0XHRcdHZhciBpZHggPSB0YWJDdHJsLmFkZFRhYihkYXRhLmZyb20sIHtcblx0XHRcdFx0XHRyZW1vdmFibGU6IHRydWUsXG5cdFx0XHRcdFx0dGVtcGxhdGU6IGA8cD4ke2RhdGEudGV4dH08L3A+YFxuXHRcdFx0XHR9KVxuXG5cdFx0XHRcdGlmICh0YWJDdHJsLmdldFRhYkNvdW50KCkgPT0gMSkge1xuXHRcdFx0XHRcdHRhYkN0cmwuc2V0QWN0aXZlKGlkeClcblx0XHRcdFx0fVxuXG5cdFx0XHRcdFxuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdHBhbmVsLmFwcGVuZChgPHA+JHtkYXRhLnRleHR9PC9wPmApXG5cdFx0XHR9XG5cblx0XHRcdGNvbnNvbGUubG9nKCdwYW5lbCcsIHBhbmVsKVxuXHRcdH0pXG5cblx0XHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xuXHRcdFx0dGVtcGxhdGU6IFwiPGRpdiBzdHlsZT1cXFwiZGlzcGxheTogZmxleDtmbGV4LWRpcmVjdGlvbjogY29sdW1uO2ZsZXg6IDFcXFwiPlxcblx0XFxuXFxuXHQ8Zm9ybSBzdHlsZT1cXFwicGFkZGluZzogNXB4O2Rpc3BsYXk6IGZsZXg7XFxcIiBibi1ldmVudD1cXFwic3VibWl0OiBvbkludml0XFxcIj5cXG5cdFx0PGlucHV0IHR5cGU9XFxcInRleHRcXFwiIG5hbWU9XFxcInVzZXJOYW1lXFxcIiBwbGFjZWhvbGRlcj1cXFwidXNlciBuYW1lXFxcIiByZXF1aXJlZD1cXFwiXFxcIiBjbGFzcz1cXFwidzMtaW5wdXQgdzMtYm9yZGVyXFxcIj5cXG5cdFx0PGJ1dHRvbiBjbGFzcz1cXFwidzMtYnRuIHczLWJsdWUgdzMtYmFyLWl0ZW0gdzMtcmlnaHRcXFwiIHR5cGU9XFxcInN1Ym1pdFxcXCI+SW52aXQ8L2J1dHRvbj5cXG5cdDwvZm9ybT5cdFx0XFxuXFxuXFxuXFxuXFxuXHQ8ZGl2IGNsYXNzPVxcXCJibi1mbGV4LXJvdyBibi1mbGV4LTFcXFwiPlxcblx0XHRcXG5cdFx0PGRpdiBjbGFzcz1cXFwiYm4tZmxleC1jb2wgYm4tZmxleC0xXFxcIiBjbGFzcz1cXFwidzMtY2FyZC00IHczLW1hcmdpblxcXCI+XFxuXHRcdFx0PGRpdiBibi1jb250cm9sPVxcXCJUYWJDb250cm9sXFxcIiBzdHlsZT1cXFwiZmxleDogMVxcXCIgYm4taWZhY2U9XFxcInRhYkN0cmxcXFwiPjwvZGl2Plxcblxcblx0XHRcdDxmb3JtIHN0eWxlPVxcXCJwYWRkaW5nOiA1cHg7ZGlzcGxheTogZmxleDtcXFwiIGJuLWV2ZW50PVxcXCJzdWJtaXQ6IG9uU2VuZFxcXCI+XFxuXHRcdFx0XHQ8aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgbmFtZT1cXFwibWVzc2FnZVxcXCIgcGxhY2Vob2xkZXI9XFxcInlvdXIgbWVzc2FnZVxcXCIgcmVxdWlyZWQ9XFxcIlxcXCIgY2xhc3M9XFxcInczLWlucHV0IHczLWJvcmRlclxcXCI+XFxuXHRcdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJ3My1idG4gdzMtYmx1ZSB3My1iYXItaXRlbSB3My1yaWdodFxcXCIgdHlwZT1cXFwic3VibWl0XFxcIj5TZW5kPC9idXR0b24+XFxuXHRcdFx0PC9mb3JtPlx0XHRcdFx0XFxuXHRcdDwvZGl2Plxcblx0XHQ8ZGl2IGJuLWNvbnRyb2w9XFxcIkZyaWVuZHNQYW5lbENvbnRyb2xcXFwiIHN0eWxlPVxcXCJ3aWR0aDogMjAwcHhcXFwiIGNsYXNzPVxcXCJ3My1jYXJkLTQgdzMtbWFyZ2luXFxcIiBibi1pZmFjZT1cXFwiZnJpZW5kc0N0cmxcXFwiIGJuLWV2ZW50PVxcXCJmcmllbmRTZWxlY3RlZDogb25GcmllbmRTZWxlY3RlZFxcXCI+PC9kaXY+XFxuXHQ8L2Rpdj5cXG5cXG48L2Rpdj5cIixcblxuXHRcdFx0ZXZlbnRzOiB7XG5cdFx0XHRcdG9uRnJpZW5kU2VsZWN0ZWQ6IGZ1bmN0aW9uKGV2LCBkYXRhKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coJ29uRnJpZW5kU2VsZWN0ZWQnLCBkYXRhKVxuXHRcdFx0XHRcdHZhciB0YWJDdHJsID0gY3RybC5zY29wZS50YWJDdHJsXG5cblx0XHRcdFx0XHR2YXIgaWR4ID0gdGFiQ3RybC5nZXRUYWJJbmRleEJ5VGl0bGUoZGF0YS5uYW1lKVxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCdpZHgnLCBpZHgpXG5cblx0XHRcdFx0XHRpZiAoaWR4IDwgMCkge1xuXHRcdFx0XHRcdFx0aWR4ID0gdGFiQ3RybC5hZGRUYWIoZGF0YS5uYW1lLCB7cmVtb3ZhYmxlOiB0cnVlfSlcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcblx0XHRcdFx0XHR0YWJDdHJsLnNldEFjdGl2ZShpZHgpXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9uSW52aXQ6IGZ1bmN0aW9uKGV2KSB7XG5cdFx0XHRcdFx0ZXYucHJldmVudERlZmF1bHQoKVxuXHRcdFx0XHRcdHZhciBkYXRhID0gJCh0aGlzKS5nZXRGb3JtRGF0YSgpXG5cdFx0XHRcdFx0Y29uc29sZS5sb2coJ29uSW52aXQnLCBkYXRhKVxuXG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0dmFyIG15RnJpZW5kcyA9IGN0cmwuc2NvcGUuZnJpZW5kc0N0cmwuZ2V0RnJpZW5kcygpXG5cdFx0XHRcdFx0Y29uc29sZS5sb2coJ2ZyaWVuZHMnLCBteUZyaWVuZHMpXG5cdFx0XHRcdFx0dmFyIGZyaWVuZCA9IG15RnJpZW5kcy5maW5kKChpdGVtKSA9PiB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gaXRlbS5uYW1lID09IGRhdGEudXNlck5hbWVcblx0XHRcdFx0XHR9KVxuXG5cdFx0XHRcdFx0Y29uc29sZS5sb2coJ2ZyaWVuZCcsIGZyaWVuZClcblxuXHRcdFx0XHRcdGlmIChmcmllbmQgIT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0XHQkKHRoaXMpLnJlc2V0Rm9ybSgpXG5cdFx0XHRcdFx0XHQkJC5zaG93QWxlcnQoYFVzZXIgJyR7ZGF0YS51c2VyTmFtZX0nIGlzIGFscmVhZHkgeW91ciBmcmllbmQgIWApXG5cdFx0XHRcdFx0XHRyZXR1cm5cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRodHRwLnBvc3QoJy9hcGkvbm90aWYvJyArIGRhdGEudXNlck5hbWUsIHtcblx0XHRcdFx0XHRcdHR5cGU6ICdpbnZpdCcsXG5cdFx0XHRcdFx0XHRtZXNzYWdlOiBgVXNlciA8c3Ryb25nPiR7dXNlck5hbWV9PC9zdHJvbmc+IHdhbnQgdG8gYmUgeW91ciBmcmllbmRgLFxuXHRcdFx0XHRcdFx0ZnJvbTogdXNlck5hbWVcblx0XHRcdFx0XHR9KS5jYXRjaCgoZSkgPT4ge1xuXHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnRXJyb3InLCBlKVxuXHRcdFx0XHRcdFx0JCQuc2hvd0FsZXJ0KGUucmVzcG9uc2VUZXh0KVxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdH0sXG5cblx0XHRcdFx0b25TZW5kOiBmdW5jdGlvbihldikge1xuXHRcdFx0XHRcdGV2LnByZXZlbnREZWZhdWx0KClcblxuXHRcdFx0XHRcdHZhciB0YWJDdHJsID0gY3RybC5zY29wZS50YWJDdHJsXG5cblx0XHRcdFx0XHR2YXIgdGFiSWR4ID0gdGFiQ3RybC5nZXRBY3RpdmUoKVxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCd0YWJJZHgnLCB0YWJJZHgpXG5cblx0XHRcdFx0XHR2YXIgdXNlck5hbWUgPSB0YWJDdHJsLmdldFRpdGxlQnlJbmRleCh0YWJJZHgpXG5cdFx0XHRcdFx0Y29uc29sZS5sb2coJ3VzZXJOYW1lJywgdXNlck5hbWUpXG5cdFx0XHRcdFx0aWYgKHVzZXJOYW1lID09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdFx0JCQuc2hvd0FsZXJ0KCdQbGVhc2Ugc2VsZWN0IGEgdXNlciBmaXJzdCcpXG5cdFx0XHRcdFx0XHRyZXR1cm5cblxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHZhciBkYXRhID0gJCh0aGlzKS5nZXRGb3JtRGF0YSgpXG5cdFx0XHRcdFx0Y29uc29sZS5sb2coJ2RhdGEnLCBkYXRhKVxuXG5cdFx0XHRcdFx0JCh0aGlzKS5yZXNldEZvcm0oKVxuXG5cdFx0XHRcdFx0aHR0cC5wb3N0KCcvYXBpL3RjaGF0L3NlbmQvJyArIHVzZXJOYW1lLCB7XG5cdFx0XHRcdFx0XHR0ZXh0OiBkYXRhLm1lc3NhZ2Vcblx0XHRcdFx0XHR9KS5jYXRjaCgoZSkgPT4ge1xuXHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnRXJyb3InLCBlKVxuXHRcdFx0XHRcdFx0JCQuc2hvd0FsZXJ0KGUucmVzcG9uc2VUZXh0KVxuXHRcdFx0XHRcdH0pXG5cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pXG5cdH1cbn0pO1xuIl19
