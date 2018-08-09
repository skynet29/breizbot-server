$$.configReady(function () {
	console.log('App started')

	var ctrl = $$.viewController('body', {
		template: " <div class=\"mainPanel\">\n    <div bn-control=\"UsersControl\" bn-event=\"userSelected: onUserSelected\" bn-show=\"!showDetails\" style=\"margin: 5px;\"></div>\n    <div bn-show=\"showDetails\" style=\"display: flex; flex-direction: column;\">\n    	<div class=\"toolbar\" style=\"display: flex; justify-content: space-between\">\n    		<button class=\"backBtn\" title=\"back\" bn-event=\"click: onBack\"><i class=\"fa fa-arrow-left\"></i></button>\n    		<strong bn-text=\"user\"></strong>\n    		<div></div>\n    	</div>\n	    <div bn-control=\"UserDetailsControl\" bn-iface=\"userDetailsCtrl\" style=\"flex: 1; margin: 5px;display: flex; flex-direction: column;\"></div>\n    	\n    </div>\n</div>",
		data: {
			showDetails: false
		},
		events: {
			onBack: function() {
				ctrl.setData({showDetails: false})
			},
			onUserSelected: function(user) {
				console.log('userSelected', user)
				ctrl.scope.userDetailsCtrl.setUser(user)
				ctrl.setData({showDetails: true, user})
			}
	
		}	
	})


})
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIiQkLmNvbmZpZ1JlYWR5KGZ1bmN0aW9uICgpIHtcblx0Y29uc29sZS5sb2coJ0FwcCBzdGFydGVkJylcblxuXHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKCdib2R5Jywge1xuXHRcdHRlbXBsYXRlOiBcIiA8ZGl2IGNsYXNzPVxcXCJtYWluUGFuZWxcXFwiPlxcbiAgICA8ZGl2IGJuLWNvbnRyb2w9XFxcIlVzZXJzQ29udHJvbFxcXCIgYm4tZXZlbnQ9XFxcInVzZXJTZWxlY3RlZDogb25Vc2VyU2VsZWN0ZWRcXFwiIGJuLXNob3c9XFxcIiFzaG93RGV0YWlsc1xcXCIgc3R5bGU9XFxcIm1hcmdpbjogNXB4O1xcXCI+PC9kaXY+XFxuICAgIDxkaXYgYm4tc2hvdz1cXFwic2hvd0RldGFpbHNcXFwiIHN0eWxlPVxcXCJkaXNwbGF5OiBmbGV4OyBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xcXCI+XFxuICAgIFx0PGRpdiBjbGFzcz1cXFwidG9vbGJhclxcXCIgc3R5bGU9XFxcImRpc3BsYXk6IGZsZXg7IGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlblxcXCI+XFxuICAgIFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJiYWNrQnRuXFxcIiB0aXRsZT1cXFwiYmFja1xcXCIgYm4tZXZlbnQ9XFxcImNsaWNrOiBvbkJhY2tcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1hcnJvdy1sZWZ0XFxcIj48L2k+PC9idXR0b24+XFxuICAgIFx0XHQ8c3Ryb25nIGJuLXRleHQ9XFxcInVzZXJcXFwiPjwvc3Ryb25nPlxcbiAgICBcdFx0PGRpdj48L2Rpdj5cXG4gICAgXHQ8L2Rpdj5cXG5cdCAgICA8ZGl2IGJuLWNvbnRyb2w9XFxcIlVzZXJEZXRhaWxzQ29udHJvbFxcXCIgYm4taWZhY2U9XFxcInVzZXJEZXRhaWxzQ3RybFxcXCIgc3R5bGU9XFxcImZsZXg6IDE7IG1hcmdpbjogNXB4O2Rpc3BsYXk6IGZsZXg7IGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XFxcIj48L2Rpdj5cXG4gICAgXHRcXG4gICAgPC9kaXY+XFxuPC9kaXY+XCIsXG5cdFx0ZGF0YToge1xuXHRcdFx0c2hvd0RldGFpbHM6IGZhbHNlXG5cdFx0fSxcblx0XHRldmVudHM6IHtcblx0XHRcdG9uQmFjazogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGN0cmwuc2V0RGF0YSh7c2hvd0RldGFpbHM6IGZhbHNlfSlcblx0XHRcdH0sXG5cdFx0XHRvblVzZXJTZWxlY3RlZDogZnVuY3Rpb24odXNlcikge1xuXHRcdFx0XHRjb25zb2xlLmxvZygndXNlclNlbGVjdGVkJywgdXNlcilcblx0XHRcdFx0Y3RybC5zY29wZS51c2VyRGV0YWlsc0N0cmwuc2V0VXNlcih1c2VyKVxuXHRcdFx0XHRjdHJsLnNldERhdGEoe3Nob3dEZXRhaWxzOiB0cnVlLCB1c2VyfSlcblx0XHRcdH1cblx0XG5cdFx0fVx0XG5cdH0pXG5cblxufSkiXX0=
