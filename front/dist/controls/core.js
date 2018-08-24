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
			template: "<div style=\"display: flex; flex-direction: column;\">\n	<h1 class=\"w3-center\">Friends</h1>\n	<div class=\"scrollPanel\">\n		<div bn-each=\"f of friends\" bn-event=\"click.name: onItemClicked\">\n			<div class=\"item\" bn-data=\"info: f\">\n				<div class=\"name\">\n					<span bn-text=\"f.name\"></span>\n				</div>\n				<div bn-show=\"f.isConnected\" class=\"w3-text-green\">\n					<i class=\"fa fa-check\"></i>\n				</div>\n			</div>\n		</div>\n	</div>	\n</div>",
			data: {
				friends: []
			},
			events: {
				onItemClicked: function() {
					var data = $(this).closest('.item').data('info')
					console.log('onItemClicked', data)
					elt.trigger('friendSelected', data)
				}
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
	deps: ['WebSocketService', 'InvitService', 'NotifService'],
	options: {
		title: 'Hello World',
		userName: 'unknown',
		isHomePage: false
	},
	
	lib: 'core',
init: function(elt, options, client, invitSrv, notifSrv) {

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
					notifSrv.delete(notif.id)
				},
				onAccept: function() {
					var notif = $(this).closest('li').data('notif')
					console.log('onAccept', notif)

					invitSrv.accept(notif.from)

					notifSrv.delete(notif.id)

				},
				onDeny: function() {
					var notif = $(this).closest('li').data('notif')
					console.log('onDeny', notif)

					notifSrv.delete(notif.id)

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
	deps: ['AppService'],

	
	lib: 'core',
init: function(elt, options, appSrv) {

		var ctrl = $$.viewController(elt, {
			template: "<div class=\"main\">\n\n\n	<strong>Available apps:</strong>\n	<div class=\"content\" bn-each=\"app of apps\">\n			<a bn-attr=\"class: app.className, href:app.href, title:app.desc\">\n				\n				<div class=\"bn-flex-col\" style=\"height: 100%; justify-content: center;\">\n					<div class=\"bn-flex-1 bn-flex-row\" style=\"align-items: center; justify-content: center;\" bn-show=\"app.hasTileIcon\">\n						<i bn-attr=\"class: app.tileIcon\"></i>\n					</div>\n\n					<span bn-text=\"app.tileName\"></span>\n				</div>\n\n			</a>\n	</div>\n\n\n</div>",
			data: {
				apps: []
				
			}

		})

		appSrv.getUserAppsInfo().then((appInfos) => {
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



//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNhcm91c2VsLmpzIiwiY2hlY2tncm91cC5qcyIsImVkaXRvci5qcyIsImZpbHRlcmVkLXRhYmxlLmpzIiwiZnJpZW5kcy5qcyIsImhlYWRlci5qcyIsImhvbWUuanMiLCJpbnB1dGdyb3VwLmpzIiwibmF2YmFyLmpzIiwicGljdHVyZWNhcm91c2VsLmpzIiwicmFkaW9ncm91cC5qcyIsInJvdXRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiY29yZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpIHtcblxuXHQkJC5yZWdpc3RlckNvbnRyb2xFeCgnQ2Fyb3VzZWxDb250cm9sJywge1xuXG5cdFx0cHJvcHM6IHtcblxuXHRcdFx0aW5kZXg6IHtcblx0XHRcdFx0dmFsOiAwLFxuXHRcdFx0XHRzZXQ6ICdzZXRJbmRleCdcblx0XHRcdH0gXG5cdFx0fSxcblx0XHRvcHRpb25zOiB7XG5cdFx0XHR3aWR0aDogMzAwLFxuXHRcdFx0aGVpZ2h0OiAyMDAsXG5cdFx0XHRhbmltYXRlRGVsYXk6IDEwMDAsXG5cdFx0XG5cdFx0fSxcblx0XHRpZmFjZTogJ3NldEluZGV4KGlkeCk7cmVmcmVzaCgpJyxcblxuXHRcdFxuXHRsaWI6ICdjb3JlJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucykge1xuXHRcblxuXG5cdFx0XHR2YXIgd2lkdGggPSBvcHRpb25zLndpZHRoICsgJ3B4J1xuXHRcdFx0dmFyIGhlaWdodCA9IG9wdGlvbnMuaGVpZ2h0ICsgJ3B4J1xuXHRcdFx0ZWx0LmNzcygnd2lkdGgnLCB3aWR0aCkuY3NzKCdoZWlnaHQnLCBoZWlnaHQpXG5cblx0XHRcdGNvbnNvbGUubG9nKGBbQ2Fyb3VzZWxDb250cm9sXSBvcHRpb25zYCwgb3B0aW9ucylcblxuXHRcdFx0dmFyIGN0cmwgPSBudWxsXG5cdFx0XHR2YXIgaXRlbXNcblx0XHRcdHZhciBpZHhcblxuXG5cdFx0XHR0aGlzLnJlZnJlc2ggPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnW0Nhcm91c2VsQ29udHJvbF0gcmVmcmVzaCcpXG5cdFx0XHRcdGl0ZW1zID0gZWx0LmNoaWxkcmVuKCdkaXYnKS5yZW1vdmUoKS5jc3MoJ3dpZHRoJywgd2lkdGgpLmNzcygnaGVpZ2h0JywgaGVpZ2h0KVx0XHRcblxuXHRcdFx0XHRpZHggPSBNYXRoLm1heCgwLCBNYXRoLm1pbihvcHRpb25zLmluZGV4LCBpdGVtcy5sZW5ndGgpKVxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKGBbQ2Fyb3VzZWxDb250cm9sXSBpZHhgLCBpZHgpXG5cblx0XHRcdFx0ZnVuY3Rpb24gYW5pbWF0ZShkaXJlY3Rpb24pIHtcblx0XHRcdFx0XHRjdHJsLnNldERhdGEoe2xlZnREaXNhYmxlZDogdHJ1ZSwgcmlnaHREaXNhYmxlZDogdHJ1ZX0pXG5cdFx0XHRcdFx0dmFyIG9wID0gZGlyZWN0aW9uID09ICdsZWZ0JyA/ICcrPScgOiAnLT0nXG5cdFx0XHRcdFx0aWR4ID0gZGlyZWN0aW9uID09ICdsZWZ0JyA/IGlkeC0xIDogaWR4KzFcblxuXHRcdFx0XHRcdGN0cmwuc2NvcGUuaXRlbXMuYW5pbWF0ZSh7bGVmdDogb3AgKyB3aWR0aH0sIG9wdGlvbnMuYW5pbWF0ZURlbGF5LCBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdGNoZWNrQnRucygpXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihlbHQsIHtcblx0XHRcdFx0XHR0ZW1wbGF0ZTogXCI8ZGl2IGNsYXNzPVxcXCJjb250YWluZXJcXFwiPlxcblx0PGRpdiBjbGFzcz1cXFwidmlld3BvcnRcXFwiPlxcblx0XHQ8ZGl2IGNsYXNzPVxcXCJpdGVtc1xcXCIgYm4tYmluZD1cXFwiaXRlbXNcXFwiPjwvZGl2Plx0XFxuXHQ8L2Rpdj5cXG5cdDxkaXYgY2xhc3M9XFxcIm92ZXJsYXlcXFwiPlxcblx0XHQ8ZGl2Plxcblx0XHRcdDxidXR0b24gXFxuXHRcdFx0XHRibi1ldmVudD1cXFwiY2xpY2s6IG9uTGVmdFxcXCIgXFxuXHRcdFx0XHRibi1wcm9wPVxcXCJoaWRkZW46IGxlZnREaXNhYmxlZFxcXCJcXG5cdFx0XHRcdD5cXG5cdFx0XHRcdDxpIGNsYXNzPVxcXCJmYSBmYS0yeCBmYS1jaGV2cm9uLWNpcmNsZS1sZWZ0XFxcIj48L2k+XFxuXHRcdFx0PC9idXR0b24+XHRcdFx0XFxuXHRcdDwvZGl2Plxcblxcblx0XHQ8ZGl2Plxcblx0XHRcdDxidXR0b24gXFxuXHRcdFx0XHRibi1ldmVudD1cXFwiY2xpY2s6IG9uUmlnaHRcXFwiIFxcblx0XHRcdFx0Ym4tcHJvcD1cXFwiaGlkZGVuOiByaWdodERpc2FibGVkXFxcIlxcblx0XHRcdD5cXG5cdFx0XHRcdDxpIGNsYXNzPVxcXCJmYSBmYS0yeCBmYS1jaGV2cm9uLWNpcmNsZS1yaWdodFxcXCI+PC9pPlxcblx0XHRcdDwvYnV0dG9uPlx0XHRcdFxcblx0XHQ8L2Rpdj5cXG5cXG5cdDwvZGl2PlxcblxcbjwvZGl2PlwiLFxuXHRcdFx0XHRcdGRhdGE6IHtcblx0XHRcdFx0XHRcdGxlZnREaXNhYmxlZDogdHJ1ZSxcblx0XHRcdFx0XHRcdHJpZ2h0RGlzYWJsZWQ6IGZhbHNlXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRpbml0OiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdHRoaXMuc2NvcGUuaXRlbXMuYXBwZW5kKGl0ZW1zKVxuXHRcdFx0XHRcdFx0dGhpcy5zY29wZS5pdGVtcy5jc3MoJ2xlZnQnLCAoLWlkeCAqIG9wdGlvbnMud2lkdGgpICsgJ3B4Jylcblx0XHRcdFx0XHRcdC8vY2hlY2tCdG5zKClcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdGV2ZW50czoge1xuXHRcdFx0XHRcdFx0b25MZWZ0OiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdFx0YW5pbWF0ZSgnbGVmdCcpXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0b25SaWdodDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRcdGFuaW1hdGUoJ3JpZ2h0Jylcblx0XHRcdFx0XHRcdH1cdFx0XHRcdFxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSlcblx0XHRcdFx0Y2hlY2tCdG5zKClcdFx0XG5cblx0XHRcdH1cdFx0XG5cblx0XHRcdHRoaXMuc2V0SW5kZXggPSBmdW5jdGlvbihpbmRleCkge1xuXHRcdFx0XHRjb25zb2xlLmxvZygnW0Nhcm91c2VsQ29udHJvbF0gc2V0SW5kZXgnLCBpbmRleClcblx0XHRcdFx0aWR4ID0gIE1hdGgubWF4KDAsIE1hdGgubWluKGluZGV4LCBpdGVtcy5sZW5ndGgpKVxuXHRcdFx0XHRjdHJsLnNjb3BlLml0ZW1zLmNzcygnbGVmdCcsICgtaWR4ICogb3B0aW9ucy53aWR0aCkgKyAncHgnKVxuXHRcdFx0XHRjaGVja0J0bnMoaWR4KVxuXHRcdFx0fVxuXG5cdFx0XHRmdW5jdGlvbiBjaGVja0J0bnMoKSB7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ2NoZWNrQnRucycsIGlkeCwgaXRlbXMubGVuZ3RoKVxuXHRcdFx0XHRjdHJsLnNldERhdGEoe1xuXHRcdFx0XHRcdGxlZnREaXNhYmxlZDogaWR4ID09IDAsXG5cdFx0XHRcdFx0cmlnaHREaXNhYmxlZDogaWR4ID09IGl0ZW1zLmxlbmd0aCAtIDFcblx0XHRcdFx0fSlcblx0XHRcdH1cdFx0XG5cblx0IFx0XHR0aGlzLnJlZnJlc2goKVxuXG5cdFx0fVxuXG5cdH0pXG5cbn0pKCk7XG4iLCIkJC5yZWdpc3RlckNvbnRyb2xFeCgnQ2hlY2tHcm91cENvbnRyb2wnLCB7XG5cdFxuXHRsaWI6ICdjb3JlJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCkge1xuXG5cdFx0ZWx0Lm9uKCdjbGljaycsICdpbnB1dFt0eXBlPWNoZWNrYm94XScsIGZ1bmN0aW9uKCkge1xuXHRcdFx0ZWx0LnRyaWdnZXIoJ2lucHV0Jylcblx0XHR9KVxuXG5cdFx0dGhpcy5nZXRWYWx1ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIHJldCA9IFtdXG5cdFx0XHRlbHQuZmluZCgnaW5wdXRbdHlwZT1jaGVja2JveF06Y2hlY2tlZCcpLmVhY2goZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHJldC5wdXNoKCQodGhpcykudmFsKCkpXG5cdFx0XHR9KVx0XG5cdFx0XHRyZXR1cm4gcmV0XHRcblx0XHR9XG5cblx0XHR0aGlzLnNldFZhbHVlID0gZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuXHRcdFx0XHRlbHQuZmluZCgnaW5wdXRbdHlwZT1jaGVja2JveF0nKS5lYWNoKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdCQodGhpcykucHJvcCgnY2hlY2tlZCcsIHZhbHVlLmluZGV4T2YoJCh0aGlzKS52YWwoKSkgPj0gMClcblx0XHRcdFx0fSlcblx0XHRcdH1cdFx0XG5cdFx0fVxuXG5cdH1cblxufSk7XG5cblxuXG5cblxuXG4iLCIkJC5yZWdpc3RlckNvbnRyb2xFeCgnSHRtbEVkaXRvckNvbnRyb2wnLCB7XG5cblx0aWZhY2U6ICdodG1sKCknLFxuXG5cdFxuXHRsaWI6ICdjb3JlJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCkge1xuXG5cdFx0ZWx0LmFkZENsYXNzKCdibi1mbGV4LXJvdycpXG5cblx0XHR2YXIgY21kQXJncyA9IHtcblx0XHRcdCdmb3JlQ29sb3InOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0cmV0dXJuIGN0cmwubW9kZWwuY29sb3Jcblx0XHRcdH1cblx0XHR9XG5cblxuXHRcdHZhciBjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoZWx0LCB7XG5cdFx0XHR0ZW1wbGF0ZTogXCI8ZGl2IGNsYXNzPVxcXCJibi1mbGV4LWNvbCBibi1mbGV4LTFcXFwiPlxcblxcblx0PGRpdiBibi1ldmVudD1cXFwiY2xpY2suY21kOiBvbkNvbW1hbmRcXFwiPlxcblx0XHQ8ZGl2IGJuLWNvbnRyb2w9XFxcIlRvb2xiYXJDb250cm9sXFxcIj5cXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJib2xkXFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtYm9sZFxcXCI+PC9pPjwvYnV0dG9uPlxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcIml0YWxpY1xcXCI+PGkgY2xhc3M9XFxcImZhIGZhLWl0YWxpY1xcXCI+PC9pPjwvYnV0dG9uPlxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcInVuZGVybGluZVxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLXVuZGVybGluZVxcXCI+PC9pPjwvYnV0dG9uPlxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcInN0cmlrZVRocm91Z2hcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1zdHJpa2V0aHJvdWdoXFxcIj48L2k+PC9idXR0b24+XFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwiZm9yZUNvbG9yXFxcIiBibi1tZW51PVxcXCJjb2xvckl0ZW1zXFxcIiBibi1ldmVudD1cXFwibWVudUNoYW5nZTogb25Db2xvck1lbnVDaGFuZ2VcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1wZW5jaWxcXFwiIGJuLXN0eWxlPVxcXCJjb2xvcjogY29sb3JcXFwiPjwvaT48L2J1dHRvbj5cXG5cdFx0PC9kaXY+XFxuXHRcdDxkaXYgYm4tY29udHJvbD1cXFwiVG9vbGJhckNvbnRyb2xcXFwiPlxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcImp1c3RpZnlMZWZ0XFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtYWxpZ24tbGVmdFxcXCI+PC9pPjwvYnV0dG9uPlxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcImp1c3RpZnlDZW50ZXJcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1hbGlnbi1jZW50ZXJcXFwiPjwvaT48L2J1dHRvbj5cXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJqdXN0aWZ5UmlnaHRcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1hbGlnbi1yaWdodFxcXCI+PC9pPjwvYnV0dG9uPlxcblx0XHQ8L2Rpdj5cdFxcblx0XHQ8ZGl2IGJuLWNvbnRyb2w9XFxcIlRvb2xiYXJDb250cm9sXFxcIj5cXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJpbmRlbnRcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1pbmRlbnRcXFwiPjwvaT48L2J1dHRvbj5cXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJvdXRkZW50XFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtb3V0ZGVudFxcXCI+PC9pPjwvYnV0dG9uPlxcblx0XHQ8L2Rpdj5cdFxcblx0XHQ8ZGl2IGJuLWNvbnRyb2w9XFxcIlRvb2xiYXJDb250cm9sXFxcIj5cXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJpbnNlcnRIb3Jpem9udGFsUnVsZVxcXCI+aHI8L2J1dHRvbj5cXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJmb3JtYXRCbG9ja1xcXCIgZGF0YS1jbWQtYXJnPVxcXCJoMVxcXCI+aDE8L2J1dHRvbj5cXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJmb3JtYXRCbG9ja1xcXCIgZGF0YS1jbWQtYXJnPVxcXCJoMlxcXCI+aDI8L2J1dHRvbj5cXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJmb3JtYXRCbG9ja1xcXCIgZGF0YS1jbWQtYXJnPVxcXCJoM1xcXCI+aDM8L2J1dHRvbj5cXG5cdFx0PC9kaXY+XHRcdFxcblx0XHQ8ZGl2IGJuLWNvbnRyb2w9XFxcIlRvb2xiYXJDb250cm9sXFxcIj5cXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJpbnNlcnRVbm9yZGVyZWRMaXN0XFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtbGlzdC11bFxcXCI+PC9pPjwvYnV0dG9uPlxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcImluc2VydE9yZGVyZWRMaXN0XFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtbGlzdC1vbFxcXCI+PC9pPjwvYnV0dG9uPlxcblx0XHQ8L2Rpdj5cXG5cXG5cdDwvZGl2Plx0XFxuXHQ8ZGl2IGNvbnRlbnRlZGl0YWJsZT1cXFwidHJ1ZVxcXCIgY2xhc3M9XFxcImJuLWZsZXgtMSBlZGl0b3JcXFwiIGJuLWJpbmQ9XFxcImVkaXRvclxcXCI+PC9kaXY+XFxuPC9kaXY+XFxuXCIsXG5cdFx0XHRkYXRhOiB7XG5cdFx0XHRcdGNvbG9yOiAnYmx1ZScsXG5cdFx0XHRcdGNvbG9ySXRlbXM6IHtcblx0XHRcdFx0XHRibGFjazoge25hbWU6ICdCbGFjayd9LFxuXHRcdFx0XHRcdHJlZDoge25hbWU6ICdSZWQnfSxcblx0XHRcdFx0XHRncmVlbjoge25hbWU6ICdHcmVlbid9LFxuXHRcdFx0XHRcdGJsdWU6IHtuYW1lOiAnQmx1ZSd9LFxuXHRcdFx0XHRcdHllbGxvdzoge25hbWU6ICdZZWxsb3cnfSxcblx0XHRcdFx0XHRjeWFuOiB7bmFtZTogJ0N5YW4nfSxcblx0XHRcdFx0XHRtYWdlbnRhOiB7bmFtZTogJ01hZ2VudGEnfVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0ZXZlbnRzOiB7XG5cdFx0XHRcdG9uQ29tbWFuZDogZnVuY3Rpb24oKSB7XG5cblx0XHRcdFx0XHR2YXIgY21kID0gJCh0aGlzKS5kYXRhKCdjbWQnKVxuXHRcdFx0XHRcdHZhciBjbWRBcmcgPSAkKHRoaXMpLmRhdGEoJ2NtZEFyZycpXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb25Db21tYW5kJywgY21kLCBjbWRBcmcpXG5cblx0XHRcdFx0XHR2YXIgY21kQXJnID0gY21kQXJnIHx8IGNtZEFyZ3NbY21kXVxuXHRcdFx0XHRcdGlmICh0eXBlb2YgY21kQXJnID09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRcdGNtZEFyZyA9IGNtZEFyZygpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ29uQ29tbWFuZCcsIGNtZCwgY21kQXJnKVxuXG5cdFx0XHRcdFx0ZG9jdW1lbnQuZXhlY0NvbW1hbmQoY21kLCBmYWxzZSwgY21kQXJnKVxuXHRcdFx0XHRcblx0XHRcdFx0fSxcblx0XHRcdFx0b25Db2xvck1lbnVDaGFuZ2U6IGZ1bmN0aW9uKGV2LCBjb2xvcikge1xuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ29uQ29sb3JNZW51Q2hhbmdlJywgY29sb3IpXG5cdFx0XHRcdFx0Y3RybC5zZXREYXRhKHtjb2xvcn0pXG5cdFx0XHRcdH1cblxuXHRcdFx0fVxuXG5cdFx0fSlcblxuXHRcdHRoaXMuaHRtbCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIGN0cmwuc2NvcGUuZWRpdG9yLmh0bWwoKVxuXHRcdH1cblxuXG5cdH1cblxufSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cblx0ZnVuY3Rpb24gZ2V0VGVtcGxhdGUoaGVhZGVycykge1xuXHRcdHJldHVybiBgXG5cdFx0XHQ8ZGl2IGNsYXNzPVwic2Nyb2xsUGFuZWxcIj5cblx0ICAgICAgICAgICAgPHRhYmxlIGNsYXNzPVwidzMtdGFibGUtYWxsIHczLXNtYWxsXCI+XG5cdCAgICAgICAgICAgICAgICA8dGhlYWQ+XG5cdCAgICAgICAgICAgICAgICAgICAgPHRyIGNsYXNzPVwidzMtZ3JlZW5cIj5cblx0ICAgICAgICAgICAgICAgICAgICBcdCR7aGVhZGVyc31cblx0ICAgICAgICAgICAgICAgICAgICA8L3RyPlxuXHQgICAgICAgICAgICAgICAgPC90aGVhZD5cblx0ICAgICAgICAgICAgICAgIDx0Ym9keT48L3Rib2R5PlxuXHQgICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICAgICAgPC9kaXY+XG5cdFx0YFxuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0SXRlbVRlbXBsYXRlKHJvd3MpIHtcblx0XHRyZXR1cm4gYFxuICAgICAgICAgICAgPHRyIGNsYXNzPVwiaXRlbVwiIGJuLWF0dHI9XCJkYXRhLWlkOiBfaWRcIj5cbiAgICAgICAgICAgIFx0JHtyb3dzfVxuICAgICAgICAgICAgPC90cj5cdFxuXHRcdGBcblx0fVxuXG5cblxuXHQkJC5yZWdpc3RlckNvbnRyb2xFeCgnRmlsdGVyZWRUYWJsZUNvbnRyb2wnLCB7XG5cblx0XHRpZmFjZTogYGFkZEl0ZW0oaWQsIGRhdGEpO3JlbW92ZUl0ZW0oaWQpO3JlbW92ZUFsbEl0ZW1zKCk7Z2V0SXRlbShpZCk7c2V0RmlsdGVycyhmaWx0ZXJzKTtnZXREYXRhcygpO2dldERpc3BsYXllZERhdGFzKCk7b24oZXZlbnQsIGNhbGxiYWNrKWAsXG5cdFx0ZXZlbnRzOiAnaXRlbUFjdGlvbicsXG5cblx0XHRcblx0bGliOiAnY29yZScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMpIHtcblxuXHRcdFx0Y29uc29sZS5sb2coJ29wdGlvbnMnLCBvcHRpb25zKVxuXG5cdFx0XHR2YXIgY29sdW1ucyA9ICAkJC5vYmoyQXJyYXkob3B0aW9ucy5jb2x1bW5zKVxuXHRcdFx0dmFyIGFjdGlvbnMgPSAkJC5vYmoyQXJyYXkob3B0aW9ucy5hY3Rpb25zKVxuXHRcdFx0dmFyIGhlYWRlcnMgPSBjb2x1bW5zLm1hcCgoY29sdW1uKSA9PiBgPHRoPiR7Y29sdW1uLnZhbHVlfTwvdGg+YClcdFx0XG5cdFx0XHR2YXIgcm93cyA9IGNvbHVtbnMubWFwKChjb2x1bW4pID0+IGA8dGQgYm4taHRtbD1cIiR7Y29sdW1uLmtleX1cIj48L3RkPmApXG5cdFx0XHRpZiAoYWN0aW9ucy5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdGhlYWRlcnMucHVzaChgPHRoPkFjdGlvbjwvdGg+YClcblxuXHRcdFx0XHR2YXIgYnV0dG9ucyA9IGFjdGlvbnMubWFwKChhY3Rpb24pID0+IGA8YnV0dG9uIGRhdGEtYWN0aW9uPVwiJHthY3Rpb24ua2V5fVwiIGNsYXNzPVwidzMtYnV0dG9uXCI+PGkgY2xhc3M9XCIke2FjdGlvbi52YWx1ZX1cIj48L2k+PC9idXR0b24+YClcblx0XHRcdFx0cm93cy5wdXNoKGA8dGQ+JHtidXR0b25zLmpvaW4oJycpfTwvdGQ+YClcblx0XHRcdH1cblxuXHRcdFx0Ly9jb25zb2xlLmxvZygncm93cycsIHJvd3MpXG5cdFx0XHR2YXIgaXRlbVRlbXBsYXRlID0gZ2V0SXRlbVRlbXBsYXRlKHJvd3Muam9pbignJykpXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdpdGVtVGVtcGxhdGUnLCBpdGVtVGVtcGxhdGUpXG5cblx0XHRcdGVsdC5hcHBlbmQoZ2V0VGVtcGxhdGUoaGVhZGVycy5qb2luKCcnKSkpXG5cdFx0XHRlbHQuYWRkQ2xhc3MoJ2JuLWZsZXgtY29sJylcblxuXHRcdFx0bGV0IGRhdGFzID0ge31cblx0XHRcdGxldCBldmVudHMgPSBuZXcgRXZlbnRFbWl0dGVyMigpXG5cdFx0XHRsZXQgX2ZpbHRlcnMgPSB7fVxuXHRcdFx0bGV0IGRpc3BsYXllZEl0ZW1zID0ge31cblxuXHRcdFx0Y29uc3QgdGJvZHkgPSBlbHQuZmluZCgndGJvZHknKVxuXHRcdFx0dGJvZHkub24oJ2NsaWNrJywgJ1tkYXRhLWFjdGlvbl0nLCBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIGlkID0gJCh0aGlzKS5jbG9zZXN0KCcuaXRlbScpLmRhdGEoJ2lkJylcblx0XHRcdFx0dmFyIGFjdGlvbiA9ICQodGhpcykuZGF0YSgnYWN0aW9uJylcblx0XHRcdFx0Y29uc29sZS5sb2coJ2NsaWNrJywgaWQsICdhY3Rpb24nLCBhY3Rpb24pXG5cdFx0XHRcdGV2ZW50cy5lbWl0KCdpdGVtQWN0aW9uJywgYWN0aW9uLCBpZClcblx0XHRcdH0pXG5cblx0XHRcdHRoaXMuYWRkSXRlbSA9IGZ1bmN0aW9uKGlkLCBkYXRhKSB7XG5cblx0XHRcdFx0dmFyIGl0ZW1EYXRhID0gJC5leHRlbmQoeydfaWQnOiBpZH0sIGRhdGEpXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ2FkZEl0ZW0nLCBpdGVtRGF0YSlcblx0XHRcdFx0XG5cdFx0XHRcdGlmIChkYXRhc1tpZF0gIT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0dmFyIGl0ZW0gPSBkaXNwbGF5ZWRJdGVtc1tpZF1cblx0XHRcdFx0XHRpZiAoaXRlbSAhPSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRcdGl0ZW0uZWx0LnVwZGF0ZVRlbXBsYXRlKGl0ZW0uY3R4LCBpdGVtRGF0YSlcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSBpZiAoaXNJbkZpbHRlcihkYXRhKSl7XG5cdFx0XHRcdFx0dmFyIGVsdCA9ICQoaXRlbVRlbXBsYXRlKVxuXHRcdFx0XHRcdHZhciBjdHggPSBlbHQucHJvY2Vzc1RlbXBsYXRlKGl0ZW1EYXRhKVxuXHRcdFx0XHRcdGRpc3BsYXllZEl0ZW1zW2lkXSA9IHtlbHQsIGN0eH1cblx0XHRcdFx0XHR0Ym9keS5hcHBlbmQoZWx0KVxuXHRcdFx0XHR9XG5cdFx0XHRcdGRhdGFzW2lkXSA9IGRhdGFcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5yZW1vdmVJdGVtID0gZnVuY3Rpb24oaWQpIHtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygncmVtb3ZlSXRlbScsIGlkKVxuXHRcdFx0XHRpZiAoZGF0YXNbaWRdICE9IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdGRlbGV0ZSBkYXRhc1tpZF1cblx0XHRcdFx0XHR2YXIgaXRlbSA9IGRpc3BsYXllZEl0ZW1zW2lkXVxuXHRcdFx0XHRcdGlmIChpdGVtICE9IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdFx0aXRlbS5lbHQucmVtb3ZlKClcblx0XHRcdFx0XHRcdGRlbGV0ZSBkaXNwbGF5ZWRJdGVtc1tpZF1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cdFx0XHRcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5nZXRJdGVtID0gZnVuY3Rpb24oaWQpIHtcblx0XHRcdFx0cmV0dXJuIGRhdGFzW2lkXVxuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLnJlbW92ZUFsbEl0ZW1zID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ3JlbW92ZUFsbEl0ZW1zJylcblx0XHRcdFx0ZGF0YXMgPSB7fVxuXHRcdFx0XHRkaXNwbGF5ZWRJdGVtcyA9IHt9XG5cdFx0XHRcdHRib2R5LmVtcHR5KClcdFx0XG5cdFx0XHR9XG5cblx0XHRcdGZ1bmN0aW9uIGlzSW5GaWx0ZXIoZGF0YSkge1xuXHRcdFx0XHR2YXIgcmV0ID0gdHJ1ZVxuXHRcdFx0XHRmb3IodmFyIGYgaW4gX2ZpbHRlcnMpIHtcblx0XHRcdFx0XHR2YXIgdmFsdWUgPSBkYXRhW2ZdXG5cdFx0XHRcdFx0dmFyIGZpbHRlclZhbHVlID0gX2ZpbHRlcnNbZl1cblx0XHRcdFx0XHRyZXQgJj0gKGZpbHRlclZhbHVlID09ICcnIHx8IHZhbHVlLnN0YXJ0c1dpdGgoZmlsdGVyVmFsdWUpKVxuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiByZXRcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5zZXRGaWx0ZXJzID0gZnVuY3Rpb24oZmlsdGVycykge1xuXHRcdFx0XHRfZmlsdGVycyA9IGZpbHRlcnNcblx0XHRcdFx0ZGlzcFRhYmxlKClcblx0XHRcdH1cblxuXG5cdFx0XHRmdW5jdGlvbiBkaXNwVGFibGUoKSB7XG5cdFx0XHRcdGRpc3BsYXllZEl0ZW1zID0ge31cblx0XHRcdFx0bGV0IGl0ZW1zID0gW11cblx0XHRcdFx0Zm9yKGxldCBpZCBpbiBkYXRhcykge1xuXHRcdFx0XHRcdHZhciBkYXRhID0gZGF0YXNbaWRdXG5cdFx0XHRcdFx0aWYgKGlzSW5GaWx0ZXIoZGF0YSkpIHtcblx0XHRcdFx0XHRcdHZhciBpdGVtRGF0YSA9ICQuZXh0ZW5kKHsnX2lkJzogaWR9LCBkYXRhKVxuXHRcdFx0XHRcdFx0dmFyIGVsdCA9ICQoaXRlbVRlbXBsYXRlKVxuXHRcdFx0XHRcdFx0dmFyIGN0eCA9IGVsdC5wcm9jZXNzVGVtcGxhdGUoaXRlbURhdGEpXHRcdFx0XG5cdFx0XHRcdFx0XHRpdGVtcy5wdXNoKGVsdClcblx0XHRcdFx0XHRcdGRpc3BsYXllZEl0ZW1zW2lkXSA9IHtlbHQsIGN0eH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdFx0XG5cdFx0XHRcdHRib2R5LmVtcHR5KCkuYXBwZW5kKGl0ZW1zKVxuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLmdldERhdGFzID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHJldHVybiBkYXRhc1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLmdldERpc3BsYXllZERhdGFzID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZhciByZXQgPSB7fVxuXHRcdFx0XHRmb3IobGV0IGkgaW4gZGlzcGxheWVkSXRlbXMpIHtcblx0XHRcdFx0XHRyZXRbaV0gPSBkYXRhc1tpXVxuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiByZXRcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5vbiA9IGV2ZW50cy5vbi5iaW5kKGV2ZW50cylcblxuXG5cdFx0fVxuXHR9KVxuXG59KSgpO1xuIiwiJCQucmVnaXN0ZXJDb250cm9sRXgoJ0ZyaWVuZHNQYW5lbENvbnRyb2wnLCB7XG5cblx0ZGVwczogWydXZWJTb2NrZXRTZXJ2aWNlJ10sXG5cdFxuXHRcblx0bGliOiAnY29yZScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMsIGNsaWVudCkge1xuXG5cdFx0dmFyIGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihlbHQsIHtcblx0XHRcdHRlbXBsYXRlOiBcIjxkaXYgc3R5bGU9XFxcImRpc3BsYXk6IGZsZXg7IGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XFxcIj5cXG5cdDxoMSBjbGFzcz1cXFwidzMtY2VudGVyXFxcIj5GcmllbmRzPC9oMT5cXG5cdDxkaXYgY2xhc3M9XFxcInNjcm9sbFBhbmVsXFxcIj5cXG5cdFx0PGRpdiBibi1lYWNoPVxcXCJmIG9mIGZyaWVuZHNcXFwiIGJuLWV2ZW50PVxcXCJjbGljay5uYW1lOiBvbkl0ZW1DbGlja2VkXFxcIj5cXG5cdFx0XHQ8ZGl2IGNsYXNzPVxcXCJpdGVtXFxcIiBibi1kYXRhPVxcXCJpbmZvOiBmXFxcIj5cXG5cdFx0XHRcdDxkaXYgY2xhc3M9XFxcIm5hbWVcXFwiPlxcblx0XHRcdFx0XHQ8c3BhbiBibi10ZXh0PVxcXCJmLm5hbWVcXFwiPjwvc3Bhbj5cXG5cdFx0XHRcdDwvZGl2Plxcblx0XHRcdFx0PGRpdiBibi1zaG93PVxcXCJmLmlzQ29ubmVjdGVkXFxcIiBjbGFzcz1cXFwidzMtdGV4dC1ncmVlblxcXCI+XFxuXHRcdFx0XHRcdDxpIGNsYXNzPVxcXCJmYSBmYS1jaGVja1xcXCI+PC9pPlxcblx0XHRcdFx0PC9kaXY+XFxuXHRcdFx0PC9kaXY+XFxuXHRcdDwvZGl2Plxcblx0PC9kaXY+XHRcXG48L2Rpdj5cIixcblx0XHRcdGRhdGE6IHtcblx0XHRcdFx0ZnJpZW5kczogW11cblx0XHRcdH0sXG5cdFx0XHRldmVudHM6IHtcblx0XHRcdFx0b25JdGVtQ2xpY2tlZDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0dmFyIGRhdGEgPSAkKHRoaXMpLmNsb3Nlc3QoJy5pdGVtJykuZGF0YSgnaW5mbycpXG5cdFx0XHRcdFx0Y29uc29sZS5sb2coJ29uSXRlbUNsaWNrZWQnLCBkYXRhKVxuXHRcdFx0XHRcdGVsdC50cmlnZ2VyKCdmcmllbmRTZWxlY3RlZCcsIGRhdGEpXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KVxuXG5cdFx0Y2xpZW50LnJlZ2lzdGVyKCdtYXN0ZXJGcmllbmRzJywgdHJ1ZSwgb25GcmllbmRzKVxuXG5cdFx0ZnVuY3Rpb24gb25GcmllbmRzKG1zZykge1xuXHRcdFx0Y29uc29sZS5sb2coJ29uRnJpZW5kcycsIG1zZy5kYXRhKVxuXHRcdFx0Y3RybC5zZXREYXRhKHtmcmllbmRzOiBtc2cuZGF0YX0pXG5cdFx0fVxuXG5cdFx0dGhpcy5nZXRGcmllbmRzID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gY3RybC5tb2RlbC5mcmllbmRzXG5cdFx0fVxuXHR9XG59KTtcbiIsIlxuJCQucmVnaXN0ZXJDb250cm9sRXgoJ0hlYWRlckNvbnRyb2wnLCB7XG5cdGRlcHM6IFsnV2ViU29ja2V0U2VydmljZScsICdJbnZpdFNlcnZpY2UnLCAnTm90aWZTZXJ2aWNlJ10sXG5cdG9wdGlvbnM6IHtcblx0XHR0aXRsZTogJ0hlbGxvIFdvcmxkJyxcblx0XHR1c2VyTmFtZTogJ3Vua25vd24nLFxuXHRcdGlzSG9tZVBhZ2U6IGZhbHNlXG5cdH0sXG5cdFxuXHRsaWI6ICdjb3JlJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucywgY2xpZW50LCBpbnZpdFNydiwgbm90aWZTcnYpIHtcblxuXHRcdHZhciBkbGdDdHJsID0gJCQuZGlhbG9nQ29udHJvbGxlcignTm90aWZpY2F0aW9ucycsIHtcblx0XHRcdHRlbXBsYXRlOiBcIlxcbjx1bCBjbGFzcz1cXFwidzMtdWwgdzMtYm9yZGVyIHczLXdoaXRlXFxcIiBibi1lYWNoPVxcXCJuIG9mIG5vdGlmc1xcXCIgXFxuXHRibi1ldmVudD1cXFwiY2xpY2suZGVsZXRlOiBvbkRlbGV0ZSwgY2xpY2suZGVueTogb25EZW55LCBjbGljay5hY2NlcHQ6IG9uQWNjZXB0XFxcIj5cXG5cdDxsaSBjbGFzcz1cXFwidzMtYmFyXFxcIiBibi1kYXRhPVxcXCJub3RpZjogblxcXCIgYm4tc2hvdz1cXFwiIW4uaXNJbnZpdFxcXCI+XFxuXHRcdDxzcGFuIGNsYXNzPVxcXCJ3My1idXR0b24gdzMtcmlnaHQgZGVsZXRlXFxcIiB0aXRsZT1cXFwiRGVsZXRlXFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtdGltZXNcXFwiPjwvaT48L3NwYW4+XFxuXFxuXHRcdDxkaXYgY2xhc3M9XFxcInczLWJhci1pdGVtXFxcIiBibi1odG1sPVxcXCJuLm1lc3NhZ2VcXFwiID48L2Rpdj5cXG5cdDwvbGk+XFxuXHQ8bGkgY2xhc3M9XFxcInczLWJhclxcXCIgYm4tZGF0YT1cXFwibm90aWY6IG5cXFwiIGJuLXNob3c9XFxcIm4uaXNJbnZpdFxcXCI+XFxuXHRcdDxzcGFuIGNsYXNzPVxcXCJ3My1idXR0b24gdzMtcmlnaHQgdzMtZ3JlZW4gYWNjZXB0XFxcIj5BY2NlcHQ8L2k+PC9zcGFuPlxcblx0XHQ8c3BhbiBjbGFzcz1cXFwidzMtYnV0dG9uIHczLXJpZ2h0IHczLXJlZCBkZW55XFxcIj5EZW55PC9pPjwvc3Bhbj5cXG5cXG5cdFx0PGRpdiBjbGFzcz1cXFwidzMtYmFyLWl0ZW1cXFwiIGJuLWh0bWw9XFxcIm4ubWVzc2FnZVxcXCIgPjwvZGl2Plxcblx0PC9saT5cdFx0XFxuPC91bD5cdFx0XFxuXCIsXG5cdFx0XHRkYXRhOiB7bm90aWZzOiBbXX0sXG5cdFx0XHRvcHRpb25zOiB7XG5cdFx0XHRcdHdpZHRoOiAnYXV0bydcblx0XHRcdH0sXG5cdFx0XHRldmVudHM6IHtcblx0XHRcdFx0b25EZWxldGU6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHZhciBub3RpZiA9ICQodGhpcykuY2xvc2VzdCgnbGknKS5kYXRhKCdub3RpZicpXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb25EZWxldGUnLCBub3RpZilcblx0XHRcdFx0XHRub3RpZlNydi5kZWxldGUobm90aWYuaWQpXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9uQWNjZXB0OiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHR2YXIgbm90aWYgPSAkKHRoaXMpLmNsb3Nlc3QoJ2xpJykuZGF0YSgnbm90aWYnKVxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCdvbkFjY2VwdCcsIG5vdGlmKVxuXG5cdFx0XHRcdFx0aW52aXRTcnYuYWNjZXB0KG5vdGlmLmZyb20pXG5cblx0XHRcdFx0XHRub3RpZlNydi5kZWxldGUobm90aWYuaWQpXG5cblx0XHRcdFx0fSxcblx0XHRcdFx0b25EZW55OiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHR2YXIgbm90aWYgPSAkKHRoaXMpLmNsb3Nlc3QoJ2xpJykuZGF0YSgnbm90aWYnKVxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCdvbkRlbnknLCBub3RpZilcblxuXHRcdFx0XHRcdG5vdGlmU3J2LmRlbGV0ZShub3RpZi5pZClcblxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSlcblxuXHRcdHZhciBjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoZWx0LCB7XG5cdFx0XHR0ZW1wbGF0ZTogXCI8ZGl2ID5cXG5cdDxkaXYgY2xhc3M9XFxcImJyYW5kXFxcIj48aDEgY2xhc3M9XFxcImJuLXhzLWhpZGVcXFwiIGJuLXRleHQ9XFxcInRpdGxlXFxcIj48L2gxPiA8L2Rpdj5cXG5cdDxkaXYgY2xhc3M9XFxcImluZm9zXFxcIj5cXG5cdFx0PGJ1dHRvbiBjbGFzcz1cXFwibm90aWZpY2F0aW9uIHczLWJ0blxcXCIgdGl0bGU9XFxcIm5vdGlmaWNhdGlvblxcXCIgYm4tZXZlbnQ9XFxcImNsaWNrOiBvbk5vdGlmaWNhdGlvblxcXCI+XFxuXHRcdFx0PGkgY2xhc3M9XFxcImZhIGZhLWxnIGZhLWJlbGwgdzMtdGV4dC13aGl0ZVxcXCIgPjwvaT5cXG5cdFx0XHQ8c3BhbiBjbGFzcz1cXFwidzMtYmFkZ2UgdzMtcmVkIHczLXRpbnlcXFwiIGJuLXRleHQ9XFxcIm5iTm90aWZcXFwiIGJuLXNob3c9XFxcImlzTm90aWZWaXNpYmxlXFxcIj48L3NwYW4+XHRcdFx0XFxuXHRcdDwvYnV0dG9uPlxcblxcblx0ICAgIDxpIGJuLWF0dHI9XFxcInRpdGxlOiB0aXRsZVN0YXRlXFxcIiBjbGFzcz1cXFwiZmEgZmEtbGcgY29ubmVjdGlvblN0YXRlXFxcIiBibi1jbGFzcz1cXFwiZmEtZXllOiBjb25uZWN0ZWQsIGZhLWV5ZS1zbGFzaDogIWNvbm5lY3RlZFxcXCI+PC9pPlxcblxcblx0ICAgIDxkaXY+XFxuXHRcdCAgICA8aSBjbGFzcz1cXFwiZmEgZmEtdXNlciBmYS1sZ1xcXCI+PC9pPlxcblx0XHQgICAgPHNwYW4gYm4tdGV4dD1cXFwidXNlck5hbWVcXFwiIGNsYXNzPVxcXCJ1c2VyTmFtZVxcXCI+PC9zcGFuPlx0ICAgIFx0XFxuXHQgICAgPC9kaXY+XFxuXFxuXHQgICAgPGJ1dHRvbiB0aXRsZT1cXFwibG9nb3V0XFxcIiBjbGFzcz1cXFwidzMtYnRuXFxcIiBibi1ldmVudD1cXFwiY2xpY2s6IG9uRGlzY29ubmVjdFxcXCIgYm4tc2hvdz1cXFwiaXNIb21lUGFnZVxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLXBvd2VyLW9mZiBmYS1sZ1xcXCI+PC9pPjwvYnV0dG9uPiBcXG5cXG5cdCAgICA8YnV0dG9uIHRpdGxlPVxcXCJob21lXFxcIiBjbGFzcz1cXFwidzMtYnRuXFxcIiBibi1ldmVudD1cXFwiY2xpY2s6IG9uR29Ib21lXFxcIiBibi1zaG93PVxcXCIhaXNIb21lUGFnZVxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLWhvbWUgZmEtbGdcXFwiPjwvaT48L2J1dHRvbj4gXFxuXFxuXHQ8L2Rpdj5cXG5cXG5cXG48L2Rpdj5cIixcblx0XHRcdGRhdGE6IHtcblx0XHRcdFx0Y29ubmVjdGVkOiBmYWxzZSxcblx0XHRcdFx0dGl0bGVTdGF0ZTogXCJXZWJTb2NrZXQgZGlzY29ubmVjdGVkXCIsXG5cdFx0XHRcdHRpdGxlOiBvcHRpb25zLnRpdGxlLFxuXHRcdFx0XHR1c2VyTmFtZTogb3B0aW9ucy51c2VyTmFtZSxcblx0XHRcdFx0aXNIb21lUGFnZTogb3B0aW9ucy5pc0hvbWVQYWdlLFxuXHRcdFx0XHRuYk5vdGlmOiAwLFxuXHRcdFx0XHRcblx0XHRcdFx0aXNOb3RpZlZpc2libGU6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLm5iTm90aWYgPiAwXG5cdFx0XHRcdH1cdFx0XHRcdFxuXHRcdFx0fSxcblx0XHRcdGV2ZW50czoge1xuXHRcdFx0XHRvbkdvSG9tZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0bG9jYXRpb24uaHJlZiA9ICcvJ1xuXHRcdFx0XHR9LFxuXG5cdFx0XHRcdG9uRGlzY29ubmVjdDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0c2Vzc2lvblN0b3JhZ2UuY2xlYXIoKVxuXHRcdFx0XHRcdGxvY2F0aW9uLmhyZWYgPSAnL2Rpc2Nvbm5lY3QnXG5cdFx0XHRcdH0sXG5cblx0XHRcdFx0b25Ob3RpZmljYXRpb246IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCdvbk5vdGlmaWNhdGlvbicpXG5cdFx0XHRcdFx0aWYgKGN0cmwubW9kZWwubmJOb3RpZiA9PSAwKSB7XG5cdFx0XHRcdFx0XHQkJC5zaG93QWxlcnQoJ25vIG5vdGlmaWNhdGlvbnMnLCAnTm90aWZpY2F0aW9ucycpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0ZGxnQ3RybC5zaG93KClcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KVxuXG5cblx0XHRjbGllbnQuZXZlbnRzLm9uKCdjb25uZWN0JywgZnVuY3Rpb24oKSB7XG5cdFx0XHRjb25zb2xlLmxvZygnW0hlYWRlckNvbnRyb2xdIGNsaWVudCBjb25uZWN0ZWQnKVxuXHRcdFx0Y3RybC5zZXREYXRhKHtjb25uZWN0ZWQ6IHRydWUsIHRpdGxlU3RhdGU6IFwiV2ViU29ja2V0IGNvbm5lY3RlZFwifSlcblxuXHRcdH0pXG5cblx0XHRjbGllbnQuZXZlbnRzLm9uKCdkaXNjb25uZWN0JywgZnVuY3Rpb24oKSB7XG5cdFx0XHRjb25zb2xlLmxvZygnW0hlYWRlckNvbnRyb2xdIGNsaWVudCBkaXNjb25uZWN0ZWQnKVxuXHRcdFx0Y3RybC5zZXREYXRhKHtjb25uZWN0ZWQ6IGZhbHNlLCB0aXRsZVN0YXRlOiBcIldlYlNvY2tldCBkaXNjb25uZWN0ZWRcIn0pXG5cblx0XHR9KVxuXG5cdFx0Y2xpZW50LnJlZ2lzdGVyKCdtYXN0ZXJOb3RpZmljYXRpb25zJywgdHJ1ZSwgb25Ob3RpZmljYXRpb25zKVxuXG5cdFx0ZnVuY3Rpb24gb25Ob3RpZmljYXRpb25zKG1zZykge1xuXHRcdFx0Y29uc29sZS5sb2coJ29uTm90aWZpY2F0aW9ucycsIG1zZy5kYXRhKVxuXHRcdFx0Y3RybC5zZXREYXRhKHtuYk5vdGlmOiBtc2cuZGF0YS5sZW5ndGh9KVxuXHRcdFx0ZGxnQ3RybC5zZXREYXRhKHtcblx0XHRcdFx0bm90aWZzOiBtc2cuZGF0YS5tYXAoKGl0ZW0pID0+IHtcblx0XHRcdFx0XHRpdGVtLmlzSW52aXQgPSAoaXRlbS50eXBlID09ICdpbnZpdCcpXG5cdFx0XHRcdFx0cmV0dXJuIGl0ZW1cblx0XHRcdFx0fSlcblx0XHRcdH0pXG5cdFx0XHRpZiAobXNnLmRhdGEubGVuZ3RoID09IDApIHtcblx0XHRcdFx0ZGxnQ3RybC5oaWRlKClcblx0XHRcdH1cblx0XHR9XG5cblxuXHR9XG5cbn0pO1xuXG5cbiIsIiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdIb21lQ29udHJvbCcsIHtcblx0ZGVwczogWydBcHBTZXJ2aWNlJ10sXG5cblx0XG5cdGxpYjogJ2NvcmUnLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zLCBhcHBTcnYpIHtcblxuXHRcdHZhciBjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoZWx0LCB7XG5cdFx0XHR0ZW1wbGF0ZTogXCI8ZGl2IGNsYXNzPVxcXCJtYWluXFxcIj5cXG5cXG5cXG5cdDxzdHJvbmc+QXZhaWxhYmxlIGFwcHM6PC9zdHJvbmc+XFxuXHQ8ZGl2IGNsYXNzPVxcXCJjb250ZW50XFxcIiBibi1lYWNoPVxcXCJhcHAgb2YgYXBwc1xcXCI+XFxuXHRcdFx0PGEgYm4tYXR0cj1cXFwiY2xhc3M6IGFwcC5jbGFzc05hbWUsIGhyZWY6YXBwLmhyZWYsIHRpdGxlOmFwcC5kZXNjXFxcIj5cXG5cdFx0XHRcdFxcblx0XHRcdFx0PGRpdiBjbGFzcz1cXFwiYm4tZmxleC1jb2xcXFwiIHN0eWxlPVxcXCJoZWlnaHQ6IDEwMCU7IGp1c3RpZnktY29udGVudDogY2VudGVyO1xcXCI+XFxuXHRcdFx0XHRcdDxkaXYgY2xhc3M9XFxcImJuLWZsZXgtMSBibi1mbGV4LXJvd1xcXCIgc3R5bGU9XFxcImFsaWduLWl0ZW1zOiBjZW50ZXI7IGp1c3RpZnktY29udGVudDogY2VudGVyO1xcXCIgYm4tc2hvdz1cXFwiYXBwLmhhc1RpbGVJY29uXFxcIj5cXG5cdFx0XHRcdFx0XHQ8aSBibi1hdHRyPVxcXCJjbGFzczogYXBwLnRpbGVJY29uXFxcIj48L2k+XFxuXHRcdFx0XHRcdDwvZGl2Plxcblxcblx0XHRcdFx0XHQ8c3BhbiBibi10ZXh0PVxcXCJhcHAudGlsZU5hbWVcXFwiPjwvc3Bhbj5cXG5cdFx0XHRcdDwvZGl2Plxcblxcblx0XHRcdDwvYT5cXG5cdDwvZGl2PlxcblxcblxcbjwvZGl2PlwiLFxuXHRcdFx0ZGF0YToge1xuXHRcdFx0XHRhcHBzOiBbXVxuXHRcdFx0XHRcblx0XHRcdH1cblxuXHRcdH0pXG5cblx0XHRhcHBTcnYuZ2V0VXNlckFwcHNJbmZvKCkudGhlbigoYXBwSW5mb3MpID0+IHtcblx0XHRcdC8vY29uc29sZS5sb2coJ2FwcEluZm9zJywgYXBwSW5mb3MpXG5cblx0XHRcdHZhciBhcHBzID0gW11cblxuXHRcdFx0Zm9yKHZhciBrIGluIGFwcEluZm9zKSB7XG5cdFx0XHRcdHZhciBhcHBJbmZvID0gYXBwSW5mb3Nba11cblx0XHRcdFx0dmFyIHRpbGVOYW1lID0ga1xuXHRcdFx0XHR2YXIgZGVzYyA9ICcnXG5cdFx0XHRcdHZhciB0aWxlQ29sb3IgPSAndzMtYmx1ZSdcblx0XHRcdFx0dmFyIHByb3BzID0gYXBwSW5mby5wcm9wc1xuXHRcdFx0XHRpZiAodHlwZW9mIHByb3BzLnRpbGVOYW1lID09ICdzdHJpbmcnKSB7XG5cdFx0XHRcdFx0dGlsZU5hbWUgPSBwcm9wcy50aWxlTmFtZVxuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICh0eXBlb2YgcHJvcHMuZGVzYyA9PSAnc3RyaW5nJykge1xuXHRcdFx0XHRcdGRlc2MgPSBwcm9wcy5kZXNjXG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKHR5cGVvZiBwcm9wcy50aWxlQ29sb3IgPT0gJ3N0cmluZycpIHtcblx0XHRcdFx0XHR0aWxlQ29sb3IgPSBwcm9wcy50aWxlQ29sb3Jcblx0XHRcdFx0fVxuXHRcdFx0XHR2YXIgY2xhc3NOYW1lID0gXCJ3My1idG4gYXBwSWNvbiBcIiArIHRpbGVDb2xvclxuXHRcdFx0XHR2YXIgaHJlZiA9IFwiL2FwcHMvXCIgKyBrXG5cblx0XHRcdFx0YXBwcy5wdXNoKHtcblx0XHRcdFx0XHR0aWxlSWNvbjogcHJvcHMudGlsZUljb24sXG5cdFx0XHRcdFx0dGlsZUNvbG9yLFxuXHRcdFx0XHRcdHRpbGVOYW1lLFxuXHRcdFx0XHRcdGRlc2MsXG5cdFx0XHRcdFx0dGlsZUNvbG9yLFxuXHRcdFx0XHRcdGNsYXNzTmFtZSxcblx0XHRcdFx0XHRocmVmLFxuXHRcdFx0XHRcdGhhc1RpbGVJY29uOiBwcm9wcy50aWxlSWNvbiAhPSB1bmRlZmluZWRcblx0XHRcdFx0fSlcblxuXHRcdFx0fVxuXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdhcHBzJywgYXBwcylcblx0XHRcdGN0cmwuc2V0RGF0YSh7YXBwc30pXG5cdFx0XHRcblx0XHR9KVxuXG5cdH1cblxufSk7XG5cbiIsIlxuJCQucmVnaXN0ZXJDb250cm9sRXgoJ0lucHV0R3JvdXBDb250cm9sJywge1xuXHRcblx0bGliOiAnY29yZScsXG5pbml0OiBmdW5jdGlvbihlbHQpIHtcblxuXHRcdHZhciBpZCA9IGVsdC5jaGlsZHJlbignaW5wdXQnKS51bmlxdWVJZCgpLmF0dHIoJ2lkJylcblx0XHQvL2NvbnNvbGUubG9nKCdbSW5wdXRHcm91cENvbnRyb2xdIGlkJywgaWQpXG5cdFx0ZWx0LmNoaWxkcmVuKCdsYWJlbCcpLmF0dHIoJ2ZvcicsIGlkKVxuXHR9XG59KTtcbiIsIihmdW5jdGlvbigpIHtcblxuXHQkJC5yZWdpc3RlckNvbnRyb2xFeCgnTmF2YmFyQ29udHJvbCcsIHtcblxuXHRcdG9wdGlvbnM6IHtcblx0XHRcdGFjdGl2ZUNvbG9yOiAndzMtZ3JlZW4nXG5cdFx0fSxcblxuXHRcdFxuXHRsaWI6ICdjb3JlJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucykge1xuXG5cdFx0XHR2YXIgYWN0aXZlQ29sb3IgPSBvcHRpb25zLmFjdGl2ZUNvbG9yXG5cblxuXHRcdFx0Ly9jb25zb2xlLmxvZygnW05hdmJhckNvbnRyb2xdIG9wdGlvbnMnLCBvcHRpb25zKVxuXG5cdFx0XHRlbHQuYWRkQ2xhc3MoJ3czLWJhcicpXG5cdFx0XHRlbHQuY2hpbGRyZW4oJ2EnKS5lYWNoKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQkKHRoaXMpLmFkZENsYXNzKCd3My1iYXItaXRlbSB3My1idXR0b24nKVxuXHRcdFx0fSlcblxuXHRcdFx0JCh3aW5kb3cpLm9uKCdyb3V0ZUNoYW5nZWQnLCBmdW5jdGlvbihldnQsIG5ld1JvdXRlKSB7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ1tOYXZiYXJDb250cm9sXSByb3V0ZUNoYW5nZScsIG5ld1JvdXRlKVxuXG5cdFx0XHRcdGVsdC5jaGlsZHJlbihgYS4ke2FjdGl2ZUNvbG9yfWApLnJlbW92ZUNsYXNzKGFjdGl2ZUNvbG9yKVx0XG5cdFx0XHRcdGVsdC5jaGlsZHJlbihgYVtocmVmPVwiIyR7bmV3Um91dGV9XCJdYCkuYWRkQ2xhc3MoYWN0aXZlQ29sb3IpXG5cblx0XHRcdH0pXHRcblx0XHR9XG5cblx0fSlcblxuXG59KSgpO1xuXG5cbiIsIiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdQaWN0dXJlQ2Fyb3VzZWxDb250cm9sJywge1xuXG5cdHByb3BzOiB7XG5cdFx0aW5kZXg6IHt2YWw6IDAsIHNldDogJ3NldEluZGV4J30sXG5cdFx0aW1hZ2VzOiB7dmFsOiBbXSwgc2V0OiAnc2V0SW1hZ2VzJ31cblx0fSxcblx0b3B0aW9uczoge1xuXHRcdHdpZHRoOiAzMDAsXG5cdFx0aGVpZ2h0OiAyMDAsXG5cdFx0YW5pbWF0ZURlbGF5OiAxMDAwLFxuXHRcdGNvbG9yOiAneWVsbG93J1xuXHR9LFx0XG5cblx0aWZhY2U6ICdzZXRJbWFnZXMoaW1hZ2VzKTtzZXRJbmRleChpZHgpJyxcblxuXHRcblx0bGliOiAnY29yZScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMpIHtcblxuXHRcdGNvbnNvbGUubG9nKGBbUGljdHVyZUNhcm91c2VsQ29udHJvbF0gb3B0aW9uc2AsIG9wdGlvbnMpXG5cblx0XHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xuXHRcdFx0dGVtcGxhdGU6IFwiPGRpdiBibi1jb250cm9sPVxcXCJDYXJvdXNlbENvbnRyb2xcXFwiIGJuLW9wdGlvbnM9XFxcImNhcm91c2VsQ3RybE9wdGlvbnNcXFwiIGJuLWVhY2g9XFxcImkgb2YgaW1hZ2VzXFxcIiBibi1pZmFjZT1cXFwiY2Fyb3VzZWxDdHJsXFxcIiBibi1kYXRhPVxcXCJpbmRleDogaW5kZXhcXFwiPlxcblx0PGRpdiBzdHlsZT1cXFwidGV4dC1hbGlnbjogY2VudGVyO1xcXCIgYm4tc3R5bGU9XFxcImJhY2tncm91bmQtY29sb3I6IGJhY2tDb2xvclxcXCI+XFxuXHRcdDxpbWcgYm4tYXR0cj1cXFwic3JjOiBpXFxcIiBzdHlsZT1cXFwiaGVpZ2h0OiAxMDAlXFxcIj5cXG5cdDwvZGl2PlxcbjwvZGl2PlwiLFxuXHRcdFx0ZGF0YToge1xuXHRcdFx0XHRjYXJvdXNlbEN0cmxPcHRpb25zOiBvcHRpb25zLFxuXHRcdFx0XHRpbWFnZXM6IG9wdGlvbnMuaW1hZ2VzLFxuXHRcdFx0XHRiYWNrQ29sb3I6IG9wdGlvbnMuY29sb3IsXG5cdFx0XHRcdGluZGV4OiBvcHRpb25zLmluZGV4XG5cdFx0XHR9XG5cdFx0fSlcblxuXHRcdHRoaXMuc2V0SW1hZ2VzID0gZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdC8vY29uc29sZS5sb2coJ1tQaWN0dXJlQ2Fyb3VzZWxDb250cm9sXSBzZXRJbWFnZXMnLCB2YWx1ZSlcblx0XHRcdGN0cmwuc2V0RGF0YSgnaW1hZ2VzJywgdmFsdWUpXG5cdFx0XHRjdHJsLnNjb3BlLmNhcm91c2VsQ3RybC5yZWZyZXNoKClcdFx0XHRcblx0XHR9LFxuXHRcdHRoaXMuc2V0SW5kZXggPSBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0Y3RybC5zZXREYXRhKCdpbmRleCcsIHZhbHVlKVxuXHRcdH1cblxuXHR9XG59KTsiLCIoZnVuY3Rpb24oKSB7XG5cblx0JCQucmVnaXN0ZXJDb250cm9sKCdSYWRpb0dyb3VwQ29udHJvbCcsIGZ1bmN0aW9uKGVsdCkge1xuXG5cdFx0ZWx0Lm9uKCdjbGljaycsICdpbnB1dFt0eXBlPXJhZGlvXScsIGZ1bmN0aW9uKCkge1xuXHRcdFx0Ly9jb25zb2xlLmxvZygncmFkaW9ncm91cCBjbGljaycpXG5cdFx0XHRlbHQuZmluZCgnaW5wdXRbdHlwZT1yYWRpb106Y2hlY2tlZCcpLnByb3AoJ2NoZWNrZWQnLCBmYWxzZSlcblx0XHRcdCQodGhpcykucHJvcCgnY2hlY2tlZCcsIHRydWUpXG5cdFx0XHRlbHQudHJpZ2dlcignaW5wdXQnKVxuXHRcdH0pXG5cdFx0XG5cblx0XHR0aGlzLmdldFZhbHVlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gZWx0LmZpbmQoJ2lucHV0W3R5cGU9cmFkaW9dOmNoZWNrZWQnKS52YWwoKVxuXHRcdH1cblxuXHRcdHRoaXMuc2V0VmFsdWUgPSBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0ZWx0LmZpbmQoJ2lucHV0W3R5cGU9cmFkaW9dJykuZWFjaChmdW5jdGlvbigpIHtcblx0XHRcdFx0JCh0aGlzKS5wcm9wKCdjaGVja2VkJywgdmFsdWUgPT09ICQodGhpcykudmFsKCkpXG5cdFx0XHR9KVx0XHRcdFxuXHRcdH1cblxuXG5cdH0pXG5cblxufSkoKTtcblxuXG4iLCIoZnVuY3Rpb24oKSB7XG5cblx0ZnVuY3Rpb24gbWF0Y2hSb3V0ZShyb3V0ZSwgcGF0dGVybikge1xuXHRcdC8vY29uc29sZS5sb2coJ21hdGNoUm91dGUnLCByb3V0ZSwgcGF0dGVybilcblx0XHR2YXIgcm91dGVTcGxpdCA9IHJvdXRlLnNwbGl0KCcvJylcblx0XHR2YXIgcGF0dGVyblNwbGl0ID0gcGF0dGVybi5zcGxpdCgnLycpXG5cdFx0Ly9jb25zb2xlLmxvZyhyb3V0ZVNwbGl0LCBwYXR0ZXJuU3BsaXQpXG5cdFx0dmFyIHJldCA9IHt9XG5cblx0XHRpZiAocm91dGVTcGxpdC5sZW5ndGggIT0gcGF0dGVyblNwbGl0Lmxlbmd0aClcblx0XHRcdHJldHVybiBudWxsXG5cblx0XHRmb3IodmFyIGlkeCA9IDA7IGlkeCA8IHBhdHRlcm5TcGxpdC5sZW5ndGg7IGlkeCsrKSB7XG5cdFx0XHR2YXIgcGF0aCA9IHBhdHRlcm5TcGxpdFtpZHhdXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdwYXRoJywgcGF0aClcblx0XHRcdGlmIChwYXRoLnN1YnN0cigwLCAxKSA9PT0gJzonKSB7XG5cdFx0XHRcdGlmIChyb3V0ZVNwbGl0W2lkeF0ubGVuZ3RoID09PSAwKVxuXHRcdFx0XHRcdHJldHVybiBudWxsXG5cdFx0XHRcdHJldFtwYXRoLnN1YnN0cigxKV0gPSByb3V0ZVNwbGl0W2lkeF1cblx0XHRcdH1cblx0XHRcdGVsc2UgaWYgKHBhdGggIT09IHJvdXRlU3BsaXRbaWR4XSkge1xuXHRcdFx0XHRyZXR1cm4gbnVsbFxuXHRcdFx0fVxuXG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJldFxuXHR9XG5cblxuXG5cblx0JCQucmVnaXN0ZXJDb250cm9sRXgoJ1JvdXRlckNvbnRyb2wnLCB7XG5cblx0XHRvcHRpb25zOiB7XG5cdFx0XHRyb3V0ZXM6IFtdXG5cdFx0fSxcblx0XHRcblx0bGliOiAnY29yZScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMpIHtcblxuXG5cblx0XHRcdHZhciByb3V0ZXMgPSBvcHRpb25zLnJvdXRlc1xuXG5cdFx0XHRpZiAoIUFycmF5LmlzQXJyYXkocm91dGVzKSkge1xuXHRcdFx0XHRjb25zb2xlLndhcm4oJ1tSb3V0ZXJDb250cm9sXSBiYWQgb3B0aW9ucycpXG5cdFx0XHRcdHJldHVyblxuXHRcdFx0fVxuXG5cblx0XHRcdGZ1bmN0aW9uIHByb2Nlc3NSb3V0ZShpbmZvKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKCdbUm91dGVyQ29udHJvbF0gcHJvY2Vzc1JvdXRlJywgaW5mbylcblxuXHRcdFx0XHR2YXIgbmV3Um91dGUgPSBpbmZvLmN1clJvdXRlXG5cblx0XHRcdFx0Zm9yKHZhciByb3V0ZSBvZiByb3V0ZXMpIHtcblx0XHRcdFx0XHR2YXIgcGFyYW1zID0gbWF0Y2hSb3V0ZShuZXdSb3V0ZSwgcm91dGUuaHJlZilcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKGByb3V0ZTogJHtyb3V0ZS5ocmVmfSwgcGFyYW1zYCwgcGFyYW1zKVxuXHRcdFx0XHRcdGlmIChwYXJhbXMgIT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnW1JvdXRlckNvbnRyb2xdIHBhcmFtcycsIHBhcmFtcylcblx0XHRcdFx0XHRcdGlmICh0eXBlb2Ygcm91dGUucmVkaXJlY3QgPT0gJ3N0cmluZycpIHtcblx0XHRcdFx0XHRcdFx0bG9jYXRpb24uaHJlZiA9ICcjJyArIHJvdXRlLnJlZGlyZWN0XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRlbHNlIGlmICh0eXBlb2Ygcm91dGUuY29udHJvbCA9PSAnc3RyaW5nJykge1xuXG5cdFx0XHRcdFx0XHRcdHZhciBjdXJDdHJsID0gZWx0LmZpbmQoJy5DdXN0b21Db250cm9sJykuaW50ZXJmYWNlKClcblx0XHRcdFx0XHRcdFx0dmFyIGNhbkNoYW5nZSA9IHRydWVcblx0XHRcdFx0XHRcdFx0aWYgKGN1ckN0cmwgJiYgdHlwZW9mIGN1ckN0cmwuY2FuQ2hhbmdlID09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRcdFx0XHRjYW5DaGFuZ2UgPSBjdXJDdHJsLmNhbkNoYW5nZSgpXG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0aWYgKGNhbkNoYW5nZSkge1xuXHRcdFx0XHRcdFx0XHRcdCQod2luZG93KS50cmlnZ2VyKCdyb3V0ZUNoYW5nZWQnLCBuZXdSb3V0ZSlcblx0XHRcdFx0XHRcdFx0XHR2YXIgY29uZmlnID0gJC5leHRlbmQoeyRwYXJhbXM6IHBhcmFtc30sIHJvdXRlLm9wdGlvbnMpXHRcblx0XHRcdFx0XHRcdFx0XHR2YXIgaHRtbCA9ICQoYDxkaXYgYm4tY29udHJvbD1cIiR7cm91dGUuY29udHJvbH1cIiBibi1vcHRpb25zPVwiY29uZmlnXCIgY2xhc3M9XCJibi1mbGV4LWNvbCBibi1mbGV4LTFcIj48L2Rpdj5gKVxuXHRcdFx0XHRcdFx0XHRcdGVsdC5kaXNwb3NlKCkuaHRtbChodG1sKVxuXHRcdFx0XHRcdFx0XHRcdGh0bWwucHJvY2Vzc1VJKHtjb25maWc6IGNvbmZpZ30pXHRcdFxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdGVsc2UgaWYgKGluZm8ucHJldlJvdXRlKSB7XG5cdFx0XHRcdFx0XHRcdFx0aGlzdG9yeS5yZXBsYWNlU3RhdGUoe30sICcnLCAnIycgKyBpbmZvLnByZXZSb3V0ZSlcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdC8vZWx0Lmh0bWwoaHRtbClcblxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0cmV0dXJuIHRydWVcblx0XHRcdFx0XHR9XHRcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gZmFsc2VcblxuXHRcdFx0fVx0XHRcblxuXHRcdFx0JCh3aW5kb3cpLm9uKCdyb3V0ZUNoYW5nZScsIGZ1bmN0aW9uKGV2LCBpbmZvKSB7XG5cdFx0XHRcdGlmICghcHJvY2Vzc1JvdXRlKGluZm8pKSB7XG5cdFx0XHRcdFx0Y29uc29sZS53YXJuKGBbUm91dGVyQ29udHJvbF0gbm8gYWN0aW9uIGRlZmluZWQgZm9yIHJvdXRlICcke25ld1JvdXRlfSdgKVxuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXG5cblx0XHR9XG5cblx0fSlcblxufSkoKTtcblxuXG4iXX0=
