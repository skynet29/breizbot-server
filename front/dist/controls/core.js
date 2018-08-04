(function() {

	$$.registerControlEx('CarouselControl', {

		props: {

			index: {
				val: 0,
				set: 'setIndex'
			} 
		},
		options: {
			width: 300,
			height: 200,
			animateDelay: 1000,
		
		},
		iface: 'setIndex(idx);refresh()',

		
	lib: 'core',
init: function(elt, options) {
	


			var width = options.width + 'px'
			var height = options.height + 'px'
			elt.css('width', width).css('height', height)

			console.log(`[CarouselControl] options`, options)

			var ctrl = null
			var items
			var idx


			this.refresh = function() {
				//console.log('[CarouselControl] refresh')
				items = elt.children('div').remove().css('width', width).css('height', height)		

				idx = Math.max(0, Math.min(options.index, items.length))
				//console.log(`[CarouselControl] idx`, idx)

				function animate(direction) {
					ctrl.setData({leftDisabled: true, rightDisabled: true})
					var op = direction == 'left' ? '+=' : '-='
					idx = direction == 'left' ? idx-1 : idx+1

					ctrl.scope.items.animate({left: op + width}, options.animateDelay, function() {
						checkBtns()
					})
				}

				ctrl = $$.viewController(elt, {
					template: "<div class=\"container\">\r\n	<div class=\"viewport\">\r\n		<div class=\"items\" bn-bind=\"items\"></div>	\r\n	</div>\r\n	<div class=\"overlay\">\r\n		<div>\r\n			<button \r\n				bn-event=\"click: onLeft\" \r\n				bn-prop=\"hidden: leftDisabled\"\r\n				>\r\n				<i class=\"fa fa-2x fa-chevron-circle-left\"></i>\r\n			</button>			\r\n		</div>\r\n\r\n		<div>\r\n			<button \r\n				bn-event=\"click: onRight\" \r\n				bn-prop=\"hidden: rightDisabled\"\r\n			>\r\n				<i class=\"fa fa-2x fa-chevron-circle-right\"></i>\r\n			</button>			\r\n		</div>\r\n\r\n	</div>\r\n\r\n</div>",
					data: {
						leftDisabled: true,
						rightDisabled: false
					},
					init: function() {
						this.scope.items.append(items)
						this.scope.items.css('left', (-idx * options.width) + 'px')
						//checkBtns()
					},
					events: {
						onLeft: function() {
							animate('left')
						},
						onRight: function() {
							animate('right')
						}				
					}
				})
				checkBtns()		

			}		

			this.setIndex = function(index) {
				console.log('[CarouselControl] setIndex', index)
				idx =  Math.max(0, Math.min(index, items.length))
				ctrl.scope.items.css('left', (-idx * options.width) + 'px')
				checkBtns(idx)
			}

			function checkBtns() {
				//console.log('checkBtns', idx, items.length)
				ctrl.setData({
					leftDisabled: idx == 0,
					rightDisabled: idx == items.length - 1
				})
			}		

	 		this.refresh()

		}

	})

})();

$$.registerControlEx('CheckGroupControl', {
	
	lib: 'core',
init: function(elt) {

		elt.on('click', 'input[type=checkbox]', function() {
			elt.trigger('input')
		})

		this.getValue = function() {
			var ret = []
			elt.find('input[type=checkbox]:checked').each(function() {
				ret.push($(this).val())
			})	
			return ret	
		}

		this.setValue = function(value) {
			if (Array.isArray(value)) {
				elt.find('input[type=checkbox]').each(function() {
					$(this).prop('checked', value.indexOf($(this).val()) >= 0)
				})
			}		
		}

	}

});







$$.registerControlEx('HtmlEditorControl', {

	iface: 'html()',

	
	lib: 'core',
init: function(elt) {

		elt.addClass('bn-flex-row')

		var cmdArgs = {
			'foreColor': function() {
				return ctrl.model.color
			}
		}


		var ctrl = $$.viewController(elt, {
			template: "<div class=\"bn-flex-col bn-flex-1\">\r\n\r\n	<div bn-event=\"click.cmd: onCommand\">\r\n		<div bn-control=\"ToolbarControl\">\r\n			<button class=\"cmd\" data-cmd=\"bold\"><i class=\"fa fa-bold\"></i></button>\r\n			<button class=\"cmd\" data-cmd=\"italic\"><i class=\"fa fa-italic\"></i></button>\r\n			<button class=\"cmd\" data-cmd=\"underline\"><i class=\"fa fa-underline\"></i></button>\r\n			<button class=\"cmd\" data-cmd=\"strikeThrough\"><i class=\"fa fa-strikethrough\"></i></button>\r\n			<button class=\"cmd\" data-cmd=\"foreColor\" bn-menu=\"colorItems\" bn-event=\"menuChange: onColorMenuChange\"><i class=\"fa fa-pencil\" bn-style=\"color: color\"></i></button>\r\n		</div>\r\n		<div bn-control=\"ToolbarControl\">\r\n			<button class=\"cmd\" data-cmd=\"justifyLeft\"><i class=\"fa fa-align-left\"></i></button>\r\n			<button class=\"cmd\" data-cmd=\"justifyCenter\"><i class=\"fa fa-align-center\"></i></button>\r\n			<button class=\"cmd\" data-cmd=\"justifyRight\"><i class=\"fa fa-align-right\"></i></button>\r\n		</div>	\r\n		<div bn-control=\"ToolbarControl\">\r\n			<button class=\"cmd\" data-cmd=\"indent\"><i class=\"fa fa-indent\"></i></button>\r\n			<button class=\"cmd\" data-cmd=\"outdent\"><i class=\"fa fa-outdent\"></i></button>\r\n		</div>	\r\n		<div bn-control=\"ToolbarControl\">\r\n			<button class=\"cmd\" data-cmd=\"insertHorizontalRule\">hr</button>\r\n			<button class=\"cmd\" data-cmd=\"formatBlock\" data-cmd-arg=\"h1\">h1</button>\r\n			<button class=\"cmd\" data-cmd=\"formatBlock\" data-cmd-arg=\"h2\">h2</button>\r\n			<button class=\"cmd\" data-cmd=\"formatBlock\" data-cmd-arg=\"h3\">h3</button>\r\n		</div>		\r\n		<div bn-control=\"ToolbarControl\">\r\n			<button class=\"cmd\" data-cmd=\"insertUnorderedList\"><i class=\"fa fa-list-ul\"></i></button>\r\n			<button class=\"cmd\" data-cmd=\"insertOrderedList\"><i class=\"fa fa-list-ol\"></i></button>\r\n		</div>\r\n\r\n	</div>	\r\n	<div contenteditable=\"true\" class=\"bn-flex-1 editor\" bn-bind=\"editor\"></div>\r\n</div>\r\n",
			data: {
				color: 'blue',
				colorItems: {
					black: {name: 'Black'},
					red: {name: 'Red'},
					green: {name: 'Green'},
					blue: {name: 'Blue'},
					yellow: {name: 'Yellow'},
					cyan: {name: 'Cyan'},
					magenta: {name: 'Magenta'}
				}
			},
			events: {
				onCommand: function() {

					var cmd = $(this).data('cmd')
					var cmdArg = $(this).data('cmdArg')
					//console.log('onCommand', cmd, cmdArg)

					var cmdArg = cmdArg || cmdArgs[cmd]
					if (typeof cmdArg == 'function') {
						cmdArg = cmdArg()
					}
					//console.log('onCommand', cmd, cmdArg)

					document.execCommand(cmd, false, cmdArg)
				
				},
				onColorMenuChange: function(ev, color) {
					//console.log('onColorMenuChange', color)
					ctrl.setData({color})
				}

			}

		})

		this.html = function() {
			return ctrl.scope.editor.html()
		}


	}

});

(function() {

	function getTemplate(headers) {
		return `
			<div class="scrollPanel">
	            <table class="w3-table-all w3-small">
	                <thead>
	                    <tr class="w3-green">
	                    	${headers}
	                    </tr>
	                </thead>
	                <tbody></tbody>
	            </table>
            </div>
		`
	}

	function getItemTemplate(rows) {
		return `
            <tr class="item" bn-attr="data-id: _id">
            	${rows}
            </tr>	
		`
	}



	$$.registerControlEx('FilteredTableControl', {

		iface: `addItem(id, data);removeItem(id);removeAllItems();getItem(id);setFilters(filters);getDatas();getDisplayedDatas();on(event, callback)`,
		events: 'itemAction',

		
	lib: 'core',
init: function(elt, options) {

			console.log('options', options)

			var columns =  $$.obj2Array(options.columns)
			var actions = $$.obj2Array(options.actions)
			var headers = columns.map((column) => `<th>${column.value}</th>`)		
			var rows = columns.map((column) => `<td bn-html="${column.key}"></td>`)
			if (actions.length > 0) {
				headers.push(`<th>Action</th>`)

				var buttons = actions.map((action) => `<button data-action="${action.key}" class="w3-button"><i class="${action.value}"></i></button>`)
				rows.push(`<td>${buttons.join('')}</td>`)
			}

			//console.log('rows', rows)
			var itemTemplate = getItemTemplate(rows.join(''))
			//console.log('itemTemplate', itemTemplate)

			elt.append(getTemplate(headers.join('')))
			elt.addClass('bn-flex-col')

			let datas = {}
			let events = new EventEmitter2()
			let _filters = {}
			let displayedItems = {}

			const tbody = elt.find('tbody')
			tbody.on('click', '[data-action]', function() {
				var id = $(this).closest('.item').data('id')
				var action = $(this).data('action')
				console.log('click', id, 'action', action)
				events.emit('itemAction', action, id)
			})

			this.addItem = function(id, data) {

				var itemData = $.extend({'_id': id}, data)
				//console.log('addItem', itemData)
				
				if (datas[id] != undefined) {
					var item = displayedItems[id]
					if (item != undefined) {
						item.elt.updateTemplate(item.ctx, itemData)
					}
				}
				else if (isInFilter(data)){
					var elt = $(itemTemplate)
					var ctx = elt.processTemplate(itemData)
					displayedItems[id] = {elt, ctx}
					tbody.append(elt)
				}
				datas[id] = data
			}

			this.removeItem = function(id) {
				//console.log('removeItem', id)
				if (datas[id] != undefined) {
					delete datas[id]
					var item = displayedItems[id]
					if (item != undefined) {
						item.elt.remove()
						delete displayedItems[id]
					}
				}			
			}

			this.getItem = function(id) {
				return datas[id]
			}

			this.removeAllItems = function() {
				//console.log('removeAllItems')
				datas = {}
				displayedItems = {}
				tbody.empty()		
			}

			function isInFilter(data) {
				var ret = true
				for(var f in _filters) {
					var value = data[f]
					var filterValue = _filters[f]
					ret &= (filterValue == '' || value.startsWith(filterValue))
				}
				return ret
			}

			this.setFilters = function(filters) {
				_filters = filters
				dispTable()
			}


			function dispTable() {
				displayedItems = {}
				let items = []
				for(let id in datas) {
					var data = datas[id]
					if (isInFilter(data)) {
						var itemData = $.extend({'_id': id}, data)
						var elt = $(itemTemplate)
						var ctx = elt.processTemplate(itemData)			
						items.push(elt)
						displayedItems[id] = {elt, ctx}
					}

				}
				
				
				tbody.empty().append(items)
			}

			this.getDatas = function() {
				return datas
			}

			this.getDisplayedDatas = function() {
				var ret = {}
				for(let i in displayedItems) {
					ret[i] = datas[i]
				}
				return ret
			}

			this.on = events.on.bind(events)


		}
	})

})();


$$.registerControlEx('HeaderControl', {
	deps: ['WebSocketService'],
	options: {
		title: 'Hello World',
		userName: 'unknown',
		isHomePage: false
	},
	
	lib: 'core',
init: function(elt, options, client) {

		var ctrl = $$.viewController(elt, {
			template: "<div >\r\n	<div class=\"brand\"><h1 class=\"bn-xs-hide\" bn-text=\"title\"></h1> </div>\r\n	<div class=\"infos\">\r\n		<div class=\"notification\" title=\"notification\">\r\n			<i class=\"fa fa-lg fa-bell\"></i>\r\n			<span class=\"w3-badge w3-red w3-tiny\" bn-text=\"nbNotif\" bn-show=\"isNotifVisible\"></span>			\r\n		</div>\r\n\r\n	    <i bn-attr=\"title: titleState\" class=\"fa fa-lg connectionState\" bn-class=\"fa-eye: connected, fa-eye-slash: !connected\"></i>\r\n\r\n	    <div>\r\n		    <i class=\"fa fa-user fa-lg\"></i>\r\n		    <span bn-text=\"userName\" class=\"userName\"></span>	    	\r\n	    </div>\r\n\r\n	    <button title=\"logout\" class=\"w3-btn\" bn-event=\"click: onDisconnect\" bn-show=\"isHomePage\"><i class=\"fa fa-power-off fa-lg\"></i></button> \r\n\r\n	    <button title=\"home\" class=\"w3-btn\" bn-event=\"click: onGoHome\" bn-show=\"!isHomePage\"><i class=\"fa fa-home fa-lg\"></i></button> \r\n\r\n<!-- 	    <a href=\"/\" title=\"home\"><i class=\"fa fa-home fa-lg\"></i></a> \r\n -->	</div>\r\n</div>",
			data: {
				connected: false,
				titleState: "WebSocket disconnected",
				title: options.title,
				userName: options.userName,
				isHomePage: options.isHomePage,
				nbNotif: 0,
				isNotifVisible: function() {
					return this.nbNotif > 0
				}				
			},
			events: {
				onGoHome: function() {
					location.href = '/'
				},

				onDisconnect: function() {
					sessionStorage.clear()
					location.href = '/disconnect'
				}
			}
		})


		client.events.on('connect', function() {
			console.log('[HeaderControl] client connected')
			ctrl.setData({connected: true, titleState: "WebSocket connected"})

		})

		client.events.on('disconnect', function() {
			console.log('[HeaderControl] client disconnected')
			ctrl.setData({connected: false, titleState: "WebSocket disconnected"})

		})

		client.register('masterNotifications', true, onNotifications)

		function onNotifications(msg) {
			console.log('onNotifications', msg.data)
			ctrl.setData({nbNotif: msg.data.length})
		}


	}

});



$$.registerControlEx('HomeControl', {
	deps: ['HttpService'],

	
	lib: 'core',
init: function(elt, options, http) {

		var ctrl = $$.viewController(elt, {
			template: "<div id=\"main\">\r\n\r\n\r\n	<article>\r\n		<p>Available apps:</p>\r\n		<div class=\"bn-flex-row bn-flex-wrap\" bn-each=\"app of apps\">\r\n				<a bn-attr=\"class: app.className, href:app.href, title:app.desc\">\r\n					\r\n					<div class=\"bn-flex-col\" style=\"height: 100%; justify-content: center;\">\r\n						<div class=\"bn-flex-1 bn-flex-row\" style=\"align-items: center; justify-content: center;\" bn-show=\"app.hasTileIcon\">\r\n							<i bn-attr=\"class: app.tileIcon\"></i>\r\n						</div>\r\n	\r\n						<span bn-text=\"app.tileName\"></span>\r\n					</div>\r\n\r\n				</a>\r\n		</div>\r\n\r\n	</article>\r\n\r\n</div>",
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



$$.registerControlEx('InputGroupControl', {
	
	lib: 'core',
init: function(elt) {

		var id = elt.children('input').uniqueId().attr('id')
		//console.log('[InputGroupControl] id', id)
		elt.children('label').attr('for', id)
	}
});

(function() {

	$$.registerControlEx('NavbarControl', {

		options: {
			activeColor: 'w3-green'
		},

		
	lib: 'core',
init: function(elt, options) {

			var activeColor = options.activeColor


			//console.log('[NavbarControl] options', options)

			elt.addClass('w3-bar')
			elt.children('a').each(function() {
				$(this).addClass('w3-bar-item w3-button')
			})

			$(window).on('routeChanged', function(evt, newRoute) {
				//console.log('[NavbarControl] routeChange', newRoute)

				elt.children(`a.${activeColor}`).removeClass(activeColor)	
				elt.children(`a[href="#${newRoute}"]`).addClass(activeColor)

			})	
		}

	})


})();



$$.registerControlEx('PictureCarouselControl', {

	props: {
		index: {val: 0, set: 'setIndex'},
		images: {val: [], set: 'setImages'}
	},
	options: {
		width: 300,
		height: 200,
		animateDelay: 1000,
		color: 'yellow'
	},	

	iface: 'setImages(images);setIndex(idx)',

	
	lib: 'core',
init: function(elt, options) {

		console.log(`[PictureCarouselControl] options`, options)

		var ctrl = $$.viewController(elt, {
			template: "<div bn-control=\"CarouselControl\" bn-options=\"carouselCtrlOptions\" bn-each=\"i of images\" bn-iface=\"carouselCtrl\" bn-data=\"index: index\">\r\n	<div style=\"text-align: center;\" bn-style=\"background-color: backColor\">\r\n		<img bn-attr=\"src: i\" style=\"height: 100%\">\r\n	</div>\r\n</div>",
			data: {
				carouselCtrlOptions: options,
				images: options.images,
				backColor: options.color,
				index: options.index
			}
		})

		this.setImages = function(value) {
			//console.log('[PictureCarouselControl] setImages', value)
			ctrl.setData('images', value)
			ctrl.scope.carouselCtrl.refresh()			
		},
		this.setIndex = function(value) {
			ctrl.setData('index', value)
		}

	}
});
(function() {

	$$.registerControl('RadioGroupControl', function(elt) {

		elt.on('click', 'input[type=radio]', function() {
			//console.log('radiogroup click')
			elt.find('input[type=radio]:checked').prop('checked', false)
			$(this).prop('checked', true)
			elt.trigger('input')
		})
		

		this.getValue = function() {
			return elt.find('input[type=radio]:checked').val()
		}

		this.setValue = function(value) {
			elt.find('input[type=radio]').each(function() {
				$(this).prop('checked', value === $(this).val())
			})			
		}


	})


})();



(function() {

	function matchRoute(route, pattern) {
		//console.log('matchRoute', route, pattern)
		var routeSplit = route.split('/')
		var patternSplit = pattern.split('/')
		//console.log(routeSplit, patternSplit)
		var ret = {}

		if (routeSplit.length != patternSplit.length)
			return null

		for(var idx = 0; idx < patternSplit.length; idx++) {
			var path = patternSplit[idx]
			//console.log('path', path)
			if (path.substr(0, 1) === ':') {
				if (routeSplit[idx].length === 0)
					return null
				ret[path.substr(1)] = routeSplit[idx]
			}
			else if (path !== routeSplit[idx]) {
				return null
			}

		}

		return ret
	}




	$$.registerControlEx('RouterControl', {

		options: {
			routes: []
		},
		
	lib: 'core',
init: function(elt, options) {



			var routes = options.routes

			if (!Array.isArray(routes)) {
				console.warn('[RouterControl] bad options')
				return
			}


			function processRoute(info) {
				console.log('[RouterControl] processRoute', info)

				var newRoute = info.curRoute

				for(var route of routes) {
					var params = matchRoute(newRoute, route.href)
					//console.log(`route: ${route.href}, params`, params)
					if (params != null) {
						//console.log('[RouterControl] params', params)
						if (typeof route.redirect == 'string') {
							location.href = '#' + route.redirect
						}
						else if (typeof route.control == 'string') {

							var curCtrl = elt.find('.CustomControl').interface()
							var canChange = true
							if (curCtrl && typeof curCtrl.canChange == 'function') {
								canChange = curCtrl.canChange()
							}
							if (canChange) {
								$(window).trigger('routeChanged', newRoute)
								var config = $.extend({$params: params}, route.options)	
								var html = $(`<div bn-control="${route.control}" bn-options="config" class="bn-flex-col bn-flex-1"></div>`)
								elt.dispose().html(html)
								html.processUI({config: config})		
							}
							else if (info.prevRoute) {
								history.replaceState({}, '', '#' + info.prevRoute)
							}

							//elt.html(html)

						}
						return true
					}	
				}
				return false

			}		

			$(window).on('routeChange', function(ev, info) {
				if (!processRoute(info)) {
					console.warn(`[RouterControl] no action defined for route '${newRoute}'`)
				}
			})


		}

	})

})();



//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNhcm91c2VsLmpzIiwiY2hlY2tncm91cC5qcyIsImVkaXRvci5qcyIsImZpbHRlcmVkLXRhYmxlLmpzIiwiaGVhZGVyLmpzIiwiaG9tZS5qcyIsImlucHV0Z3JvdXAuanMiLCJuYXZiYXIuanMiLCJwaWN0dXJlY2Fyb3VzZWwuanMiLCJyYWRpb2dyb3VwLmpzIiwicm91dGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiY29yZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpIHtcclxuXHJcblx0JCQucmVnaXN0ZXJDb250cm9sRXgoJ0Nhcm91c2VsQ29udHJvbCcsIHtcclxuXHJcblx0XHRwcm9wczoge1xyXG5cclxuXHRcdFx0aW5kZXg6IHtcclxuXHRcdFx0XHR2YWw6IDAsXHJcblx0XHRcdFx0c2V0OiAnc2V0SW5kZXgnXHJcblx0XHRcdH0gXHJcblx0XHR9LFxyXG5cdFx0b3B0aW9uczoge1xyXG5cdFx0XHR3aWR0aDogMzAwLFxyXG5cdFx0XHRoZWlnaHQ6IDIwMCxcclxuXHRcdFx0YW5pbWF0ZURlbGF5OiAxMDAwLFxyXG5cdFx0XHJcblx0XHR9LFxyXG5cdFx0aWZhY2U6ICdzZXRJbmRleChpZHgpO3JlZnJlc2goKScsXHJcblxyXG5cdFx0XG5cdGxpYjogJ2NvcmUnLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zKSB7XHJcblx0XHJcblxyXG5cclxuXHRcdFx0dmFyIHdpZHRoID0gb3B0aW9ucy53aWR0aCArICdweCdcclxuXHRcdFx0dmFyIGhlaWdodCA9IG9wdGlvbnMuaGVpZ2h0ICsgJ3B4J1xyXG5cdFx0XHRlbHQuY3NzKCd3aWR0aCcsIHdpZHRoKS5jc3MoJ2hlaWdodCcsIGhlaWdodClcclxuXHJcblx0XHRcdGNvbnNvbGUubG9nKGBbQ2Fyb3VzZWxDb250cm9sXSBvcHRpb25zYCwgb3B0aW9ucylcclxuXHJcblx0XHRcdHZhciBjdHJsID0gbnVsbFxyXG5cdFx0XHR2YXIgaXRlbXNcclxuXHRcdFx0dmFyIGlkeFxyXG5cclxuXHJcblx0XHRcdHRoaXMucmVmcmVzaCA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ1tDYXJvdXNlbENvbnRyb2xdIHJlZnJlc2gnKVxyXG5cdFx0XHRcdGl0ZW1zID0gZWx0LmNoaWxkcmVuKCdkaXYnKS5yZW1vdmUoKS5jc3MoJ3dpZHRoJywgd2lkdGgpLmNzcygnaGVpZ2h0JywgaGVpZ2h0KVx0XHRcclxuXHJcblx0XHRcdFx0aWR4ID0gTWF0aC5tYXgoMCwgTWF0aC5taW4ob3B0aW9ucy5pbmRleCwgaXRlbXMubGVuZ3RoKSlcclxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKGBbQ2Fyb3VzZWxDb250cm9sXSBpZHhgLCBpZHgpXHJcblxyXG5cdFx0XHRcdGZ1bmN0aW9uIGFuaW1hdGUoZGlyZWN0aW9uKSB7XHJcblx0XHRcdFx0XHRjdHJsLnNldERhdGEoe2xlZnREaXNhYmxlZDogdHJ1ZSwgcmlnaHREaXNhYmxlZDogdHJ1ZX0pXHJcblx0XHRcdFx0XHR2YXIgb3AgPSBkaXJlY3Rpb24gPT0gJ2xlZnQnID8gJys9JyA6ICctPSdcclxuXHRcdFx0XHRcdGlkeCA9IGRpcmVjdGlvbiA9PSAnbGVmdCcgPyBpZHgtMSA6IGlkeCsxXHJcblxyXG5cdFx0XHRcdFx0Y3RybC5zY29wZS5pdGVtcy5hbmltYXRlKHtsZWZ0OiBvcCArIHdpZHRofSwgb3B0aW9ucy5hbmltYXRlRGVsYXksIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRjaGVja0J0bnMoKVxyXG5cdFx0XHRcdFx0fSlcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihlbHQsIHtcclxuXHRcdFx0XHRcdHRlbXBsYXRlOiBcIjxkaXYgY2xhc3M9XFxcImNvbnRhaW5lclxcXCI+XFxyXFxuXHQ8ZGl2IGNsYXNzPVxcXCJ2aWV3cG9ydFxcXCI+XFxyXFxuXHRcdDxkaXYgY2xhc3M9XFxcIml0ZW1zXFxcIiBibi1iaW5kPVxcXCJpdGVtc1xcXCI+PC9kaXY+XHRcXHJcXG5cdDwvZGl2Plxcclxcblx0PGRpdiBjbGFzcz1cXFwib3ZlcmxheVxcXCI+XFxyXFxuXHRcdDxkaXY+XFxyXFxuXHRcdFx0PGJ1dHRvbiBcXHJcXG5cdFx0XHRcdGJuLWV2ZW50PVxcXCJjbGljazogb25MZWZ0XFxcIiBcXHJcXG5cdFx0XHRcdGJuLXByb3A9XFxcImhpZGRlbjogbGVmdERpc2FibGVkXFxcIlxcclxcblx0XHRcdFx0Plxcclxcblx0XHRcdFx0PGkgY2xhc3M9XFxcImZhIGZhLTJ4IGZhLWNoZXZyb24tY2lyY2xlLWxlZnRcXFwiPjwvaT5cXHJcXG5cdFx0XHQ8L2J1dHRvbj5cdFx0XHRcXHJcXG5cdFx0PC9kaXY+XFxyXFxuXFxyXFxuXHRcdDxkaXY+XFxyXFxuXHRcdFx0PGJ1dHRvbiBcXHJcXG5cdFx0XHRcdGJuLWV2ZW50PVxcXCJjbGljazogb25SaWdodFxcXCIgXFxyXFxuXHRcdFx0XHRibi1wcm9wPVxcXCJoaWRkZW46IHJpZ2h0RGlzYWJsZWRcXFwiXFxyXFxuXHRcdFx0Plxcclxcblx0XHRcdFx0PGkgY2xhc3M9XFxcImZhIGZhLTJ4IGZhLWNoZXZyb24tY2lyY2xlLXJpZ2h0XFxcIj48L2k+XFxyXFxuXHRcdFx0PC9idXR0b24+XHRcdFx0XFxyXFxuXHRcdDwvZGl2Plxcclxcblxcclxcblx0PC9kaXY+XFxyXFxuXFxyXFxuPC9kaXY+XCIsXHJcblx0XHRcdFx0XHRkYXRhOiB7XHJcblx0XHRcdFx0XHRcdGxlZnREaXNhYmxlZDogdHJ1ZSxcclxuXHRcdFx0XHRcdFx0cmlnaHREaXNhYmxlZDogZmFsc2VcclxuXHRcdFx0XHRcdH0sXHJcblx0XHRcdFx0XHRpbml0OiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0dGhpcy5zY29wZS5pdGVtcy5hcHBlbmQoaXRlbXMpXHJcblx0XHRcdFx0XHRcdHRoaXMuc2NvcGUuaXRlbXMuY3NzKCdsZWZ0JywgKC1pZHggKiBvcHRpb25zLndpZHRoKSArICdweCcpXHJcblx0XHRcdFx0XHRcdC8vY2hlY2tCdG5zKClcclxuXHRcdFx0XHRcdH0sXHJcblx0XHRcdFx0XHRldmVudHM6IHtcclxuXHRcdFx0XHRcdFx0b25MZWZ0OiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0XHRhbmltYXRlKCdsZWZ0JylcclxuXHRcdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdFx0b25SaWdodDogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdFx0YW5pbWF0ZSgncmlnaHQnKVxyXG5cdFx0XHRcdFx0XHR9XHRcdFx0XHRcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9KVxyXG5cdFx0XHRcdGNoZWNrQnRucygpXHRcdFxyXG5cclxuXHRcdFx0fVx0XHRcclxuXHJcblx0XHRcdHRoaXMuc2V0SW5kZXggPSBmdW5jdGlvbihpbmRleCkge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdbQ2Fyb3VzZWxDb250cm9sXSBzZXRJbmRleCcsIGluZGV4KVxyXG5cdFx0XHRcdGlkeCA9ICBNYXRoLm1heCgwLCBNYXRoLm1pbihpbmRleCwgaXRlbXMubGVuZ3RoKSlcclxuXHRcdFx0XHRjdHJsLnNjb3BlLml0ZW1zLmNzcygnbGVmdCcsICgtaWR4ICogb3B0aW9ucy53aWR0aCkgKyAncHgnKVxyXG5cdFx0XHRcdGNoZWNrQnRucyhpZHgpXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGZ1bmN0aW9uIGNoZWNrQnRucygpIHtcclxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdjaGVja0J0bnMnLCBpZHgsIGl0ZW1zLmxlbmd0aClcclxuXHRcdFx0XHRjdHJsLnNldERhdGEoe1xyXG5cdFx0XHRcdFx0bGVmdERpc2FibGVkOiBpZHggPT0gMCxcclxuXHRcdFx0XHRcdHJpZ2h0RGlzYWJsZWQ6IGlkeCA9PSBpdGVtcy5sZW5ndGggLSAxXHJcblx0XHRcdFx0fSlcclxuXHRcdFx0fVx0XHRcclxuXHJcblx0IFx0XHR0aGlzLnJlZnJlc2goKVxyXG5cclxuXHRcdH1cclxuXHJcblx0fSlcclxuXHJcbn0pKCk7XHJcbiIsIiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdDaGVja0dyb3VwQ29udHJvbCcsIHtcclxuXHRcblx0bGliOiAnY29yZScsXG5pbml0OiBmdW5jdGlvbihlbHQpIHtcclxuXHJcblx0XHRlbHQub24oJ2NsaWNrJywgJ2lucHV0W3R5cGU9Y2hlY2tib3hdJywgZnVuY3Rpb24oKSB7XHJcblx0XHRcdGVsdC50cmlnZ2VyKCdpbnB1dCcpXHJcblx0XHR9KVxyXG5cclxuXHRcdHRoaXMuZ2V0VmFsdWUgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0dmFyIHJldCA9IFtdXHJcblx0XHRcdGVsdC5maW5kKCdpbnB1dFt0eXBlPWNoZWNrYm94XTpjaGVja2VkJykuZWFjaChmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRyZXQucHVzaCgkKHRoaXMpLnZhbCgpKVxyXG5cdFx0XHR9KVx0XHJcblx0XHRcdHJldHVybiByZXRcdFxyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMuc2V0VmFsdWUgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcclxuXHRcdFx0XHRlbHQuZmluZCgnaW5wdXRbdHlwZT1jaGVja2JveF0nKS5lYWNoKGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0JCh0aGlzKS5wcm9wKCdjaGVja2VkJywgdmFsdWUuaW5kZXhPZigkKHRoaXMpLnZhbCgpKSA+PSAwKVxyXG5cdFx0XHRcdH0pXHJcblx0XHRcdH1cdFx0XHJcblx0XHR9XHJcblxyXG5cdH1cclxuXHJcbn0pO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIkJC5yZWdpc3RlckNvbnRyb2xFeCgnSHRtbEVkaXRvckNvbnRyb2wnLCB7XHJcblxyXG5cdGlmYWNlOiAnaHRtbCgpJyxcclxuXHJcblx0XG5cdGxpYjogJ2NvcmUnLFxuaW5pdDogZnVuY3Rpb24oZWx0KSB7XHJcblxyXG5cdFx0ZWx0LmFkZENsYXNzKCdibi1mbGV4LXJvdycpXHJcblxyXG5cdFx0dmFyIGNtZEFyZ3MgPSB7XHJcblx0XHRcdCdmb3JlQ29sb3InOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRyZXR1cm4gY3RybC5tb2RlbC5jb2xvclxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cclxuXHRcdHZhciBjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoZWx0LCB7XHJcblx0XHRcdHRlbXBsYXRlOiBcIjxkaXYgY2xhc3M9XFxcImJuLWZsZXgtY29sIGJuLWZsZXgtMVxcXCI+XFxyXFxuXFxyXFxuXHQ8ZGl2IGJuLWV2ZW50PVxcXCJjbGljay5jbWQ6IG9uQ29tbWFuZFxcXCI+XFxyXFxuXHRcdDxkaXYgYm4tY29udHJvbD1cXFwiVG9vbGJhckNvbnRyb2xcXFwiPlxcclxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcImJvbGRcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1ib2xkXFxcIj48L2k+PC9idXR0b24+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwiaXRhbGljXFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtaXRhbGljXFxcIj48L2k+PC9idXR0b24+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwidW5kZXJsaW5lXFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtdW5kZXJsaW5lXFxcIj48L2k+PC9idXR0b24+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwic3RyaWtlVGhyb3VnaFxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLXN0cmlrZXRocm91Z2hcXFwiPjwvaT48L2J1dHRvbj5cXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJmb3JlQ29sb3JcXFwiIGJuLW1lbnU9XFxcImNvbG9ySXRlbXNcXFwiIGJuLWV2ZW50PVxcXCJtZW51Q2hhbmdlOiBvbkNvbG9yTWVudUNoYW5nZVxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLXBlbmNpbFxcXCIgYm4tc3R5bGU9XFxcImNvbG9yOiBjb2xvclxcXCI+PC9pPjwvYnV0dG9uPlxcclxcblx0XHQ8L2Rpdj5cXHJcXG5cdFx0PGRpdiBibi1jb250cm9sPVxcXCJUb29sYmFyQ29udHJvbFxcXCI+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwianVzdGlmeUxlZnRcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1hbGlnbi1sZWZ0XFxcIj48L2k+PC9idXR0b24+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwianVzdGlmeUNlbnRlclxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLWFsaWduLWNlbnRlclxcXCI+PC9pPjwvYnV0dG9uPlxcclxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcImp1c3RpZnlSaWdodFxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLWFsaWduLXJpZ2h0XFxcIj48L2k+PC9idXR0b24+XFxyXFxuXHRcdDwvZGl2Plx0XFxyXFxuXHRcdDxkaXYgYm4tY29udHJvbD1cXFwiVG9vbGJhckNvbnRyb2xcXFwiPlxcclxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcImluZGVudFxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLWluZGVudFxcXCI+PC9pPjwvYnV0dG9uPlxcclxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcIm91dGRlbnRcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1vdXRkZW50XFxcIj48L2k+PC9idXR0b24+XFxyXFxuXHRcdDwvZGl2Plx0XFxyXFxuXHRcdDxkaXYgYm4tY29udHJvbD1cXFwiVG9vbGJhckNvbnRyb2xcXFwiPlxcclxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcImluc2VydEhvcml6b250YWxSdWxlXFxcIj5ocjwvYnV0dG9uPlxcclxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcImZvcm1hdEJsb2NrXFxcIiBkYXRhLWNtZC1hcmc9XFxcImgxXFxcIj5oMTwvYnV0dG9uPlxcclxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcImZvcm1hdEJsb2NrXFxcIiBkYXRhLWNtZC1hcmc9XFxcImgyXFxcIj5oMjwvYnV0dG9uPlxcclxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcImZvcm1hdEJsb2NrXFxcIiBkYXRhLWNtZC1hcmc9XFxcImgzXFxcIj5oMzwvYnV0dG9uPlxcclxcblx0XHQ8L2Rpdj5cdFx0XFxyXFxuXHRcdDxkaXYgYm4tY29udHJvbD1cXFwiVG9vbGJhckNvbnRyb2xcXFwiPlxcclxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcImluc2VydFVub3JkZXJlZExpc3RcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1saXN0LXVsXFxcIj48L2k+PC9idXR0b24+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwiaW5zZXJ0T3JkZXJlZExpc3RcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1saXN0LW9sXFxcIj48L2k+PC9idXR0b24+XFxyXFxuXHRcdDwvZGl2Plxcclxcblxcclxcblx0PC9kaXY+XHRcXHJcXG5cdDxkaXYgY29udGVudGVkaXRhYmxlPVxcXCJ0cnVlXFxcIiBjbGFzcz1cXFwiYm4tZmxleC0xIGVkaXRvclxcXCIgYm4tYmluZD1cXFwiZWRpdG9yXFxcIj48L2Rpdj5cXHJcXG48L2Rpdj5cXHJcXG5cIixcclxuXHRcdFx0ZGF0YToge1xyXG5cdFx0XHRcdGNvbG9yOiAnYmx1ZScsXHJcblx0XHRcdFx0Y29sb3JJdGVtczoge1xyXG5cdFx0XHRcdFx0YmxhY2s6IHtuYW1lOiAnQmxhY2snfSxcclxuXHRcdFx0XHRcdHJlZDoge25hbWU6ICdSZWQnfSxcclxuXHRcdFx0XHRcdGdyZWVuOiB7bmFtZTogJ0dyZWVuJ30sXHJcblx0XHRcdFx0XHRibHVlOiB7bmFtZTogJ0JsdWUnfSxcclxuXHRcdFx0XHRcdHllbGxvdzoge25hbWU6ICdZZWxsb3cnfSxcclxuXHRcdFx0XHRcdGN5YW46IHtuYW1lOiAnQ3lhbid9LFxyXG5cdFx0XHRcdFx0bWFnZW50YToge25hbWU6ICdNYWdlbnRhJ31cclxuXHRcdFx0XHR9XHJcblx0XHRcdH0sXHJcblx0XHRcdGV2ZW50czoge1xyXG5cdFx0XHRcdG9uQ29tbWFuZDogZnVuY3Rpb24oKSB7XHJcblxyXG5cdFx0XHRcdFx0dmFyIGNtZCA9ICQodGhpcykuZGF0YSgnY21kJylcclxuXHRcdFx0XHRcdHZhciBjbWRBcmcgPSAkKHRoaXMpLmRhdGEoJ2NtZEFyZycpXHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvbkNvbW1hbmQnLCBjbWQsIGNtZEFyZylcclxuXHJcblx0XHRcdFx0XHR2YXIgY21kQXJnID0gY21kQXJnIHx8IGNtZEFyZ3NbY21kXVxyXG5cdFx0XHRcdFx0aWYgKHR5cGVvZiBjbWRBcmcgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdFx0XHRjbWRBcmcgPSBjbWRBcmcoKVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb25Db21tYW5kJywgY21kLCBjbWRBcmcpXHJcblxyXG5cdFx0XHRcdFx0ZG9jdW1lbnQuZXhlY0NvbW1hbmQoY21kLCBmYWxzZSwgY21kQXJnKVxyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0b25Db2xvck1lbnVDaGFuZ2U6IGZ1bmN0aW9uKGV2LCBjb2xvcikge1xyXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb25Db2xvck1lbnVDaGFuZ2UnLCBjb2xvcilcclxuXHRcdFx0XHRcdGN0cmwuc2V0RGF0YSh7Y29sb3J9KVxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdH1cclxuXHJcblx0XHR9KVxyXG5cclxuXHRcdHRoaXMuaHRtbCA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRyZXR1cm4gY3RybC5zY29wZS5lZGl0b3IuaHRtbCgpXHJcblx0XHR9XHJcblxyXG5cclxuXHR9XHJcblxyXG59KTtcclxuIiwiKGZ1bmN0aW9uKCkge1xyXG5cclxuXHRmdW5jdGlvbiBnZXRUZW1wbGF0ZShoZWFkZXJzKSB7XHJcblx0XHRyZXR1cm4gYFxyXG5cdFx0XHQ8ZGl2IGNsYXNzPVwic2Nyb2xsUGFuZWxcIj5cclxuXHQgICAgICAgICAgICA8dGFibGUgY2xhc3M9XCJ3My10YWJsZS1hbGwgdzMtc21hbGxcIj5cclxuXHQgICAgICAgICAgICAgICAgPHRoZWFkPlxyXG5cdCAgICAgICAgICAgICAgICAgICAgPHRyIGNsYXNzPVwidzMtZ3JlZW5cIj5cclxuXHQgICAgICAgICAgICAgICAgICAgIFx0JHtoZWFkZXJzfVxyXG5cdCAgICAgICAgICAgICAgICAgICAgPC90cj5cclxuXHQgICAgICAgICAgICAgICAgPC90aGVhZD5cclxuXHQgICAgICAgICAgICAgICAgPHRib2R5PjwvdGJvZHk+XHJcblx0ICAgICAgICAgICAgPC90YWJsZT5cclxuICAgICAgICAgICAgPC9kaXY+XHJcblx0XHRgXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBnZXRJdGVtVGVtcGxhdGUocm93cykge1xyXG5cdFx0cmV0dXJuIGBcclxuICAgICAgICAgICAgPHRyIGNsYXNzPVwiaXRlbVwiIGJuLWF0dHI9XCJkYXRhLWlkOiBfaWRcIj5cclxuICAgICAgICAgICAgXHQke3Jvd3N9XHJcbiAgICAgICAgICAgIDwvdHI+XHRcclxuXHRcdGBcclxuXHR9XHJcblxyXG5cclxuXHJcblx0JCQucmVnaXN0ZXJDb250cm9sRXgoJ0ZpbHRlcmVkVGFibGVDb250cm9sJywge1xyXG5cclxuXHRcdGlmYWNlOiBgYWRkSXRlbShpZCwgZGF0YSk7cmVtb3ZlSXRlbShpZCk7cmVtb3ZlQWxsSXRlbXMoKTtnZXRJdGVtKGlkKTtzZXRGaWx0ZXJzKGZpbHRlcnMpO2dldERhdGFzKCk7Z2V0RGlzcGxheWVkRGF0YXMoKTtvbihldmVudCwgY2FsbGJhY2spYCxcclxuXHRcdGV2ZW50czogJ2l0ZW1BY3Rpb24nLFxyXG5cclxuXHRcdFxuXHRsaWI6ICdjb3JlJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucykge1xyXG5cclxuXHRcdFx0Y29uc29sZS5sb2coJ29wdGlvbnMnLCBvcHRpb25zKVxyXG5cclxuXHRcdFx0dmFyIGNvbHVtbnMgPSAgJCQub2JqMkFycmF5KG9wdGlvbnMuY29sdW1ucylcclxuXHRcdFx0dmFyIGFjdGlvbnMgPSAkJC5vYmoyQXJyYXkob3B0aW9ucy5hY3Rpb25zKVxyXG5cdFx0XHR2YXIgaGVhZGVycyA9IGNvbHVtbnMubWFwKChjb2x1bW4pID0+IGA8dGg+JHtjb2x1bW4udmFsdWV9PC90aD5gKVx0XHRcclxuXHRcdFx0dmFyIHJvd3MgPSBjb2x1bW5zLm1hcCgoY29sdW1uKSA9PiBgPHRkIGJuLWh0bWw9XCIke2NvbHVtbi5rZXl9XCI+PC90ZD5gKVxyXG5cdFx0XHRpZiAoYWN0aW9ucy5sZW5ndGggPiAwKSB7XHJcblx0XHRcdFx0aGVhZGVycy5wdXNoKGA8dGg+QWN0aW9uPC90aD5gKVxyXG5cclxuXHRcdFx0XHR2YXIgYnV0dG9ucyA9IGFjdGlvbnMubWFwKChhY3Rpb24pID0+IGA8YnV0dG9uIGRhdGEtYWN0aW9uPVwiJHthY3Rpb24ua2V5fVwiIGNsYXNzPVwidzMtYnV0dG9uXCI+PGkgY2xhc3M9XCIke2FjdGlvbi52YWx1ZX1cIj48L2k+PC9idXR0b24+YClcclxuXHRcdFx0XHRyb3dzLnB1c2goYDx0ZD4ke2J1dHRvbnMuam9pbignJyl9PC90ZD5gKVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdyb3dzJywgcm93cylcclxuXHRcdFx0dmFyIGl0ZW1UZW1wbGF0ZSA9IGdldEl0ZW1UZW1wbGF0ZShyb3dzLmpvaW4oJycpKVxyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdpdGVtVGVtcGxhdGUnLCBpdGVtVGVtcGxhdGUpXHJcblxyXG5cdFx0XHRlbHQuYXBwZW5kKGdldFRlbXBsYXRlKGhlYWRlcnMuam9pbignJykpKVxyXG5cdFx0XHRlbHQuYWRkQ2xhc3MoJ2JuLWZsZXgtY29sJylcclxuXHJcblx0XHRcdGxldCBkYXRhcyA9IHt9XHJcblx0XHRcdGxldCBldmVudHMgPSBuZXcgRXZlbnRFbWl0dGVyMigpXHJcblx0XHRcdGxldCBfZmlsdGVycyA9IHt9XHJcblx0XHRcdGxldCBkaXNwbGF5ZWRJdGVtcyA9IHt9XHJcblxyXG5cdFx0XHRjb25zdCB0Ym9keSA9IGVsdC5maW5kKCd0Ym9keScpXHJcblx0XHRcdHRib2R5Lm9uKCdjbGljaycsICdbZGF0YS1hY3Rpb25dJywgZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0dmFyIGlkID0gJCh0aGlzKS5jbG9zZXN0KCcuaXRlbScpLmRhdGEoJ2lkJylcclxuXHRcdFx0XHR2YXIgYWN0aW9uID0gJCh0aGlzKS5kYXRhKCdhY3Rpb24nKVxyXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdjbGljaycsIGlkLCAnYWN0aW9uJywgYWN0aW9uKVxyXG5cdFx0XHRcdGV2ZW50cy5lbWl0KCdpdGVtQWN0aW9uJywgYWN0aW9uLCBpZClcclxuXHRcdFx0fSlcclxuXHJcblx0XHRcdHRoaXMuYWRkSXRlbSA9IGZ1bmN0aW9uKGlkLCBkYXRhKSB7XHJcblxyXG5cdFx0XHRcdHZhciBpdGVtRGF0YSA9ICQuZXh0ZW5kKHsnX2lkJzogaWR9LCBkYXRhKVxyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ2FkZEl0ZW0nLCBpdGVtRGF0YSlcclxuXHRcdFx0XHRcclxuXHRcdFx0XHRpZiAoZGF0YXNbaWRdICE9IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdFx0dmFyIGl0ZW0gPSBkaXNwbGF5ZWRJdGVtc1tpZF1cclxuXHRcdFx0XHRcdGlmIChpdGVtICE9IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdFx0XHRpdGVtLmVsdC51cGRhdGVUZW1wbGF0ZShpdGVtLmN0eCwgaXRlbURhdGEpXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGVsc2UgaWYgKGlzSW5GaWx0ZXIoZGF0YSkpe1xyXG5cdFx0XHRcdFx0dmFyIGVsdCA9ICQoaXRlbVRlbXBsYXRlKVxyXG5cdFx0XHRcdFx0dmFyIGN0eCA9IGVsdC5wcm9jZXNzVGVtcGxhdGUoaXRlbURhdGEpXHJcblx0XHRcdFx0XHRkaXNwbGF5ZWRJdGVtc1tpZF0gPSB7ZWx0LCBjdHh9XHJcblx0XHRcdFx0XHR0Ym9keS5hcHBlbmQoZWx0KVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRkYXRhc1tpZF0gPSBkYXRhXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHRoaXMucmVtb3ZlSXRlbSA9IGZ1bmN0aW9uKGlkKSB7XHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygncmVtb3ZlSXRlbScsIGlkKVxyXG5cdFx0XHRcdGlmIChkYXRhc1tpZF0gIT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0XHRkZWxldGUgZGF0YXNbaWRdXHJcblx0XHRcdFx0XHR2YXIgaXRlbSA9IGRpc3BsYXllZEl0ZW1zW2lkXVxyXG5cdFx0XHRcdFx0aWYgKGl0ZW0gIT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0XHRcdGl0ZW0uZWx0LnJlbW92ZSgpXHJcblx0XHRcdFx0XHRcdGRlbGV0ZSBkaXNwbGF5ZWRJdGVtc1tpZF1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHRcdFx0XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHRoaXMuZ2V0SXRlbSA9IGZ1bmN0aW9uKGlkKSB7XHJcblx0XHRcdFx0cmV0dXJuIGRhdGFzW2lkXVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0aGlzLnJlbW92ZUFsbEl0ZW1zID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygncmVtb3ZlQWxsSXRlbXMnKVxyXG5cdFx0XHRcdGRhdGFzID0ge31cclxuXHRcdFx0XHRkaXNwbGF5ZWRJdGVtcyA9IHt9XHJcblx0XHRcdFx0dGJvZHkuZW1wdHkoKVx0XHRcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0ZnVuY3Rpb24gaXNJbkZpbHRlcihkYXRhKSB7XHJcblx0XHRcdFx0dmFyIHJldCA9IHRydWVcclxuXHRcdFx0XHRmb3IodmFyIGYgaW4gX2ZpbHRlcnMpIHtcclxuXHRcdFx0XHRcdHZhciB2YWx1ZSA9IGRhdGFbZl1cclxuXHRcdFx0XHRcdHZhciBmaWx0ZXJWYWx1ZSA9IF9maWx0ZXJzW2ZdXHJcblx0XHRcdFx0XHRyZXQgJj0gKGZpbHRlclZhbHVlID09ICcnIHx8IHZhbHVlLnN0YXJ0c1dpdGgoZmlsdGVyVmFsdWUpKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gcmV0XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHRoaXMuc2V0RmlsdGVycyA9IGZ1bmN0aW9uKGZpbHRlcnMpIHtcclxuXHRcdFx0XHRfZmlsdGVycyA9IGZpbHRlcnNcclxuXHRcdFx0XHRkaXNwVGFibGUoKVxyXG5cdFx0XHR9XHJcblxyXG5cclxuXHRcdFx0ZnVuY3Rpb24gZGlzcFRhYmxlKCkge1xyXG5cdFx0XHRcdGRpc3BsYXllZEl0ZW1zID0ge31cclxuXHRcdFx0XHRsZXQgaXRlbXMgPSBbXVxyXG5cdFx0XHRcdGZvcihsZXQgaWQgaW4gZGF0YXMpIHtcclxuXHRcdFx0XHRcdHZhciBkYXRhID0gZGF0YXNbaWRdXHJcblx0XHRcdFx0XHRpZiAoaXNJbkZpbHRlcihkYXRhKSkge1xyXG5cdFx0XHRcdFx0XHR2YXIgaXRlbURhdGEgPSAkLmV4dGVuZCh7J19pZCc6IGlkfSwgZGF0YSlcclxuXHRcdFx0XHRcdFx0dmFyIGVsdCA9ICQoaXRlbVRlbXBsYXRlKVxyXG5cdFx0XHRcdFx0XHR2YXIgY3R4ID0gZWx0LnByb2Nlc3NUZW1wbGF0ZShpdGVtRGF0YSlcdFx0XHRcclxuXHRcdFx0XHRcdFx0aXRlbXMucHVzaChlbHQpXHJcblx0XHRcdFx0XHRcdGRpc3BsYXllZEl0ZW1zW2lkXSA9IHtlbHQsIGN0eH1cclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdHRib2R5LmVtcHR5KCkuYXBwZW5kKGl0ZW1zKVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0aGlzLmdldERhdGFzID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0cmV0dXJuIGRhdGFzXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHRoaXMuZ2V0RGlzcGxheWVkRGF0YXMgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHR2YXIgcmV0ID0ge31cclxuXHRcdFx0XHRmb3IobGV0IGkgaW4gZGlzcGxheWVkSXRlbXMpIHtcclxuXHRcdFx0XHRcdHJldFtpXSA9IGRhdGFzW2ldXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiByZXRcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dGhpcy5vbiA9IGV2ZW50cy5vbi5iaW5kKGV2ZW50cylcclxuXHJcblxyXG5cdFx0fVxyXG5cdH0pXHJcblxyXG59KSgpO1xyXG4iLCJcclxuJCQucmVnaXN0ZXJDb250cm9sRXgoJ0hlYWRlckNvbnRyb2wnLCB7XHJcblx0ZGVwczogWydXZWJTb2NrZXRTZXJ2aWNlJ10sXHJcblx0b3B0aW9uczoge1xyXG5cdFx0dGl0bGU6ICdIZWxsbyBXb3JsZCcsXHJcblx0XHR1c2VyTmFtZTogJ3Vua25vd24nLFxyXG5cdFx0aXNIb21lUGFnZTogZmFsc2VcclxuXHR9LFxyXG5cdFxuXHRsaWI6ICdjb3JlJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucywgY2xpZW50KSB7XHJcblxyXG5cdFx0dmFyIGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihlbHQsIHtcclxuXHRcdFx0dGVtcGxhdGU6IFwiPGRpdiA+XFxyXFxuXHQ8ZGl2IGNsYXNzPVxcXCJicmFuZFxcXCI+PGgxIGNsYXNzPVxcXCJibi14cy1oaWRlXFxcIiBibi10ZXh0PVxcXCJ0aXRsZVxcXCI+PC9oMT4gPC9kaXY+XFxyXFxuXHQ8ZGl2IGNsYXNzPVxcXCJpbmZvc1xcXCI+XFxyXFxuXHRcdDxkaXYgY2xhc3M9XFxcIm5vdGlmaWNhdGlvblxcXCIgdGl0bGU9XFxcIm5vdGlmaWNhdGlvblxcXCI+XFxyXFxuXHRcdFx0PGkgY2xhc3M9XFxcImZhIGZhLWxnIGZhLWJlbGxcXFwiPjwvaT5cXHJcXG5cdFx0XHQ8c3BhbiBjbGFzcz1cXFwidzMtYmFkZ2UgdzMtcmVkIHczLXRpbnlcXFwiIGJuLXRleHQ9XFxcIm5iTm90aWZcXFwiIGJuLXNob3c9XFxcImlzTm90aWZWaXNpYmxlXFxcIj48L3NwYW4+XHRcdFx0XFxyXFxuXHRcdDwvZGl2Plxcclxcblxcclxcblx0ICAgIDxpIGJuLWF0dHI9XFxcInRpdGxlOiB0aXRsZVN0YXRlXFxcIiBjbGFzcz1cXFwiZmEgZmEtbGcgY29ubmVjdGlvblN0YXRlXFxcIiBibi1jbGFzcz1cXFwiZmEtZXllOiBjb25uZWN0ZWQsIGZhLWV5ZS1zbGFzaDogIWNvbm5lY3RlZFxcXCI+PC9pPlxcclxcblxcclxcblx0ICAgIDxkaXY+XFxyXFxuXHRcdCAgICA8aSBjbGFzcz1cXFwiZmEgZmEtdXNlciBmYS1sZ1xcXCI+PC9pPlxcclxcblx0XHQgICAgPHNwYW4gYm4tdGV4dD1cXFwidXNlck5hbWVcXFwiIGNsYXNzPVxcXCJ1c2VyTmFtZVxcXCI+PC9zcGFuPlx0ICAgIFx0XFxyXFxuXHQgICAgPC9kaXY+XFxyXFxuXFxyXFxuXHQgICAgPGJ1dHRvbiB0aXRsZT1cXFwibG9nb3V0XFxcIiBjbGFzcz1cXFwidzMtYnRuXFxcIiBibi1ldmVudD1cXFwiY2xpY2s6IG9uRGlzY29ubmVjdFxcXCIgYm4tc2hvdz1cXFwiaXNIb21lUGFnZVxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLXBvd2VyLW9mZiBmYS1sZ1xcXCI+PC9pPjwvYnV0dG9uPiBcXHJcXG5cXHJcXG5cdCAgICA8YnV0dG9uIHRpdGxlPVxcXCJob21lXFxcIiBjbGFzcz1cXFwidzMtYnRuXFxcIiBibi1ldmVudD1cXFwiY2xpY2s6IG9uR29Ib21lXFxcIiBibi1zaG93PVxcXCIhaXNIb21lUGFnZVxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLWhvbWUgZmEtbGdcXFwiPjwvaT48L2J1dHRvbj4gXFxyXFxuXFxyXFxuPCEtLSBcdCAgICA8YSBocmVmPVxcXCIvXFxcIiB0aXRsZT1cXFwiaG9tZVxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLWhvbWUgZmEtbGdcXFwiPjwvaT48L2E+IFxcclxcbiAtLT5cdDwvZGl2PlxcclxcbjwvZGl2PlwiLFxyXG5cdFx0XHRkYXRhOiB7XHJcblx0XHRcdFx0Y29ubmVjdGVkOiBmYWxzZSxcclxuXHRcdFx0XHR0aXRsZVN0YXRlOiBcIldlYlNvY2tldCBkaXNjb25uZWN0ZWRcIixcclxuXHRcdFx0XHR0aXRsZTogb3B0aW9ucy50aXRsZSxcclxuXHRcdFx0XHR1c2VyTmFtZTogb3B0aW9ucy51c2VyTmFtZSxcclxuXHRcdFx0XHRpc0hvbWVQYWdlOiBvcHRpb25zLmlzSG9tZVBhZ2UsXHJcblx0XHRcdFx0bmJOb3RpZjogMCxcclxuXHRcdFx0XHRpc05vdGlmVmlzaWJsZTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5uYk5vdGlmID4gMFxyXG5cdFx0XHRcdH1cdFx0XHRcdFxyXG5cdFx0XHR9LFxyXG5cdFx0XHRldmVudHM6IHtcclxuXHRcdFx0XHRvbkdvSG9tZTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRsb2NhdGlvbi5ocmVmID0gJy8nXHJcblx0XHRcdFx0fSxcclxuXHJcblx0XHRcdFx0b25EaXNjb25uZWN0OiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdHNlc3Npb25TdG9yYWdlLmNsZWFyKClcclxuXHRcdFx0XHRcdGxvY2F0aW9uLmhyZWYgPSAnL2Rpc2Nvbm5lY3QnXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9KVxyXG5cclxuXHJcblx0XHRjbGllbnQuZXZlbnRzLm9uKCdjb25uZWN0JywgZnVuY3Rpb24oKSB7XHJcblx0XHRcdGNvbnNvbGUubG9nKCdbSGVhZGVyQ29udHJvbF0gY2xpZW50IGNvbm5lY3RlZCcpXHJcblx0XHRcdGN0cmwuc2V0RGF0YSh7Y29ubmVjdGVkOiB0cnVlLCB0aXRsZVN0YXRlOiBcIldlYlNvY2tldCBjb25uZWN0ZWRcIn0pXHJcblxyXG5cdFx0fSlcclxuXHJcblx0XHRjbGllbnQuZXZlbnRzLm9uKCdkaXNjb25uZWN0JywgZnVuY3Rpb24oKSB7XHJcblx0XHRcdGNvbnNvbGUubG9nKCdbSGVhZGVyQ29udHJvbF0gY2xpZW50IGRpc2Nvbm5lY3RlZCcpXHJcblx0XHRcdGN0cmwuc2V0RGF0YSh7Y29ubmVjdGVkOiBmYWxzZSwgdGl0bGVTdGF0ZTogXCJXZWJTb2NrZXQgZGlzY29ubmVjdGVkXCJ9KVxyXG5cclxuXHRcdH0pXHJcblxyXG5cdFx0Y2xpZW50LnJlZ2lzdGVyKCdtYXN0ZXJOb3RpZmljYXRpb25zJywgdHJ1ZSwgb25Ob3RpZmljYXRpb25zKVxyXG5cclxuXHRcdGZ1bmN0aW9uIG9uTm90aWZpY2F0aW9ucyhtc2cpIHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ29uTm90aWZpY2F0aW9ucycsIG1zZy5kYXRhKVxyXG5cdFx0XHRjdHJsLnNldERhdGEoe25iTm90aWY6IG1zZy5kYXRhLmxlbmd0aH0pXHJcblx0XHR9XHJcblxyXG5cclxuXHR9XHJcblxyXG59KTtcclxuXHJcblxyXG4iLCIkJC5yZWdpc3RlckNvbnRyb2xFeCgnSG9tZUNvbnRyb2wnLCB7XHJcblx0ZGVwczogWydIdHRwU2VydmljZSddLFxyXG5cclxuXHRcblx0bGliOiAnY29yZScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMsIGh0dHApIHtcclxuXHJcblx0XHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xyXG5cdFx0XHR0ZW1wbGF0ZTogXCI8ZGl2IGlkPVxcXCJtYWluXFxcIj5cXHJcXG5cXHJcXG5cXHJcXG5cdDxhcnRpY2xlPlxcclxcblx0XHQ8cD5BdmFpbGFibGUgYXBwczo8L3A+XFxyXFxuXHRcdDxkaXYgY2xhc3M9XFxcImJuLWZsZXgtcm93IGJuLWZsZXgtd3JhcFxcXCIgYm4tZWFjaD1cXFwiYXBwIG9mIGFwcHNcXFwiPlxcclxcblx0XHRcdFx0PGEgYm4tYXR0cj1cXFwiY2xhc3M6IGFwcC5jbGFzc05hbWUsIGhyZWY6YXBwLmhyZWYsIHRpdGxlOmFwcC5kZXNjXFxcIj5cXHJcXG5cdFx0XHRcdFx0XFxyXFxuXHRcdFx0XHRcdDxkaXYgY2xhc3M9XFxcImJuLWZsZXgtY29sXFxcIiBzdHlsZT1cXFwiaGVpZ2h0OiAxMDAlOyBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcXFwiPlxcclxcblx0XHRcdFx0XHRcdDxkaXYgY2xhc3M9XFxcImJuLWZsZXgtMSBibi1mbGV4LXJvd1xcXCIgc3R5bGU9XFxcImFsaWduLWl0ZW1zOiBjZW50ZXI7IGp1c3RpZnktY29udGVudDogY2VudGVyO1xcXCIgYm4tc2hvdz1cXFwiYXBwLmhhc1RpbGVJY29uXFxcIj5cXHJcXG5cdFx0XHRcdFx0XHRcdDxpIGJuLWF0dHI9XFxcImNsYXNzOiBhcHAudGlsZUljb25cXFwiPjwvaT5cXHJcXG5cdFx0XHRcdFx0XHQ8L2Rpdj5cXHJcXG5cdFxcclxcblx0XHRcdFx0XHRcdDxzcGFuIGJuLXRleHQ9XFxcImFwcC50aWxlTmFtZVxcXCI+PC9zcGFuPlxcclxcblx0XHRcdFx0XHQ8L2Rpdj5cXHJcXG5cXHJcXG5cdFx0XHRcdDwvYT5cXHJcXG5cdFx0PC9kaXY+XFxyXFxuXFxyXFxuXHQ8L2FydGljbGU+XFxyXFxuXFxyXFxuPC9kaXY+XCIsXHJcblx0XHRcdGRhdGE6IHtcclxuXHRcdFx0XHRhcHBzOiBbXVxyXG5cdFx0XHRcdFxyXG5cdFx0XHR9XHJcblxyXG5cdFx0fSlcclxuXHJcblx0XHRodHRwLmdldCgnL2FwaS9hcHAvd2ViYXBwcycpLnRoZW4oKGFwcEluZm9zKSA9PiB7XHJcblx0XHRcdGNvbnNvbGUubG9nKCdhcHBJbmZvcycsIGFwcEluZm9zKVxyXG5cclxuXHRcdFx0dmFyIGFwcHMgPSBbXVxyXG5cclxuXHRcdFx0Zm9yKHZhciBrIGluIGFwcEluZm9zKSB7XHJcblx0XHRcdFx0dmFyIGFwcEluZm8gPSBhcHBJbmZvc1trXVxyXG5cdFx0XHRcdHZhciB0aWxlTmFtZSA9IGtcclxuXHRcdFx0XHR2YXIgZGVzYyA9ICcnXHJcblx0XHRcdFx0dmFyIHRpbGVDb2xvciA9ICd3My1ibHVlJ1xyXG5cdFx0XHRcdHZhciBwcm9wcyA9IGFwcEluZm8ucHJvcHNcclxuXHRcdFx0XHRpZiAodHlwZW9mIHByb3BzLnRpbGVOYW1lID09ICdzdHJpbmcnKSB7XHJcblx0XHRcdFx0XHR0aWxlTmFtZSA9IHByb3BzLnRpbGVOYW1lXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICh0eXBlb2YgcHJvcHMuZGVzYyA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdFx0ZGVzYyA9IHByb3BzLmRlc2NcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKHR5cGVvZiBwcm9wcy50aWxlQ29sb3IgPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0XHRcdHRpbGVDb2xvciA9IHByb3BzLnRpbGVDb2xvclxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHR2YXIgY2xhc3NOYW1lID0gXCJ3My1idG4gYXBwSWNvbiBcIiArIHRpbGVDb2xvclxyXG5cdFx0XHRcdHZhciBocmVmID0gXCIvYXBwcy9cIiArIGtcclxuXHJcblx0XHRcdFx0YXBwcy5wdXNoKHtcclxuXHRcdFx0XHRcdHRpbGVJY29uOiBwcm9wcy50aWxlSWNvbixcclxuXHRcdFx0XHRcdHRpbGVDb2xvcixcclxuXHRcdFx0XHRcdHRpbGVOYW1lLFxyXG5cdFx0XHRcdFx0ZGVzYyxcclxuXHRcdFx0XHRcdHRpbGVDb2xvcixcclxuXHRcdFx0XHRcdGNsYXNzTmFtZSxcclxuXHRcdFx0XHRcdGhyZWYsXHJcblx0XHRcdFx0XHRoYXNUaWxlSWNvbjogcHJvcHMudGlsZUljb24gIT0gdW5kZWZpbmVkXHJcblx0XHRcdFx0fSlcclxuXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGNvbnNvbGUubG9nKCdhcHBzJywgYXBwcylcclxuXHRcdFx0Y3RybC5zZXREYXRhKHthcHBzfSlcclxuXHRcdFx0XHJcblx0XHR9KVxyXG5cclxuXHR9XHJcblxyXG59KTtcclxuXHJcbiIsIlxyXG4kJC5yZWdpc3RlckNvbnRyb2xFeCgnSW5wdXRHcm91cENvbnRyb2wnLCB7XHJcblx0XG5cdGxpYjogJ2NvcmUnLFxuaW5pdDogZnVuY3Rpb24oZWx0KSB7XHJcblxyXG5cdFx0dmFyIGlkID0gZWx0LmNoaWxkcmVuKCdpbnB1dCcpLnVuaXF1ZUlkKCkuYXR0cignaWQnKVxyXG5cdFx0Ly9jb25zb2xlLmxvZygnW0lucHV0R3JvdXBDb250cm9sXSBpZCcsIGlkKVxyXG5cdFx0ZWx0LmNoaWxkcmVuKCdsYWJlbCcpLmF0dHIoJ2ZvcicsIGlkKVxyXG5cdH1cclxufSk7XHJcbiIsIihmdW5jdGlvbigpIHtcclxuXHJcblx0JCQucmVnaXN0ZXJDb250cm9sRXgoJ05hdmJhckNvbnRyb2wnLCB7XHJcblxyXG5cdFx0b3B0aW9uczoge1xyXG5cdFx0XHRhY3RpdmVDb2xvcjogJ3czLWdyZWVuJ1xyXG5cdFx0fSxcclxuXHJcblx0XHRcblx0bGliOiAnY29yZScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMpIHtcclxuXHJcblx0XHRcdHZhciBhY3RpdmVDb2xvciA9IG9wdGlvbnMuYWN0aXZlQ29sb3JcclxuXHJcblxyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdbTmF2YmFyQ29udHJvbF0gb3B0aW9ucycsIG9wdGlvbnMpXHJcblxyXG5cdFx0XHRlbHQuYWRkQ2xhc3MoJ3czLWJhcicpXHJcblx0XHRcdGVsdC5jaGlsZHJlbignYScpLmVhY2goZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0JCh0aGlzKS5hZGRDbGFzcygndzMtYmFyLWl0ZW0gdzMtYnV0dG9uJylcclxuXHRcdFx0fSlcclxuXHJcblx0XHRcdCQod2luZG93KS5vbigncm91dGVDaGFuZ2VkJywgZnVuY3Rpb24oZXZ0LCBuZXdSb3V0ZSkge1xyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ1tOYXZiYXJDb250cm9sXSByb3V0ZUNoYW5nZScsIG5ld1JvdXRlKVxyXG5cclxuXHRcdFx0XHRlbHQuY2hpbGRyZW4oYGEuJHthY3RpdmVDb2xvcn1gKS5yZW1vdmVDbGFzcyhhY3RpdmVDb2xvcilcdFxyXG5cdFx0XHRcdGVsdC5jaGlsZHJlbihgYVtocmVmPVwiIyR7bmV3Um91dGV9XCJdYCkuYWRkQ2xhc3MoYWN0aXZlQ29sb3IpXHJcblxyXG5cdFx0XHR9KVx0XHJcblx0XHR9XHJcblxyXG5cdH0pXHJcblxyXG5cclxufSkoKTtcclxuXHJcblxyXG4iLCIkJC5yZWdpc3RlckNvbnRyb2xFeCgnUGljdHVyZUNhcm91c2VsQ29udHJvbCcsIHtcclxuXHJcblx0cHJvcHM6IHtcclxuXHRcdGluZGV4OiB7dmFsOiAwLCBzZXQ6ICdzZXRJbmRleCd9LFxyXG5cdFx0aW1hZ2VzOiB7dmFsOiBbXSwgc2V0OiAnc2V0SW1hZ2VzJ31cclxuXHR9LFxyXG5cdG9wdGlvbnM6IHtcclxuXHRcdHdpZHRoOiAzMDAsXHJcblx0XHRoZWlnaHQ6IDIwMCxcclxuXHRcdGFuaW1hdGVEZWxheTogMTAwMCxcclxuXHRcdGNvbG9yOiAneWVsbG93J1xyXG5cdH0sXHRcclxuXHJcblx0aWZhY2U6ICdzZXRJbWFnZXMoaW1hZ2VzKTtzZXRJbmRleChpZHgpJyxcclxuXHJcblx0XG5cdGxpYjogJ2NvcmUnLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zKSB7XHJcblxyXG5cdFx0Y29uc29sZS5sb2coYFtQaWN0dXJlQ2Fyb3VzZWxDb250cm9sXSBvcHRpb25zYCwgb3B0aW9ucylcclxuXHJcblx0XHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xyXG5cdFx0XHR0ZW1wbGF0ZTogXCI8ZGl2IGJuLWNvbnRyb2w9XFxcIkNhcm91c2VsQ29udHJvbFxcXCIgYm4tb3B0aW9ucz1cXFwiY2Fyb3VzZWxDdHJsT3B0aW9uc1xcXCIgYm4tZWFjaD1cXFwiaSBvZiBpbWFnZXNcXFwiIGJuLWlmYWNlPVxcXCJjYXJvdXNlbEN0cmxcXFwiIGJuLWRhdGE9XFxcImluZGV4OiBpbmRleFxcXCI+XFxyXFxuXHQ8ZGl2IHN0eWxlPVxcXCJ0ZXh0LWFsaWduOiBjZW50ZXI7XFxcIiBibi1zdHlsZT1cXFwiYmFja2dyb3VuZC1jb2xvcjogYmFja0NvbG9yXFxcIj5cXHJcXG5cdFx0PGltZyBibi1hdHRyPVxcXCJzcmM6IGlcXFwiIHN0eWxlPVxcXCJoZWlnaHQ6IDEwMCVcXFwiPlxcclxcblx0PC9kaXY+XFxyXFxuPC9kaXY+XCIsXHJcblx0XHRcdGRhdGE6IHtcclxuXHRcdFx0XHRjYXJvdXNlbEN0cmxPcHRpb25zOiBvcHRpb25zLFxyXG5cdFx0XHRcdGltYWdlczogb3B0aW9ucy5pbWFnZXMsXHJcblx0XHRcdFx0YmFja0NvbG9yOiBvcHRpb25zLmNvbG9yLFxyXG5cdFx0XHRcdGluZGV4OiBvcHRpb25zLmluZGV4XHJcblx0XHRcdH1cclxuXHRcdH0pXHJcblxyXG5cdFx0dGhpcy5zZXRJbWFnZXMgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdbUGljdHVyZUNhcm91c2VsQ29udHJvbF0gc2V0SW1hZ2VzJywgdmFsdWUpXHJcblx0XHRcdGN0cmwuc2V0RGF0YSgnaW1hZ2VzJywgdmFsdWUpXHJcblx0XHRcdGN0cmwuc2NvcGUuY2Fyb3VzZWxDdHJsLnJlZnJlc2goKVx0XHRcdFxyXG5cdFx0fSxcclxuXHRcdHRoaXMuc2V0SW5kZXggPSBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRjdHJsLnNldERhdGEoJ2luZGV4JywgdmFsdWUpXHJcblx0XHR9XHJcblxyXG5cdH1cclxufSk7IiwiKGZ1bmN0aW9uKCkge1xyXG5cclxuXHQkJC5yZWdpc3RlckNvbnRyb2woJ1JhZGlvR3JvdXBDb250cm9sJywgZnVuY3Rpb24oZWx0KSB7XHJcblxyXG5cdFx0ZWx0Lm9uKCdjbGljaycsICdpbnB1dFt0eXBlPXJhZGlvXScsIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdyYWRpb2dyb3VwIGNsaWNrJylcclxuXHRcdFx0ZWx0LmZpbmQoJ2lucHV0W3R5cGU9cmFkaW9dOmNoZWNrZWQnKS5wcm9wKCdjaGVja2VkJywgZmFsc2UpXHJcblx0XHRcdCQodGhpcykucHJvcCgnY2hlY2tlZCcsIHRydWUpXHJcblx0XHRcdGVsdC50cmlnZ2VyKCdpbnB1dCcpXHJcblx0XHR9KVxyXG5cdFx0XHJcblxyXG5cdFx0dGhpcy5nZXRWYWx1ZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRyZXR1cm4gZWx0LmZpbmQoJ2lucHV0W3R5cGU9cmFkaW9dOmNoZWNrZWQnKS52YWwoKVxyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMuc2V0VmFsdWUgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRlbHQuZmluZCgnaW5wdXRbdHlwZT1yYWRpb10nKS5lYWNoKGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdCQodGhpcykucHJvcCgnY2hlY2tlZCcsIHZhbHVlID09PSAkKHRoaXMpLnZhbCgpKVxyXG5cdFx0XHR9KVx0XHRcdFxyXG5cdFx0fVxyXG5cclxuXHJcblx0fSlcclxuXHJcblxyXG59KSgpO1xyXG5cclxuXHJcbiIsIihmdW5jdGlvbigpIHtcclxuXHJcblx0ZnVuY3Rpb24gbWF0Y2hSb3V0ZShyb3V0ZSwgcGF0dGVybikge1xyXG5cdFx0Ly9jb25zb2xlLmxvZygnbWF0Y2hSb3V0ZScsIHJvdXRlLCBwYXR0ZXJuKVxyXG5cdFx0dmFyIHJvdXRlU3BsaXQgPSByb3V0ZS5zcGxpdCgnLycpXHJcblx0XHR2YXIgcGF0dGVyblNwbGl0ID0gcGF0dGVybi5zcGxpdCgnLycpXHJcblx0XHQvL2NvbnNvbGUubG9nKHJvdXRlU3BsaXQsIHBhdHRlcm5TcGxpdClcclxuXHRcdHZhciByZXQgPSB7fVxyXG5cclxuXHRcdGlmIChyb3V0ZVNwbGl0Lmxlbmd0aCAhPSBwYXR0ZXJuU3BsaXQubGVuZ3RoKVxyXG5cdFx0XHRyZXR1cm4gbnVsbFxyXG5cclxuXHRcdGZvcih2YXIgaWR4ID0gMDsgaWR4IDwgcGF0dGVyblNwbGl0Lmxlbmd0aDsgaWR4KyspIHtcclxuXHRcdFx0dmFyIHBhdGggPSBwYXR0ZXJuU3BsaXRbaWR4XVxyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdwYXRoJywgcGF0aClcclxuXHRcdFx0aWYgKHBhdGguc3Vic3RyKDAsIDEpID09PSAnOicpIHtcclxuXHRcdFx0XHRpZiAocm91dGVTcGxpdFtpZHhdLmxlbmd0aCA9PT0gMClcclxuXHRcdFx0XHRcdHJldHVybiBudWxsXHJcblx0XHRcdFx0cmV0W3BhdGguc3Vic3RyKDEpXSA9IHJvdXRlU3BsaXRbaWR4XVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2UgaWYgKHBhdGggIT09IHJvdXRlU3BsaXRbaWR4XSkge1xyXG5cdFx0XHRcdHJldHVybiBudWxsXHJcblx0XHRcdH1cclxuXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHJldFxyXG5cdH1cclxuXHJcblxyXG5cclxuXHJcblx0JCQucmVnaXN0ZXJDb250cm9sRXgoJ1JvdXRlckNvbnRyb2wnLCB7XHJcblxyXG5cdFx0b3B0aW9uczoge1xyXG5cdFx0XHRyb3V0ZXM6IFtdXHJcblx0XHR9LFxyXG5cdFx0XG5cdGxpYjogJ2NvcmUnLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zKSB7XHJcblxyXG5cclxuXHJcblx0XHRcdHZhciByb3V0ZXMgPSBvcHRpb25zLnJvdXRlc1xyXG5cclxuXHRcdFx0aWYgKCFBcnJheS5pc0FycmF5KHJvdXRlcykpIHtcclxuXHRcdFx0XHRjb25zb2xlLndhcm4oJ1tSb3V0ZXJDb250cm9sXSBiYWQgb3B0aW9ucycpXHJcblx0XHRcdFx0cmV0dXJuXHJcblx0XHRcdH1cclxuXHJcblxyXG5cdFx0XHRmdW5jdGlvbiBwcm9jZXNzUm91dGUoaW5mbykge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdbUm91dGVyQ29udHJvbF0gcHJvY2Vzc1JvdXRlJywgaW5mbylcclxuXHJcblx0XHRcdFx0dmFyIG5ld1JvdXRlID0gaW5mby5jdXJSb3V0ZVxyXG5cclxuXHRcdFx0XHRmb3IodmFyIHJvdXRlIG9mIHJvdXRlcykge1xyXG5cdFx0XHRcdFx0dmFyIHBhcmFtcyA9IG1hdGNoUm91dGUobmV3Um91dGUsIHJvdXRlLmhyZWYpXHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKGByb3V0ZTogJHtyb3V0ZS5ocmVmfSwgcGFyYW1zYCwgcGFyYW1zKVxyXG5cdFx0XHRcdFx0aWYgKHBhcmFtcyAhPSBudWxsKSB7XHJcblx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ1tSb3V0ZXJDb250cm9sXSBwYXJhbXMnLCBwYXJhbXMpXHJcblx0XHRcdFx0XHRcdGlmICh0eXBlb2Ygcm91dGUucmVkaXJlY3QgPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0XHRcdFx0XHRsb2NhdGlvbi5ocmVmID0gJyMnICsgcm91dGUucmVkaXJlY3RcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRlbHNlIGlmICh0eXBlb2Ygcm91dGUuY29udHJvbCA9PSAnc3RyaW5nJykge1xyXG5cclxuXHRcdFx0XHRcdFx0XHR2YXIgY3VyQ3RybCA9IGVsdC5maW5kKCcuQ3VzdG9tQ29udHJvbCcpLmludGVyZmFjZSgpXHJcblx0XHRcdFx0XHRcdFx0dmFyIGNhbkNoYW5nZSA9IHRydWVcclxuXHRcdFx0XHRcdFx0XHRpZiAoY3VyQ3RybCAmJiB0eXBlb2YgY3VyQ3RybC5jYW5DaGFuZ2UgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdFx0XHRcdFx0Y2FuQ2hhbmdlID0gY3VyQ3RybC5jYW5DaGFuZ2UoKVxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHRpZiAoY2FuQ2hhbmdlKSB7XHJcblx0XHRcdFx0XHRcdFx0XHQkKHdpbmRvdykudHJpZ2dlcigncm91dGVDaGFuZ2VkJywgbmV3Um91dGUpXHJcblx0XHRcdFx0XHRcdFx0XHR2YXIgY29uZmlnID0gJC5leHRlbmQoeyRwYXJhbXM6IHBhcmFtc30sIHJvdXRlLm9wdGlvbnMpXHRcclxuXHRcdFx0XHRcdFx0XHRcdHZhciBodG1sID0gJChgPGRpdiBibi1jb250cm9sPVwiJHtyb3V0ZS5jb250cm9sfVwiIGJuLW9wdGlvbnM9XCJjb25maWdcIiBjbGFzcz1cImJuLWZsZXgtY29sIGJuLWZsZXgtMVwiPjwvZGl2PmApXHJcblx0XHRcdFx0XHRcdFx0XHRlbHQuZGlzcG9zZSgpLmh0bWwoaHRtbClcclxuXHRcdFx0XHRcdFx0XHRcdGh0bWwucHJvY2Vzc1VJKHtjb25maWc6IGNvbmZpZ30pXHRcdFxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHRlbHNlIGlmIChpbmZvLnByZXZSb3V0ZSkge1xyXG5cdFx0XHRcdFx0XHRcdFx0aGlzdG9yeS5yZXBsYWNlU3RhdGUoe30sICcnLCAnIycgKyBpbmZvLnByZXZSb3V0ZSlcclxuXHRcdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0XHRcdC8vZWx0Lmh0bWwoaHRtbClcclxuXHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0cmV0dXJuIHRydWVcclxuXHRcdFx0XHRcdH1cdFxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gZmFsc2VcclxuXHJcblx0XHRcdH1cdFx0XHJcblxyXG5cdFx0XHQkKHdpbmRvdykub24oJ3JvdXRlQ2hhbmdlJywgZnVuY3Rpb24oZXYsIGluZm8pIHtcclxuXHRcdFx0XHRpZiAoIXByb2Nlc3NSb3V0ZShpbmZvKSkge1xyXG5cdFx0XHRcdFx0Y29uc29sZS53YXJuKGBbUm91dGVyQ29udHJvbF0gbm8gYWN0aW9uIGRlZmluZWQgZm9yIHJvdXRlICcke25ld1JvdXRlfSdgKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSlcclxuXHJcblxyXG5cdFx0fVxyXG5cclxuXHR9KVxyXG5cclxufSkoKTtcclxuXHJcblxyXG4iXX0=
