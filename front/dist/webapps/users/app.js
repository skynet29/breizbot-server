$$.configReady(function () {
	console.log('App started')

	var ctrl = $$.viewController('body', {
		template: " <div class=\"mainPanel\">\r\n    <div bn-control=\"UsersControl\" bn-event=\"userSelected: onUserSelected\" bn-show=\"!showDetails\" style=\"margin: 5px;\"></div>\r\n    <div bn-show=\"showDetails\" style=\"display: flex; flex-direction: column;\">\r\n    	<div class=\"toolbar\" style=\"display: flex; justify-content: space-between\">\r\n    		<button class=\"backBtn\" title=\"back\" bn-event=\"click: onBack\"><i class=\"fa fa-arrow-left\"></i></button>\r\n    		<div>User&nbsp;<strong bn-text=\"user\"></strong></div>\r\n    	</div>\r\n	    <div bn-control=\"UserDetailsControl\" bn-iface=\"userDetailsCtrl\" style=\"flex: 1; margin: 5px;display: flex; flex-direction: column;\"></div>\r\n    	\r\n    </div>\r\n</div>",
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIiQkLmNvbmZpZ1JlYWR5KGZ1bmN0aW9uICgpIHtcclxuXHRjb25zb2xlLmxvZygnQXBwIHN0YXJ0ZWQnKVxyXG5cclxuXHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKCdib2R5Jywge1xyXG5cdFx0dGVtcGxhdGU6IFwiIDxkaXYgY2xhc3M9XFxcIm1haW5QYW5lbFxcXCI+XFxyXFxuICAgIDxkaXYgYm4tY29udHJvbD1cXFwiVXNlcnNDb250cm9sXFxcIiBibi1ldmVudD1cXFwidXNlclNlbGVjdGVkOiBvblVzZXJTZWxlY3RlZFxcXCIgYm4tc2hvdz1cXFwiIXNob3dEZXRhaWxzXFxcIiBzdHlsZT1cXFwibWFyZ2luOiA1cHg7XFxcIj48L2Rpdj5cXHJcXG4gICAgPGRpdiBibi1zaG93PVxcXCJzaG93RGV0YWlsc1xcXCIgc3R5bGU9XFxcImRpc3BsYXk6IGZsZXg7IGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XFxcIj5cXHJcXG4gICAgXHQ8ZGl2IGNsYXNzPVxcXCJ0b29sYmFyXFxcIiBzdHlsZT1cXFwiZGlzcGxheTogZmxleDsganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuXFxcIj5cXHJcXG4gICAgXHRcdDxidXR0b24gY2xhc3M9XFxcImJhY2tCdG5cXFwiIHRpdGxlPVxcXCJiYWNrXFxcIiBibi1ldmVudD1cXFwiY2xpY2s6IG9uQmFja1xcXCI+PGkgY2xhc3M9XFxcImZhIGZhLWFycm93LWxlZnRcXFwiPjwvaT48L2J1dHRvbj5cXHJcXG4gICAgXHRcdDxkaXY+VXNlciZuYnNwOzxzdHJvbmcgYm4tdGV4dD1cXFwidXNlclxcXCI+PC9zdHJvbmc+PC9kaXY+XFxyXFxuICAgIFx0PC9kaXY+XFxyXFxuXHQgICAgPGRpdiBibi1jb250cm9sPVxcXCJVc2VyRGV0YWlsc0NvbnRyb2xcXFwiIGJuLWlmYWNlPVxcXCJ1c2VyRGV0YWlsc0N0cmxcXFwiIHN0eWxlPVxcXCJmbGV4OiAxOyBtYXJnaW46IDVweDtkaXNwbGF5OiBmbGV4OyBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xcXCI+PC9kaXY+XFxyXFxuICAgIFx0XFxyXFxuICAgIDwvZGl2PlxcclxcbjwvZGl2PlwiLFxyXG5cdFx0ZGF0YToge1xyXG5cdFx0XHRzaG93RGV0YWlsczogZmFsc2VcclxuXHRcdH0sXHJcblx0XHRldmVudHM6IHtcclxuXHRcdFx0b25CYWNrOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRjdHJsLnNldERhdGEoe3Nob3dEZXRhaWxzOiBmYWxzZX0pXHJcblx0XHRcdH0sXHJcblx0XHRcdG9uVXNlclNlbGVjdGVkOiBmdW5jdGlvbih1c2VyKSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coJ3VzZXJTZWxlY3RlZCcsIHVzZXIpXHJcblx0XHRcdFx0Y3RybC5zY29wZS51c2VyRGV0YWlsc0N0cmwuc2V0VXNlcih1c2VyKVxyXG5cdFx0XHRcdGN0cmwuc2V0RGF0YSh7c2hvd0RldGFpbHM6IHRydWUsIHVzZXJ9KVxyXG5cdFx0XHR9XHJcblx0XHJcblx0XHR9XHRcclxuXHR9KVxyXG5cclxuXHJcbn0pIl19
