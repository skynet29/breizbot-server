$$.registerControlEx('HomeControl', {
	deps: ['HttpService'],

	init: function(elt, options, http) {

		var ctrl = $$.viewController(elt, {
			template: {gulp_inject: "./home.html"},
			data: {
				apps: []
				
			}

		})

		http.get('/api/app/webapps').then((appInfos) => {
			console.log('appInfos', appInfos)

			var apps = []

			for(var k in appInfos) {
				var appInfo = appInfos[k]
				var tileName = k
				var desc = ''
				var tileColor = 'w3-blue'
				var props = appInfo.props
				if (typeof props.tileName == 'string') {
					tileName = props.tileName
				}
				if (typeof props.desc == 'string') {
					desc = props.desc
				}
				if (typeof props.tileColor == 'string') {
					tileColor = props.tileColor
				}
				var className = "w3-btn appIcon " + tileColor
				var href = "/apps/" + k

				apps.push({
					tileIcon: props.tileIcon,
					tileColor,
					tileName,
					desc,
					tileColor,
					className,
					href,
					hasTileIcon: props.tileIcon != undefined
				})

			}

			console.log('apps', apps)
			ctrl.setData({apps})
			
		})

	}

});

