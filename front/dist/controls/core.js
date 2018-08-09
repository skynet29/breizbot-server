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
					template: "<div class=\"container\">\n	<div class=\"viewport\">\n		<div class=\"items\" bn-bind=\"items\"></div>	\n	</div>\n	<div class=\"overlay\">\n		<div>\n			<button \n				bn-event=\"click: onLeft\" \n				bn-prop=\"hidden: leftDisabled\"\n				>\n				<i class=\"fa fa-2x fa-chevron-circle-left\"></i>\n			</button>			\n		</div>\n\n		<div>\n			<button \n				bn-event=\"click: onRight\" \n				bn-prop=\"hidden: rightDisabled\"\n			>\n				<i class=\"fa fa-2x fa-chevron-circle-right\"></i>\n			</button>			\n		</div>\n\n	</div>\n\n</div>",
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
			template: "<div class=\"bn-flex-col bn-flex-1\">\n\n	<div bn-event=\"click.cmd: onCommand\">\n		<div bn-control=\"ToolbarControl\">\n			<button class=\"cmd\" data-cmd=\"bold\"><i class=\"fa fa-bold\"></i></button>\n			<button class=\"cmd\" data-cmd=\"italic\"><i class=\"fa fa-italic\"></i></button>\n			<button class=\"cmd\" data-cmd=\"underline\"><i class=\"fa fa-underline\"></i></button>\n			<button class=\"cmd\" data-cmd=\"strikeThrough\"><i class=\"fa fa-strikethrough\"></i></button>\n			<button class=\"cmd\" data-cmd=\"foreColor\" bn-menu=\"colorItems\" bn-event=\"menuChange: onColorMenuChange\"><i class=\"fa fa-pencil\" bn-style=\"color: color\"></i></button>\n		</div>\n		<div bn-control=\"ToolbarControl\">\n			<button class=\"cmd\" data-cmd=\"justifyLeft\"><i class=\"fa fa-align-left\"></i></button>\n			<button class=\"cmd\" data-cmd=\"justifyCenter\"><i class=\"fa fa-align-center\"></i></button>\n			<button class=\"cmd\" data-cmd=\"justifyRight\"><i class=\"fa fa-align-right\"></i></button>\n		</div>	\n		<div bn-control=\"ToolbarControl\">\n			<button class=\"cmd\" data-cmd=\"indent\"><i class=\"fa fa-indent\"></i></button>\n			<button class=\"cmd\" data-cmd=\"outdent\"><i class=\"fa fa-outdent\"></i></button>\n		</div>	\n		<div bn-control=\"ToolbarControl\">\n			<button class=\"cmd\" data-cmd=\"insertHorizontalRule\">hr</button>\n			<button class=\"cmd\" data-cmd=\"formatBlock\" data-cmd-arg=\"h1\">h1</button>\n			<button class=\"cmd\" data-cmd=\"formatBlock\" data-cmd-arg=\"h2\">h2</button>\n			<button class=\"cmd\" data-cmd=\"formatBlock\" data-cmd-arg=\"h3\">h3</button>\n		</div>		\n		<div bn-control=\"ToolbarControl\">\n			<button class=\"cmd\" data-cmd=\"insertUnorderedList\"><i class=\"fa fa-list-ul\"></i></button>\n			<button class=\"cmd\" data-cmd=\"insertOrderedList\"><i class=\"fa fa-list-ol\"></i></button>\n		</div>\n\n	</div>	\n	<div contenteditable=\"true\" class=\"bn-flex-1 editor\" bn-bind=\"editor\"></div>\n</div>\n",
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
			template: "<div style=\"display: flex; flex-direction: column;\">\n	<h1 class=\"w3-center\">Friends</h1>\n	<div class=\"scrollPanel\">\n		<div bn-each=\"f of friends\">\n			<div class=\"item\">\n				<div class=\"name\">\n					<span bn-text=\"f.name\"></span>\n				</div>\n				<div bn-show=\"f.isConnected\" class=\"w3-text-green\">\n					<i class=\"fa fa-check\"></i>\n				</div>\n			</div>\n		</div>\n	</div>	\n</div>",
			data: {
				friends: []
			}
		})

		client.register('masterFriends', true, onFriends)

		function onFriends(msg) {
			console.log('onFriends', msg.data)
			ctrl.setData({friends: msg.data})
		}

		this.getFriends = function() {
			return ctrl.model.friends
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
			template: "\n<ul class=\"w3-ul w3-border w3-white\" bn-each=\"n of notifs\" \n	bn-event=\"click.delete: onDelete, click.deny: onDeny, click.accept: onAccept\">\n	<li class=\"w3-bar\" bn-data=\"notif: n\" bn-show=\"!n.isInvit\">\n		<span class=\"w3-button w3-right delete\" title=\"Delete\"><i class=\"fa fa-times\"></i></span>\n\n		<div class=\"w3-bar-item\" bn-html=\"n.message\" ></div>\n	</li>\n	<li class=\"w3-bar\" bn-data=\"notif: n\" bn-show=\"n.isInvit\">\n		<span class=\"w3-button w3-right w3-green accept\">Accept</i></span>\n		<span class=\"w3-button w3-right w3-red deny\">Deny</i></span>\n\n		<div class=\"w3-bar-item\" bn-html=\"n.message\" ></div>\n	</li>		\n</ul>		\n",
			data: {notifs: []},
			options: {
				width: 'auto'
			},
			events: {
				onDelete: function() {
					var notif = $(this).closest('li').data('notif')
					//console.log('onDelete', notif)
					http.delete('/api/notif/' + notif.id)
				},
				onAccept: function() {
					var notif = $(this).closest('li').data('notif')
					console.log('onAccept', notif)

					http.post('/api/notif/accept/' + notif.from)

					http.delete('/api/notif/' + notif.id)

				},
				onDeny: function() {
					var notif = $(this).closest('li').data('notif')
					console.log('onDeny', notif)

					http.delete('/api/notif/' + notif.id)

				}
			}
		})

		var ctrl = $$.viewController(elt, {
			template: "<div >\n	<div class=\"brand\"><h1 class=\"bn-xs-hide\" bn-text=\"title\"></h1> </div>\n	<div class=\"infos\">\n		<button class=\"notification w3-btn\" title=\"notification\" bn-event=\"click: onNotification\">\n			<i class=\"fa fa-lg fa-bell w3-text-white\" ></i>\n			<span class=\"w3-badge w3-red w3-tiny\" bn-text=\"nbNotif\" bn-show=\"isNotifVisible\"></span>			\n		</button>\n\n	    <i bn-attr=\"title: titleState\" class=\"fa fa-lg connectionState\" bn-class=\"fa-eye: connected, fa-eye-slash: !connected\"></i>\n\n	    <div>\n		    <i class=\"fa fa-user fa-lg\"></i>\n		    <span bn-text=\"userName\" class=\"userName\"></span>	    	\n	    </div>\n\n	    <button title=\"logout\" class=\"w3-btn\" bn-event=\"click: onDisconnect\" bn-show=\"isHomePage\"><i class=\"fa fa-power-off fa-lg\"></i></button> \n\n	    <button title=\"home\" class=\"w3-btn\" bn-event=\"click: onGoHome\" bn-show=\"!isHomePage\"><i class=\"fa fa-home fa-lg\"></i></button> \n\n	</div>\n\n\n</div>",
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
			console.log('onNotifications', msg.data)
			ctrl.setData({nbNotif: msg.data.length})
			dlgCtrl.setData({
				notifs: msg.data.map((item) => {
					item.isInvit = (item.type == 'invit')
					return item
				})
			})
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
			template: "<div class=\"main\">\n\n\n	<strong>Available apps:</strong>\n	<div class=\"content\" bn-each=\"app of apps\">\n			<a bn-attr=\"class: app.className, href:app.href, title:app.desc\">\n				\n				<div class=\"bn-flex-col\" style=\"height: 100%; justify-content: center;\">\n					<div class=\"bn-flex-1 bn-flex-row\" style=\"align-items: center; justify-content: center;\" bn-show=\"app.hasTileIcon\">\n						<i bn-attr=\"class: app.tileIcon\"></i>\n					</div>\n\n					<span bn-text=\"app.tileName\"></span>\n				</div>\n\n			</a>\n	</div>\n\n\n</div>",
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
			template: "<div bn-control=\"CarouselControl\" bn-options=\"carouselCtrlOptions\" bn-each=\"i of images\" bn-iface=\"carouselCtrl\" bn-data=\"index: index\">\n	<div style=\"text-align: center;\" bn-style=\"background-color: backColor\">\n		<img bn-attr=\"src: i\" style=\"height: 100%\">\n	</div>\n</div>",
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



//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNhcm91c2VsLmpzIiwiY2hlY2tncm91cC5qcyIsImVkaXRvci5qcyIsImZpbHRlcmVkLXRhYmxlLmpzIiwiZnJpZW5kcy5qcyIsImhlYWRlci5qcyIsImhvbWUuanMiLCJpbnB1dGdyb3VwLmpzIiwibmF2YmFyLmpzIiwicGljdHVyZWNhcm91c2VsLmpzIiwicmFkaW9ncm91cC5qcyIsInJvdXRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDN0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImNvcmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKSB7XG5cblx0JCQucmVnaXN0ZXJDb250cm9sRXgoJ0Nhcm91c2VsQ29udHJvbCcsIHtcblxuXHRcdHByb3BzOiB7XG5cblx0XHRcdGluZGV4OiB7XG5cdFx0XHRcdHZhbDogMCxcblx0XHRcdFx0c2V0OiAnc2V0SW5kZXgnXG5cdFx0XHR9IFxuXHRcdH0sXG5cdFx0b3B0aW9uczoge1xuXHRcdFx0d2lkdGg6IDMwMCxcblx0XHRcdGhlaWdodDogMjAwLFxuXHRcdFx0YW5pbWF0ZURlbGF5OiAxMDAwLFxuXHRcdFxuXHRcdH0sXG5cdFx0aWZhY2U6ICdzZXRJbmRleChpZHgpO3JlZnJlc2goKScsXG5cblx0XHRcblx0bGliOiAnY29yZScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMpIHtcblx0XG5cblxuXHRcdFx0dmFyIHdpZHRoID0gb3B0aW9ucy53aWR0aCArICdweCdcblx0XHRcdHZhciBoZWlnaHQgPSBvcHRpb25zLmhlaWdodCArICdweCdcblx0XHRcdGVsdC5jc3MoJ3dpZHRoJywgd2lkdGgpLmNzcygnaGVpZ2h0JywgaGVpZ2h0KVxuXG5cdFx0XHRjb25zb2xlLmxvZyhgW0Nhcm91c2VsQ29udHJvbF0gb3B0aW9uc2AsIG9wdGlvbnMpXG5cblx0XHRcdHZhciBjdHJsID0gbnVsbFxuXHRcdFx0dmFyIGl0ZW1zXG5cdFx0XHR2YXIgaWR4XG5cblxuXHRcdFx0dGhpcy5yZWZyZXNoID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ1tDYXJvdXNlbENvbnRyb2xdIHJlZnJlc2gnKVxuXHRcdFx0XHRpdGVtcyA9IGVsdC5jaGlsZHJlbignZGl2JykucmVtb3ZlKCkuY3NzKCd3aWR0aCcsIHdpZHRoKS5jc3MoJ2hlaWdodCcsIGhlaWdodClcdFx0XG5cblx0XHRcdFx0aWR4ID0gTWF0aC5tYXgoMCwgTWF0aC5taW4ob3B0aW9ucy5pbmRleCwgaXRlbXMubGVuZ3RoKSlcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhgW0Nhcm91c2VsQ29udHJvbF0gaWR4YCwgaWR4KVxuXG5cdFx0XHRcdGZ1bmN0aW9uIGFuaW1hdGUoZGlyZWN0aW9uKSB7XG5cdFx0XHRcdFx0Y3RybC5zZXREYXRhKHtsZWZ0RGlzYWJsZWQ6IHRydWUsIHJpZ2h0RGlzYWJsZWQ6IHRydWV9KVxuXHRcdFx0XHRcdHZhciBvcCA9IGRpcmVjdGlvbiA9PSAnbGVmdCcgPyAnKz0nIDogJy09J1xuXHRcdFx0XHRcdGlkeCA9IGRpcmVjdGlvbiA9PSAnbGVmdCcgPyBpZHgtMSA6IGlkeCsxXG5cblx0XHRcdFx0XHRjdHJsLnNjb3BlLml0ZW1zLmFuaW1hdGUoe2xlZnQ6IG9wICsgd2lkdGh9LCBvcHRpb25zLmFuaW1hdGVEZWxheSwgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRjaGVja0J0bnMoKVxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoZWx0LCB7XG5cdFx0XHRcdFx0dGVtcGxhdGU6IFwiPGRpdiBjbGFzcz1cXFwiY29udGFpbmVyXFxcIj5cXG5cdDxkaXYgY2xhc3M9XFxcInZpZXdwb3J0XFxcIj5cXG5cdFx0PGRpdiBjbGFzcz1cXFwiaXRlbXNcXFwiIGJuLWJpbmQ9XFxcIml0ZW1zXFxcIj48L2Rpdj5cdFxcblx0PC9kaXY+XFxuXHQ8ZGl2IGNsYXNzPVxcXCJvdmVybGF5XFxcIj5cXG5cdFx0PGRpdj5cXG5cdFx0XHQ8YnV0dG9uIFxcblx0XHRcdFx0Ym4tZXZlbnQ9XFxcImNsaWNrOiBvbkxlZnRcXFwiIFxcblx0XHRcdFx0Ym4tcHJvcD1cXFwiaGlkZGVuOiBsZWZ0RGlzYWJsZWRcXFwiXFxuXHRcdFx0XHQ+XFxuXHRcdFx0XHQ8aSBjbGFzcz1cXFwiZmEgZmEtMnggZmEtY2hldnJvbi1jaXJjbGUtbGVmdFxcXCI+PC9pPlxcblx0XHRcdDwvYnV0dG9uPlx0XHRcdFxcblx0XHQ8L2Rpdj5cXG5cXG5cdFx0PGRpdj5cXG5cdFx0XHQ8YnV0dG9uIFxcblx0XHRcdFx0Ym4tZXZlbnQ9XFxcImNsaWNrOiBvblJpZ2h0XFxcIiBcXG5cdFx0XHRcdGJuLXByb3A9XFxcImhpZGRlbjogcmlnaHREaXNhYmxlZFxcXCJcXG5cdFx0XHQ+XFxuXHRcdFx0XHQ8aSBjbGFzcz1cXFwiZmEgZmEtMnggZmEtY2hldnJvbi1jaXJjbGUtcmlnaHRcXFwiPjwvaT5cXG5cdFx0XHQ8L2J1dHRvbj5cdFx0XHRcXG5cdFx0PC9kaXY+XFxuXFxuXHQ8L2Rpdj5cXG5cXG48L2Rpdj5cIixcblx0XHRcdFx0XHRkYXRhOiB7XG5cdFx0XHRcdFx0XHRsZWZ0RGlzYWJsZWQ6IHRydWUsXG5cdFx0XHRcdFx0XHRyaWdodERpc2FibGVkOiBmYWxzZVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0aW5pdDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHR0aGlzLnNjb3BlLml0ZW1zLmFwcGVuZChpdGVtcylcblx0XHRcdFx0XHRcdHRoaXMuc2NvcGUuaXRlbXMuY3NzKCdsZWZ0JywgKC1pZHggKiBvcHRpb25zLndpZHRoKSArICdweCcpXG5cdFx0XHRcdFx0XHQvL2NoZWNrQnRucygpXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRldmVudHM6IHtcblx0XHRcdFx0XHRcdG9uTGVmdDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRcdGFuaW1hdGUoJ2xlZnQnKVxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdG9uUmlnaHQ6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0XHRhbmltYXRlKCdyaWdodCcpXG5cdFx0XHRcdFx0XHR9XHRcdFx0XHRcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pXG5cdFx0XHRcdGNoZWNrQnRucygpXHRcdFxuXG5cdFx0XHR9XHRcdFxuXG5cdFx0XHR0aGlzLnNldEluZGV4ID0gZnVuY3Rpb24oaW5kZXgpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coJ1tDYXJvdXNlbENvbnRyb2xdIHNldEluZGV4JywgaW5kZXgpXG5cdFx0XHRcdGlkeCA9ICBNYXRoLm1heCgwLCBNYXRoLm1pbihpbmRleCwgaXRlbXMubGVuZ3RoKSlcblx0XHRcdFx0Y3RybC5zY29wZS5pdGVtcy5jc3MoJ2xlZnQnLCAoLWlkeCAqIG9wdGlvbnMud2lkdGgpICsgJ3B4Jylcblx0XHRcdFx0Y2hlY2tCdG5zKGlkeClcblx0XHRcdH1cblxuXHRcdFx0ZnVuY3Rpb24gY2hlY2tCdG5zKCkge1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdjaGVja0J0bnMnLCBpZHgsIGl0ZW1zLmxlbmd0aClcblx0XHRcdFx0Y3RybC5zZXREYXRhKHtcblx0XHRcdFx0XHRsZWZ0RGlzYWJsZWQ6IGlkeCA9PSAwLFxuXHRcdFx0XHRcdHJpZ2h0RGlzYWJsZWQ6IGlkeCA9PSBpdGVtcy5sZW5ndGggLSAxXG5cdFx0XHRcdH0pXG5cdFx0XHR9XHRcdFxuXG5cdCBcdFx0dGhpcy5yZWZyZXNoKClcblxuXHRcdH1cblxuXHR9KVxuXG59KSgpO1xuIiwiJCQucmVnaXN0ZXJDb250cm9sRXgoJ0NoZWNrR3JvdXBDb250cm9sJywge1xuXHRcblx0bGliOiAnY29yZScsXG5pbml0OiBmdW5jdGlvbihlbHQpIHtcblxuXHRcdGVsdC5vbignY2xpY2snLCAnaW5wdXRbdHlwZT1jaGVja2JveF0nLCBmdW5jdGlvbigpIHtcblx0XHRcdGVsdC50cmlnZ2VyKCdpbnB1dCcpXG5cdFx0fSlcblxuXHRcdHRoaXMuZ2V0VmFsdWUgPSBmdW5jdGlvbigpIHtcblx0XHRcdHZhciByZXQgPSBbXVxuXHRcdFx0ZWx0LmZpbmQoJ2lucHV0W3R5cGU9Y2hlY2tib3hdOmNoZWNrZWQnKS5lYWNoKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXQucHVzaCgkKHRoaXMpLnZhbCgpKVxuXHRcdFx0fSlcdFxuXHRcdFx0cmV0dXJuIHJldFx0XG5cdFx0fVxuXG5cdFx0dGhpcy5zZXRWYWx1ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHRpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcblx0XHRcdFx0ZWx0LmZpbmQoJ2lucHV0W3R5cGU9Y2hlY2tib3hdJykuZWFjaChmdW5jdGlvbigpIHtcblx0XHRcdFx0XHQkKHRoaXMpLnByb3AoJ2NoZWNrZWQnLCB2YWx1ZS5pbmRleE9mKCQodGhpcykudmFsKCkpID49IDApXG5cdFx0XHRcdH0pXG5cdFx0XHR9XHRcdFxuXHRcdH1cblxuXHR9XG5cbn0pO1xuXG5cblxuXG5cblxuIiwiJCQucmVnaXN0ZXJDb250cm9sRXgoJ0h0bWxFZGl0b3JDb250cm9sJywge1xuXG5cdGlmYWNlOiAnaHRtbCgpJyxcblxuXHRcblx0bGliOiAnY29yZScsXG5pbml0OiBmdW5jdGlvbihlbHQpIHtcblxuXHRcdGVsdC5hZGRDbGFzcygnYm4tZmxleC1yb3cnKVxuXG5cdFx0dmFyIGNtZEFyZ3MgPSB7XG5cdFx0XHQnZm9yZUNvbG9yJzogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHJldHVybiBjdHJsLm1vZGVsLmNvbG9yXG5cdFx0XHR9XG5cdFx0fVxuXG5cblx0XHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xuXHRcdFx0dGVtcGxhdGU6IFwiPGRpdiBjbGFzcz1cXFwiYm4tZmxleC1jb2wgYm4tZmxleC0xXFxcIj5cXG5cXG5cdDxkaXYgYm4tZXZlbnQ9XFxcImNsaWNrLmNtZDogb25Db21tYW5kXFxcIj5cXG5cdFx0PGRpdiBibi1jb250cm9sPVxcXCJUb29sYmFyQ29udHJvbFxcXCI+XFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwiYm9sZFxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLWJvbGRcXFwiPjwvaT48L2J1dHRvbj5cXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJpdGFsaWNcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1pdGFsaWNcXFwiPjwvaT48L2J1dHRvbj5cXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJ1bmRlcmxpbmVcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS11bmRlcmxpbmVcXFwiPjwvaT48L2J1dHRvbj5cXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJzdHJpa2VUaHJvdWdoXFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtc3RyaWtldGhyb3VnaFxcXCI+PC9pPjwvYnV0dG9uPlxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcImZvcmVDb2xvclxcXCIgYm4tbWVudT1cXFwiY29sb3JJdGVtc1xcXCIgYm4tZXZlbnQ9XFxcIm1lbnVDaGFuZ2U6IG9uQ29sb3JNZW51Q2hhbmdlXFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtcGVuY2lsXFxcIiBibi1zdHlsZT1cXFwiY29sb3I6IGNvbG9yXFxcIj48L2k+PC9idXR0b24+XFxuXHRcdDwvZGl2Plxcblx0XHQ8ZGl2IGJuLWNvbnRyb2w9XFxcIlRvb2xiYXJDb250cm9sXFxcIj5cXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJqdXN0aWZ5TGVmdFxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLWFsaWduLWxlZnRcXFwiPjwvaT48L2J1dHRvbj5cXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJqdXN0aWZ5Q2VudGVyXFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtYWxpZ24tY2VudGVyXFxcIj48L2k+PC9idXR0b24+XFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwianVzdGlmeVJpZ2h0XFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtYWxpZ24tcmlnaHRcXFwiPjwvaT48L2J1dHRvbj5cXG5cdFx0PC9kaXY+XHRcXG5cdFx0PGRpdiBibi1jb250cm9sPVxcXCJUb29sYmFyQ29udHJvbFxcXCI+XFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwiaW5kZW50XFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtaW5kZW50XFxcIj48L2k+PC9idXR0b24+XFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwib3V0ZGVudFxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLW91dGRlbnRcXFwiPjwvaT48L2J1dHRvbj5cXG5cdFx0PC9kaXY+XHRcXG5cdFx0PGRpdiBibi1jb250cm9sPVxcXCJUb29sYmFyQ29udHJvbFxcXCI+XFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwiaW5zZXJ0SG9yaXpvbnRhbFJ1bGVcXFwiPmhyPC9idXR0b24+XFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwiZm9ybWF0QmxvY2tcXFwiIGRhdGEtY21kLWFyZz1cXFwiaDFcXFwiPmgxPC9idXR0b24+XFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwiZm9ybWF0QmxvY2tcXFwiIGRhdGEtY21kLWFyZz1cXFwiaDJcXFwiPmgyPC9idXR0b24+XFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwiZm9ybWF0QmxvY2tcXFwiIGRhdGEtY21kLWFyZz1cXFwiaDNcXFwiPmgzPC9idXR0b24+XFxuXHRcdDwvZGl2Plx0XHRcXG5cdFx0PGRpdiBibi1jb250cm9sPVxcXCJUb29sYmFyQ29udHJvbFxcXCI+XFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwiaW5zZXJ0VW5vcmRlcmVkTGlzdFxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLWxpc3QtdWxcXFwiPjwvaT48L2J1dHRvbj5cXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJpbnNlcnRPcmRlcmVkTGlzdFxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLWxpc3Qtb2xcXFwiPjwvaT48L2J1dHRvbj5cXG5cdFx0PC9kaXY+XFxuXFxuXHQ8L2Rpdj5cdFxcblx0PGRpdiBjb250ZW50ZWRpdGFibGU9XFxcInRydWVcXFwiIGNsYXNzPVxcXCJibi1mbGV4LTEgZWRpdG9yXFxcIiBibi1iaW5kPVxcXCJlZGl0b3JcXFwiPjwvZGl2PlxcbjwvZGl2PlxcblwiLFxuXHRcdFx0ZGF0YToge1xuXHRcdFx0XHRjb2xvcjogJ2JsdWUnLFxuXHRcdFx0XHRjb2xvckl0ZW1zOiB7XG5cdFx0XHRcdFx0YmxhY2s6IHtuYW1lOiAnQmxhY2snfSxcblx0XHRcdFx0XHRyZWQ6IHtuYW1lOiAnUmVkJ30sXG5cdFx0XHRcdFx0Z3JlZW46IHtuYW1lOiAnR3JlZW4nfSxcblx0XHRcdFx0XHRibHVlOiB7bmFtZTogJ0JsdWUnfSxcblx0XHRcdFx0XHR5ZWxsb3c6IHtuYW1lOiAnWWVsbG93J30sXG5cdFx0XHRcdFx0Y3lhbjoge25hbWU6ICdDeWFuJ30sXG5cdFx0XHRcdFx0bWFnZW50YToge25hbWU6ICdNYWdlbnRhJ31cblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdGV2ZW50czoge1xuXHRcdFx0XHRvbkNvbW1hbmQ6IGZ1bmN0aW9uKCkge1xuXG5cdFx0XHRcdFx0dmFyIGNtZCA9ICQodGhpcykuZGF0YSgnY21kJylcblx0XHRcdFx0XHR2YXIgY21kQXJnID0gJCh0aGlzKS5kYXRhKCdjbWRBcmcnKVxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ29uQ29tbWFuZCcsIGNtZCwgY21kQXJnKVxuXG5cdFx0XHRcdFx0dmFyIGNtZEFyZyA9IGNtZEFyZyB8fCBjbWRBcmdzW2NtZF1cblx0XHRcdFx0XHRpZiAodHlwZW9mIGNtZEFyZyA9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0XHRjbWRBcmcgPSBjbWRBcmcoKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvbkNvbW1hbmQnLCBjbWQsIGNtZEFyZylcblxuXHRcdFx0XHRcdGRvY3VtZW50LmV4ZWNDb21tYW5kKGNtZCwgZmFsc2UsIGNtZEFyZylcblx0XHRcdFx0XG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9uQ29sb3JNZW51Q2hhbmdlOiBmdW5jdGlvbihldiwgY29sb3IpIHtcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvbkNvbG9yTWVudUNoYW5nZScsIGNvbG9yKVxuXHRcdFx0XHRcdGN0cmwuc2V0RGF0YSh7Y29sb3J9KVxuXHRcdFx0XHR9XG5cblx0XHRcdH1cblxuXHRcdH0pXG5cblx0XHR0aGlzLmh0bWwgPSBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBjdHJsLnNjb3BlLmVkaXRvci5odG1sKClcblx0XHR9XG5cblxuXHR9XG5cbn0pO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG5cdGZ1bmN0aW9uIGdldFRlbXBsYXRlKGhlYWRlcnMpIHtcblx0XHRyZXR1cm4gYFxuXHRcdFx0PGRpdiBjbGFzcz1cInNjcm9sbFBhbmVsXCI+XG5cdCAgICAgICAgICAgIDx0YWJsZSBjbGFzcz1cInczLXRhYmxlLWFsbCB3My1zbWFsbFwiPlxuXHQgICAgICAgICAgICAgICAgPHRoZWFkPlxuXHQgICAgICAgICAgICAgICAgICAgIDx0ciBjbGFzcz1cInczLWdyZWVuXCI+XG5cdCAgICAgICAgICAgICAgICAgICAgXHQke2hlYWRlcnN9XG5cdCAgICAgICAgICAgICAgICAgICAgPC90cj5cblx0ICAgICAgICAgICAgICAgIDwvdGhlYWQ+XG5cdCAgICAgICAgICAgICAgICA8dGJvZHk+PC90Ym9keT5cblx0ICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgIDwvZGl2PlxuXHRcdGBcblx0fVxuXG5cdGZ1bmN0aW9uIGdldEl0ZW1UZW1wbGF0ZShyb3dzKSB7XG5cdFx0cmV0dXJuIGBcbiAgICAgICAgICAgIDx0ciBjbGFzcz1cIml0ZW1cIiBibi1hdHRyPVwiZGF0YS1pZDogX2lkXCI+XG4gICAgICAgICAgICBcdCR7cm93c31cbiAgICAgICAgICAgIDwvdHI+XHRcblx0XHRgXG5cdH1cblxuXG5cblx0JCQucmVnaXN0ZXJDb250cm9sRXgoJ0ZpbHRlcmVkVGFibGVDb250cm9sJywge1xuXG5cdFx0aWZhY2U6IGBhZGRJdGVtKGlkLCBkYXRhKTtyZW1vdmVJdGVtKGlkKTtyZW1vdmVBbGxJdGVtcygpO2dldEl0ZW0oaWQpO3NldEZpbHRlcnMoZmlsdGVycyk7Z2V0RGF0YXMoKTtnZXREaXNwbGF5ZWREYXRhcygpO29uKGV2ZW50LCBjYWxsYmFjaylgLFxuXHRcdGV2ZW50czogJ2l0ZW1BY3Rpb24nLFxuXG5cdFx0XG5cdGxpYjogJ2NvcmUnLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zKSB7XG5cblx0XHRcdGNvbnNvbGUubG9nKCdvcHRpb25zJywgb3B0aW9ucylcblxuXHRcdFx0dmFyIGNvbHVtbnMgPSAgJCQub2JqMkFycmF5KG9wdGlvbnMuY29sdW1ucylcblx0XHRcdHZhciBhY3Rpb25zID0gJCQub2JqMkFycmF5KG9wdGlvbnMuYWN0aW9ucylcblx0XHRcdHZhciBoZWFkZXJzID0gY29sdW1ucy5tYXAoKGNvbHVtbikgPT4gYDx0aD4ke2NvbHVtbi52YWx1ZX08L3RoPmApXHRcdFxuXHRcdFx0dmFyIHJvd3MgPSBjb2x1bW5zLm1hcCgoY29sdW1uKSA9PiBgPHRkIGJuLWh0bWw9XCIke2NvbHVtbi5rZXl9XCI+PC90ZD5gKVxuXHRcdFx0aWYgKGFjdGlvbnMubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRoZWFkZXJzLnB1c2goYDx0aD5BY3Rpb248L3RoPmApXG5cblx0XHRcdFx0dmFyIGJ1dHRvbnMgPSBhY3Rpb25zLm1hcCgoYWN0aW9uKSA9PiBgPGJ1dHRvbiBkYXRhLWFjdGlvbj1cIiR7YWN0aW9uLmtleX1cIiBjbGFzcz1cInczLWJ1dHRvblwiPjxpIGNsYXNzPVwiJHthY3Rpb24udmFsdWV9XCI+PC9pPjwvYnV0dG9uPmApXG5cdFx0XHRcdHJvd3MucHVzaChgPHRkPiR7YnV0dG9ucy5qb2luKCcnKX08L3RkPmApXG5cdFx0XHR9XG5cblx0XHRcdC8vY29uc29sZS5sb2coJ3Jvd3MnLCByb3dzKVxuXHRcdFx0dmFyIGl0ZW1UZW1wbGF0ZSA9IGdldEl0ZW1UZW1wbGF0ZShyb3dzLmpvaW4oJycpKVxuXHRcdFx0Ly9jb25zb2xlLmxvZygnaXRlbVRlbXBsYXRlJywgaXRlbVRlbXBsYXRlKVxuXG5cdFx0XHRlbHQuYXBwZW5kKGdldFRlbXBsYXRlKGhlYWRlcnMuam9pbignJykpKVxuXHRcdFx0ZWx0LmFkZENsYXNzKCdibi1mbGV4LWNvbCcpXG5cblx0XHRcdGxldCBkYXRhcyA9IHt9XG5cdFx0XHRsZXQgZXZlbnRzID0gbmV3IEV2ZW50RW1pdHRlcjIoKVxuXHRcdFx0bGV0IF9maWx0ZXJzID0ge31cblx0XHRcdGxldCBkaXNwbGF5ZWRJdGVtcyA9IHt9XG5cblx0XHRcdGNvbnN0IHRib2R5ID0gZWx0LmZpbmQoJ3Rib2R5Jylcblx0XHRcdHRib2R5Lm9uKCdjbGljaycsICdbZGF0YS1hY3Rpb25dJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZhciBpZCA9ICQodGhpcykuY2xvc2VzdCgnLml0ZW0nKS5kYXRhKCdpZCcpXG5cdFx0XHRcdHZhciBhY3Rpb24gPSAkKHRoaXMpLmRhdGEoJ2FjdGlvbicpXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdjbGljaycsIGlkLCAnYWN0aW9uJywgYWN0aW9uKVxuXHRcdFx0XHRldmVudHMuZW1pdCgnaXRlbUFjdGlvbicsIGFjdGlvbiwgaWQpXG5cdFx0XHR9KVxuXG5cdFx0XHR0aGlzLmFkZEl0ZW0gPSBmdW5jdGlvbihpZCwgZGF0YSkge1xuXG5cdFx0XHRcdHZhciBpdGVtRGF0YSA9ICQuZXh0ZW5kKHsnX2lkJzogaWR9LCBkYXRhKVxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdhZGRJdGVtJywgaXRlbURhdGEpXG5cdFx0XHRcdFxuXHRcdFx0XHRpZiAoZGF0YXNbaWRdICE9IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdHZhciBpdGVtID0gZGlzcGxheWVkSXRlbXNbaWRdXG5cdFx0XHRcdFx0aWYgKGl0ZW0gIT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0XHRpdGVtLmVsdC51cGRhdGVUZW1wbGF0ZShpdGVtLmN0eCwgaXRlbURhdGEpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2UgaWYgKGlzSW5GaWx0ZXIoZGF0YSkpe1xuXHRcdFx0XHRcdHZhciBlbHQgPSAkKGl0ZW1UZW1wbGF0ZSlcblx0XHRcdFx0XHR2YXIgY3R4ID0gZWx0LnByb2Nlc3NUZW1wbGF0ZShpdGVtRGF0YSlcblx0XHRcdFx0XHRkaXNwbGF5ZWRJdGVtc1tpZF0gPSB7ZWx0LCBjdHh9XG5cdFx0XHRcdFx0dGJvZHkuYXBwZW5kKGVsdClcblx0XHRcdFx0fVxuXHRcdFx0XHRkYXRhc1tpZF0gPSBkYXRhXG5cdFx0XHR9XG5cblx0XHRcdHRoaXMucmVtb3ZlSXRlbSA9IGZ1bmN0aW9uKGlkKSB7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ3JlbW92ZUl0ZW0nLCBpZClcblx0XHRcdFx0aWYgKGRhdGFzW2lkXSAhPSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRkZWxldGUgZGF0YXNbaWRdXG5cdFx0XHRcdFx0dmFyIGl0ZW0gPSBkaXNwbGF5ZWRJdGVtc1tpZF1cblx0XHRcdFx0XHRpZiAoaXRlbSAhPSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRcdGl0ZW0uZWx0LnJlbW92ZSgpXG5cdFx0XHRcdFx0XHRkZWxldGUgZGlzcGxheWVkSXRlbXNbaWRdXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XHRcdFx0XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMuZ2V0SXRlbSA9IGZ1bmN0aW9uKGlkKSB7XG5cdFx0XHRcdHJldHVybiBkYXRhc1tpZF1cblx0XHRcdH1cblxuXHRcdFx0dGhpcy5yZW1vdmVBbGxJdGVtcyA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdyZW1vdmVBbGxJdGVtcycpXG5cdFx0XHRcdGRhdGFzID0ge31cblx0XHRcdFx0ZGlzcGxheWVkSXRlbXMgPSB7fVxuXHRcdFx0XHR0Ym9keS5lbXB0eSgpXHRcdFxuXHRcdFx0fVxuXG5cdFx0XHRmdW5jdGlvbiBpc0luRmlsdGVyKGRhdGEpIHtcblx0XHRcdFx0dmFyIHJldCA9IHRydWVcblx0XHRcdFx0Zm9yKHZhciBmIGluIF9maWx0ZXJzKSB7XG5cdFx0XHRcdFx0dmFyIHZhbHVlID0gZGF0YVtmXVxuXHRcdFx0XHRcdHZhciBmaWx0ZXJWYWx1ZSA9IF9maWx0ZXJzW2ZdXG5cdFx0XHRcdFx0cmV0ICY9IChmaWx0ZXJWYWx1ZSA9PSAnJyB8fCB2YWx1ZS5zdGFydHNXaXRoKGZpbHRlclZhbHVlKSlcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gcmV0XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMuc2V0RmlsdGVycyA9IGZ1bmN0aW9uKGZpbHRlcnMpIHtcblx0XHRcdFx0X2ZpbHRlcnMgPSBmaWx0ZXJzXG5cdFx0XHRcdGRpc3BUYWJsZSgpXG5cdFx0XHR9XG5cblxuXHRcdFx0ZnVuY3Rpb24gZGlzcFRhYmxlKCkge1xuXHRcdFx0XHRkaXNwbGF5ZWRJdGVtcyA9IHt9XG5cdFx0XHRcdGxldCBpdGVtcyA9IFtdXG5cdFx0XHRcdGZvcihsZXQgaWQgaW4gZGF0YXMpIHtcblx0XHRcdFx0XHR2YXIgZGF0YSA9IGRhdGFzW2lkXVxuXHRcdFx0XHRcdGlmIChpc0luRmlsdGVyKGRhdGEpKSB7XG5cdFx0XHRcdFx0XHR2YXIgaXRlbURhdGEgPSAkLmV4dGVuZCh7J19pZCc6IGlkfSwgZGF0YSlcblx0XHRcdFx0XHRcdHZhciBlbHQgPSAkKGl0ZW1UZW1wbGF0ZSlcblx0XHRcdFx0XHRcdHZhciBjdHggPSBlbHQucHJvY2Vzc1RlbXBsYXRlKGl0ZW1EYXRhKVx0XHRcdFxuXHRcdFx0XHRcdFx0aXRlbXMucHVzaChlbHQpXG5cdFx0XHRcdFx0XHRkaXNwbGF5ZWRJdGVtc1tpZF0gPSB7ZWx0LCBjdHh9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHRcdFxuXHRcdFx0XHR0Ym9keS5lbXB0eSgpLmFwcGVuZChpdGVtcylcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5nZXREYXRhcyA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gZGF0YXNcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5nZXREaXNwbGF5ZWREYXRhcyA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR2YXIgcmV0ID0ge31cblx0XHRcdFx0Zm9yKGxldCBpIGluIGRpc3BsYXllZEl0ZW1zKSB7XG5cdFx0XHRcdFx0cmV0W2ldID0gZGF0YXNbaV1cblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gcmV0XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMub24gPSBldmVudHMub24uYmluZChldmVudHMpXG5cblxuXHRcdH1cblx0fSlcblxufSkoKTtcbiIsIiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdGcmllbmRzUGFuZWxDb250cm9sJywge1xuXG5cdGRlcHM6IFsnV2ViU29ja2V0U2VydmljZSddLFxuXHRcblx0XG5cdGxpYjogJ2NvcmUnLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zLCBjbGllbnQpIHtcblxuXHRcdHZhciBjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoZWx0LCB7XG5cdFx0XHR0ZW1wbGF0ZTogXCI8ZGl2IHN0eWxlPVxcXCJkaXNwbGF5OiBmbGV4OyBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xcXCI+XFxuXHQ8aDEgY2xhc3M9XFxcInczLWNlbnRlclxcXCI+RnJpZW5kczwvaDE+XFxuXHQ8ZGl2IGNsYXNzPVxcXCJzY3JvbGxQYW5lbFxcXCI+XFxuXHRcdDxkaXYgYm4tZWFjaD1cXFwiZiBvZiBmcmllbmRzXFxcIj5cXG5cdFx0XHQ8ZGl2IGNsYXNzPVxcXCJpdGVtXFxcIj5cXG5cdFx0XHRcdDxkaXYgY2xhc3M9XFxcIm5hbWVcXFwiPlxcblx0XHRcdFx0XHQ8c3BhbiBibi10ZXh0PVxcXCJmLm5hbWVcXFwiPjwvc3Bhbj5cXG5cdFx0XHRcdDwvZGl2Plxcblx0XHRcdFx0PGRpdiBibi1zaG93PVxcXCJmLmlzQ29ubmVjdGVkXFxcIiBjbGFzcz1cXFwidzMtdGV4dC1ncmVlblxcXCI+XFxuXHRcdFx0XHRcdDxpIGNsYXNzPVxcXCJmYSBmYS1jaGVja1xcXCI+PC9pPlxcblx0XHRcdFx0PC9kaXY+XFxuXHRcdFx0PC9kaXY+XFxuXHRcdDwvZGl2Plxcblx0PC9kaXY+XHRcXG48L2Rpdj5cIixcblx0XHRcdGRhdGE6IHtcblx0XHRcdFx0ZnJpZW5kczogW11cblx0XHRcdH1cblx0XHR9KVxuXG5cdFx0Y2xpZW50LnJlZ2lzdGVyKCdtYXN0ZXJGcmllbmRzJywgdHJ1ZSwgb25GcmllbmRzKVxuXG5cdFx0ZnVuY3Rpb24gb25GcmllbmRzKG1zZykge1xuXHRcdFx0Y29uc29sZS5sb2coJ29uRnJpZW5kcycsIG1zZy5kYXRhKVxuXHRcdFx0Y3RybC5zZXREYXRhKHtmcmllbmRzOiBtc2cuZGF0YX0pXG5cdFx0fVxuXG5cdFx0dGhpcy5nZXRGcmllbmRzID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gY3RybC5tb2RlbC5mcmllbmRzXG5cdFx0fVxuXHR9XG59KTtcbiIsIlxuJCQucmVnaXN0ZXJDb250cm9sRXgoJ0hlYWRlckNvbnRyb2wnLCB7XG5cdGRlcHM6IFsnV2ViU29ja2V0U2VydmljZScsICdIdHRwU2VydmljZSddLFxuXHRvcHRpb25zOiB7XG5cdFx0dGl0bGU6ICdIZWxsbyBXb3JsZCcsXG5cdFx0dXNlck5hbWU6ICd1bmtub3duJyxcblx0XHRpc0hvbWVQYWdlOiBmYWxzZVxuXHR9LFxuXHRcblx0bGliOiAnY29yZScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMsIGNsaWVudCwgaHR0cCkge1xuXG5cdFx0dmFyIGRsZ0N0cmwgPSAkJC5kaWFsb2dDb250cm9sbGVyKCdOb3RpZmljYXRpb25zJywge1xuXHRcdFx0dGVtcGxhdGU6IFwiXFxuPHVsIGNsYXNzPVxcXCJ3My11bCB3My1ib3JkZXIgdzMtd2hpdGVcXFwiIGJuLWVhY2g9XFxcIm4gb2Ygbm90aWZzXFxcIiBcXG5cdGJuLWV2ZW50PVxcXCJjbGljay5kZWxldGU6IG9uRGVsZXRlLCBjbGljay5kZW55OiBvbkRlbnksIGNsaWNrLmFjY2VwdDogb25BY2NlcHRcXFwiPlxcblx0PGxpIGNsYXNzPVxcXCJ3My1iYXJcXFwiIGJuLWRhdGE9XFxcIm5vdGlmOiBuXFxcIiBibi1zaG93PVxcXCIhbi5pc0ludml0XFxcIj5cXG5cdFx0PHNwYW4gY2xhc3M9XFxcInczLWJ1dHRvbiB3My1yaWdodCBkZWxldGVcXFwiIHRpdGxlPVxcXCJEZWxldGVcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS10aW1lc1xcXCI+PC9pPjwvc3Bhbj5cXG5cXG5cdFx0PGRpdiBjbGFzcz1cXFwidzMtYmFyLWl0ZW1cXFwiIGJuLWh0bWw9XFxcIm4ubWVzc2FnZVxcXCIgPjwvZGl2Plxcblx0PC9saT5cXG5cdDxsaSBjbGFzcz1cXFwidzMtYmFyXFxcIiBibi1kYXRhPVxcXCJub3RpZjogblxcXCIgYm4tc2hvdz1cXFwibi5pc0ludml0XFxcIj5cXG5cdFx0PHNwYW4gY2xhc3M9XFxcInczLWJ1dHRvbiB3My1yaWdodCB3My1ncmVlbiBhY2NlcHRcXFwiPkFjY2VwdDwvaT48L3NwYW4+XFxuXHRcdDxzcGFuIGNsYXNzPVxcXCJ3My1idXR0b24gdzMtcmlnaHQgdzMtcmVkIGRlbnlcXFwiPkRlbnk8L2k+PC9zcGFuPlxcblxcblx0XHQ8ZGl2IGNsYXNzPVxcXCJ3My1iYXItaXRlbVxcXCIgYm4taHRtbD1cXFwibi5tZXNzYWdlXFxcIiA+PC9kaXY+XFxuXHQ8L2xpPlx0XHRcXG48L3VsPlx0XHRcXG5cIixcblx0XHRcdGRhdGE6IHtub3RpZnM6IFtdfSxcblx0XHRcdG9wdGlvbnM6IHtcblx0XHRcdFx0d2lkdGg6ICdhdXRvJ1xuXHRcdFx0fSxcblx0XHRcdGV2ZW50czoge1xuXHRcdFx0XHRvbkRlbGV0ZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0dmFyIG5vdGlmID0gJCh0aGlzKS5jbG9zZXN0KCdsaScpLmRhdGEoJ25vdGlmJylcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvbkRlbGV0ZScsIG5vdGlmKVxuXHRcdFx0XHRcdGh0dHAuZGVsZXRlKCcvYXBpL25vdGlmLycgKyBub3RpZi5pZClcblx0XHRcdFx0fSxcblx0XHRcdFx0b25BY2NlcHQ6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHZhciBub3RpZiA9ICQodGhpcykuY2xvc2VzdCgnbGknKS5kYXRhKCdub3RpZicpXG5cdFx0XHRcdFx0Y29uc29sZS5sb2coJ29uQWNjZXB0Jywgbm90aWYpXG5cblx0XHRcdFx0XHRodHRwLnBvc3QoJy9hcGkvbm90aWYvYWNjZXB0LycgKyBub3RpZi5mcm9tKVxuXG5cdFx0XHRcdFx0aHR0cC5kZWxldGUoJy9hcGkvbm90aWYvJyArIG5vdGlmLmlkKVxuXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9uRGVueTogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0dmFyIG5vdGlmID0gJCh0aGlzKS5jbG9zZXN0KCdsaScpLmRhdGEoJ25vdGlmJylcblx0XHRcdFx0XHRjb25zb2xlLmxvZygnb25EZW55Jywgbm90aWYpXG5cblx0XHRcdFx0XHRodHRwLmRlbGV0ZSgnL2FwaS9ub3RpZi8nICsgbm90aWYuaWQpXG5cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pXG5cblx0XHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xuXHRcdFx0dGVtcGxhdGU6IFwiPGRpdiA+XFxuXHQ8ZGl2IGNsYXNzPVxcXCJicmFuZFxcXCI+PGgxIGNsYXNzPVxcXCJibi14cy1oaWRlXFxcIiBibi10ZXh0PVxcXCJ0aXRsZVxcXCI+PC9oMT4gPC9kaXY+XFxuXHQ8ZGl2IGNsYXNzPVxcXCJpbmZvc1xcXCI+XFxuXHRcdDxidXR0b24gY2xhc3M9XFxcIm5vdGlmaWNhdGlvbiB3My1idG5cXFwiIHRpdGxlPVxcXCJub3RpZmljYXRpb25cXFwiIGJuLWV2ZW50PVxcXCJjbGljazogb25Ob3RpZmljYXRpb25cXFwiPlxcblx0XHRcdDxpIGNsYXNzPVxcXCJmYSBmYS1sZyBmYS1iZWxsIHczLXRleHQtd2hpdGVcXFwiID48L2k+XFxuXHRcdFx0PHNwYW4gY2xhc3M9XFxcInczLWJhZGdlIHczLXJlZCB3My10aW55XFxcIiBibi10ZXh0PVxcXCJuYk5vdGlmXFxcIiBibi1zaG93PVxcXCJpc05vdGlmVmlzaWJsZVxcXCI+PC9zcGFuPlx0XHRcdFxcblx0XHQ8L2J1dHRvbj5cXG5cXG5cdCAgICA8aSBibi1hdHRyPVxcXCJ0aXRsZTogdGl0bGVTdGF0ZVxcXCIgY2xhc3M9XFxcImZhIGZhLWxnIGNvbm5lY3Rpb25TdGF0ZVxcXCIgYm4tY2xhc3M9XFxcImZhLWV5ZTogY29ubmVjdGVkLCBmYS1leWUtc2xhc2g6ICFjb25uZWN0ZWRcXFwiPjwvaT5cXG5cXG5cdCAgICA8ZGl2Plxcblx0XHQgICAgPGkgY2xhc3M9XFxcImZhIGZhLXVzZXIgZmEtbGdcXFwiPjwvaT5cXG5cdFx0ICAgIDxzcGFuIGJuLXRleHQ9XFxcInVzZXJOYW1lXFxcIiBjbGFzcz1cXFwidXNlck5hbWVcXFwiPjwvc3Bhbj5cdCAgICBcdFxcblx0ICAgIDwvZGl2Plxcblxcblx0ICAgIDxidXR0b24gdGl0bGU9XFxcImxvZ291dFxcXCIgY2xhc3M9XFxcInczLWJ0blxcXCIgYm4tZXZlbnQ9XFxcImNsaWNrOiBvbkRpc2Nvbm5lY3RcXFwiIGJuLXNob3c9XFxcImlzSG9tZVBhZ2VcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1wb3dlci1vZmYgZmEtbGdcXFwiPjwvaT48L2J1dHRvbj4gXFxuXFxuXHQgICAgPGJ1dHRvbiB0aXRsZT1cXFwiaG9tZVxcXCIgY2xhc3M9XFxcInczLWJ0blxcXCIgYm4tZXZlbnQ9XFxcImNsaWNrOiBvbkdvSG9tZVxcXCIgYm4tc2hvdz1cXFwiIWlzSG9tZVBhZ2VcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1ob21lIGZhLWxnXFxcIj48L2k+PC9idXR0b24+IFxcblxcblx0PC9kaXY+XFxuXFxuXFxuPC9kaXY+XCIsXG5cdFx0XHRkYXRhOiB7XG5cdFx0XHRcdGNvbm5lY3RlZDogZmFsc2UsXG5cdFx0XHRcdHRpdGxlU3RhdGU6IFwiV2ViU29ja2V0IGRpc2Nvbm5lY3RlZFwiLFxuXHRcdFx0XHR0aXRsZTogb3B0aW9ucy50aXRsZSxcblx0XHRcdFx0dXNlck5hbWU6IG9wdGlvbnMudXNlck5hbWUsXG5cdFx0XHRcdGlzSG9tZVBhZ2U6IG9wdGlvbnMuaXNIb21lUGFnZSxcblx0XHRcdFx0bmJOb3RpZjogMCxcblx0XHRcdFx0XG5cdFx0XHRcdGlzTm90aWZWaXNpYmxlOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5uYk5vdGlmID4gMFxuXHRcdFx0XHR9XHRcdFx0XHRcblx0XHRcdH0sXG5cdFx0XHRldmVudHM6IHtcblx0XHRcdFx0b25Hb0hvbWU6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGxvY2F0aW9uLmhyZWYgPSAnLydcblx0XHRcdFx0fSxcblxuXHRcdFx0XHRvbkRpc2Nvbm5lY3Q6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHNlc3Npb25TdG9yYWdlLmNsZWFyKClcblx0XHRcdFx0XHRsb2NhdGlvbi5ocmVmID0gJy9kaXNjb25uZWN0J1xuXHRcdFx0XHR9LFxuXG5cdFx0XHRcdG9uTm90aWZpY2F0aW9uOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRjb25zb2xlLmxvZygnb25Ob3RpZmljYXRpb24nKVxuXHRcdFx0XHRcdGlmIChjdHJsLm1vZGVsLm5iTm90aWYgPT0gMCkge1xuXHRcdFx0XHRcdFx0JCQuc2hvd0FsZXJ0KCdubyBub3RpZmljYXRpb25zJywgJ05vdGlmaWNhdGlvbnMnKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdGRsZ0N0cmwuc2hvdygpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSlcblxuXG5cdFx0Y2xpZW50LmV2ZW50cy5vbignY29ubmVjdCcsIGZ1bmN0aW9uKCkge1xuXHRcdFx0Y29uc29sZS5sb2coJ1tIZWFkZXJDb250cm9sXSBjbGllbnQgY29ubmVjdGVkJylcblx0XHRcdGN0cmwuc2V0RGF0YSh7Y29ubmVjdGVkOiB0cnVlLCB0aXRsZVN0YXRlOiBcIldlYlNvY2tldCBjb25uZWN0ZWRcIn0pXG5cblx0XHR9KVxuXG5cdFx0Y2xpZW50LmV2ZW50cy5vbignZGlzY29ubmVjdCcsIGZ1bmN0aW9uKCkge1xuXHRcdFx0Y29uc29sZS5sb2coJ1tIZWFkZXJDb250cm9sXSBjbGllbnQgZGlzY29ubmVjdGVkJylcblx0XHRcdGN0cmwuc2V0RGF0YSh7Y29ubmVjdGVkOiBmYWxzZSwgdGl0bGVTdGF0ZTogXCJXZWJTb2NrZXQgZGlzY29ubmVjdGVkXCJ9KVxuXG5cdFx0fSlcblxuXHRcdGNsaWVudC5yZWdpc3RlcignbWFzdGVyTm90aWZpY2F0aW9ucycsIHRydWUsIG9uTm90aWZpY2F0aW9ucylcblxuXHRcdGZ1bmN0aW9uIG9uTm90aWZpY2F0aW9ucyhtc2cpIHtcblx0XHRcdGNvbnNvbGUubG9nKCdvbk5vdGlmaWNhdGlvbnMnLCBtc2cuZGF0YSlcblx0XHRcdGN0cmwuc2V0RGF0YSh7bmJOb3RpZjogbXNnLmRhdGEubGVuZ3RofSlcblx0XHRcdGRsZ0N0cmwuc2V0RGF0YSh7XG5cdFx0XHRcdG5vdGlmczogbXNnLmRhdGEubWFwKChpdGVtKSA9PiB7XG5cdFx0XHRcdFx0aXRlbS5pc0ludml0ID0gKGl0ZW0udHlwZSA9PSAnaW52aXQnKVxuXHRcdFx0XHRcdHJldHVybiBpdGVtXG5cdFx0XHRcdH0pXG5cdFx0XHR9KVxuXHRcdFx0aWYgKG1zZy5kYXRhLmxlbmd0aCA9PSAwKSB7XG5cdFx0XHRcdGRsZ0N0cmwuaGlkZSgpXG5cdFx0XHR9XG5cdFx0fVxuXG5cblx0fVxuXG59KTtcblxuXG4iLCIkJC5yZWdpc3RlckNvbnRyb2xFeCgnSG9tZUNvbnRyb2wnLCB7XG5cdGRlcHM6IFsnSHR0cFNlcnZpY2UnXSxcblxuXHRcblx0bGliOiAnY29yZScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMsIGh0dHApIHtcblxuXHRcdHZhciBjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoZWx0LCB7XG5cdFx0XHR0ZW1wbGF0ZTogXCI8ZGl2IGNsYXNzPVxcXCJtYWluXFxcIj5cXG5cXG5cXG5cdDxzdHJvbmc+QXZhaWxhYmxlIGFwcHM6PC9zdHJvbmc+XFxuXHQ8ZGl2IGNsYXNzPVxcXCJjb250ZW50XFxcIiBibi1lYWNoPVxcXCJhcHAgb2YgYXBwc1xcXCI+XFxuXHRcdFx0PGEgYm4tYXR0cj1cXFwiY2xhc3M6IGFwcC5jbGFzc05hbWUsIGhyZWY6YXBwLmhyZWYsIHRpdGxlOmFwcC5kZXNjXFxcIj5cXG5cdFx0XHRcdFxcblx0XHRcdFx0PGRpdiBjbGFzcz1cXFwiYm4tZmxleC1jb2xcXFwiIHN0eWxlPVxcXCJoZWlnaHQ6IDEwMCU7IGp1c3RpZnktY29udGVudDogY2VudGVyO1xcXCI+XFxuXHRcdFx0XHRcdDxkaXYgY2xhc3M9XFxcImJuLWZsZXgtMSBibi1mbGV4LXJvd1xcXCIgc3R5bGU9XFxcImFsaWduLWl0ZW1zOiBjZW50ZXI7IGp1c3RpZnktY29udGVudDogY2VudGVyO1xcXCIgYm4tc2hvdz1cXFwiYXBwLmhhc1RpbGVJY29uXFxcIj5cXG5cdFx0XHRcdFx0XHQ8aSBibi1hdHRyPVxcXCJjbGFzczogYXBwLnRpbGVJY29uXFxcIj48L2k+XFxuXHRcdFx0XHRcdDwvZGl2Plxcblxcblx0XHRcdFx0XHQ8c3BhbiBibi10ZXh0PVxcXCJhcHAudGlsZU5hbWVcXFwiPjwvc3Bhbj5cXG5cdFx0XHRcdDwvZGl2Plxcblxcblx0XHRcdDwvYT5cXG5cdDwvZGl2PlxcblxcblxcbjwvZGl2PlwiLFxuXHRcdFx0ZGF0YToge1xuXHRcdFx0XHRhcHBzOiBbXVxuXHRcdFx0XHRcblx0XHRcdH1cblxuXHRcdH0pXG5cblx0XHRodHRwLmdldCgnL2FwaS9hcHAvd2ViYXBwcycpLnRoZW4oKGFwcEluZm9zKSA9PiB7XG5cdFx0XHQvL2NvbnNvbGUubG9nKCdhcHBJbmZvcycsIGFwcEluZm9zKVxuXG5cdFx0XHR2YXIgYXBwcyA9IFtdXG5cblx0XHRcdGZvcih2YXIgayBpbiBhcHBJbmZvcykge1xuXHRcdFx0XHR2YXIgYXBwSW5mbyA9IGFwcEluZm9zW2tdXG5cdFx0XHRcdHZhciB0aWxlTmFtZSA9IGtcblx0XHRcdFx0dmFyIGRlc2MgPSAnJ1xuXHRcdFx0XHR2YXIgdGlsZUNvbG9yID0gJ3czLWJsdWUnXG5cdFx0XHRcdHZhciBwcm9wcyA9IGFwcEluZm8ucHJvcHNcblx0XHRcdFx0aWYgKHR5cGVvZiBwcm9wcy50aWxlTmFtZSA9PSAnc3RyaW5nJykge1xuXHRcdFx0XHRcdHRpbGVOYW1lID0gcHJvcHMudGlsZU5hbWVcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAodHlwZW9mIHByb3BzLmRlc2MgPT0gJ3N0cmluZycpIHtcblx0XHRcdFx0XHRkZXNjID0gcHJvcHMuZGVzY1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICh0eXBlb2YgcHJvcHMudGlsZUNvbG9yID09ICdzdHJpbmcnKSB7XG5cdFx0XHRcdFx0dGlsZUNvbG9yID0gcHJvcHMudGlsZUNvbG9yXG5cdFx0XHRcdH1cblx0XHRcdFx0dmFyIGNsYXNzTmFtZSA9IFwidzMtYnRuIGFwcEljb24gXCIgKyB0aWxlQ29sb3Jcblx0XHRcdFx0dmFyIGhyZWYgPSBcIi9hcHBzL1wiICsga1xuXG5cdFx0XHRcdGFwcHMucHVzaCh7XG5cdFx0XHRcdFx0dGlsZUljb246IHByb3BzLnRpbGVJY29uLFxuXHRcdFx0XHRcdHRpbGVDb2xvcixcblx0XHRcdFx0XHR0aWxlTmFtZSxcblx0XHRcdFx0XHRkZXNjLFxuXHRcdFx0XHRcdHRpbGVDb2xvcixcblx0XHRcdFx0XHRjbGFzc05hbWUsXG5cdFx0XHRcdFx0aHJlZixcblx0XHRcdFx0XHRoYXNUaWxlSWNvbjogcHJvcHMudGlsZUljb24gIT0gdW5kZWZpbmVkXG5cdFx0XHRcdH0pXG5cblx0XHRcdH1cblxuXHRcdFx0Ly9jb25zb2xlLmxvZygnYXBwcycsIGFwcHMpXG5cdFx0XHRjdHJsLnNldERhdGEoe2FwcHN9KVxuXHRcdFx0XG5cdFx0fSlcblxuXHR9XG5cbn0pO1xuXG4iLCJcbiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdJbnB1dEdyb3VwQ29udHJvbCcsIHtcblx0XG5cdGxpYjogJ2NvcmUnLFxuaW5pdDogZnVuY3Rpb24oZWx0KSB7XG5cblx0XHR2YXIgaWQgPSBlbHQuY2hpbGRyZW4oJ2lucHV0JykudW5pcXVlSWQoKS5hdHRyKCdpZCcpXG5cdFx0Ly9jb25zb2xlLmxvZygnW0lucHV0R3JvdXBDb250cm9sXSBpZCcsIGlkKVxuXHRcdGVsdC5jaGlsZHJlbignbGFiZWwnKS5hdHRyKCdmb3InLCBpZClcblx0fVxufSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cblx0JCQucmVnaXN0ZXJDb250cm9sRXgoJ05hdmJhckNvbnRyb2wnLCB7XG5cblx0XHRvcHRpb25zOiB7XG5cdFx0XHRhY3RpdmVDb2xvcjogJ3czLWdyZWVuJ1xuXHRcdH0sXG5cblx0XHRcblx0bGliOiAnY29yZScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMpIHtcblxuXHRcdFx0dmFyIGFjdGl2ZUNvbG9yID0gb3B0aW9ucy5hY3RpdmVDb2xvclxuXG5cblx0XHRcdC8vY29uc29sZS5sb2coJ1tOYXZiYXJDb250cm9sXSBvcHRpb25zJywgb3B0aW9ucylcblxuXHRcdFx0ZWx0LmFkZENsYXNzKCd3My1iYXInKVxuXHRcdFx0ZWx0LmNoaWxkcmVuKCdhJykuZWFjaChmdW5jdGlvbigpIHtcblx0XHRcdFx0JCh0aGlzKS5hZGRDbGFzcygndzMtYmFyLWl0ZW0gdzMtYnV0dG9uJylcblx0XHRcdH0pXG5cblx0XHRcdCQod2luZG93KS5vbigncm91dGVDaGFuZ2VkJywgZnVuY3Rpb24oZXZ0LCBuZXdSb3V0ZSkge1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdbTmF2YmFyQ29udHJvbF0gcm91dGVDaGFuZ2UnLCBuZXdSb3V0ZSlcblxuXHRcdFx0XHRlbHQuY2hpbGRyZW4oYGEuJHthY3RpdmVDb2xvcn1gKS5yZW1vdmVDbGFzcyhhY3RpdmVDb2xvcilcdFxuXHRcdFx0XHRlbHQuY2hpbGRyZW4oYGFbaHJlZj1cIiMke25ld1JvdXRlfVwiXWApLmFkZENsYXNzKGFjdGl2ZUNvbG9yKVxuXG5cdFx0XHR9KVx0XG5cdFx0fVxuXG5cdH0pXG5cblxufSkoKTtcblxuXG4iLCIkJC5yZWdpc3RlckNvbnRyb2xFeCgnUGljdHVyZUNhcm91c2VsQ29udHJvbCcsIHtcblxuXHRwcm9wczoge1xuXHRcdGluZGV4OiB7dmFsOiAwLCBzZXQ6ICdzZXRJbmRleCd9LFxuXHRcdGltYWdlczoge3ZhbDogW10sIHNldDogJ3NldEltYWdlcyd9XG5cdH0sXG5cdG9wdGlvbnM6IHtcblx0XHR3aWR0aDogMzAwLFxuXHRcdGhlaWdodDogMjAwLFxuXHRcdGFuaW1hdGVEZWxheTogMTAwMCxcblx0XHRjb2xvcjogJ3llbGxvdydcblx0fSxcdFxuXG5cdGlmYWNlOiAnc2V0SW1hZ2VzKGltYWdlcyk7c2V0SW5kZXgoaWR4KScsXG5cblx0XG5cdGxpYjogJ2NvcmUnLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zKSB7XG5cblx0XHRjb25zb2xlLmxvZyhgW1BpY3R1cmVDYXJvdXNlbENvbnRyb2xdIG9wdGlvbnNgLCBvcHRpb25zKVxuXG5cdFx0dmFyIGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihlbHQsIHtcblx0XHRcdHRlbXBsYXRlOiBcIjxkaXYgYm4tY29udHJvbD1cXFwiQ2Fyb3VzZWxDb250cm9sXFxcIiBibi1vcHRpb25zPVxcXCJjYXJvdXNlbEN0cmxPcHRpb25zXFxcIiBibi1lYWNoPVxcXCJpIG9mIGltYWdlc1xcXCIgYm4taWZhY2U9XFxcImNhcm91c2VsQ3RybFxcXCIgYm4tZGF0YT1cXFwiaW5kZXg6IGluZGV4XFxcIj5cXG5cdDxkaXYgc3R5bGU9XFxcInRleHQtYWxpZ246IGNlbnRlcjtcXFwiIGJuLXN0eWxlPVxcXCJiYWNrZ3JvdW5kLWNvbG9yOiBiYWNrQ29sb3JcXFwiPlxcblx0XHQ8aW1nIGJuLWF0dHI9XFxcInNyYzogaVxcXCIgc3R5bGU9XFxcImhlaWdodDogMTAwJVxcXCI+XFxuXHQ8L2Rpdj5cXG48L2Rpdj5cIixcblx0XHRcdGRhdGE6IHtcblx0XHRcdFx0Y2Fyb3VzZWxDdHJsT3B0aW9uczogb3B0aW9ucyxcblx0XHRcdFx0aW1hZ2VzOiBvcHRpb25zLmltYWdlcyxcblx0XHRcdFx0YmFja0NvbG9yOiBvcHRpb25zLmNvbG9yLFxuXHRcdFx0XHRpbmRleDogb3B0aW9ucy5pbmRleFxuXHRcdFx0fVxuXHRcdH0pXG5cblx0XHR0aGlzLnNldEltYWdlcyA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHQvL2NvbnNvbGUubG9nKCdbUGljdHVyZUNhcm91c2VsQ29udHJvbF0gc2V0SW1hZ2VzJywgdmFsdWUpXG5cdFx0XHRjdHJsLnNldERhdGEoJ2ltYWdlcycsIHZhbHVlKVxuXHRcdFx0Y3RybC5zY29wZS5jYXJvdXNlbEN0cmwucmVmcmVzaCgpXHRcdFx0XG5cdFx0fSxcblx0XHR0aGlzLnNldEluZGV4ID0gZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdGN0cmwuc2V0RGF0YSgnaW5kZXgnLCB2YWx1ZSlcblx0XHR9XG5cblx0fVxufSk7IiwiKGZ1bmN0aW9uKCkge1xuXG5cdCQkLnJlZ2lzdGVyQ29udHJvbCgnUmFkaW9Hcm91cENvbnRyb2wnLCBmdW5jdGlvbihlbHQpIHtcblxuXHRcdGVsdC5vbignY2xpY2snLCAnaW5wdXRbdHlwZT1yYWRpb10nLCBmdW5jdGlvbigpIHtcblx0XHRcdC8vY29uc29sZS5sb2coJ3JhZGlvZ3JvdXAgY2xpY2snKVxuXHRcdFx0ZWx0LmZpbmQoJ2lucHV0W3R5cGU9cmFkaW9dOmNoZWNrZWQnKS5wcm9wKCdjaGVja2VkJywgZmFsc2UpXG5cdFx0XHQkKHRoaXMpLnByb3AoJ2NoZWNrZWQnLCB0cnVlKVxuXHRcdFx0ZWx0LnRyaWdnZXIoJ2lucHV0Jylcblx0XHR9KVxuXHRcdFxuXG5cdFx0dGhpcy5nZXRWYWx1ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIGVsdC5maW5kKCdpbnB1dFt0eXBlPXJhZGlvXTpjaGVja2VkJykudmFsKClcblx0XHR9XG5cblx0XHR0aGlzLnNldFZhbHVlID0gZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdGVsdC5maW5kKCdpbnB1dFt0eXBlPXJhZGlvXScpLmVhY2goZnVuY3Rpb24oKSB7XG5cdFx0XHRcdCQodGhpcykucHJvcCgnY2hlY2tlZCcsIHZhbHVlID09PSAkKHRoaXMpLnZhbCgpKVxuXHRcdFx0fSlcdFx0XHRcblx0XHR9XG5cblxuXHR9KVxuXG5cbn0pKCk7XG5cblxuIiwiKGZ1bmN0aW9uKCkge1xuXG5cdGZ1bmN0aW9uIG1hdGNoUm91dGUocm91dGUsIHBhdHRlcm4pIHtcblx0XHQvL2NvbnNvbGUubG9nKCdtYXRjaFJvdXRlJywgcm91dGUsIHBhdHRlcm4pXG5cdFx0dmFyIHJvdXRlU3BsaXQgPSByb3V0ZS5zcGxpdCgnLycpXG5cdFx0dmFyIHBhdHRlcm5TcGxpdCA9IHBhdHRlcm4uc3BsaXQoJy8nKVxuXHRcdC8vY29uc29sZS5sb2cocm91dGVTcGxpdCwgcGF0dGVyblNwbGl0KVxuXHRcdHZhciByZXQgPSB7fVxuXG5cdFx0aWYgKHJvdXRlU3BsaXQubGVuZ3RoICE9IHBhdHRlcm5TcGxpdC5sZW5ndGgpXG5cdFx0XHRyZXR1cm4gbnVsbFxuXG5cdFx0Zm9yKHZhciBpZHggPSAwOyBpZHggPCBwYXR0ZXJuU3BsaXQubGVuZ3RoOyBpZHgrKykge1xuXHRcdFx0dmFyIHBhdGggPSBwYXR0ZXJuU3BsaXRbaWR4XVxuXHRcdFx0Ly9jb25zb2xlLmxvZygncGF0aCcsIHBhdGgpXG5cdFx0XHRpZiAocGF0aC5zdWJzdHIoMCwgMSkgPT09ICc6Jykge1xuXHRcdFx0XHRpZiAocm91dGVTcGxpdFtpZHhdLmxlbmd0aCA9PT0gMClcblx0XHRcdFx0XHRyZXR1cm4gbnVsbFxuXHRcdFx0XHRyZXRbcGF0aC5zdWJzdHIoMSldID0gcm91dGVTcGxpdFtpZHhdXG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmIChwYXRoICE9PSByb3V0ZVNwbGl0W2lkeF0pIHtcblx0XHRcdFx0cmV0dXJuIG51bGxcblx0XHRcdH1cblxuXHRcdH1cblxuXHRcdHJldHVybiByZXRcblx0fVxuXG5cblxuXG5cdCQkLnJlZ2lzdGVyQ29udHJvbEV4KCdSb3V0ZXJDb250cm9sJywge1xuXG5cdFx0b3B0aW9uczoge1xuXHRcdFx0cm91dGVzOiBbXVxuXHRcdH0sXG5cdFx0XG5cdGxpYjogJ2NvcmUnLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zKSB7XG5cblxuXG5cdFx0XHR2YXIgcm91dGVzID0gb3B0aW9ucy5yb3V0ZXNcblxuXHRcdFx0aWYgKCFBcnJheS5pc0FycmF5KHJvdXRlcykpIHtcblx0XHRcdFx0Y29uc29sZS53YXJuKCdbUm91dGVyQ29udHJvbF0gYmFkIG9wdGlvbnMnKVxuXHRcdFx0XHRyZXR1cm5cblx0XHRcdH1cblxuXG5cdFx0XHRmdW5jdGlvbiBwcm9jZXNzUm91dGUoaW5mbykge1xuXHRcdFx0XHRjb25zb2xlLmxvZygnW1JvdXRlckNvbnRyb2xdIHByb2Nlc3NSb3V0ZScsIGluZm8pXG5cblx0XHRcdFx0dmFyIG5ld1JvdXRlID0gaW5mby5jdXJSb3V0ZVxuXG5cdFx0XHRcdGZvcih2YXIgcm91dGUgb2Ygcm91dGVzKSB7XG5cdFx0XHRcdFx0dmFyIHBhcmFtcyA9IG1hdGNoUm91dGUobmV3Um91dGUsIHJvdXRlLmhyZWYpXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhgcm91dGU6ICR7cm91dGUuaHJlZn0sIHBhcmFtc2AsIHBhcmFtcylcblx0XHRcdFx0XHRpZiAocGFyYW1zICE9IG51bGwpIHtcblx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ1tSb3V0ZXJDb250cm9sXSBwYXJhbXMnLCBwYXJhbXMpXG5cdFx0XHRcdFx0XHRpZiAodHlwZW9mIHJvdXRlLnJlZGlyZWN0ID09ICdzdHJpbmcnKSB7XG5cdFx0XHRcdFx0XHRcdGxvY2F0aW9uLmhyZWYgPSAnIycgKyByb3V0ZS5yZWRpcmVjdFxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0ZWxzZSBpZiAodHlwZW9mIHJvdXRlLmNvbnRyb2wgPT0gJ3N0cmluZycpIHtcblxuXHRcdFx0XHRcdFx0XHR2YXIgY3VyQ3RybCA9IGVsdC5maW5kKCcuQ3VzdG9tQ29udHJvbCcpLmludGVyZmFjZSgpXG5cdFx0XHRcdFx0XHRcdHZhciBjYW5DaGFuZ2UgPSB0cnVlXG5cdFx0XHRcdFx0XHRcdGlmIChjdXJDdHJsICYmIHR5cGVvZiBjdXJDdHJsLmNhbkNoYW5nZSA9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0XHRcdFx0Y2FuQ2hhbmdlID0gY3VyQ3RybC5jYW5DaGFuZ2UoKVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdGlmIChjYW5DaGFuZ2UpIHtcblx0XHRcdFx0XHRcdFx0XHQkKHdpbmRvdykudHJpZ2dlcigncm91dGVDaGFuZ2VkJywgbmV3Um91dGUpXG5cdFx0XHRcdFx0XHRcdFx0dmFyIGNvbmZpZyA9ICQuZXh0ZW5kKHskcGFyYW1zOiBwYXJhbXN9LCByb3V0ZS5vcHRpb25zKVx0XG5cdFx0XHRcdFx0XHRcdFx0dmFyIGh0bWwgPSAkKGA8ZGl2IGJuLWNvbnRyb2w9XCIke3JvdXRlLmNvbnRyb2x9XCIgYm4tb3B0aW9ucz1cImNvbmZpZ1wiIGNsYXNzPVwiYm4tZmxleC1jb2wgYm4tZmxleC0xXCI+PC9kaXY+YClcblx0XHRcdFx0XHRcdFx0XHRlbHQuZGlzcG9zZSgpLmh0bWwoaHRtbClcblx0XHRcdFx0XHRcdFx0XHRodG1sLnByb2Nlc3NVSSh7Y29uZmlnOiBjb25maWd9KVx0XHRcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRlbHNlIGlmIChpbmZvLnByZXZSb3V0ZSkge1xuXHRcdFx0XHRcdFx0XHRcdGhpc3RvcnkucmVwbGFjZVN0YXRlKHt9LCAnJywgJyMnICsgaW5mby5wcmV2Um91dGUpXG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHQvL2VsdC5odG1sKGh0bWwpXG5cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdHJldHVybiB0cnVlXG5cdFx0XHRcdFx0fVx0XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIGZhbHNlXG5cblx0XHRcdH1cdFx0XG5cblx0XHRcdCQod2luZG93KS5vbigncm91dGVDaGFuZ2UnLCBmdW5jdGlvbihldiwgaW5mbykge1xuXHRcdFx0XHRpZiAoIXByb2Nlc3NSb3V0ZShpbmZvKSkge1xuXHRcdFx0XHRcdGNvbnNvbGUud2FybihgW1JvdXRlckNvbnRyb2xdIG5vIGFjdGlvbiBkZWZpbmVkIGZvciByb3V0ZSAnJHtuZXdSb3V0ZX0nYClcblx0XHRcdFx0fVxuXHRcdFx0fSlcblxuXG5cdFx0fVxuXG5cdH0pXG5cbn0pKCk7XG5cblxuIl19
