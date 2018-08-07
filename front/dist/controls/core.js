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

$$.registerControlEx('FriendsPanelControl', {

	deps: ['WebSocketService'],
	
	
	lib: 'core',
init: function(elt, options, client) {

		var ctrl = $$.viewController(elt, {
			template: "<div style=\"display: flex; flex-direction: column;\">\r\n	<h1>Friends</h1>\r\n	<div class=\"scrollPanel\">\r\n		<div bn-each=\"f of friends\">\r\n			<div class=\"item\">\r\n				<div class=\"name\">\r\n					<span bn-text=\"f.name\"></span>\r\n				</div>\r\n				<div bn-show=\"f.isConnected\" class=\"w3-text-green\">\r\n					<i class=\"fa fa-check\"></i>\r\n				</div>\r\n			</div>\r\n		</div>\r\n	</div>	\r\n</div>",
			data: {
				friends: []
			}
		})

		client.register('masterFriends', true, onFriends)

		function onFriends(msg) {
			console.log('onFriends', msg.data)
			ctrl.setData({friends: msg.data})
		}
	}
});


$$.registerControlEx('HeaderControl', {
	deps: ['WebSocketService', 'HttpService'],
	options: {
		title: 'Hello World',
		userName: 'unknown',
		isHomePage: false
	},
	
	lib: 'core',
init: function(elt, options, client, http) {

		var dlgCtrl = $$.dialogController('Notifications', {
			template: "\r\n<ul class=\"w3-ul w3-border w3-white\" bn-each=\"n of notifs\" bn-event=\"click.delete: onDelete\">\r\n	<li class=\"w3-bar\" bn-data=\"notif: n\">\r\n		<span class=\"w3-button w3-right delete\" title=\"Delete\"><i class=\"fa fa-times\"></i></span>\r\n\r\n		<div class=\"w3-bar-item\" bn-text=\"n.message\"></div>\r\n	</li>\r\n</ul>		\r\n",
			data: {notifs: []},
			options: {
				width: 'auto'
			},
			events: {
				onDelete: function() {
					var notif = $(this).closest('li').data('notif')
					//console.log('onDelete', notif)
					http.delete('/api/notif/' + notif.id)
				}
			}
		})

		var ctrl = $$.viewController(elt, {
			template: "<div >\r\n	<div class=\"brand\"><h1 class=\"bn-xs-hide\" bn-text=\"title\"></h1> </div>\r\n	<div class=\"infos\">\r\n		<button class=\"notification w3-btn\" title=\"notification\" bn-event=\"click: onNotification\">\r\n			<i class=\"fa fa-lg fa-bell w3-text-white\" ></i>\r\n			<span class=\"w3-badge w3-red w3-tiny\" bn-text=\"nbNotif\" bn-show=\"isNotifVisible\"></span>			\r\n		</button>\r\n\r\n	    <i bn-attr=\"title: titleState\" class=\"fa fa-lg connectionState\" bn-class=\"fa-eye: connected, fa-eye-slash: !connected\"></i>\r\n\r\n	    <div>\r\n		    <i class=\"fa fa-user fa-lg\"></i>\r\n		    <span bn-text=\"userName\" class=\"userName\"></span>	    	\r\n	    </div>\r\n\r\n	    <button title=\"logout\" class=\"w3-btn\" bn-event=\"click: onDisconnect\" bn-show=\"isHomePage\"><i class=\"fa fa-power-off fa-lg\"></i></button> \r\n\r\n	    <button title=\"home\" class=\"w3-btn\" bn-event=\"click: onGoHome\" bn-show=\"!isHomePage\"><i class=\"fa fa-home fa-lg\"></i></button> \r\n\r\n	</div>\r\n\r\n\r\n</div>",
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
				},

				onNotification: function() {
					console.log('onNotification')
					if (ctrl.model.nbNotif == 0) {
						$$.showAlert('no notifications', 'Notifications')
					}
					else {
						dlgCtrl.show()
					}
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
			//console.log('onNotifications', msg.data)
			ctrl.setData({nbNotif: msg.data.length})
			dlgCtrl.setData({notifs: msg.data})
			if (msg.data.length == 0) {
				dlgCtrl.hide()
			}
		}


	}

});



$$.registerControlEx('HomeControl', {
	deps: ['HttpService'],

	
	lib: 'core',
init: function(elt, options, http) {

		var ctrl = $$.viewController(elt, {
			template: "<div class=\"main\">\r\n\r\n\r\n	<strong>Available apps:</strong>\r\n	<div class=\"content\" bn-each=\"app of apps\">\r\n			<a bn-attr=\"class: app.className, href:app.href, title:app.desc\">\r\n				\r\n				<div class=\"bn-flex-col\" style=\"height: 100%; justify-content: center;\">\r\n					<div class=\"bn-flex-1 bn-flex-row\" style=\"align-items: center; justify-content: center;\" bn-show=\"app.hasTileIcon\">\r\n						<i bn-attr=\"class: app.tileIcon\"></i>\r\n					</div>\r\n\r\n					<span bn-text=\"app.tileName\"></span>\r\n				</div>\r\n\r\n			</a>\r\n	</div>\r\n\r\n\r\n</div>",
			data: {
				apps: []
				
			}

		})

		http.get('/api/app/webapps').then((appInfos) => {
			//console.log('appInfos', appInfos)

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

			//console.log('apps', apps)
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



//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNhcm91c2VsLmpzIiwiY2hlY2tncm91cC5qcyIsImVkaXRvci5qcyIsImZpbHRlcmVkLXRhYmxlLmpzIiwiZnJpZW5kcy5qcyIsImhlYWRlci5qcyIsImhvbWUuanMiLCJpbnB1dGdyb3VwLmpzIiwibmF2YmFyLmpzIiwicGljdHVyZWNhcm91c2VsLmpzIiwicmFkaW9ncm91cC5qcyIsInJvdXRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJjb3JlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCkge1xyXG5cclxuXHQkJC5yZWdpc3RlckNvbnRyb2xFeCgnQ2Fyb3VzZWxDb250cm9sJywge1xyXG5cclxuXHRcdHByb3BzOiB7XHJcblxyXG5cdFx0XHRpbmRleDoge1xyXG5cdFx0XHRcdHZhbDogMCxcclxuXHRcdFx0XHRzZXQ6ICdzZXRJbmRleCdcclxuXHRcdFx0fSBcclxuXHRcdH0sXHJcblx0XHRvcHRpb25zOiB7XHJcblx0XHRcdHdpZHRoOiAzMDAsXHJcblx0XHRcdGhlaWdodDogMjAwLFxyXG5cdFx0XHRhbmltYXRlRGVsYXk6IDEwMDAsXHJcblx0XHRcclxuXHRcdH0sXHJcblx0XHRpZmFjZTogJ3NldEluZGV4KGlkeCk7cmVmcmVzaCgpJyxcclxuXHJcblx0XHRcblx0bGliOiAnY29yZScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMpIHtcclxuXHRcclxuXHJcblxyXG5cdFx0XHR2YXIgd2lkdGggPSBvcHRpb25zLndpZHRoICsgJ3B4J1xyXG5cdFx0XHR2YXIgaGVpZ2h0ID0gb3B0aW9ucy5oZWlnaHQgKyAncHgnXHJcblx0XHRcdGVsdC5jc3MoJ3dpZHRoJywgd2lkdGgpLmNzcygnaGVpZ2h0JywgaGVpZ2h0KVxyXG5cclxuXHRcdFx0Y29uc29sZS5sb2coYFtDYXJvdXNlbENvbnRyb2xdIG9wdGlvbnNgLCBvcHRpb25zKVxyXG5cclxuXHRcdFx0dmFyIGN0cmwgPSBudWxsXHJcblx0XHRcdHZhciBpdGVtc1xyXG5cdFx0XHR2YXIgaWR4XHJcblxyXG5cclxuXHRcdFx0dGhpcy5yZWZyZXNoID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnW0Nhcm91c2VsQ29udHJvbF0gcmVmcmVzaCcpXHJcblx0XHRcdFx0aXRlbXMgPSBlbHQuY2hpbGRyZW4oJ2RpdicpLnJlbW92ZSgpLmNzcygnd2lkdGgnLCB3aWR0aCkuY3NzKCdoZWlnaHQnLCBoZWlnaHQpXHRcdFxyXG5cclxuXHRcdFx0XHRpZHggPSBNYXRoLm1heCgwLCBNYXRoLm1pbihvcHRpb25zLmluZGV4LCBpdGVtcy5sZW5ndGgpKVxyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coYFtDYXJvdXNlbENvbnRyb2xdIGlkeGAsIGlkeClcclxuXHJcblx0XHRcdFx0ZnVuY3Rpb24gYW5pbWF0ZShkaXJlY3Rpb24pIHtcclxuXHRcdFx0XHRcdGN0cmwuc2V0RGF0YSh7bGVmdERpc2FibGVkOiB0cnVlLCByaWdodERpc2FibGVkOiB0cnVlfSlcclxuXHRcdFx0XHRcdHZhciBvcCA9IGRpcmVjdGlvbiA9PSAnbGVmdCcgPyAnKz0nIDogJy09J1xyXG5cdFx0XHRcdFx0aWR4ID0gZGlyZWN0aW9uID09ICdsZWZ0JyA/IGlkeC0xIDogaWR4KzFcclxuXHJcblx0XHRcdFx0XHRjdHJsLnNjb3BlLml0ZW1zLmFuaW1hdGUoe2xlZnQ6IG9wICsgd2lkdGh9LCBvcHRpb25zLmFuaW1hdGVEZWxheSwgZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdGNoZWNrQnRucygpXHJcblx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0Y3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xyXG5cdFx0XHRcdFx0dGVtcGxhdGU6IFwiPGRpdiBjbGFzcz1cXFwiY29udGFpbmVyXFxcIj5cXHJcXG5cdDxkaXYgY2xhc3M9XFxcInZpZXdwb3J0XFxcIj5cXHJcXG5cdFx0PGRpdiBjbGFzcz1cXFwiaXRlbXNcXFwiIGJuLWJpbmQ9XFxcIml0ZW1zXFxcIj48L2Rpdj5cdFxcclxcblx0PC9kaXY+XFxyXFxuXHQ8ZGl2IGNsYXNzPVxcXCJvdmVybGF5XFxcIj5cXHJcXG5cdFx0PGRpdj5cXHJcXG5cdFx0XHQ8YnV0dG9uIFxcclxcblx0XHRcdFx0Ym4tZXZlbnQ9XFxcImNsaWNrOiBvbkxlZnRcXFwiIFxcclxcblx0XHRcdFx0Ym4tcHJvcD1cXFwiaGlkZGVuOiBsZWZ0RGlzYWJsZWRcXFwiXFxyXFxuXHRcdFx0XHQ+XFxyXFxuXHRcdFx0XHQ8aSBjbGFzcz1cXFwiZmEgZmEtMnggZmEtY2hldnJvbi1jaXJjbGUtbGVmdFxcXCI+PC9pPlxcclxcblx0XHRcdDwvYnV0dG9uPlx0XHRcdFxcclxcblx0XHQ8L2Rpdj5cXHJcXG5cXHJcXG5cdFx0PGRpdj5cXHJcXG5cdFx0XHQ8YnV0dG9uIFxcclxcblx0XHRcdFx0Ym4tZXZlbnQ9XFxcImNsaWNrOiBvblJpZ2h0XFxcIiBcXHJcXG5cdFx0XHRcdGJuLXByb3A9XFxcImhpZGRlbjogcmlnaHREaXNhYmxlZFxcXCJcXHJcXG5cdFx0XHQ+XFxyXFxuXHRcdFx0XHQ8aSBjbGFzcz1cXFwiZmEgZmEtMnggZmEtY2hldnJvbi1jaXJjbGUtcmlnaHRcXFwiPjwvaT5cXHJcXG5cdFx0XHQ8L2J1dHRvbj5cdFx0XHRcXHJcXG5cdFx0PC9kaXY+XFxyXFxuXFxyXFxuXHQ8L2Rpdj5cXHJcXG5cXHJcXG48L2Rpdj5cIixcclxuXHRcdFx0XHRcdGRhdGE6IHtcclxuXHRcdFx0XHRcdFx0bGVmdERpc2FibGVkOiB0cnVlLFxyXG5cdFx0XHRcdFx0XHRyaWdodERpc2FibGVkOiBmYWxzZVxyXG5cdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdGluaXQ6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHR0aGlzLnNjb3BlLml0ZW1zLmFwcGVuZChpdGVtcylcclxuXHRcdFx0XHRcdFx0dGhpcy5zY29wZS5pdGVtcy5jc3MoJ2xlZnQnLCAoLWlkeCAqIG9wdGlvbnMud2lkdGgpICsgJ3B4JylcclxuXHRcdFx0XHRcdFx0Ly9jaGVja0J0bnMoKVxyXG5cdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdGV2ZW50czoge1xyXG5cdFx0XHRcdFx0XHRvbkxlZnQ6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRcdGFuaW1hdGUoJ2xlZnQnKVxyXG5cdFx0XHRcdFx0XHR9LFxyXG5cdFx0XHRcdFx0XHRvblJpZ2h0OiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0XHRhbmltYXRlKCdyaWdodCcpXHJcblx0XHRcdFx0XHRcdH1cdFx0XHRcdFxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0pXHJcblx0XHRcdFx0Y2hlY2tCdG5zKClcdFx0XHJcblxyXG5cdFx0XHR9XHRcdFxyXG5cclxuXHRcdFx0dGhpcy5zZXRJbmRleCA9IGZ1bmN0aW9uKGluZGV4KSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coJ1tDYXJvdXNlbENvbnRyb2xdIHNldEluZGV4JywgaW5kZXgpXHJcblx0XHRcdFx0aWR4ID0gIE1hdGgubWF4KDAsIE1hdGgubWluKGluZGV4LCBpdGVtcy5sZW5ndGgpKVxyXG5cdFx0XHRcdGN0cmwuc2NvcGUuaXRlbXMuY3NzKCdsZWZ0JywgKC1pZHggKiBvcHRpb25zLndpZHRoKSArICdweCcpXHJcblx0XHRcdFx0Y2hlY2tCdG5zKGlkeClcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0ZnVuY3Rpb24gY2hlY2tCdG5zKCkge1xyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ2NoZWNrQnRucycsIGlkeCwgaXRlbXMubGVuZ3RoKVxyXG5cdFx0XHRcdGN0cmwuc2V0RGF0YSh7XHJcblx0XHRcdFx0XHRsZWZ0RGlzYWJsZWQ6IGlkeCA9PSAwLFxyXG5cdFx0XHRcdFx0cmlnaHREaXNhYmxlZDogaWR4ID09IGl0ZW1zLmxlbmd0aCAtIDFcclxuXHRcdFx0XHR9KVxyXG5cdFx0XHR9XHRcdFxyXG5cclxuXHQgXHRcdHRoaXMucmVmcmVzaCgpXHJcblxyXG5cdFx0fVxyXG5cclxuXHR9KVxyXG5cclxufSkoKTtcclxuIiwiJCQucmVnaXN0ZXJDb250cm9sRXgoJ0NoZWNrR3JvdXBDb250cm9sJywge1xyXG5cdFxuXHRsaWI6ICdjb3JlJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCkge1xyXG5cclxuXHRcdGVsdC5vbignY2xpY2snLCAnaW5wdXRbdHlwZT1jaGVja2JveF0nLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0ZWx0LnRyaWdnZXIoJ2lucHV0JylcclxuXHRcdH0pXHJcblxyXG5cdFx0dGhpcy5nZXRWYWx1ZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHR2YXIgcmV0ID0gW11cclxuXHRcdFx0ZWx0LmZpbmQoJ2lucHV0W3R5cGU9Y2hlY2tib3hdOmNoZWNrZWQnKS5lYWNoKGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdHJldC5wdXNoKCQodGhpcykudmFsKCkpXHJcblx0XHRcdH0pXHRcclxuXHRcdFx0cmV0dXJuIHJldFx0XHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5zZXRWYWx1ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xyXG5cdFx0XHRcdGVsdC5maW5kKCdpbnB1dFt0eXBlPWNoZWNrYm94XScpLmVhY2goZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHQkKHRoaXMpLnByb3AoJ2NoZWNrZWQnLCB2YWx1ZS5pbmRleE9mKCQodGhpcykudmFsKCkpID49IDApXHJcblx0XHRcdFx0fSlcclxuXHRcdFx0fVx0XHRcclxuXHRcdH1cclxuXHJcblx0fVxyXG5cclxufSk7XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdIdG1sRWRpdG9yQ29udHJvbCcsIHtcclxuXHJcblx0aWZhY2U6ICdodG1sKCknLFxyXG5cclxuXHRcblx0bGliOiAnY29yZScsXG5pbml0OiBmdW5jdGlvbihlbHQpIHtcclxuXHJcblx0XHRlbHQuYWRkQ2xhc3MoJ2JuLWZsZXgtcm93JylcclxuXHJcblx0XHR2YXIgY21kQXJncyA9IHtcclxuXHRcdFx0J2ZvcmVDb2xvcic6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdHJldHVybiBjdHJsLm1vZGVsLmNvbG9yXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblxyXG5cdFx0dmFyIGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihlbHQsIHtcclxuXHRcdFx0dGVtcGxhdGU6IFwiPGRpdiBjbGFzcz1cXFwiYm4tZmxleC1jb2wgYm4tZmxleC0xXFxcIj5cXHJcXG5cXHJcXG5cdDxkaXYgYm4tZXZlbnQ9XFxcImNsaWNrLmNtZDogb25Db21tYW5kXFxcIj5cXHJcXG5cdFx0PGRpdiBibi1jb250cm9sPVxcXCJUb29sYmFyQ29udHJvbFxcXCI+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwiYm9sZFxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLWJvbGRcXFwiPjwvaT48L2J1dHRvbj5cXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJpdGFsaWNcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1pdGFsaWNcXFwiPjwvaT48L2J1dHRvbj5cXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJ1bmRlcmxpbmVcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS11bmRlcmxpbmVcXFwiPjwvaT48L2J1dHRvbj5cXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJzdHJpa2VUaHJvdWdoXFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtc3RyaWtldGhyb3VnaFxcXCI+PC9pPjwvYnV0dG9uPlxcclxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcImZvcmVDb2xvclxcXCIgYm4tbWVudT1cXFwiY29sb3JJdGVtc1xcXCIgYm4tZXZlbnQ9XFxcIm1lbnVDaGFuZ2U6IG9uQ29sb3JNZW51Q2hhbmdlXFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtcGVuY2lsXFxcIiBibi1zdHlsZT1cXFwiY29sb3I6IGNvbG9yXFxcIj48L2k+PC9idXR0b24+XFxyXFxuXHRcdDwvZGl2Plxcclxcblx0XHQ8ZGl2IGJuLWNvbnRyb2w9XFxcIlRvb2xiYXJDb250cm9sXFxcIj5cXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJqdXN0aWZ5TGVmdFxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLWFsaWduLWxlZnRcXFwiPjwvaT48L2J1dHRvbj5cXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJqdXN0aWZ5Q2VudGVyXFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtYWxpZ24tY2VudGVyXFxcIj48L2k+PC9idXR0b24+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwianVzdGlmeVJpZ2h0XFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtYWxpZ24tcmlnaHRcXFwiPjwvaT48L2J1dHRvbj5cXHJcXG5cdFx0PC9kaXY+XHRcXHJcXG5cdFx0PGRpdiBibi1jb250cm9sPVxcXCJUb29sYmFyQ29udHJvbFxcXCI+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwiaW5kZW50XFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtaW5kZW50XFxcIj48L2k+PC9idXR0b24+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwib3V0ZGVudFxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLW91dGRlbnRcXFwiPjwvaT48L2J1dHRvbj5cXHJcXG5cdFx0PC9kaXY+XHRcXHJcXG5cdFx0PGRpdiBibi1jb250cm9sPVxcXCJUb29sYmFyQ29udHJvbFxcXCI+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwiaW5zZXJ0SG9yaXpvbnRhbFJ1bGVcXFwiPmhyPC9idXR0b24+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwiZm9ybWF0QmxvY2tcXFwiIGRhdGEtY21kLWFyZz1cXFwiaDFcXFwiPmgxPC9idXR0b24+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwiZm9ybWF0QmxvY2tcXFwiIGRhdGEtY21kLWFyZz1cXFwiaDJcXFwiPmgyPC9idXR0b24+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwiZm9ybWF0QmxvY2tcXFwiIGRhdGEtY21kLWFyZz1cXFwiaDNcXFwiPmgzPC9idXR0b24+XFxyXFxuXHRcdDwvZGl2Plx0XHRcXHJcXG5cdFx0PGRpdiBibi1jb250cm9sPVxcXCJUb29sYmFyQ29udHJvbFxcXCI+XFxyXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwiaW5zZXJ0VW5vcmRlcmVkTGlzdFxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLWxpc3QtdWxcXFwiPjwvaT48L2J1dHRvbj5cXHJcXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJpbnNlcnRPcmRlcmVkTGlzdFxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLWxpc3Qtb2xcXFwiPjwvaT48L2J1dHRvbj5cXHJcXG5cdFx0PC9kaXY+XFxyXFxuXFxyXFxuXHQ8L2Rpdj5cdFxcclxcblx0PGRpdiBjb250ZW50ZWRpdGFibGU9XFxcInRydWVcXFwiIGNsYXNzPVxcXCJibi1mbGV4LTEgZWRpdG9yXFxcIiBibi1iaW5kPVxcXCJlZGl0b3JcXFwiPjwvZGl2PlxcclxcbjwvZGl2PlxcclxcblwiLFxyXG5cdFx0XHRkYXRhOiB7XHJcblx0XHRcdFx0Y29sb3I6ICdibHVlJyxcclxuXHRcdFx0XHRjb2xvckl0ZW1zOiB7XHJcblx0XHRcdFx0XHRibGFjazoge25hbWU6ICdCbGFjayd9LFxyXG5cdFx0XHRcdFx0cmVkOiB7bmFtZTogJ1JlZCd9LFxyXG5cdFx0XHRcdFx0Z3JlZW46IHtuYW1lOiAnR3JlZW4nfSxcclxuXHRcdFx0XHRcdGJsdWU6IHtuYW1lOiAnQmx1ZSd9LFxyXG5cdFx0XHRcdFx0eWVsbG93OiB7bmFtZTogJ1llbGxvdyd9LFxyXG5cdFx0XHRcdFx0Y3lhbjoge25hbWU6ICdDeWFuJ30sXHJcblx0XHRcdFx0XHRtYWdlbnRhOiB7bmFtZTogJ01hZ2VudGEnfVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSxcclxuXHRcdFx0ZXZlbnRzOiB7XHJcblx0XHRcdFx0b25Db21tYW5kOiBmdW5jdGlvbigpIHtcclxuXHJcblx0XHRcdFx0XHR2YXIgY21kID0gJCh0aGlzKS5kYXRhKCdjbWQnKVxyXG5cdFx0XHRcdFx0dmFyIGNtZEFyZyA9ICQodGhpcykuZGF0YSgnY21kQXJnJylcclxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ29uQ29tbWFuZCcsIGNtZCwgY21kQXJnKVxyXG5cclxuXHRcdFx0XHRcdHZhciBjbWRBcmcgPSBjbWRBcmcgfHwgY21kQXJnc1tjbWRdXHJcblx0XHRcdFx0XHRpZiAodHlwZW9mIGNtZEFyZyA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0XHRcdGNtZEFyZyA9IGNtZEFyZygpXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvbkNvbW1hbmQnLCBjbWQsIGNtZEFyZylcclxuXHJcblx0XHRcdFx0XHRkb2N1bWVudC5leGVjQ29tbWFuZChjbWQsIGZhbHNlLCBjbWRBcmcpXHJcblx0XHRcdFx0XHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRvbkNvbG9yTWVudUNoYW5nZTogZnVuY3Rpb24oZXYsIGNvbG9yKSB7XHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvbkNvbG9yTWVudUNoYW5nZScsIGNvbG9yKVxyXG5cdFx0XHRcdFx0Y3RybC5zZXREYXRhKHtjb2xvcn0pXHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0fVxyXG5cclxuXHRcdH0pXHJcblxyXG5cdFx0dGhpcy5odG1sID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdHJldHVybiBjdHJsLnNjb3BlLmVkaXRvci5odG1sKClcclxuXHRcdH1cclxuXHJcblxyXG5cdH1cclxuXHJcbn0pO1xyXG4iLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdGZ1bmN0aW9uIGdldFRlbXBsYXRlKGhlYWRlcnMpIHtcclxuXHRcdHJldHVybiBgXHJcblx0XHRcdDxkaXYgY2xhc3M9XCJzY3JvbGxQYW5lbFwiPlxyXG5cdCAgICAgICAgICAgIDx0YWJsZSBjbGFzcz1cInczLXRhYmxlLWFsbCB3My1zbWFsbFwiPlxyXG5cdCAgICAgICAgICAgICAgICA8dGhlYWQ+XHJcblx0ICAgICAgICAgICAgICAgICAgICA8dHIgY2xhc3M9XCJ3My1ncmVlblwiPlxyXG5cdCAgICAgICAgICAgICAgICAgICAgXHQke2hlYWRlcnN9XHJcblx0ICAgICAgICAgICAgICAgICAgICA8L3RyPlxyXG5cdCAgICAgICAgICAgICAgICA8L3RoZWFkPlxyXG5cdCAgICAgICAgICAgICAgICA8dGJvZHk+PC90Ym9keT5cclxuXHQgICAgICAgICAgICA8L3RhYmxlPlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuXHRcdGBcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGdldEl0ZW1UZW1wbGF0ZShyb3dzKSB7XHJcblx0XHRyZXR1cm4gYFxyXG4gICAgICAgICAgICA8dHIgY2xhc3M9XCJpdGVtXCIgYm4tYXR0cj1cImRhdGEtaWQ6IF9pZFwiPlxyXG4gICAgICAgICAgICBcdCR7cm93c31cclxuICAgICAgICAgICAgPC90cj5cdFxyXG5cdFx0YFxyXG5cdH1cclxuXHJcblxyXG5cclxuXHQkJC5yZWdpc3RlckNvbnRyb2xFeCgnRmlsdGVyZWRUYWJsZUNvbnRyb2wnLCB7XHJcblxyXG5cdFx0aWZhY2U6IGBhZGRJdGVtKGlkLCBkYXRhKTtyZW1vdmVJdGVtKGlkKTtyZW1vdmVBbGxJdGVtcygpO2dldEl0ZW0oaWQpO3NldEZpbHRlcnMoZmlsdGVycyk7Z2V0RGF0YXMoKTtnZXREaXNwbGF5ZWREYXRhcygpO29uKGV2ZW50LCBjYWxsYmFjaylgLFxyXG5cdFx0ZXZlbnRzOiAnaXRlbUFjdGlvbicsXHJcblxyXG5cdFx0XG5cdGxpYjogJ2NvcmUnLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zKSB7XHJcblxyXG5cdFx0XHRjb25zb2xlLmxvZygnb3B0aW9ucycsIG9wdGlvbnMpXHJcblxyXG5cdFx0XHR2YXIgY29sdW1ucyA9ICAkJC5vYmoyQXJyYXkob3B0aW9ucy5jb2x1bW5zKVxyXG5cdFx0XHR2YXIgYWN0aW9ucyA9ICQkLm9iajJBcnJheShvcHRpb25zLmFjdGlvbnMpXHJcblx0XHRcdHZhciBoZWFkZXJzID0gY29sdW1ucy5tYXAoKGNvbHVtbikgPT4gYDx0aD4ke2NvbHVtbi52YWx1ZX08L3RoPmApXHRcdFxyXG5cdFx0XHR2YXIgcm93cyA9IGNvbHVtbnMubWFwKChjb2x1bW4pID0+IGA8dGQgYm4taHRtbD1cIiR7Y29sdW1uLmtleX1cIj48L3RkPmApXHJcblx0XHRcdGlmIChhY3Rpb25zLmxlbmd0aCA+IDApIHtcclxuXHRcdFx0XHRoZWFkZXJzLnB1c2goYDx0aD5BY3Rpb248L3RoPmApXHJcblxyXG5cdFx0XHRcdHZhciBidXR0b25zID0gYWN0aW9ucy5tYXAoKGFjdGlvbikgPT4gYDxidXR0b24gZGF0YS1hY3Rpb249XCIke2FjdGlvbi5rZXl9XCIgY2xhc3M9XCJ3My1idXR0b25cIj48aSBjbGFzcz1cIiR7YWN0aW9uLnZhbHVlfVwiPjwvaT48L2J1dHRvbj5gKVxyXG5cdFx0XHRcdHJvd3MucHVzaChgPHRkPiR7YnV0dG9ucy5qb2luKCcnKX08L3RkPmApXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8vY29uc29sZS5sb2coJ3Jvd3MnLCByb3dzKVxyXG5cdFx0XHR2YXIgaXRlbVRlbXBsYXRlID0gZ2V0SXRlbVRlbXBsYXRlKHJvd3Muam9pbignJykpXHJcblx0XHRcdC8vY29uc29sZS5sb2coJ2l0ZW1UZW1wbGF0ZScsIGl0ZW1UZW1wbGF0ZSlcclxuXHJcblx0XHRcdGVsdC5hcHBlbmQoZ2V0VGVtcGxhdGUoaGVhZGVycy5qb2luKCcnKSkpXHJcblx0XHRcdGVsdC5hZGRDbGFzcygnYm4tZmxleC1jb2wnKVxyXG5cclxuXHRcdFx0bGV0IGRhdGFzID0ge31cclxuXHRcdFx0bGV0IGV2ZW50cyA9IG5ldyBFdmVudEVtaXR0ZXIyKClcclxuXHRcdFx0bGV0IF9maWx0ZXJzID0ge31cclxuXHRcdFx0bGV0IGRpc3BsYXllZEl0ZW1zID0ge31cclxuXHJcblx0XHRcdGNvbnN0IHRib2R5ID0gZWx0LmZpbmQoJ3Rib2R5JylcclxuXHRcdFx0dGJvZHkub24oJ2NsaWNrJywgJ1tkYXRhLWFjdGlvbl0nLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHR2YXIgaWQgPSAkKHRoaXMpLmNsb3Nlc3QoJy5pdGVtJykuZGF0YSgnaWQnKVxyXG5cdFx0XHRcdHZhciBhY3Rpb24gPSAkKHRoaXMpLmRhdGEoJ2FjdGlvbicpXHJcblx0XHRcdFx0Y29uc29sZS5sb2coJ2NsaWNrJywgaWQsICdhY3Rpb24nLCBhY3Rpb24pXHJcblx0XHRcdFx0ZXZlbnRzLmVtaXQoJ2l0ZW1BY3Rpb24nLCBhY3Rpb24sIGlkKVxyXG5cdFx0XHR9KVxyXG5cclxuXHRcdFx0dGhpcy5hZGRJdGVtID0gZnVuY3Rpb24oaWQsIGRhdGEpIHtcclxuXHJcblx0XHRcdFx0dmFyIGl0ZW1EYXRhID0gJC5leHRlbmQoeydfaWQnOiBpZH0sIGRhdGEpXHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnYWRkSXRlbScsIGl0ZW1EYXRhKVxyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdGlmIChkYXRhc1tpZF0gIT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0XHR2YXIgaXRlbSA9IGRpc3BsYXllZEl0ZW1zW2lkXVxyXG5cdFx0XHRcdFx0aWYgKGl0ZW0gIT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0XHRcdGl0ZW0uZWx0LnVwZGF0ZVRlbXBsYXRlKGl0ZW0uY3R4LCBpdGVtRGF0YSlcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZWxzZSBpZiAoaXNJbkZpbHRlcihkYXRhKSl7XHJcblx0XHRcdFx0XHR2YXIgZWx0ID0gJChpdGVtVGVtcGxhdGUpXHJcblx0XHRcdFx0XHR2YXIgY3R4ID0gZWx0LnByb2Nlc3NUZW1wbGF0ZShpdGVtRGF0YSlcclxuXHRcdFx0XHRcdGRpc3BsYXllZEl0ZW1zW2lkXSA9IHtlbHQsIGN0eH1cclxuXHRcdFx0XHRcdHRib2R5LmFwcGVuZChlbHQpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGRhdGFzW2lkXSA9IGRhdGFcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dGhpcy5yZW1vdmVJdGVtID0gZnVuY3Rpb24oaWQpIHtcclxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdyZW1vdmVJdGVtJywgaWQpXHJcblx0XHRcdFx0aWYgKGRhdGFzW2lkXSAhPSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRcdGRlbGV0ZSBkYXRhc1tpZF1cclxuXHRcdFx0XHRcdHZhciBpdGVtID0gZGlzcGxheWVkSXRlbXNbaWRdXHJcblx0XHRcdFx0XHRpZiAoaXRlbSAhPSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRcdFx0aXRlbS5lbHQucmVtb3ZlKClcclxuXHRcdFx0XHRcdFx0ZGVsZXRlIGRpc3BsYXllZEl0ZW1zW2lkXVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cdFx0XHRcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dGhpcy5nZXRJdGVtID0gZnVuY3Rpb24oaWQpIHtcclxuXHRcdFx0XHRyZXR1cm4gZGF0YXNbaWRdXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHRoaXMucmVtb3ZlQWxsSXRlbXMgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdyZW1vdmVBbGxJdGVtcycpXHJcblx0XHRcdFx0ZGF0YXMgPSB7fVxyXG5cdFx0XHRcdGRpc3BsYXllZEl0ZW1zID0ge31cclxuXHRcdFx0XHR0Ym9keS5lbXB0eSgpXHRcdFxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmdW5jdGlvbiBpc0luRmlsdGVyKGRhdGEpIHtcclxuXHRcdFx0XHR2YXIgcmV0ID0gdHJ1ZVxyXG5cdFx0XHRcdGZvcih2YXIgZiBpbiBfZmlsdGVycykge1xyXG5cdFx0XHRcdFx0dmFyIHZhbHVlID0gZGF0YVtmXVxyXG5cdFx0XHRcdFx0dmFyIGZpbHRlclZhbHVlID0gX2ZpbHRlcnNbZl1cclxuXHRcdFx0XHRcdHJldCAmPSAoZmlsdGVyVmFsdWUgPT0gJycgfHwgdmFsdWUuc3RhcnRzV2l0aChmaWx0ZXJWYWx1ZSkpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiByZXRcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dGhpcy5zZXRGaWx0ZXJzID0gZnVuY3Rpb24oZmlsdGVycykge1xyXG5cdFx0XHRcdF9maWx0ZXJzID0gZmlsdGVyc1xyXG5cdFx0XHRcdGRpc3BUYWJsZSgpXHJcblx0XHRcdH1cclxuXHJcblxyXG5cdFx0XHRmdW5jdGlvbiBkaXNwVGFibGUoKSB7XHJcblx0XHRcdFx0ZGlzcGxheWVkSXRlbXMgPSB7fVxyXG5cdFx0XHRcdGxldCBpdGVtcyA9IFtdXHJcblx0XHRcdFx0Zm9yKGxldCBpZCBpbiBkYXRhcykge1xyXG5cdFx0XHRcdFx0dmFyIGRhdGEgPSBkYXRhc1tpZF1cclxuXHRcdFx0XHRcdGlmIChpc0luRmlsdGVyKGRhdGEpKSB7XHJcblx0XHRcdFx0XHRcdHZhciBpdGVtRGF0YSA9ICQuZXh0ZW5kKHsnX2lkJzogaWR9LCBkYXRhKVxyXG5cdFx0XHRcdFx0XHR2YXIgZWx0ID0gJChpdGVtVGVtcGxhdGUpXHJcblx0XHRcdFx0XHRcdHZhciBjdHggPSBlbHQucHJvY2Vzc1RlbXBsYXRlKGl0ZW1EYXRhKVx0XHRcdFxyXG5cdFx0XHRcdFx0XHRpdGVtcy5wdXNoKGVsdClcclxuXHRcdFx0XHRcdFx0ZGlzcGxheWVkSXRlbXNbaWRdID0ge2VsdCwgY3R4fVxyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0XHJcblx0XHRcdFx0XHJcblx0XHRcdFx0dGJvZHkuZW1wdHkoKS5hcHBlbmQoaXRlbXMpXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHRoaXMuZ2V0RGF0YXMgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRyZXR1cm4gZGF0YXNcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dGhpcy5nZXREaXNwbGF5ZWREYXRhcyA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdHZhciByZXQgPSB7fVxyXG5cdFx0XHRcdGZvcihsZXQgaSBpbiBkaXNwbGF5ZWRJdGVtcykge1xyXG5cdFx0XHRcdFx0cmV0W2ldID0gZGF0YXNbaV1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIHJldFxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0aGlzLm9uID0gZXZlbnRzLm9uLmJpbmQoZXZlbnRzKVxyXG5cclxuXHJcblx0XHR9XHJcblx0fSlcclxuXHJcbn0pKCk7XHJcbiIsIiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdGcmllbmRzUGFuZWxDb250cm9sJywge1xyXG5cclxuXHRkZXBzOiBbJ1dlYlNvY2tldFNlcnZpY2UnXSxcclxuXHRcclxuXHRcblx0bGliOiAnY29yZScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMsIGNsaWVudCkge1xyXG5cclxuXHRcdHZhciBjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoZWx0LCB7XHJcblx0XHRcdHRlbXBsYXRlOiBcIjxkaXYgc3R5bGU9XFxcImRpc3BsYXk6IGZsZXg7IGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XFxcIj5cXHJcXG5cdDxoMT5GcmllbmRzPC9oMT5cXHJcXG5cdDxkaXYgY2xhc3M9XFxcInNjcm9sbFBhbmVsXFxcIj5cXHJcXG5cdFx0PGRpdiBibi1lYWNoPVxcXCJmIG9mIGZyaWVuZHNcXFwiPlxcclxcblx0XHRcdDxkaXYgY2xhc3M9XFxcIml0ZW1cXFwiPlxcclxcblx0XHRcdFx0PGRpdiBjbGFzcz1cXFwibmFtZVxcXCI+XFxyXFxuXHRcdFx0XHRcdDxzcGFuIGJuLXRleHQ9XFxcImYubmFtZVxcXCI+PC9zcGFuPlxcclxcblx0XHRcdFx0PC9kaXY+XFxyXFxuXHRcdFx0XHQ8ZGl2IGJuLXNob3c9XFxcImYuaXNDb25uZWN0ZWRcXFwiIGNsYXNzPVxcXCJ3My10ZXh0LWdyZWVuXFxcIj5cXHJcXG5cdFx0XHRcdFx0PGkgY2xhc3M9XFxcImZhIGZhLWNoZWNrXFxcIj48L2k+XFxyXFxuXHRcdFx0XHQ8L2Rpdj5cXHJcXG5cdFx0XHQ8L2Rpdj5cXHJcXG5cdFx0PC9kaXY+XFxyXFxuXHQ8L2Rpdj5cdFxcclxcbjwvZGl2PlwiLFxyXG5cdFx0XHRkYXRhOiB7XHJcblx0XHRcdFx0ZnJpZW5kczogW11cclxuXHRcdFx0fVxyXG5cdFx0fSlcclxuXHJcblx0XHRjbGllbnQucmVnaXN0ZXIoJ21hc3RlckZyaWVuZHMnLCB0cnVlLCBvbkZyaWVuZHMpXHJcblxyXG5cdFx0ZnVuY3Rpb24gb25GcmllbmRzKG1zZykge1xyXG5cdFx0XHRjb25zb2xlLmxvZygnb25GcmllbmRzJywgbXNnLmRhdGEpXHJcblx0XHRcdGN0cmwuc2V0RGF0YSh7ZnJpZW5kczogbXNnLmRhdGF9KVxyXG5cdFx0fVxyXG5cdH1cclxufSk7XHJcbiIsIlxyXG4kJC5yZWdpc3RlckNvbnRyb2xFeCgnSGVhZGVyQ29udHJvbCcsIHtcclxuXHRkZXBzOiBbJ1dlYlNvY2tldFNlcnZpY2UnLCAnSHR0cFNlcnZpY2UnXSxcclxuXHRvcHRpb25zOiB7XHJcblx0XHR0aXRsZTogJ0hlbGxvIFdvcmxkJyxcclxuXHRcdHVzZXJOYW1lOiAndW5rbm93bicsXHJcblx0XHRpc0hvbWVQYWdlOiBmYWxzZVxyXG5cdH0sXHJcblx0XG5cdGxpYjogJ2NvcmUnLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zLCBjbGllbnQsIGh0dHApIHtcclxuXHJcblx0XHR2YXIgZGxnQ3RybCA9ICQkLmRpYWxvZ0NvbnRyb2xsZXIoJ05vdGlmaWNhdGlvbnMnLCB7XHJcblx0XHRcdHRlbXBsYXRlOiBcIlxcclxcbjx1bCBjbGFzcz1cXFwidzMtdWwgdzMtYm9yZGVyIHczLXdoaXRlXFxcIiBibi1lYWNoPVxcXCJuIG9mIG5vdGlmc1xcXCIgYm4tZXZlbnQ9XFxcImNsaWNrLmRlbGV0ZTogb25EZWxldGVcXFwiPlxcclxcblx0PGxpIGNsYXNzPVxcXCJ3My1iYXJcXFwiIGJuLWRhdGE9XFxcIm5vdGlmOiBuXFxcIj5cXHJcXG5cdFx0PHNwYW4gY2xhc3M9XFxcInczLWJ1dHRvbiB3My1yaWdodCBkZWxldGVcXFwiIHRpdGxlPVxcXCJEZWxldGVcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS10aW1lc1xcXCI+PC9pPjwvc3Bhbj5cXHJcXG5cXHJcXG5cdFx0PGRpdiBjbGFzcz1cXFwidzMtYmFyLWl0ZW1cXFwiIGJuLXRleHQ9XFxcIm4ubWVzc2FnZVxcXCI+PC9kaXY+XFxyXFxuXHQ8L2xpPlxcclxcbjwvdWw+XHRcdFxcclxcblwiLFxyXG5cdFx0XHRkYXRhOiB7bm90aWZzOiBbXX0sXHJcblx0XHRcdG9wdGlvbnM6IHtcclxuXHRcdFx0XHR3aWR0aDogJ2F1dG8nXHJcblx0XHRcdH0sXHJcblx0XHRcdGV2ZW50czoge1xyXG5cdFx0XHRcdG9uRGVsZXRlOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdHZhciBub3RpZiA9ICQodGhpcykuY2xvc2VzdCgnbGknKS5kYXRhKCdub3RpZicpXHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvbkRlbGV0ZScsIG5vdGlmKVxyXG5cdFx0XHRcdFx0aHR0cC5kZWxldGUoJy9hcGkvbm90aWYvJyArIG5vdGlmLmlkKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fSlcclxuXHJcblx0XHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xyXG5cdFx0XHR0ZW1wbGF0ZTogXCI8ZGl2ID5cXHJcXG5cdDxkaXYgY2xhc3M9XFxcImJyYW5kXFxcIj48aDEgY2xhc3M9XFxcImJuLXhzLWhpZGVcXFwiIGJuLXRleHQ9XFxcInRpdGxlXFxcIj48L2gxPiA8L2Rpdj5cXHJcXG5cdDxkaXYgY2xhc3M9XFxcImluZm9zXFxcIj5cXHJcXG5cdFx0PGJ1dHRvbiBjbGFzcz1cXFwibm90aWZpY2F0aW9uIHczLWJ0blxcXCIgdGl0bGU9XFxcIm5vdGlmaWNhdGlvblxcXCIgYm4tZXZlbnQ9XFxcImNsaWNrOiBvbk5vdGlmaWNhdGlvblxcXCI+XFxyXFxuXHRcdFx0PGkgY2xhc3M9XFxcImZhIGZhLWxnIGZhLWJlbGwgdzMtdGV4dC13aGl0ZVxcXCIgPjwvaT5cXHJcXG5cdFx0XHQ8c3BhbiBjbGFzcz1cXFwidzMtYmFkZ2UgdzMtcmVkIHczLXRpbnlcXFwiIGJuLXRleHQ9XFxcIm5iTm90aWZcXFwiIGJuLXNob3c9XFxcImlzTm90aWZWaXNpYmxlXFxcIj48L3NwYW4+XHRcdFx0XFxyXFxuXHRcdDwvYnV0dG9uPlxcclxcblxcclxcblx0ICAgIDxpIGJuLWF0dHI9XFxcInRpdGxlOiB0aXRsZVN0YXRlXFxcIiBjbGFzcz1cXFwiZmEgZmEtbGcgY29ubmVjdGlvblN0YXRlXFxcIiBibi1jbGFzcz1cXFwiZmEtZXllOiBjb25uZWN0ZWQsIGZhLWV5ZS1zbGFzaDogIWNvbm5lY3RlZFxcXCI+PC9pPlxcclxcblxcclxcblx0ICAgIDxkaXY+XFxyXFxuXHRcdCAgICA8aSBjbGFzcz1cXFwiZmEgZmEtdXNlciBmYS1sZ1xcXCI+PC9pPlxcclxcblx0XHQgICAgPHNwYW4gYm4tdGV4dD1cXFwidXNlck5hbWVcXFwiIGNsYXNzPVxcXCJ1c2VyTmFtZVxcXCI+PC9zcGFuPlx0ICAgIFx0XFxyXFxuXHQgICAgPC9kaXY+XFxyXFxuXFxyXFxuXHQgICAgPGJ1dHRvbiB0aXRsZT1cXFwibG9nb3V0XFxcIiBjbGFzcz1cXFwidzMtYnRuXFxcIiBibi1ldmVudD1cXFwiY2xpY2s6IG9uRGlzY29ubmVjdFxcXCIgYm4tc2hvdz1cXFwiaXNIb21lUGFnZVxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLXBvd2VyLW9mZiBmYS1sZ1xcXCI+PC9pPjwvYnV0dG9uPiBcXHJcXG5cXHJcXG5cdCAgICA8YnV0dG9uIHRpdGxlPVxcXCJob21lXFxcIiBjbGFzcz1cXFwidzMtYnRuXFxcIiBibi1ldmVudD1cXFwiY2xpY2s6IG9uR29Ib21lXFxcIiBibi1zaG93PVxcXCIhaXNIb21lUGFnZVxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLWhvbWUgZmEtbGdcXFwiPjwvaT48L2J1dHRvbj4gXFxyXFxuXFxyXFxuXHQ8L2Rpdj5cXHJcXG5cXHJcXG5cXHJcXG48L2Rpdj5cIixcclxuXHRcdFx0ZGF0YToge1xyXG5cdFx0XHRcdGNvbm5lY3RlZDogZmFsc2UsXHJcblx0XHRcdFx0dGl0bGVTdGF0ZTogXCJXZWJTb2NrZXQgZGlzY29ubmVjdGVkXCIsXHJcblx0XHRcdFx0dGl0bGU6IG9wdGlvbnMudGl0bGUsXHJcblx0XHRcdFx0dXNlck5hbWU6IG9wdGlvbnMudXNlck5hbWUsXHJcblx0XHRcdFx0aXNIb21lUGFnZTogb3B0aW9ucy5pc0hvbWVQYWdlLFxyXG5cdFx0XHRcdG5iTm90aWY6IDAsXHJcblx0XHRcdFx0XHJcblx0XHRcdFx0aXNOb3RpZlZpc2libGU6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMubmJOb3RpZiA+IDBcclxuXHRcdFx0XHR9XHRcdFx0XHRcclxuXHRcdFx0fSxcclxuXHRcdFx0ZXZlbnRzOiB7XHJcblx0XHRcdFx0b25Hb0hvbWU6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0bG9jYXRpb24uaHJlZiA9ICcvJ1xyXG5cdFx0XHRcdH0sXHJcblxyXG5cdFx0XHRcdG9uRGlzY29ubmVjdDogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRzZXNzaW9uU3RvcmFnZS5jbGVhcigpXHJcblx0XHRcdFx0XHRsb2NhdGlvbi5ocmVmID0gJy9kaXNjb25uZWN0J1xyXG5cdFx0XHRcdH0sXHJcblxyXG5cdFx0XHRcdG9uTm90aWZpY2F0aW9uOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCdvbk5vdGlmaWNhdGlvbicpXHJcblx0XHRcdFx0XHRpZiAoY3RybC5tb2RlbC5uYk5vdGlmID09IDApIHtcclxuXHRcdFx0XHRcdFx0JCQuc2hvd0FsZXJ0KCdubyBub3RpZmljYXRpb25zJywgJ05vdGlmaWNhdGlvbnMnKVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHRcdGRsZ0N0cmwuc2hvdygpXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9KVxyXG5cclxuXHJcblx0XHRjbGllbnQuZXZlbnRzLm9uKCdjb25uZWN0JywgZnVuY3Rpb24oKSB7XHJcblx0XHRcdGNvbnNvbGUubG9nKCdbSGVhZGVyQ29udHJvbF0gY2xpZW50IGNvbm5lY3RlZCcpXHJcblx0XHRcdGN0cmwuc2V0RGF0YSh7Y29ubmVjdGVkOiB0cnVlLCB0aXRsZVN0YXRlOiBcIldlYlNvY2tldCBjb25uZWN0ZWRcIn0pXHJcblxyXG5cdFx0fSlcclxuXHJcblx0XHRjbGllbnQuZXZlbnRzLm9uKCdkaXNjb25uZWN0JywgZnVuY3Rpb24oKSB7XHJcblx0XHRcdGNvbnNvbGUubG9nKCdbSGVhZGVyQ29udHJvbF0gY2xpZW50IGRpc2Nvbm5lY3RlZCcpXHJcblx0XHRcdGN0cmwuc2V0RGF0YSh7Y29ubmVjdGVkOiBmYWxzZSwgdGl0bGVTdGF0ZTogXCJXZWJTb2NrZXQgZGlzY29ubmVjdGVkXCJ9KVxyXG5cclxuXHRcdH0pXHJcblxyXG5cdFx0Y2xpZW50LnJlZ2lzdGVyKCdtYXN0ZXJOb3RpZmljYXRpb25zJywgdHJ1ZSwgb25Ob3RpZmljYXRpb25zKVxyXG5cclxuXHRcdGZ1bmN0aW9uIG9uTm90aWZpY2F0aW9ucyhtc2cpIHtcclxuXHRcdFx0Ly9jb25zb2xlLmxvZygnb25Ob3RpZmljYXRpb25zJywgbXNnLmRhdGEpXHJcblx0XHRcdGN0cmwuc2V0RGF0YSh7bmJOb3RpZjogbXNnLmRhdGEubGVuZ3RofSlcclxuXHRcdFx0ZGxnQ3RybC5zZXREYXRhKHtub3RpZnM6IG1zZy5kYXRhfSlcclxuXHRcdFx0aWYgKG1zZy5kYXRhLmxlbmd0aCA9PSAwKSB7XHJcblx0XHRcdFx0ZGxnQ3RybC5oaWRlKClcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHJcblx0fVxyXG5cclxufSk7XHJcblxyXG5cclxuIiwiJCQucmVnaXN0ZXJDb250cm9sRXgoJ0hvbWVDb250cm9sJywge1xyXG5cdGRlcHM6IFsnSHR0cFNlcnZpY2UnXSxcclxuXHJcblx0XG5cdGxpYjogJ2NvcmUnLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zLCBodHRwKSB7XHJcblxyXG5cdFx0dmFyIGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihlbHQsIHtcclxuXHRcdFx0dGVtcGxhdGU6IFwiPGRpdiBjbGFzcz1cXFwibWFpblxcXCI+XFxyXFxuXFxyXFxuXFxyXFxuXHQ8c3Ryb25nPkF2YWlsYWJsZSBhcHBzOjwvc3Ryb25nPlxcclxcblx0PGRpdiBjbGFzcz1cXFwiY29udGVudFxcXCIgYm4tZWFjaD1cXFwiYXBwIG9mIGFwcHNcXFwiPlxcclxcblx0XHRcdDxhIGJuLWF0dHI9XFxcImNsYXNzOiBhcHAuY2xhc3NOYW1lLCBocmVmOmFwcC5ocmVmLCB0aXRsZTphcHAuZGVzY1xcXCI+XFxyXFxuXHRcdFx0XHRcXHJcXG5cdFx0XHRcdDxkaXYgY2xhc3M9XFxcImJuLWZsZXgtY29sXFxcIiBzdHlsZT1cXFwiaGVpZ2h0OiAxMDAlOyBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcXFwiPlxcclxcblx0XHRcdFx0XHQ8ZGl2IGNsYXNzPVxcXCJibi1mbGV4LTEgYm4tZmxleC1yb3dcXFwiIHN0eWxlPVxcXCJhbGlnbi1pdGVtczogY2VudGVyOyBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcXFwiIGJuLXNob3c9XFxcImFwcC5oYXNUaWxlSWNvblxcXCI+XFxyXFxuXHRcdFx0XHRcdFx0PGkgYm4tYXR0cj1cXFwiY2xhc3M6IGFwcC50aWxlSWNvblxcXCI+PC9pPlxcclxcblx0XHRcdFx0XHQ8L2Rpdj5cXHJcXG5cXHJcXG5cdFx0XHRcdFx0PHNwYW4gYm4tdGV4dD1cXFwiYXBwLnRpbGVOYW1lXFxcIj48L3NwYW4+XFxyXFxuXHRcdFx0XHQ8L2Rpdj5cXHJcXG5cXHJcXG5cdFx0XHQ8L2E+XFxyXFxuXHQ8L2Rpdj5cXHJcXG5cXHJcXG5cXHJcXG48L2Rpdj5cIixcclxuXHRcdFx0ZGF0YToge1xyXG5cdFx0XHRcdGFwcHM6IFtdXHJcblx0XHRcdFx0XHJcblx0XHRcdH1cclxuXHJcblx0XHR9KVxyXG5cclxuXHRcdGh0dHAuZ2V0KCcvYXBpL2FwcC93ZWJhcHBzJykudGhlbigoYXBwSW5mb3MpID0+IHtcclxuXHRcdFx0Ly9jb25zb2xlLmxvZygnYXBwSW5mb3MnLCBhcHBJbmZvcylcclxuXHJcblx0XHRcdHZhciBhcHBzID0gW11cclxuXHJcblx0XHRcdGZvcih2YXIgayBpbiBhcHBJbmZvcykge1xyXG5cdFx0XHRcdHZhciBhcHBJbmZvID0gYXBwSW5mb3Nba11cclxuXHRcdFx0XHR2YXIgdGlsZU5hbWUgPSBrXHJcblx0XHRcdFx0dmFyIGRlc2MgPSAnJ1xyXG5cdFx0XHRcdHZhciB0aWxlQ29sb3IgPSAndzMtYmx1ZSdcclxuXHRcdFx0XHR2YXIgcHJvcHMgPSBhcHBJbmZvLnByb3BzXHJcblx0XHRcdFx0aWYgKHR5cGVvZiBwcm9wcy50aWxlTmFtZSA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdFx0dGlsZU5hbWUgPSBwcm9wcy50aWxlTmFtZVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAodHlwZW9mIHByb3BzLmRlc2MgPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0XHRcdGRlc2MgPSBwcm9wcy5kZXNjXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICh0eXBlb2YgcHJvcHMudGlsZUNvbG9yID09ICdzdHJpbmcnKSB7XHJcblx0XHRcdFx0XHR0aWxlQ29sb3IgPSBwcm9wcy50aWxlQ29sb3JcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dmFyIGNsYXNzTmFtZSA9IFwidzMtYnRuIGFwcEljb24gXCIgKyB0aWxlQ29sb3JcclxuXHRcdFx0XHR2YXIgaHJlZiA9IFwiL2FwcHMvXCIgKyBrXHJcblxyXG5cdFx0XHRcdGFwcHMucHVzaCh7XHJcblx0XHRcdFx0XHR0aWxlSWNvbjogcHJvcHMudGlsZUljb24sXHJcblx0XHRcdFx0XHR0aWxlQ29sb3IsXHJcblx0XHRcdFx0XHR0aWxlTmFtZSxcclxuXHRcdFx0XHRcdGRlc2MsXHJcblx0XHRcdFx0XHR0aWxlQ29sb3IsXHJcblx0XHRcdFx0XHRjbGFzc05hbWUsXHJcblx0XHRcdFx0XHRocmVmLFxyXG5cdFx0XHRcdFx0aGFzVGlsZUljb246IHByb3BzLnRpbGVJY29uICE9IHVuZGVmaW5lZFxyXG5cdFx0XHRcdH0pXHJcblxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdhcHBzJywgYXBwcylcclxuXHRcdFx0Y3RybC5zZXREYXRhKHthcHBzfSlcclxuXHRcdFx0XHJcblx0XHR9KVxyXG5cclxuXHR9XHJcblxyXG59KTtcclxuXHJcbiIsIlxyXG4kJC5yZWdpc3RlckNvbnRyb2xFeCgnSW5wdXRHcm91cENvbnRyb2wnLCB7XHJcblx0XG5cdGxpYjogJ2NvcmUnLFxuaW5pdDogZnVuY3Rpb24oZWx0KSB7XHJcblxyXG5cdFx0dmFyIGlkID0gZWx0LmNoaWxkcmVuKCdpbnB1dCcpLnVuaXF1ZUlkKCkuYXR0cignaWQnKVxyXG5cdFx0Ly9jb25zb2xlLmxvZygnW0lucHV0R3JvdXBDb250cm9sXSBpZCcsIGlkKVxyXG5cdFx0ZWx0LmNoaWxkcmVuKCdsYWJlbCcpLmF0dHIoJ2ZvcicsIGlkKVxyXG5cdH1cclxufSk7XHJcbiIsIihmdW5jdGlvbigpIHtcclxuXHJcblx0JCQucmVnaXN0ZXJDb250cm9sRXgoJ05hdmJhckNvbnRyb2wnLCB7XHJcblxyXG5cdFx0b3B0aW9uczoge1xyXG5cdFx0XHRhY3RpdmVDb2xvcjogJ3czLWdyZWVuJ1xyXG5cdFx0fSxcclxuXHJcblx0XHRcblx0bGliOiAnY29yZScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMpIHtcclxuXHJcblx0XHRcdHZhciBhY3RpdmVDb2xvciA9IG9wdGlvbnMuYWN0aXZlQ29sb3JcclxuXHJcblxyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdbTmF2YmFyQ29udHJvbF0gb3B0aW9ucycsIG9wdGlvbnMpXHJcblxyXG5cdFx0XHRlbHQuYWRkQ2xhc3MoJ3czLWJhcicpXHJcblx0XHRcdGVsdC5jaGlsZHJlbignYScpLmVhY2goZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0JCh0aGlzKS5hZGRDbGFzcygndzMtYmFyLWl0ZW0gdzMtYnV0dG9uJylcclxuXHRcdFx0fSlcclxuXHJcblx0XHRcdCQod2luZG93KS5vbigncm91dGVDaGFuZ2VkJywgZnVuY3Rpb24oZXZ0LCBuZXdSb3V0ZSkge1xyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ1tOYXZiYXJDb250cm9sXSByb3V0ZUNoYW5nZScsIG5ld1JvdXRlKVxyXG5cclxuXHRcdFx0XHRlbHQuY2hpbGRyZW4oYGEuJHthY3RpdmVDb2xvcn1gKS5yZW1vdmVDbGFzcyhhY3RpdmVDb2xvcilcdFxyXG5cdFx0XHRcdGVsdC5jaGlsZHJlbihgYVtocmVmPVwiIyR7bmV3Um91dGV9XCJdYCkuYWRkQ2xhc3MoYWN0aXZlQ29sb3IpXHJcblxyXG5cdFx0XHR9KVx0XHJcblx0XHR9XHJcblxyXG5cdH0pXHJcblxyXG5cclxufSkoKTtcclxuXHJcblxyXG4iLCIkJC5yZWdpc3RlckNvbnRyb2xFeCgnUGljdHVyZUNhcm91c2VsQ29udHJvbCcsIHtcclxuXHJcblx0cHJvcHM6IHtcclxuXHRcdGluZGV4OiB7dmFsOiAwLCBzZXQ6ICdzZXRJbmRleCd9LFxyXG5cdFx0aW1hZ2VzOiB7dmFsOiBbXSwgc2V0OiAnc2V0SW1hZ2VzJ31cclxuXHR9LFxyXG5cdG9wdGlvbnM6IHtcclxuXHRcdHdpZHRoOiAzMDAsXHJcblx0XHRoZWlnaHQ6IDIwMCxcclxuXHRcdGFuaW1hdGVEZWxheTogMTAwMCxcclxuXHRcdGNvbG9yOiAneWVsbG93J1xyXG5cdH0sXHRcclxuXHJcblx0aWZhY2U6ICdzZXRJbWFnZXMoaW1hZ2VzKTtzZXRJbmRleChpZHgpJyxcclxuXHJcblx0XG5cdGxpYjogJ2NvcmUnLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zKSB7XHJcblxyXG5cdFx0Y29uc29sZS5sb2coYFtQaWN0dXJlQ2Fyb3VzZWxDb250cm9sXSBvcHRpb25zYCwgb3B0aW9ucylcclxuXHJcblx0XHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xyXG5cdFx0XHR0ZW1wbGF0ZTogXCI8ZGl2IGJuLWNvbnRyb2w9XFxcIkNhcm91c2VsQ29udHJvbFxcXCIgYm4tb3B0aW9ucz1cXFwiY2Fyb3VzZWxDdHJsT3B0aW9uc1xcXCIgYm4tZWFjaD1cXFwiaSBvZiBpbWFnZXNcXFwiIGJuLWlmYWNlPVxcXCJjYXJvdXNlbEN0cmxcXFwiIGJuLWRhdGE9XFxcImluZGV4OiBpbmRleFxcXCI+XFxyXFxuXHQ8ZGl2IHN0eWxlPVxcXCJ0ZXh0LWFsaWduOiBjZW50ZXI7XFxcIiBibi1zdHlsZT1cXFwiYmFja2dyb3VuZC1jb2xvcjogYmFja0NvbG9yXFxcIj5cXHJcXG5cdFx0PGltZyBibi1hdHRyPVxcXCJzcmM6IGlcXFwiIHN0eWxlPVxcXCJoZWlnaHQ6IDEwMCVcXFwiPlxcclxcblx0PC9kaXY+XFxyXFxuPC9kaXY+XCIsXHJcblx0XHRcdGRhdGE6IHtcclxuXHRcdFx0XHRjYXJvdXNlbEN0cmxPcHRpb25zOiBvcHRpb25zLFxyXG5cdFx0XHRcdGltYWdlczogb3B0aW9ucy5pbWFnZXMsXHJcblx0XHRcdFx0YmFja0NvbG9yOiBvcHRpb25zLmNvbG9yLFxyXG5cdFx0XHRcdGluZGV4OiBvcHRpb25zLmluZGV4XHJcblx0XHRcdH1cclxuXHRcdH0pXHJcblxyXG5cdFx0dGhpcy5zZXRJbWFnZXMgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdbUGljdHVyZUNhcm91c2VsQ29udHJvbF0gc2V0SW1hZ2VzJywgdmFsdWUpXHJcblx0XHRcdGN0cmwuc2V0RGF0YSgnaW1hZ2VzJywgdmFsdWUpXHJcblx0XHRcdGN0cmwuc2NvcGUuY2Fyb3VzZWxDdHJsLnJlZnJlc2goKVx0XHRcdFxyXG5cdFx0fSxcclxuXHRcdHRoaXMuc2V0SW5kZXggPSBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRjdHJsLnNldERhdGEoJ2luZGV4JywgdmFsdWUpXHJcblx0XHR9XHJcblxyXG5cdH1cclxufSk7IiwiKGZ1bmN0aW9uKCkge1xyXG5cclxuXHQkJC5yZWdpc3RlckNvbnRyb2woJ1JhZGlvR3JvdXBDb250cm9sJywgZnVuY3Rpb24oZWx0KSB7XHJcblxyXG5cdFx0ZWx0Lm9uKCdjbGljaycsICdpbnB1dFt0eXBlPXJhZGlvXScsIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdyYWRpb2dyb3VwIGNsaWNrJylcclxuXHRcdFx0ZWx0LmZpbmQoJ2lucHV0W3R5cGU9cmFkaW9dOmNoZWNrZWQnKS5wcm9wKCdjaGVja2VkJywgZmFsc2UpXHJcblx0XHRcdCQodGhpcykucHJvcCgnY2hlY2tlZCcsIHRydWUpXHJcblx0XHRcdGVsdC50cmlnZ2VyKCdpbnB1dCcpXHJcblx0XHR9KVxyXG5cdFx0XHJcblxyXG5cdFx0dGhpcy5nZXRWYWx1ZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRyZXR1cm4gZWx0LmZpbmQoJ2lucHV0W3R5cGU9cmFkaW9dOmNoZWNrZWQnKS52YWwoKVxyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMuc2V0VmFsdWUgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRlbHQuZmluZCgnaW5wdXRbdHlwZT1yYWRpb10nKS5lYWNoKGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdCQodGhpcykucHJvcCgnY2hlY2tlZCcsIHZhbHVlID09PSAkKHRoaXMpLnZhbCgpKVxyXG5cdFx0XHR9KVx0XHRcdFxyXG5cdFx0fVxyXG5cclxuXHJcblx0fSlcclxuXHJcblxyXG59KSgpO1xyXG5cclxuXHJcbiIsIihmdW5jdGlvbigpIHtcclxuXHJcblx0ZnVuY3Rpb24gbWF0Y2hSb3V0ZShyb3V0ZSwgcGF0dGVybikge1xyXG5cdFx0Ly9jb25zb2xlLmxvZygnbWF0Y2hSb3V0ZScsIHJvdXRlLCBwYXR0ZXJuKVxyXG5cdFx0dmFyIHJvdXRlU3BsaXQgPSByb3V0ZS5zcGxpdCgnLycpXHJcblx0XHR2YXIgcGF0dGVyblNwbGl0ID0gcGF0dGVybi5zcGxpdCgnLycpXHJcblx0XHQvL2NvbnNvbGUubG9nKHJvdXRlU3BsaXQsIHBhdHRlcm5TcGxpdClcclxuXHRcdHZhciByZXQgPSB7fVxyXG5cclxuXHRcdGlmIChyb3V0ZVNwbGl0Lmxlbmd0aCAhPSBwYXR0ZXJuU3BsaXQubGVuZ3RoKVxyXG5cdFx0XHRyZXR1cm4gbnVsbFxyXG5cclxuXHRcdGZvcih2YXIgaWR4ID0gMDsgaWR4IDwgcGF0dGVyblNwbGl0Lmxlbmd0aDsgaWR4KyspIHtcclxuXHRcdFx0dmFyIHBhdGggPSBwYXR0ZXJuU3BsaXRbaWR4XVxyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdwYXRoJywgcGF0aClcclxuXHRcdFx0aWYgKHBhdGguc3Vic3RyKDAsIDEpID09PSAnOicpIHtcclxuXHRcdFx0XHRpZiAocm91dGVTcGxpdFtpZHhdLmxlbmd0aCA9PT0gMClcclxuXHRcdFx0XHRcdHJldHVybiBudWxsXHJcblx0XHRcdFx0cmV0W3BhdGguc3Vic3RyKDEpXSA9IHJvdXRlU3BsaXRbaWR4XVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2UgaWYgKHBhdGggIT09IHJvdXRlU3BsaXRbaWR4XSkge1xyXG5cdFx0XHRcdHJldHVybiBudWxsXHJcblx0XHRcdH1cclxuXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHJldFxyXG5cdH1cclxuXHJcblxyXG5cclxuXHJcblx0JCQucmVnaXN0ZXJDb250cm9sRXgoJ1JvdXRlckNvbnRyb2wnLCB7XHJcblxyXG5cdFx0b3B0aW9uczoge1xyXG5cdFx0XHRyb3V0ZXM6IFtdXHJcblx0XHR9LFxyXG5cdFx0XG5cdGxpYjogJ2NvcmUnLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zKSB7XHJcblxyXG5cclxuXHJcblx0XHRcdHZhciByb3V0ZXMgPSBvcHRpb25zLnJvdXRlc1xyXG5cclxuXHRcdFx0aWYgKCFBcnJheS5pc0FycmF5KHJvdXRlcykpIHtcclxuXHRcdFx0XHRjb25zb2xlLndhcm4oJ1tSb3V0ZXJDb250cm9sXSBiYWQgb3B0aW9ucycpXHJcblx0XHRcdFx0cmV0dXJuXHJcblx0XHRcdH1cclxuXHJcblxyXG5cdFx0XHRmdW5jdGlvbiBwcm9jZXNzUm91dGUoaW5mbykge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdbUm91dGVyQ29udHJvbF0gcHJvY2Vzc1JvdXRlJywgaW5mbylcclxuXHJcblx0XHRcdFx0dmFyIG5ld1JvdXRlID0gaW5mby5jdXJSb3V0ZVxyXG5cclxuXHRcdFx0XHRmb3IodmFyIHJvdXRlIG9mIHJvdXRlcykge1xyXG5cdFx0XHRcdFx0dmFyIHBhcmFtcyA9IG1hdGNoUm91dGUobmV3Um91dGUsIHJvdXRlLmhyZWYpXHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKGByb3V0ZTogJHtyb3V0ZS5ocmVmfSwgcGFyYW1zYCwgcGFyYW1zKVxyXG5cdFx0XHRcdFx0aWYgKHBhcmFtcyAhPSBudWxsKSB7XHJcblx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ1tSb3V0ZXJDb250cm9sXSBwYXJhbXMnLCBwYXJhbXMpXHJcblx0XHRcdFx0XHRcdGlmICh0eXBlb2Ygcm91dGUucmVkaXJlY3QgPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0XHRcdFx0XHRsb2NhdGlvbi5ocmVmID0gJyMnICsgcm91dGUucmVkaXJlY3RcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRlbHNlIGlmICh0eXBlb2Ygcm91dGUuY29udHJvbCA9PSAnc3RyaW5nJykge1xyXG5cclxuXHRcdFx0XHRcdFx0XHR2YXIgY3VyQ3RybCA9IGVsdC5maW5kKCcuQ3VzdG9tQ29udHJvbCcpLmludGVyZmFjZSgpXHJcblx0XHRcdFx0XHRcdFx0dmFyIGNhbkNoYW5nZSA9IHRydWVcclxuXHRcdFx0XHRcdFx0XHRpZiAoY3VyQ3RybCAmJiB0eXBlb2YgY3VyQ3RybC5jYW5DaGFuZ2UgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdFx0XHRcdFx0Y2FuQ2hhbmdlID0gY3VyQ3RybC5jYW5DaGFuZ2UoKVxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHRpZiAoY2FuQ2hhbmdlKSB7XHJcblx0XHRcdFx0XHRcdFx0XHQkKHdpbmRvdykudHJpZ2dlcigncm91dGVDaGFuZ2VkJywgbmV3Um91dGUpXHJcblx0XHRcdFx0XHRcdFx0XHR2YXIgY29uZmlnID0gJC5leHRlbmQoeyRwYXJhbXM6IHBhcmFtc30sIHJvdXRlLm9wdGlvbnMpXHRcclxuXHRcdFx0XHRcdFx0XHRcdHZhciBodG1sID0gJChgPGRpdiBibi1jb250cm9sPVwiJHtyb3V0ZS5jb250cm9sfVwiIGJuLW9wdGlvbnM9XCJjb25maWdcIiBjbGFzcz1cImJuLWZsZXgtY29sIGJuLWZsZXgtMVwiPjwvZGl2PmApXHJcblx0XHRcdFx0XHRcdFx0XHRlbHQuZGlzcG9zZSgpLmh0bWwoaHRtbClcclxuXHRcdFx0XHRcdFx0XHRcdGh0bWwucHJvY2Vzc1VJKHtjb25maWc6IGNvbmZpZ30pXHRcdFxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHRlbHNlIGlmIChpbmZvLnByZXZSb3V0ZSkge1xyXG5cdFx0XHRcdFx0XHRcdFx0aGlzdG9yeS5yZXBsYWNlU3RhdGUoe30sICcnLCAnIycgKyBpbmZvLnByZXZSb3V0ZSlcclxuXHRcdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0XHRcdC8vZWx0Lmh0bWwoaHRtbClcclxuXHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0cmV0dXJuIHRydWVcclxuXHRcdFx0XHRcdH1cdFxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gZmFsc2VcclxuXHJcblx0XHRcdH1cdFx0XHJcblxyXG5cdFx0XHQkKHdpbmRvdykub24oJ3JvdXRlQ2hhbmdlJywgZnVuY3Rpb24oZXYsIGluZm8pIHtcclxuXHRcdFx0XHRpZiAoIXByb2Nlc3NSb3V0ZShpbmZvKSkge1xyXG5cdFx0XHRcdFx0Y29uc29sZS53YXJuKGBbUm91dGVyQ29udHJvbF0gbm8gYWN0aW9uIGRlZmluZWQgZm9yIHJvdXRlICcke25ld1JvdXRlfSdgKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSlcclxuXHJcblxyXG5cdFx0fVxyXG5cclxuXHR9KVxyXG5cclxufSkoKTtcclxuXHJcblxyXG4iXX0=
