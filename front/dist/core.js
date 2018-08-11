(function(){

	
	window.$$ = {}

})();

(function(){

var curRoute
	


$$.startApp = function(mainControlName, config) {
	$$.viewController('body', {
		template: `<div bn-control="${mainControlName}" class="mainPanel" bn-options="config"></div>`,
		data: {config}
	})
}

function processRoute() {
	var prevRoute = curRoute
	var href = location.href
	var idx = href.indexOf('#')
	curRoute = (idx !== -1)  ? href.substr(idx+1) : '/'
	//console.log('[Core] newRoute', curRoute, prevRoute)


	$(window).trigger('routeChange', {curRoute:curRoute, prevRoute: prevRoute})

}	

$$.configReady = function(onConfigReady) {


	$(function() {

		var appName = location.pathname.split('/')[2]

		console.log(`[Core] App '${appName}' started :)`)
		console.log('[Core] jQuery version', $.fn.jquery)
		console.log('[Core] jQuery UI version', $.ui.version)

		


		$(window).on('popstate', function(evt) {
			//console.log('[popstate] state', evt.state)
			processRoute()
		})


		$.getJSON(`/api/app/config/${appName}`)
		.then(function(config) {

			console.log('config', config)

			var options = {
				userName: config.$userName,
				appName
			}


			$$.configureService('WebSocketService', options)
			$$.configureService('UserService', options)

		
			
			
			try {
				$('body').processControls() // process HeaderControl
				
				onConfigReady(config)
			}
			catch(e) {
				var html = `
					<div class="w3-container">
						<p class="w3-text-red">${e}</p>
					</div>
				`
				$('body').html(html)
			}
			
			
			processRoute()
		})
		.catch((jqxhr) => {
			console.log('jqxhr', jqxhr)
			//var text = JSON.stringify(jqxhr.responseJSON, null, 4)
			var text = jqxhr.responseText
			var html = `
				<div class="w3-container">
					<p class="w3-text-red">${text}</p>
					<a href="/disconnect" class="w3-btn w3-blue">Logout</a>
				</div>
			`
			$('body').html(html)
		})				
			
	})
	

}

	
})();

$$.dialogController = function(title, options) {
	var div = $('<div>', {title: title})

	var ctrl = $$.viewController(div, options)

	var dlgOptions = $.extend({
		autoOpen: false,
		modal: true,
		width: 'auto',		
	}, options.options)

	//console.log('dlgOptions', dlgOptions)

	div.dialog(dlgOptions)

	ctrl.show = function() {
		div.dialog('open')
	}

	ctrl.hide = function() {
		div.dialog('close')
	}

	ctrl.setOption = function(optionName, value) {
		div.dialog('option', optionName, value)
	}

	return ctrl
};


$$.formDialogController = function(title, options) {
	var div = $('<div>', {title: title})
	var form = $('<form>')
		.appendTo(div)
		.on('submit', function(ev) {
			ev.preventDefault()
			div.dialog('close')
			if (typeof options.onApply == 'function') {
				options.onApply.call(ctrl, ctrl.elt.getFormData())
			}				
		})
	var submitBtn = $('<input>', {type: 'submit', hidden: true}).appendTo(form)

	var ctrl = $$.viewController(form, options)
	div.dialog({
		autoOpen: false,
		modal: true,
		width: 'auto',
		close: function() {
			//$(this).dialog('destroy')
		},
		buttons: {
			'Cancel': function() {
				$(this).dialog('close')
			},
			'Apply': function() {					
				submitBtn.click()
			}
		}
	})
	ctrl.show = function(data, onApply) {
		if (typeof ctrl.beforeShow == 'function') {
			ctrl.beforeShow()
		}
		options.onApply = onApply
		ctrl.elt.setFormData(data)
		div.dialog('open')
	}

	return ctrl
};

(function(){



class ViewController {
    constructor(elt, options) {
    	//console.log('ViewController', options)
    	if (typeof elt == 'string') {
    		elt = $(elt)
    	}

    	options = $.extend({}, options)
        this.elt = elt

        this.elt.on('data:update', (ev, name, value, excludeElt) => {
        	//console.log('[ViewController] data:change', name, value)
        	this.setData(name, value, excludeElt)
        })

        if (typeof options.template == 'string') {
        	this.elt = $(options.template).appendTo(elt)
        }
        this.model = $.extend({}, options.data)
        this.rules = $.extend({}, options.rules)
        this.watches = $.extend({}, options.watches)

        // generate automatic rules for computed data (aka function)
        for(var k in this.model) {
        	var data = this.model[k]
        	if (typeof data == 'function') {
        		var funcText = data.toString()
        		//console.log('funcText', funcText)
        		var rules = []
        		funcText.replace(/this.([a-zA-Z0-9_-]{1,})/g, function(match, captureOne) {
        			//console.log('captureOne', captureOne)
        			rules.push(captureOne)
        		})
        		this.rules[k] = rules.toString()
        	}
        }

        //console.log('rules', this.rules)
        this.dirList = this.elt.processUI(this.model)


        //this.elt.processUI(this.model)
        if (typeof options.events == 'object') {
            this.elt.processEvents(options.events)
        }

        this.scope = this.elt.processBindings()
        //console.log('scope', this.scope)
       
        var init = options.init
        if (typeof init == 'function') {
        	init.call(this)
        }
    } 

    setData(arg1, arg2, excludeElt) {
        //console.log('[ViewController] setData', arg1, arg2)
        var data = arg1
        if (typeof arg1 == 'string') {
        	data = {}
        	data[arg1] = arg2
        }
        //console.log('[ViewController] setData', data)
        $.extend(this.model, data)
        //console.log('model', this.model)
        this.update(Object.keys(data), excludeElt)
    }

    update(fieldsName, excludeElt) {
    	//console.log('[ViewController] update', fieldsName)
    	if (typeof fieldsName == 'string') {
    		fieldsName = fieldsName.split(',')
    	}


    	if (Array.isArray(fieldsName)) {
    		var fieldsSet = {}
    		fieldsName.forEach((field) => {

    			var watch = this.watches[field]
    			if (typeof watch == 'function') {
    				watch.call(null, this.model[field])
    			}
    			fieldsSet[field] = 1

    			for(var rule in this.rules) {
    				if (this.rules[rule].split(',').indexOf(field) != -1) {
    					fieldsSet[rule] = 1
    				}
    			}
    		})


    		this.elt.updateTemplate(this.dirList, this.model, Object.keys(fieldsSet), excludeElt)
    	}

    }
}


    $$.viewController = function (elt, options) {
        return new ViewController(elt, options)
    }

})();
(function(){



$$.registerControl = function(name, arg1, arg2) {
	$$.registerObject('controls', name, arg1, arg2)
}

$$.registerControlEx = function(name, options) {
	if (!$$.checkType(options, {
		$deps: ['string'],
		$iface: 'string',
		$events: 'string',
		init: 'function'
	})) {
		console.error(`[Core] registerControlEx: bad options`, options)
		return
	}


	var deps = options.deps || []


	$$.registerObject('controls', name, deps, options)
}



$$.createControl = function(controlName, elt) {
	elt.addClass(controlName)
	elt.addClass('CustomControl').uniqueId()	
	var ctrl = $$.getObject('controls', controlName)
		
	if (ctrl != undefined) {
		//console.log('createControl', controlName, ctrl)
		if (ctrl.status ===  'ok') {
			
			var iface = {}

			
			if (typeof ctrl.fn == 'function') {
				var args = [elt].concat(ctrl.deps)
				var defaultOptions = $.extend(true, {}, elt.data('$options'))
				console.log(`[Core] instance control '${controlName}'`)
				ctrl.fn.apply(iface, args)	
				iface.options = defaultOptions
							
			}
			else if (typeof ctrl.fn == 'object') {
				var init = ctrl.fn.init
				var props = ctrl.fn.props || {}
				var defaultOptions = $.extend({}, ctrl.fn.options, elt.data('$options'))

				var options = {}

				for(var o in defaultOptions) {
					options[o] = (elt.data(o) != undefined) ? elt.data(o) : defaultOptions[o]
				}

				for(var p in props) {
					options[p] = (elt.data(p) != undefined) ? elt.data(p) : props[p].val
				}

				//console.log('Computed Options', options)

				if (typeof init == 'function') {

					var args = [elt, options].concat(ctrl.deps)
					console.log(`[Core] instance control '${controlName}' with options`, options)
					init.apply(iface, args)
					iface.options = options
					iface.events = ctrl.fn.events

					if (Object.keys(props).length != 0) {
						iface.setProp = function(name, value) {
							//console.log(`[Core] setData`, name, value)
							var setter = props[name] && props[name].set
							if (typeof setter == 'string') {
								var setter = iface[setter]
							}
							if (typeof setter == 'function') {
								setter.call(null, value)
							}
							
							iface.options[name] = value
						}

						iface.props = function() {
							var ret = {}
							for(var k in props) {
								ret[k] = iface.options[k]

								var getter = props[k].get
								if (typeof getter == 'string') {
									getter = iface[getter]											
								}
								if (typeof getter == 'function') {
									ret[k] = getter.call(null)
								}
							}
							return ret
						}							
					}
				}
				else {
					console.warn(`[Core] control '${controlName}' missing init function`)
				}

			}

			iface.name = controlName
			elt.get(0).ctrl = iface
			
			return iface				
		}


	}
	else {
		throw(`[Core] control '${controlName}' is not registered`)
	}
}

$$.getRegisteredControls = function() {
	var controls = $$.getObjectDomain('controls')
	return Object.keys(controls).filter((name) => !name.startsWith('$'))
}

$$.getRegisteredControlsEx = function() {
	var controls = $$.getObjectDomain('controls')
	var libs = {}
	for(var k in controls) {
		var info = controls[k].fn
		var libName = info.lib
		if (typeof libName == 'string') {
			if (libs[libName] == undefined) {
				libs[libName] = []
			}
			libs[libName].push(k)

		}
	}
	return libs
}

$$.getControlInfo = function(controlName) {
	var controls = $$.getObjectDomain('controls')
	var info = controls[controlName]

	if (info == undefined) {
		console.log(`control '${controlName}' is not registered`)
		return
	}
	info = info.fn

	var ret = $$.extract(info, 'deps,options,lib')

	if (typeof info.events == 'string') {
		ret.events = info.events.split(',')
	}

	var props = {}
	for(var k in info.props) {
		props[k] = info.props[k].val
	}
	if (Object.keys(props).length != 0) {
		ret.props = props
	}
	if (typeof info.iface == 'string') {
		ret.iface = info.iface.split(';')
	}
	return ret
	//return controls[controlName].fn
}


$$.getControlsTree = function(showWhat) {
	showWhat = showWhat || ''
	var showOptions = showWhat.split(',')
	var tree = []
	$('.CustomControl').each(function() {
		var iface = $(this).interface()

		var item = {name:iface.name, elt: $(this), parent: null}
		item.id = $(this).attr('id')

		if (typeof iface.events == 'string' &&
			((showOptions.indexOf('events') >= 0 || showWhat === 'all'))) {
			item.events = iface.events.split(',')
		}			

		tree.push(item)

		if (showOptions.indexOf('iface') >= 0 || showWhat === 'all') {

			var func = []
			for(var k in iface) {
				if (typeof iface[k] == 'function' && k != 'props' && k != 'setProp') {
					func.push(k)
				}
			}
			if (func.length != 0) {
				item.iface = func
			}				
		}



		if (typeof iface.props == 'function' && 
			((showOptions.indexOf('props') >= 0 || showWhat === 'all'))) {
			item.props = iface.props()
		}

		if (typeof iface.getValue == 'function' &&
			((showOptions.indexOf('value') >= 0 || showWhat === 'all'))) {
			item.value = iface.getValue()
		}

		if (typeof iface.options == 'object' && Object.keys(iface.options).length != 0 &&
			((showOptions.indexOf('options') >= 0 || showWhat === 'all'))) {
			item.options = iface.options
		}	

					
		//console.log('name', name)
		item.childs = []


		var parents = $(this).parents('.CustomControl')
		//console.log('parents', parents)
		if (parents.length != 0) {
			var parent = parents.eq(0)
			item.parent = parent
			tree.forEach(function(i) {
				if (i.elt.get(0) == parent.get(0)) {
					i.childs.push(item)
				}
			})
			

		}
	})
	//console.log('tree', tree)

	var ret = []
	tree.forEach(function(i) {
		if (i.parent == null) {
			ret.push(i)
		}
		if (i.childs.length == 0) {
			delete i.childs
		}
		delete i.parent
		delete i.elt
	})

	return JSON.stringify(ret, null, 4)

}

})();

(function(){

var registeredObjects = {
	services: {}
}

var {services} = registeredObjects

function isDepsOk(deps) {
	return deps.reduce(function(prev, cur) {

		return prev && (cur != undefined)
	}, true)		
}

$$.getObjectDomain = function(domain) {
	return registeredObjects[domain]
}

$$.registerObject = function(domain, name, arg1, arg2) {
	var deps = []
	var fn = arg1
	if (Array.isArray(arg1)) {
		deps = arg1
		fn = arg2
	}
	if (typeof domain != 'string' || typeof name != 'string' || typeof fn == 'undefined' || !Array.isArray(deps)) {
		throw('[Core] registerObject called with bad arguments')
	} 
	console.log(`[Core] register object '${domain}:${name}' with deps`, deps)
	if (registeredObjects[domain] == undefined) {
		registeredObjects[domain] = {}
	}
	registeredObjects[domain][name] = {deps: deps, fn :fn, status: 'notloaded'}
}	

$$.getObject = function(domain, name) {
	//console.log(`[Core] getObject ${domain}:${name}`)
	var domain = registeredObjects[domain]
	var ret = domain && domain[name]
	if (ret && ret.status == 'notloaded') {
		ret.deps = $$.getServices(ret.deps)
		ret.status = isDepsOk(ret.deps) ? 'ok' : 'ko'
	}
	return ret
}

$$.getServices = function(deps) {
	//console.log('[Core] getServices', deps)
	return deps.map(function(depName) {
		var srv = services[depName]
		if (srv) {
			if (srv.status == 'notloaded') {
				var deps2 = $$.getServices(srv.deps)
				var config = srv.config || {}
				console.log(`[Core] instance service '${depName}' with config`, config)
				var args = [config].concat(deps2)
				srv.obj = srv.fn.apply(null, args)
				srv.status = 'ready'
			}
			return srv.obj				
		}
		else {
			//srv.status = 'notregistered'
			throw(`[Core] service '${depName}' is not registered`)
		}

	})
}



$$.configureService = function(name, config) {
	console.log('[Core] configureService', name, config)
	if (typeof name != 'string' || typeof config != 'object') {
		console.warn('[Core] configureService called with bad arguments')
		return
	} 	

	var srv = services[name]
	if (srv) {
		srv.config = config
	}
	else {
		throw(`[configureService] service '${name}' is not registered`)
	}

}

$$.registerService = function(name, arg1, arg2) {
	$$.registerObject('services', name, arg1, arg2)
}

$$.getRegisteredServices = function() {
	var ret = []
	for(var k in services) {
		var info = services[k]
		ret.push({name: k, status: info.status})
	}
	return ret
}


})();
$$.showAlert = function(text, title, callback) {
	title = title || 'Information'
	$('<div>', {title: title})
		.append($('<p>').html(text))
		.dialog({
			classes: {
				'ui-dialog-titlebar-close': 'no-close'
			},
			//width: 'auto',
			minWidth: 200,
			maxHeight: 400,
			modal: true,
			close: function() {
				$(this).dialog('destroy')
			},
			buttons: [
				{
					text: 'Close',
					click: function() {
						$(this).dialog('close')
						if (typeof callback == 'function') {
							callback()
						}
					}
				}
			]
		})
};	


$$.showConfirm = function(text, title, callback) {
	title = title || 'Information'
	$('<div>', {title: title})
		.append($('<p>').html(text))
		.dialog({

			modal: true,

			close: function() {
				$(this).dialog('destroy')
			},
			buttons: [
				{
					text: 'Cancel',
					//class: 'w3-button w3-red bn-no-corner',
					click: function() {
						$(this).dialog('close')

					}
				},
				{
					text: 'OK',
					//class: 'w3-button w3-blue bn-no-corner',
					click: function() {
						$(this).dialog('close')
						if (typeof callback == 'function') {
							callback()
						}
					}
				}					
			]
		})
};
	


$$.showPicture = function(title, pictureUrl) {
	$('<div>', {title: title})
		.append($('<div>', {class: 'bn-flex-col bn-align-center'})
			.append($('<img>', {src: pictureUrl}))
		)
		.dialog({

			modal: true,
			width: 'auto',
			maxHeight: 600,
			maxWidth: 600,
			//position: {my: 'center center', at: 'center center'},

			close: function() {
				$(this).dialog('destroy')
			}

		})
};




$$.showPrompt = function(label, title, callback, options) {
	title = title || 'Information'
	options = $.extend({type: 'text'}, options)
	//console.log('options', options)

	var div = $('<div>', {title: title})
		.append($('<form>')
			.append($('<p>').text(label))
			.append($('<input>', {class: 'value'}).attr(options).prop('required', true).css('width', '100%'))
			.append($('<input>', {type: 'submit'}).hide())
			.on('submit', function(ev) {
				ev.preventDefault()
				div.dialog('close')
				if (typeof callback == 'function') {
					var val = div.find('.value').val()
					callback(val)
				}				
			})
		)
		.dialog({
			classes: {
				'ui-dialog-titlebar-close': 'no-close'
			},
			modal: true,
			close: function() {
				$(this).dialog('destroy')
			},
			buttons: [
				{
					text: 'Cancel',
					click: function() {
						$(this).dialog('close')
					}
				},
				{
					text: 'Apply',
					click: function() {
						$(this).find('[type=submit]').click()
					}
				}
			]
		})
};


(function() {

	$.fn.processBindings = function() {

		var data = {}

		this.bnFind('bn-bind', true, function(elt, varName) {
			//console.log('bn-text', varName)
			data[varName] = elt
		})
		this.bnFind('bn-iface', true, function(elt, varName) {
			//console.log('bn-text', varName)
			data[varName] = elt.interface()
		})
		return data
	
	}

})();
(function() {
	


	$.fn.getParentInterface = function(parentCtrlName) {
		var parent = this.parent()
		if (!parent.hasClass(parentCtrlName)) {
			return
		}
		return parent.interface()		
	}

	$.fn.processControls = function( data) {

		data = data || {}

		this.bnFilter('[bn-control]').each(function() {
			var elt = $(this)

			var controlName = elt.attr('bn-control')
			elt.removeAttr('bn-control')
			//console.log('controlName', controlName)



			$$.createControl(controlName, elt)
		})

		return this

	}	

	$.fn.interface = function() {
		return (this.length == 0) ? null : this.get(0).ctrl
	}

	$.fn.dispose = function() {
		console.log('[Core] dispose')
		this.find('.CustomControl').each(function() {		
			var iface = $(this).interface()
			if (typeof iface == 'object' && typeof iface.dispose == 'function') {
				iface.dispose()
			}
			delete $(this).get(0).ctrl
		})
		return this
	}

})();
(function() {

	$.fn.processEvents = function(data) {
		//console.log('processEvents', data)
		if (typeof data != 'object') {
			console.error(`[core] processEvents called with bad parameter 'data' (must be an object):`, data)
			return
		}
		this.bnFindEx('bn-event', true, function(elt, attrName, varName) {
			//console.log('bn-event', attrName, varName)
			var f = attrName.split('.')
			var eventName = f[0]
			var selector = f[1]

			var fn = data[varName]
			if (typeof fn == 'function') {
				var iface = elt.interface()
				if (iface && typeof iface.on == 'function') {
					iface.on(eventName, fn.bind(iface))
					return
				}

				var useNativeEvents = ['mouseenter', 'mouseleave'].indexOf(eventName) != -1

				if (selector != undefined) {

					if (useNativeEvents) {
						elt.get(0).addEventListener(eventName, function(ev) {
							var target = $(ev.target)
							if (target.hasClass(selector)) {
								fn.call(ev.target, ev)
							}

						})					
					}
					else {
						elt.on(eventName, '.' + selector, fn)
					}

				}
				else {
					if (useNativeEvents) {
						elt.get(0).addEventListener(eventName, function(ev) {
								fn.call(ev.target, ev)
						
						})
					}
					else {
						elt.on(eventName, fn)
					}
				}				
			}
			else {
				console.warn(`[Core] processEvents: variable '${varName}' is not a function defined in data`, data)
			}		
		})
		return this
	
	}

})();
(function() {

	$.fn.getValue = function() {
		var type = this.attr('type')
		if (this.get(0).tagName == 'INPUT' && type == 'checkbox') {
			return this.prop('checked')
		}
		var iface = this.interface()
		if (iface && typeof iface.getValue == 'function') {
			return iface.getValue()
		}
		var ret = this.val()

		if (type == 'number' || type == 'range') {
			ret = parseFloat(ret)
		}
		return ret
	}


	$.fn.setValue = function(value) {
		if (this.get(0).tagName == 'INPUT' && this.attr('type') == 'checkbox') {
			this.prop('checked', value)
			return
		}

		var iface = this.interface()
		if (iface && typeof iface.setValue == 'function') {
			iface.setValue(value)
		}
		else {
			this.val(value)
		}
	}



	$.fn.getFormData = function() {
		var ret = {}
		this.find('[name]').each(function() {
			var elt = $(this)
			var name = elt.attr('name')
			ret[name] = elt.getValue()

		})

		return ret
	}

	$.fn.resetForm = function() {
		if (this.get(0).tagName == "FORM") {
			this.get(0).reset()
		}		
	}

	$.fn.setFormData = function(data) {

		//console.log('setFormData', data)
		this.resetForm()

		for(var name in data) {
			var value = data[name]
			console.log('for', name, value)
			var elt = this.find(`[name=${name}]`)
			console.log('elt', elt.length)
			if (elt.length) {
				elt.setValue(value)				
			}

		
		}

		return this
	}

	$.fn.processFormData = function(data) {
		if (data == undefined) {
			return this
		}

		if (typeof data != 'object') {
			console.error(`[core] processFormData called with bad parameter 'data' (must be an object):`, data)
			return this
		}

		this.bnFind('bn-form', true, function(elt, varName) {
			//console.log('bn-text', varName)
			var value = data[varName]
			if (typeof value == 'object') {
				elt.setFormData(value)
			}
			else {
				console.warn(`[Core] processFormData: variable '${varName}' is not an object defined in data`, data)
			}
			
		})
		return this
	
	}


})();
(function() {


	$.fn.processContextMenu = function(data) {
		if (data == undefined) {
			return this
		}

		if (typeof data != 'object') {
			console.error(`[core] processContextMenu called with bad parameter 'data' (must be an object):`, data)
			return this
		}

		this.bnFind('bn-menu', true, function(elt, varName) {
			//console.log('bn-text', varName)
			var value = data[varName]
			if (typeof value == 'object') {
				var id = elt.uniqueId().attr('id')
				console.log('[processContextMenu] id', id)
				$.contextMenu({
					selector: '#' + id,
					callback: function(key) {
						//console.log('[processContextMenu] callback', key)
						elt.trigger('menuChange', [key])
					},
					items: value
				})
			}
			else {
				console.warn(`[Core] processContextMenu: variable '${varName}' is not an object defined in data`, data)
			}
			
		})
		return this
	
	}


})();
(function() {

	function splitAttr(attrValue, cbk) {
		attrValue.split(',').forEach(function(item) {
			var list = item.split(':')
			if (list.length == 2) {
				var name = list[0].trim()
				var value = list[1].trim()
				cbk(name, value)
			}
			else {
				console.error(`[Core] splitAttr(${attrName}) 'attrValue' not correct:`, item)
			}
		})		
	}

	function getVarValue(varName, data) {
		//console.log('getVarValue', varName, data)
		var ret = data
		for(let f of varName.split('.')) {
			
			if (typeof ret == 'object' && f in ret) {
				ret = ret[f]
			}
			else {
				//console.warn(`[Core] getVarValue: attribut '${varName}' is not in object:`, data)
				return undefined
			}
			
			//console.log('f', f, 'ret', ret)
		}
		//console.log('ret', ret)
		return ret
	}

	function getValue(ctx, varName, fn) {

		//console.log('[Core] getValue', varName, ctx)

		var not = false
		if (varName.startsWith('!')) {
			varName = varName.substr(1)
			not = true
		}			

		var prefixName = varName.split('.')[0]
		//console.log('[Core] prefixName', prefixName)
		if (ctx.varsToUpdate && ctx.varsToUpdate.indexOf(prefixName) < 0) {
			return
		}

		var func = ctx.data[varName]
		var value

		if (typeof func == 'function') {
			value = func.call(ctx.data)
		}
		else {
			value = getVarValue(varName, ctx.data)
		}

		if (value == undefined) {
			//console.warn(`[Core] processTemplate: variable '${varName}' is not defined in object data:`, data)
			return
		}
		//console.log('value', value)
		if (typeof value == 'boolean' && not) {
			value = !value
		}
		fn(value)
	}

	function bnIf(ctx) {
		getValue(ctx, ctx.dirValue, function(value) {
			if (value === false) {
				ctx.elt.remove()
			}
		})		
	}

	function bnShow(ctx) {
		getValue(ctx, ctx.dirValue, function(value) {
			if (typeof value == 'boolean') {
				ctx.elt.bnVisible(value)
			}				
			else {
				console.warn(`[Core] bn-show: variable '${varName}' is not an boolean`, data)
			}
		})		
	}


	function bnEach(ctx) {
		var f = ctx.dirValue.split(' ')
		if (f.length != 3 || f[1] != 'of') {
			console.error('[Core] bn-each called with bad arguments:', dirValue)
			return
		}
		var iter = f[0]
		var varName = f[2]
		//console.log('bn-each iter', iter,  ctx.template)
		
		getValue(ctx, varName, function(value) {
			if (Array.isArray(value)) {

				ctx.elt.empty()
				
				value.forEach(function(item) {
					var itemData = $.extend({}, ctx.data)
					itemData[iter] = item
					//var $item = $(ctx.template)
					var $item = ctx.template.clone()
					$item.processUI(itemData)
					ctx.elt.append($item)
				})
			}	
			else {
				console.warn(`[Core] bn-each: variable '${varName}' is not an array`, data)
			}			
		})
	}

	function bnText(ctx) {
		//console.log('[Core] bnText', ctx)
		getValue(ctx, ctx.dirValue, function(value) {
			ctx.elt.text(value)
		})
	}
	

	function bnForm(ctx) {
		//console.log('[Core] bnText', ctx)
		getValue(ctx, ctx.dirValue, function(value) {
			ctx.elt.setFormData(value)
		})
	}
	

	function bnHtml(ctx) {
		getValue(ctx, ctx.dirValue, function(value) {
			ctx.elt.html(value)
		})
	}

	function bnCombo(ctx) {
		getValue(ctx, ctx.dirValue, function(value) {
			ctx.elt.initCombo(value)
		})
	}

	function bnOptions(ctx) {
		getValue(ctx, ctx.dirValue, function(value) {
			ctx.elt.data('$options', value)
		})
	}


	function bnVal(ctx) {
		getValue(ctx, ctx.dirValue, function(value) {
			ctx.elt.setValue(value)
		})
	}


	function bnProp(ctx) {
		splitAttr(ctx.dirValue, function(propName, varName) {
			getValue(ctx, varName, function(value) {
				if (typeof value == 'boolean') {
					ctx.elt.prop(propName, value)
				}				
				else {
					console.warn(`[Core] bn-prop: variable '${varName}' is not an boolean`, data)
				}
			})	
		})
	}

	function bnAttr(ctx) {
		splitAttr(ctx.dirValue, function(attrName, varName) {
			getValue(ctx, varName, function(value) {
				ctx.elt.attr(attrName, value)
			})
		})
	}

	function bnStyle(ctx) {
		splitAttr(ctx.dirValue, function(attrName, varName) {
			getValue(ctx, varName, function(value) {
				ctx.elt.css(attrName, value)
			})
		})
	}


	function bnData(ctx) {
		splitAttr(ctx.dirValue, function(attrName, varName) {
			getValue(ctx, varName, function(value) {
				ctx.elt.setProp(attrName, value)
			})
		})
	}


	function bnClass(ctx) {
		splitAttr(ctx.dirValue, function(propName, varName) {
			getValue(ctx, varName, function(value) {
				if (typeof value == 'boolean') {
					if (value) {
						ctx.elt.addClass(propName)
					}
					else {
						ctx.elt.removeClass(propName)
					}				
				}	
				else {
					console.warn(`[Core] bn-class: variable '${varName}' is not an boolean`, data)
				}
			})	
		})
	}	


	var dirMap = {
		'bn-each': bnEach,			
		'bn-if': bnIf,
		'bn-text': bnText,	
		'bn-html': bnHtml,
		'bn-options': bnOptions,			
		'bn-list': bnCombo,			
		'bn-val': bnVal,	
		'bn-prop': bnProp,
		'bn-attr': bnAttr,	
		'bn-data': bnData,			
		'bn-class': bnClass,
		'bn-show': bnShow,
		'bn-style': bnStyle,
		'bn-form': bnForm
	}

	$.fn.setProp = function(attrName, value) {
		var iface = this.interface()
		if (iface && iface.setProp) {
			iface.setProp(attrName, value)
		}
		else {
			this.data(attrName, value)
		}

		return this
	}



	$.fn.processTemplate = function(data) {
		//console.log('[Core] processTemplate')
		var that = this

		var dirList = []

		for(let k in dirMap) {
			this.bnFind(k, true, function(elt, dirValue) {
				var template
				if (k == 'bn-each') {
					template = elt.children().remove().clone()//.get(0).outerHTML
					//console.log('template', template)
				}
				if (k == 'bn-val') {
					elt.data('$val', dirValue)
					var updateEvent = elt.attr('bn-update')
					if (updateEvent != undefined) {
						elt.removeAttr('bn-update')
						elt.on(updateEvent, function(ev, ui) {
							//console.log('ui', ui)

							var value = (ui &&  ui.value) ||  $(this).getValue()
							//console.log('value', value)
							that.trigger('data:update', [dirValue, value, elt])
						})
					}
				}

				dirList.push({directive: k, elt: elt, dirValue: dirValue, template: template})
			})
		}

		if (data) {
			this.updateTemplate(dirList, data)
		}
				
		return dirList

	}	

	$.fn.updateTemplate = function(dirList, data, varsToUpdate, excludeElt) {
		//console.log('[core] updateTemplate', data, varsToUpdate)

			//console.log('data', data)
		varsToUpdate = varsToUpdate || Object.keys(data)
		//console.log('varsToUpdate', varsToUpdate)

		dirList.forEach(function(dirItem) {
			var fn = dirMap[dirItem.directive]
			if (typeof fn == 'function' && dirItem.elt != excludeElt) {
				dirItem.data = data;
				dirItem.varsToUpdate = varsToUpdate;
				fn(dirItem)
			}
		})			
		

		
		return this

	}	


})();
(function() {

	$.fn.processUI = function(data) {
		//console.log('processUI', data, this.html())
		var dirList = this.processTemplate(data)
		this.processControls(data)
		//.processFormData(data)
		.processContextMenu(data)
		return dirList
	}

})();
(function() {

	$.fn.bnFilter = function(selector) {
		return this.find(selector).add(this.filter(selector))
	}

	$.fn.bnFind = function(attrName, removeAttr, cbk) {
		this.bnFilter(`[${attrName}]`).each(function() {
			var elt = $(this)
			var attrValue = elt.attr(attrName)
			if (removeAttr) {
				elt.removeAttr(attrName)
			}		
			cbk(elt, attrValue)
		})
	}

	$.fn.bnFindEx = function(attrName, removeAttr, cbk) {
		this.bnFind(attrName, removeAttr, function(elt, attrValue) {
			attrValue.split(',').forEach(function(item) {
				var list = item.split(':')
				if (list.length == 2) {
					var name = list[0].trim()
					var value = list[1].trim()
					cbk(elt, name, value)
				}
				else {
					console.error(`[Core] bnFindEx(${attrName}) 'attrValue' not correct:`, item)
				}
			})
		})
	}

	$.fn.bnVisible = function(isVisible) {
		if (isVisible) {
			this.show()
		}
		else {
			this.hide()
		}
		return this	
	}

	$.fn.initCombo = function(values) {
		this
		.empty()
		.append(values.map(function(value) {
			return `<option value=${value}>${value}</option>`
		}))

		return this
	}


})();

(function(){

	
	function isObject(a) {
		return (typeof a == 'object') && !Array.isArray(a)
	}

	$$.checkType = function(value, type, isOptional) {
		//console.log('checkType',value, type, isOptional)
		if (typeof value == 'undefined' && isOptional === true) {
			return true
		}

		if (typeof type == 'string') {
			return typeof value == type
		}

		if (Array.isArray(value)) {
			if (!Array.isArray(type)) {
				return false
			}

			if (type.length == 0) {
				return true // no item type checking
			}
			for(let i of value) {
				var ret = false
				for(let t of type) {
					ret |= $$.checkType(i, t)
				}
				if (!ret) {
					return false
				}
			}

			return true
		}

		if (isObject(type)) {
			if (!isObject(value)) {
				return false
			}
			for(let f in type) {

				//console.log('f', f, 'value', value)
				var newType = type[f]

				var isOptional = false
				if (f.startsWith('$')) {
					f = f.substr(1)
					isOptional = true
				}
				if (!$$.checkType(value[f], newType, isOptional)) {
					return false
				}

			}

			return true
		}
		return false
	}	


})();

$$.dataURLtoBlob = function(dataURL) {
  // Decode the dataURL
  var split = dataURL.split(/[:,;]/)
  var mimeType = split[1]
  var encodage = split[2]
  if (encodage != 'base64') {
  	return
  }
  var data = split[3]

  console.log('mimeType', mimeType)
  console.log('encodage', encodage)
  //console.log('data', data)

  var binary = atob(data)
 // Create 8-bit unsigned array
  var array = []
  for(var i = 0; i < binary.length; i++) {
  	array.push(binary.charCodeAt(i))
  }

  // Return our Blob object
	return new Blob([ new Uint8Array(array) ], {mimeType})
};

$$.extract = function(obj, values) {
	if (typeof values == 'string') {
		values = values.split(',')
	}
	if (!Array.isArray(values) && typeof values == 'object') {
		values = Object.keys(values)
	}
	var ret = {}
	for(var k in obj) {
		if (values.indexOf(k) >= 0) {
			ret[k] = obj[k]
		}
	}
	return ret
};

$$.isImage = function(fileName) {
	return (/\.(gif|jpg|jpeg|png)$/i).test(fileName)
};

$$.loadStyle = function(styleFilePath, callback) {	
	//console.log('[Core] loadStyle', styleFilePath)

	$(function() {
		var cssOk = $('head').find(`link[href="${styleFilePath}"]`).length
		if (cssOk != 1) {
			console.log(`[Core] loading '${styleFilePath}' dependancy`)
			$('<link>', {href: styleFilePath, rel: 'stylesheet'})
			.on('load', function() {
				console.log(`[Core] '${styleFilePath}' loaded`)
				if (typeof callback == 'function') {
					callback()
				}
			})
			.appendTo($('head'))
		}
	})
};

$$.obj2Array = function(obj) {
	var ret = []
	for(var key in obj) {
		ret.push({key: key, value: obj[key]})
	}
	return ret
};

(function() {

var inputFile = $('<input>', {type: 'file'}).on('change', function() {
	var onApply = $(this).data('onApply')
	var fileName = this.files[0]
	if (typeof onApply == 'function') {
		onApply(fileName)
	}
})

$$.openFileDialog = function(onApply) {
	inputFile.data('onApply', onApply)
	inputFile.click()
}

})();


$$.readFileAsDataURL = function(fileName, onRead) {
	var fileReader = new FileReader()

	fileReader.onload = function() {
		if (typeof onRead == 'function') {
			onRead(fileReader.result)
		}
	}
	fileReader.readAsDataURL(fileName)
};

$$.readTextFile = function(fileName, onRead) {
	var fileReader = new FileReader()

	fileReader.onload = function() {
		if (typeof onRead == 'function') {
			onRead(fileReader.result)
		}
	}
	fileReader.readAsText(fileName)
};

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmpzIiwiYm9vdC9pbmRleC5qcyIsImNvbnRyb2xsZXJzL2RpYWxvZ0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9mb3JtRGlhbG9nQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL3ZpZXcuanMiLCJjb3JlL2NvbnRyb2xzLmpzIiwiY29yZS9vYmplY3RzQW5kU2VydmljZXMuanMiLCJ1aS9zaG93QWxlcnQuanMiLCJ1aS9zaG93Q29uZmlybS5qcyIsInVpL3Nob3dQaWN0dXJlLmpzIiwidWkvc2hvd1Byb21wdC5qcyIsInBsdWdpbnMvYmluZGluZy5qcyIsInBsdWdpbnMvY29udHJvbC5qcyIsInBsdWdpbnMvZXZlbnQuanMiLCJwbHVnaW5zL2Zvcm0uanMiLCJwbHVnaW5zL21lbnUuanMiLCJwbHVnaW5zL3RlbXBsYXRlLmpzIiwicGx1Z2lucy91aS5qcyIsInBsdWdpbnMvdXRpbC5qcyIsInV0aWwvY2hlY2tUeXBlLmpzIiwidXRpbC9kYXRhVVJMdG9CbG9iLmpzIiwidXRpbC9leHRyYWN0LmpzIiwidXRpbC9pc0ltYWdlLmpzIiwidXRpbC9sb2FkU3R5bGUuanMiLCJ1dGlsL29iajJBcnJheS5qcyIsInV0aWwvb3BlbkZpbGVEaWFsb2cuanMiLCJ1dGlsL3JlYWRGaWxlQXNEYXRhVVJMLmpzIiwidXRpbC9yZWFkVGV4dEZpbGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzVUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJjb3JlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7XG5cblx0XG5cdHdpbmRvdy4kJCA9IHt9XG5cbn0pKCk7XG4iLCIoZnVuY3Rpb24oKXtcblxudmFyIGN1clJvdXRlXG5cdFxuXG5cbiQkLnN0YXJ0QXBwID0gZnVuY3Rpb24obWFpbkNvbnRyb2xOYW1lLCBjb25maWcpIHtcblx0JCQudmlld0NvbnRyb2xsZXIoJ2JvZHknLCB7XG5cdFx0dGVtcGxhdGU6IGA8ZGl2IGJuLWNvbnRyb2w9XCIke21haW5Db250cm9sTmFtZX1cIiBjbGFzcz1cIm1haW5QYW5lbFwiIGJuLW9wdGlvbnM9XCJjb25maWdcIj48L2Rpdj5gLFxuXHRcdGRhdGE6IHtjb25maWd9XG5cdH0pXG59XG5cbmZ1bmN0aW9uIHByb2Nlc3NSb3V0ZSgpIHtcblx0dmFyIHByZXZSb3V0ZSA9IGN1clJvdXRlXG5cdHZhciBocmVmID0gbG9jYXRpb24uaHJlZlxuXHR2YXIgaWR4ID0gaHJlZi5pbmRleE9mKCcjJylcblx0Y3VyUm91dGUgPSAoaWR4ICE9PSAtMSkgID8gaHJlZi5zdWJzdHIoaWR4KzEpIDogJy8nXG5cdC8vY29uc29sZS5sb2coJ1tDb3JlXSBuZXdSb3V0ZScsIGN1clJvdXRlLCBwcmV2Um91dGUpXG5cblxuXHQkKHdpbmRvdykudHJpZ2dlcigncm91dGVDaGFuZ2UnLCB7Y3VyUm91dGU6Y3VyUm91dGUsIHByZXZSb3V0ZTogcHJldlJvdXRlfSlcblxufVx0XG5cbiQkLmNvbmZpZ1JlYWR5ID0gZnVuY3Rpb24ob25Db25maWdSZWFkeSkge1xuXG5cblx0JChmdW5jdGlvbigpIHtcblxuXHRcdHZhciBhcHBOYW1lID0gbG9jYXRpb24ucGF0aG5hbWUuc3BsaXQoJy8nKVsyXVxuXG5cdFx0Y29uc29sZS5sb2coYFtDb3JlXSBBcHAgJyR7YXBwTmFtZX0nIHN0YXJ0ZWQgOilgKVxuXHRcdGNvbnNvbGUubG9nKCdbQ29yZV0galF1ZXJ5IHZlcnNpb24nLCAkLmZuLmpxdWVyeSlcblx0XHRjb25zb2xlLmxvZygnW0NvcmVdIGpRdWVyeSBVSSB2ZXJzaW9uJywgJC51aS52ZXJzaW9uKVxuXG5cdFx0XG5cblxuXHRcdCQod2luZG93KS5vbigncG9wc3RhdGUnLCBmdW5jdGlvbihldnQpIHtcblx0XHRcdC8vY29uc29sZS5sb2coJ1twb3BzdGF0ZV0gc3RhdGUnLCBldnQuc3RhdGUpXG5cdFx0XHRwcm9jZXNzUm91dGUoKVxuXHRcdH0pXG5cblxuXHRcdCQuZ2V0SlNPTihgL2FwaS9hcHAvY29uZmlnLyR7YXBwTmFtZX1gKVxuXHRcdC50aGVuKGZ1bmN0aW9uKGNvbmZpZykge1xuXG5cdFx0XHRjb25zb2xlLmxvZygnY29uZmlnJywgY29uZmlnKVxuXG5cdFx0XHR2YXIgb3B0aW9ucyA9IHtcblx0XHRcdFx0dXNlck5hbWU6IGNvbmZpZy4kdXNlck5hbWUsXG5cdFx0XHRcdGFwcE5hbWVcblx0XHRcdH1cblxuXG5cdFx0XHQkJC5jb25maWd1cmVTZXJ2aWNlKCdXZWJTb2NrZXRTZXJ2aWNlJywgb3B0aW9ucylcblx0XHRcdCQkLmNvbmZpZ3VyZVNlcnZpY2UoJ1VzZXJTZXJ2aWNlJywgb3B0aW9ucylcblxuXHRcdFxuXHRcdFx0XG5cdFx0XHRcblx0XHRcdHRyeSB7XG5cdFx0XHRcdCQoJ2JvZHknKS5wcm9jZXNzQ29udHJvbHMoKSAvLyBwcm9jZXNzIEhlYWRlckNvbnRyb2xcblx0XHRcdFx0XG5cdFx0XHRcdG9uQ29uZmlnUmVhZHkoY29uZmlnKVxuXHRcdFx0fVxuXHRcdFx0Y2F0Y2goZSkge1xuXHRcdFx0XHR2YXIgaHRtbCA9IGBcblx0XHRcdFx0XHQ8ZGl2IGNsYXNzPVwidzMtY29udGFpbmVyXCI+XG5cdFx0XHRcdFx0XHQ8cCBjbGFzcz1cInczLXRleHQtcmVkXCI+JHtlfTwvcD5cblx0XHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0YFxuXHRcdFx0XHQkKCdib2R5JykuaHRtbChodG1sKVxuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRcblx0XHRcdHByb2Nlc3NSb3V0ZSgpXG5cdFx0fSlcblx0XHQuY2F0Y2goKGpxeGhyKSA9PiB7XG5cdFx0XHRjb25zb2xlLmxvZygnanF4aHInLCBqcXhocilcblx0XHRcdC8vdmFyIHRleHQgPSBKU09OLnN0cmluZ2lmeShqcXhoci5yZXNwb25zZUpTT04sIG51bGwsIDQpXG5cdFx0XHR2YXIgdGV4dCA9IGpxeGhyLnJlc3BvbnNlVGV4dFxuXHRcdFx0dmFyIGh0bWwgPSBgXG5cdFx0XHRcdDxkaXYgY2xhc3M9XCJ3My1jb250YWluZXJcIj5cblx0XHRcdFx0XHQ8cCBjbGFzcz1cInczLXRleHQtcmVkXCI+JHt0ZXh0fTwvcD5cblx0XHRcdFx0XHQ8YSBocmVmPVwiL2Rpc2Nvbm5lY3RcIiBjbGFzcz1cInczLWJ0biB3My1ibHVlXCI+TG9nb3V0PC9hPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdGBcblx0XHRcdCQoJ2JvZHknKS5odG1sKGh0bWwpXG5cdFx0fSlcdFx0XHRcdFxuXHRcdFx0XG5cdH0pXG5cdFxuXG59XG5cblx0XG59KSgpO1xuIiwiJCQuZGlhbG9nQ29udHJvbGxlciA9IGZ1bmN0aW9uKHRpdGxlLCBvcHRpb25zKSB7XG5cdHZhciBkaXYgPSAkKCc8ZGl2PicsIHt0aXRsZTogdGl0bGV9KVxuXG5cdHZhciBjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoZGl2LCBvcHRpb25zKVxuXG5cdHZhciBkbGdPcHRpb25zID0gJC5leHRlbmQoe1xuXHRcdGF1dG9PcGVuOiBmYWxzZSxcblx0XHRtb2RhbDogdHJ1ZSxcblx0XHR3aWR0aDogJ2F1dG8nLFx0XHRcblx0fSwgb3B0aW9ucy5vcHRpb25zKVxuXG5cdC8vY29uc29sZS5sb2coJ2RsZ09wdGlvbnMnLCBkbGdPcHRpb25zKVxuXG5cdGRpdi5kaWFsb2coZGxnT3B0aW9ucylcblxuXHRjdHJsLnNob3cgPSBmdW5jdGlvbigpIHtcblx0XHRkaXYuZGlhbG9nKCdvcGVuJylcblx0fVxuXG5cdGN0cmwuaGlkZSA9IGZ1bmN0aW9uKCkge1xuXHRcdGRpdi5kaWFsb2coJ2Nsb3NlJylcblx0fVxuXG5cdGN0cmwuc2V0T3B0aW9uID0gZnVuY3Rpb24ob3B0aW9uTmFtZSwgdmFsdWUpIHtcblx0XHRkaXYuZGlhbG9nKCdvcHRpb24nLCBvcHRpb25OYW1lLCB2YWx1ZSlcblx0fVxuXG5cdHJldHVybiBjdHJsXG59O1xuXG4iLCIkJC5mb3JtRGlhbG9nQ29udHJvbGxlciA9IGZ1bmN0aW9uKHRpdGxlLCBvcHRpb25zKSB7XG5cdHZhciBkaXYgPSAkKCc8ZGl2PicsIHt0aXRsZTogdGl0bGV9KVxuXHR2YXIgZm9ybSA9ICQoJzxmb3JtPicpXG5cdFx0LmFwcGVuZFRvKGRpdilcblx0XHQub24oJ3N1Ym1pdCcsIGZ1bmN0aW9uKGV2KSB7XG5cdFx0XHRldi5wcmV2ZW50RGVmYXVsdCgpXG5cdFx0XHRkaXYuZGlhbG9nKCdjbG9zZScpXG5cdFx0XHRpZiAodHlwZW9mIG9wdGlvbnMub25BcHBseSA9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdG9wdGlvbnMub25BcHBseS5jYWxsKGN0cmwsIGN0cmwuZWx0LmdldEZvcm1EYXRhKCkpXG5cdFx0XHR9XHRcdFx0XHRcblx0XHR9KVxuXHR2YXIgc3VibWl0QnRuID0gJCgnPGlucHV0PicsIHt0eXBlOiAnc3VibWl0JywgaGlkZGVuOiB0cnVlfSkuYXBwZW5kVG8oZm9ybSlcblxuXHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGZvcm0sIG9wdGlvbnMpXG5cdGRpdi5kaWFsb2coe1xuXHRcdGF1dG9PcGVuOiBmYWxzZSxcblx0XHRtb2RhbDogdHJ1ZSxcblx0XHR3aWR0aDogJ2F1dG8nLFxuXHRcdGNsb3NlOiBmdW5jdGlvbigpIHtcblx0XHRcdC8vJCh0aGlzKS5kaWFsb2coJ2Rlc3Ryb3knKVxuXHRcdH0sXG5cdFx0YnV0dG9uczoge1xuXHRcdFx0J0NhbmNlbCc6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQkKHRoaXMpLmRpYWxvZygnY2xvc2UnKVxuXHRcdFx0fSxcblx0XHRcdCdBcHBseSc6IGZ1bmN0aW9uKCkge1x0XHRcdFx0XHRcblx0XHRcdFx0c3VibWl0QnRuLmNsaWNrKClcblx0XHRcdH1cblx0XHR9XG5cdH0pXG5cdGN0cmwuc2hvdyA9IGZ1bmN0aW9uKGRhdGEsIG9uQXBwbHkpIHtcblx0XHRpZiAodHlwZW9mIGN0cmwuYmVmb3JlU2hvdyA9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRjdHJsLmJlZm9yZVNob3coKVxuXHRcdH1cblx0XHRvcHRpb25zLm9uQXBwbHkgPSBvbkFwcGx5XG5cdFx0Y3RybC5lbHQuc2V0Rm9ybURhdGEoZGF0YSlcblx0XHRkaXYuZGlhbG9nKCdvcGVuJylcblx0fVxuXG5cdHJldHVybiBjdHJsXG59O1xuIiwiKGZ1bmN0aW9uKCl7XG5cblxuXG5jbGFzcyBWaWV3Q29udHJvbGxlciB7XG4gICAgY29uc3RydWN0b3IoZWx0LCBvcHRpb25zKSB7XG4gICAgXHQvL2NvbnNvbGUubG9nKCdWaWV3Q29udHJvbGxlcicsIG9wdGlvbnMpXG4gICAgXHRpZiAodHlwZW9mIGVsdCA9PSAnc3RyaW5nJykge1xuICAgIFx0XHRlbHQgPSAkKGVsdClcbiAgICBcdH1cblxuICAgIFx0b3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBvcHRpb25zKVxuICAgICAgICB0aGlzLmVsdCA9IGVsdFxuXG4gICAgICAgIHRoaXMuZWx0Lm9uKCdkYXRhOnVwZGF0ZScsIChldiwgbmFtZSwgdmFsdWUsIGV4Y2x1ZGVFbHQpID0+IHtcbiAgICAgICAgXHQvL2NvbnNvbGUubG9nKCdbVmlld0NvbnRyb2xsZXJdIGRhdGE6Y2hhbmdlJywgbmFtZSwgdmFsdWUpXG4gICAgICAgIFx0dGhpcy5zZXREYXRhKG5hbWUsIHZhbHVlLCBleGNsdWRlRWx0KVxuICAgICAgICB9KVxuXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy50ZW1wbGF0ZSA9PSAnc3RyaW5nJykge1xuICAgICAgICBcdHRoaXMuZWx0ID0gJChvcHRpb25zLnRlbXBsYXRlKS5hcHBlbmRUbyhlbHQpXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tb2RlbCA9ICQuZXh0ZW5kKHt9LCBvcHRpb25zLmRhdGEpXG4gICAgICAgIHRoaXMucnVsZXMgPSAkLmV4dGVuZCh7fSwgb3B0aW9ucy5ydWxlcylcbiAgICAgICAgdGhpcy53YXRjaGVzID0gJC5leHRlbmQoe30sIG9wdGlvbnMud2F0Y2hlcylcblxuICAgICAgICAvLyBnZW5lcmF0ZSBhdXRvbWF0aWMgcnVsZXMgZm9yIGNvbXB1dGVkIGRhdGEgKGFrYSBmdW5jdGlvbilcbiAgICAgICAgZm9yKHZhciBrIGluIHRoaXMubW9kZWwpIHtcbiAgICAgICAgXHR2YXIgZGF0YSA9IHRoaXMubW9kZWxba11cbiAgICAgICAgXHRpZiAodHlwZW9mIGRhdGEgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBcdFx0dmFyIGZ1bmNUZXh0ID0gZGF0YS50b1N0cmluZygpXG4gICAgICAgIFx0XHQvL2NvbnNvbGUubG9nKCdmdW5jVGV4dCcsIGZ1bmNUZXh0KVxuICAgICAgICBcdFx0dmFyIHJ1bGVzID0gW11cbiAgICAgICAgXHRcdGZ1bmNUZXh0LnJlcGxhY2UoL3RoaXMuKFthLXpBLVowLTlfLV17MSx9KS9nLCBmdW5jdGlvbihtYXRjaCwgY2FwdHVyZU9uZSkge1xuICAgICAgICBcdFx0XHQvL2NvbnNvbGUubG9nKCdjYXB0dXJlT25lJywgY2FwdHVyZU9uZSlcbiAgICAgICAgXHRcdFx0cnVsZXMucHVzaChjYXB0dXJlT25lKVxuICAgICAgICBcdFx0fSlcbiAgICAgICAgXHRcdHRoaXMucnVsZXNba10gPSBydWxlcy50b1N0cmluZygpXG4gICAgICAgIFx0fVxuICAgICAgICB9XG5cbiAgICAgICAgLy9jb25zb2xlLmxvZygncnVsZXMnLCB0aGlzLnJ1bGVzKVxuICAgICAgICB0aGlzLmRpckxpc3QgPSB0aGlzLmVsdC5wcm9jZXNzVUkodGhpcy5tb2RlbClcblxuXG4gICAgICAgIC8vdGhpcy5lbHQucHJvY2Vzc1VJKHRoaXMubW9kZWwpXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5ldmVudHMgPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHRoaXMuZWx0LnByb2Nlc3NFdmVudHMob3B0aW9ucy5ldmVudHMpXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnNjb3BlID0gdGhpcy5lbHQucHJvY2Vzc0JpbmRpbmdzKClcbiAgICAgICAgLy9jb25zb2xlLmxvZygnc2NvcGUnLCB0aGlzLnNjb3BlKVxuICAgICAgIFxuICAgICAgICB2YXIgaW5pdCA9IG9wdGlvbnMuaW5pdFxuICAgICAgICBpZiAodHlwZW9mIGluaXQgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBcdGluaXQuY2FsbCh0aGlzKVxuICAgICAgICB9XG4gICAgfSBcblxuICAgIHNldERhdGEoYXJnMSwgYXJnMiwgZXhjbHVkZUVsdCkge1xuICAgICAgICAvL2NvbnNvbGUubG9nKCdbVmlld0NvbnRyb2xsZXJdIHNldERhdGEnLCBhcmcxLCBhcmcyKVxuICAgICAgICB2YXIgZGF0YSA9IGFyZzFcbiAgICAgICAgaWYgKHR5cGVvZiBhcmcxID09ICdzdHJpbmcnKSB7XG4gICAgICAgIFx0ZGF0YSA9IHt9XG4gICAgICAgIFx0ZGF0YVthcmcxXSA9IGFyZzJcbiAgICAgICAgfVxuICAgICAgICAvL2NvbnNvbGUubG9nKCdbVmlld0NvbnRyb2xsZXJdIHNldERhdGEnLCBkYXRhKVxuICAgICAgICAkLmV4dGVuZCh0aGlzLm1vZGVsLCBkYXRhKVxuICAgICAgICAvL2NvbnNvbGUubG9nKCdtb2RlbCcsIHRoaXMubW9kZWwpXG4gICAgICAgIHRoaXMudXBkYXRlKE9iamVjdC5rZXlzKGRhdGEpLCBleGNsdWRlRWx0KVxuICAgIH1cblxuICAgIHVwZGF0ZShmaWVsZHNOYW1lLCBleGNsdWRlRWx0KSB7XG4gICAgXHQvL2NvbnNvbGUubG9nKCdbVmlld0NvbnRyb2xsZXJdIHVwZGF0ZScsIGZpZWxkc05hbWUpXG4gICAgXHRpZiAodHlwZW9mIGZpZWxkc05hbWUgPT0gJ3N0cmluZycpIHtcbiAgICBcdFx0ZmllbGRzTmFtZSA9IGZpZWxkc05hbWUuc3BsaXQoJywnKVxuICAgIFx0fVxuXG5cbiAgICBcdGlmIChBcnJheS5pc0FycmF5KGZpZWxkc05hbWUpKSB7XG4gICAgXHRcdHZhciBmaWVsZHNTZXQgPSB7fVxuICAgIFx0XHRmaWVsZHNOYW1lLmZvckVhY2goKGZpZWxkKSA9PiB7XG5cbiAgICBcdFx0XHR2YXIgd2F0Y2ggPSB0aGlzLndhdGNoZXNbZmllbGRdXG4gICAgXHRcdFx0aWYgKHR5cGVvZiB3YXRjaCA9PSAnZnVuY3Rpb24nKSB7XG4gICAgXHRcdFx0XHR3YXRjaC5jYWxsKG51bGwsIHRoaXMubW9kZWxbZmllbGRdKVxuICAgIFx0XHRcdH1cbiAgICBcdFx0XHRmaWVsZHNTZXRbZmllbGRdID0gMVxuXG4gICAgXHRcdFx0Zm9yKHZhciBydWxlIGluIHRoaXMucnVsZXMpIHtcbiAgICBcdFx0XHRcdGlmICh0aGlzLnJ1bGVzW3J1bGVdLnNwbGl0KCcsJykuaW5kZXhPZihmaWVsZCkgIT0gLTEpIHtcbiAgICBcdFx0XHRcdFx0ZmllbGRzU2V0W3J1bGVdID0gMVxuICAgIFx0XHRcdFx0fVxuICAgIFx0XHRcdH1cbiAgICBcdFx0fSlcblxuXG4gICAgXHRcdHRoaXMuZWx0LnVwZGF0ZVRlbXBsYXRlKHRoaXMuZGlyTGlzdCwgdGhpcy5tb2RlbCwgT2JqZWN0LmtleXMoZmllbGRzU2V0KSwgZXhjbHVkZUVsdClcbiAgICBcdH1cblxuICAgIH1cbn1cblxuXG4gICAgJCQudmlld0NvbnRyb2xsZXIgPSBmdW5jdGlvbiAoZWx0LCBvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBuZXcgVmlld0NvbnRyb2xsZXIoZWx0LCBvcHRpb25zKVxuICAgIH1cblxufSkoKTsiLCIoZnVuY3Rpb24oKXtcblxuXG5cbiQkLnJlZ2lzdGVyQ29udHJvbCA9IGZ1bmN0aW9uKG5hbWUsIGFyZzEsIGFyZzIpIHtcblx0JCQucmVnaXN0ZXJPYmplY3QoJ2NvbnRyb2xzJywgbmFtZSwgYXJnMSwgYXJnMilcbn1cblxuJCQucmVnaXN0ZXJDb250cm9sRXggPSBmdW5jdGlvbihuYW1lLCBvcHRpb25zKSB7XG5cdGlmICghJCQuY2hlY2tUeXBlKG9wdGlvbnMsIHtcblx0XHQkZGVwczogWydzdHJpbmcnXSxcblx0XHQkaWZhY2U6ICdzdHJpbmcnLFxuXHRcdCRldmVudHM6ICdzdHJpbmcnLFxuXHRcdGluaXQ6ICdmdW5jdGlvbidcblx0fSkpIHtcblx0XHRjb25zb2xlLmVycm9yKGBbQ29yZV0gcmVnaXN0ZXJDb250cm9sRXg6IGJhZCBvcHRpb25zYCwgb3B0aW9ucylcblx0XHRyZXR1cm5cblx0fVxuXG5cblx0dmFyIGRlcHMgPSBvcHRpb25zLmRlcHMgfHwgW11cblxuXG5cdCQkLnJlZ2lzdGVyT2JqZWN0KCdjb250cm9scycsIG5hbWUsIGRlcHMsIG9wdGlvbnMpXG59XG5cblxuXG4kJC5jcmVhdGVDb250cm9sID0gZnVuY3Rpb24oY29udHJvbE5hbWUsIGVsdCkge1xuXHRlbHQuYWRkQ2xhc3MoY29udHJvbE5hbWUpXG5cdGVsdC5hZGRDbGFzcygnQ3VzdG9tQ29udHJvbCcpLnVuaXF1ZUlkKClcdFxuXHR2YXIgY3RybCA9ICQkLmdldE9iamVjdCgnY29udHJvbHMnLCBjb250cm9sTmFtZSlcblx0XHRcblx0aWYgKGN0cmwgIT0gdW5kZWZpbmVkKSB7XG5cdFx0Ly9jb25zb2xlLmxvZygnY3JlYXRlQ29udHJvbCcsIGNvbnRyb2xOYW1lLCBjdHJsKVxuXHRcdGlmIChjdHJsLnN0YXR1cyA9PT0gICdvaycpIHtcblx0XHRcdFxuXHRcdFx0dmFyIGlmYWNlID0ge31cblxuXHRcdFx0XG5cdFx0XHRpZiAodHlwZW9mIGN0cmwuZm4gPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHR2YXIgYXJncyA9IFtlbHRdLmNvbmNhdChjdHJsLmRlcHMpXG5cdFx0XHRcdHZhciBkZWZhdWx0T3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBlbHQuZGF0YSgnJG9wdGlvbnMnKSlcblx0XHRcdFx0Y29uc29sZS5sb2coYFtDb3JlXSBpbnN0YW5jZSBjb250cm9sICcke2NvbnRyb2xOYW1lfSdgKVxuXHRcdFx0XHRjdHJsLmZuLmFwcGx5KGlmYWNlLCBhcmdzKVx0XG5cdFx0XHRcdGlmYWNlLm9wdGlvbnMgPSBkZWZhdWx0T3B0aW9uc1xuXHRcdFx0XHRcdFx0XHRcblx0XHRcdH1cblx0XHRcdGVsc2UgaWYgKHR5cGVvZiBjdHJsLmZuID09ICdvYmplY3QnKSB7XG5cdFx0XHRcdHZhciBpbml0ID0gY3RybC5mbi5pbml0XG5cdFx0XHRcdHZhciBwcm9wcyA9IGN0cmwuZm4ucHJvcHMgfHwge31cblx0XHRcdFx0dmFyIGRlZmF1bHRPcHRpb25zID0gJC5leHRlbmQoe30sIGN0cmwuZm4ub3B0aW9ucywgZWx0LmRhdGEoJyRvcHRpb25zJykpXG5cblx0XHRcdFx0dmFyIG9wdGlvbnMgPSB7fVxuXG5cdFx0XHRcdGZvcih2YXIgbyBpbiBkZWZhdWx0T3B0aW9ucykge1xuXHRcdFx0XHRcdG9wdGlvbnNbb10gPSAoZWx0LmRhdGEobykgIT0gdW5kZWZpbmVkKSA/IGVsdC5kYXRhKG8pIDogZGVmYXVsdE9wdGlvbnNbb11cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGZvcih2YXIgcCBpbiBwcm9wcykge1xuXHRcdFx0XHRcdG9wdGlvbnNbcF0gPSAoZWx0LmRhdGEocCkgIT0gdW5kZWZpbmVkKSA/IGVsdC5kYXRhKHApIDogcHJvcHNbcF0udmFsXG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdDb21wdXRlZCBPcHRpb25zJywgb3B0aW9ucylcblxuXHRcdFx0XHRpZiAodHlwZW9mIGluaXQgPT0gJ2Z1bmN0aW9uJykge1xuXG5cdFx0XHRcdFx0dmFyIGFyZ3MgPSBbZWx0LCBvcHRpb25zXS5jb25jYXQoY3RybC5kZXBzKVxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKGBbQ29yZV0gaW5zdGFuY2UgY29udHJvbCAnJHtjb250cm9sTmFtZX0nIHdpdGggb3B0aW9uc2AsIG9wdGlvbnMpXG5cdFx0XHRcdFx0aW5pdC5hcHBseShpZmFjZSwgYXJncylcblx0XHRcdFx0XHRpZmFjZS5vcHRpb25zID0gb3B0aW9uc1xuXHRcdFx0XHRcdGlmYWNlLmV2ZW50cyA9IGN0cmwuZm4uZXZlbnRzXG5cblx0XHRcdFx0XHRpZiAoT2JqZWN0LmtleXMocHJvcHMpLmxlbmd0aCAhPSAwKSB7XG5cdFx0XHRcdFx0XHRpZmFjZS5zZXRQcm9wID0gZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcblx0XHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhgW0NvcmVdIHNldERhdGFgLCBuYW1lLCB2YWx1ZSlcblx0XHRcdFx0XHRcdFx0dmFyIHNldHRlciA9IHByb3BzW25hbWVdICYmIHByb3BzW25hbWVdLnNldFxuXHRcdFx0XHRcdFx0XHRpZiAodHlwZW9mIHNldHRlciA9PSAnc3RyaW5nJykge1xuXHRcdFx0XHRcdFx0XHRcdHZhciBzZXR0ZXIgPSBpZmFjZVtzZXR0ZXJdXG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBzZXR0ZXIgPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdFx0XHRcdHNldHRlci5jYWxsKG51bGwsIHZhbHVlKVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0XHRpZmFjZS5vcHRpb25zW25hbWVdID0gdmFsdWVcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0aWZhY2UucHJvcHMgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdFx0dmFyIHJldCA9IHt9XG5cdFx0XHRcdFx0XHRcdGZvcih2YXIgayBpbiBwcm9wcykge1xuXHRcdFx0XHRcdFx0XHRcdHJldFtrXSA9IGlmYWNlLm9wdGlvbnNba11cblxuXHRcdFx0XHRcdFx0XHRcdHZhciBnZXR0ZXIgPSBwcm9wc1trXS5nZXRcblx0XHRcdFx0XHRcdFx0XHRpZiAodHlwZW9mIGdldHRlciA9PSAnc3RyaW5nJykge1xuXHRcdFx0XHRcdFx0XHRcdFx0Z2V0dGVyID0gaWZhY2VbZ2V0dGVyXVx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBnZXR0ZXIgPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdFx0XHRcdFx0cmV0W2tdID0gZ2V0dGVyLmNhbGwobnVsbClcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0cmV0dXJuIHJldFxuXHRcdFx0XHRcdFx0fVx0XHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdGNvbnNvbGUud2FybihgW0NvcmVdIGNvbnRyb2wgJyR7Y29udHJvbE5hbWV9JyBtaXNzaW5nIGluaXQgZnVuY3Rpb25gKVxuXHRcdFx0XHR9XG5cblx0XHRcdH1cblxuXHRcdFx0aWZhY2UubmFtZSA9IGNvbnRyb2xOYW1lXG5cdFx0XHRlbHQuZ2V0KDApLmN0cmwgPSBpZmFjZVxuXHRcdFx0XG5cdFx0XHRyZXR1cm4gaWZhY2VcdFx0XHRcdFxuXHRcdH1cblxuXG5cdH1cblx0ZWxzZSB7XG5cdFx0dGhyb3coYFtDb3JlXSBjb250cm9sICcke2NvbnRyb2xOYW1lfScgaXMgbm90IHJlZ2lzdGVyZWRgKVxuXHR9XG59XG5cbiQkLmdldFJlZ2lzdGVyZWRDb250cm9scyA9IGZ1bmN0aW9uKCkge1xuXHR2YXIgY29udHJvbHMgPSAkJC5nZXRPYmplY3REb21haW4oJ2NvbnRyb2xzJylcblx0cmV0dXJuIE9iamVjdC5rZXlzKGNvbnRyb2xzKS5maWx0ZXIoKG5hbWUpID0+ICFuYW1lLnN0YXJ0c1dpdGgoJyQnKSlcbn1cblxuJCQuZ2V0UmVnaXN0ZXJlZENvbnRyb2xzRXggPSBmdW5jdGlvbigpIHtcblx0dmFyIGNvbnRyb2xzID0gJCQuZ2V0T2JqZWN0RG9tYWluKCdjb250cm9scycpXG5cdHZhciBsaWJzID0ge31cblx0Zm9yKHZhciBrIGluIGNvbnRyb2xzKSB7XG5cdFx0dmFyIGluZm8gPSBjb250cm9sc1trXS5mblxuXHRcdHZhciBsaWJOYW1lID0gaW5mby5saWJcblx0XHRpZiAodHlwZW9mIGxpYk5hbWUgPT0gJ3N0cmluZycpIHtcblx0XHRcdGlmIChsaWJzW2xpYk5hbWVdID09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRsaWJzW2xpYk5hbWVdID0gW11cblx0XHRcdH1cblx0XHRcdGxpYnNbbGliTmFtZV0ucHVzaChrKVxuXG5cdFx0fVxuXHR9XG5cdHJldHVybiBsaWJzXG59XG5cbiQkLmdldENvbnRyb2xJbmZvID0gZnVuY3Rpb24oY29udHJvbE5hbWUpIHtcblx0dmFyIGNvbnRyb2xzID0gJCQuZ2V0T2JqZWN0RG9tYWluKCdjb250cm9scycpXG5cdHZhciBpbmZvID0gY29udHJvbHNbY29udHJvbE5hbWVdXG5cblx0aWYgKGluZm8gPT0gdW5kZWZpbmVkKSB7XG5cdFx0Y29uc29sZS5sb2coYGNvbnRyb2wgJyR7Y29udHJvbE5hbWV9JyBpcyBub3QgcmVnaXN0ZXJlZGApXG5cdFx0cmV0dXJuXG5cdH1cblx0aW5mbyA9IGluZm8uZm5cblxuXHR2YXIgcmV0ID0gJCQuZXh0cmFjdChpbmZvLCAnZGVwcyxvcHRpb25zLGxpYicpXG5cblx0aWYgKHR5cGVvZiBpbmZvLmV2ZW50cyA9PSAnc3RyaW5nJykge1xuXHRcdHJldC5ldmVudHMgPSBpbmZvLmV2ZW50cy5zcGxpdCgnLCcpXG5cdH1cblxuXHR2YXIgcHJvcHMgPSB7fVxuXHRmb3IodmFyIGsgaW4gaW5mby5wcm9wcykge1xuXHRcdHByb3BzW2tdID0gaW5mby5wcm9wc1trXS52YWxcblx0fVxuXHRpZiAoT2JqZWN0LmtleXMocHJvcHMpLmxlbmd0aCAhPSAwKSB7XG5cdFx0cmV0LnByb3BzID0gcHJvcHNcblx0fVxuXHRpZiAodHlwZW9mIGluZm8uaWZhY2UgPT0gJ3N0cmluZycpIHtcblx0XHRyZXQuaWZhY2UgPSBpbmZvLmlmYWNlLnNwbGl0KCc7Jylcblx0fVxuXHRyZXR1cm4gcmV0XG5cdC8vcmV0dXJuIGNvbnRyb2xzW2NvbnRyb2xOYW1lXS5mblxufVxuXG5cbiQkLmdldENvbnRyb2xzVHJlZSA9IGZ1bmN0aW9uKHNob3dXaGF0KSB7XG5cdHNob3dXaGF0ID0gc2hvd1doYXQgfHwgJydcblx0dmFyIHNob3dPcHRpb25zID0gc2hvd1doYXQuc3BsaXQoJywnKVxuXHR2YXIgdHJlZSA9IFtdXG5cdCQoJy5DdXN0b21Db250cm9sJykuZWFjaChmdW5jdGlvbigpIHtcblx0XHR2YXIgaWZhY2UgPSAkKHRoaXMpLmludGVyZmFjZSgpXG5cblx0XHR2YXIgaXRlbSA9IHtuYW1lOmlmYWNlLm5hbWUsIGVsdDogJCh0aGlzKSwgcGFyZW50OiBudWxsfVxuXHRcdGl0ZW0uaWQgPSAkKHRoaXMpLmF0dHIoJ2lkJylcblxuXHRcdGlmICh0eXBlb2YgaWZhY2UuZXZlbnRzID09ICdzdHJpbmcnICYmXG5cdFx0XHQoKHNob3dPcHRpb25zLmluZGV4T2YoJ2V2ZW50cycpID49IDAgfHwgc2hvd1doYXQgPT09ICdhbGwnKSkpIHtcblx0XHRcdGl0ZW0uZXZlbnRzID0gaWZhY2UuZXZlbnRzLnNwbGl0KCcsJylcblx0XHR9XHRcdFx0XG5cblx0XHR0cmVlLnB1c2goaXRlbSlcblxuXHRcdGlmIChzaG93T3B0aW9ucy5pbmRleE9mKCdpZmFjZScpID49IDAgfHwgc2hvd1doYXQgPT09ICdhbGwnKSB7XG5cblx0XHRcdHZhciBmdW5jID0gW11cblx0XHRcdGZvcih2YXIgayBpbiBpZmFjZSkge1xuXHRcdFx0XHRpZiAodHlwZW9mIGlmYWNlW2tdID09ICdmdW5jdGlvbicgJiYgayAhPSAncHJvcHMnICYmIGsgIT0gJ3NldFByb3AnKSB7XG5cdFx0XHRcdFx0ZnVuYy5wdXNoKGspXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGlmIChmdW5jLmxlbmd0aCAhPSAwKSB7XG5cdFx0XHRcdGl0ZW0uaWZhY2UgPSBmdW5jXG5cdFx0XHR9XHRcdFx0XHRcblx0XHR9XG5cblxuXG5cdFx0aWYgKHR5cGVvZiBpZmFjZS5wcm9wcyA9PSAnZnVuY3Rpb24nICYmIFxuXHRcdFx0KChzaG93T3B0aW9ucy5pbmRleE9mKCdwcm9wcycpID49IDAgfHwgc2hvd1doYXQgPT09ICdhbGwnKSkpIHtcblx0XHRcdGl0ZW0ucHJvcHMgPSBpZmFjZS5wcm9wcygpXG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiBpZmFjZS5nZXRWYWx1ZSA9PSAnZnVuY3Rpb24nICYmXG5cdFx0XHQoKHNob3dPcHRpb25zLmluZGV4T2YoJ3ZhbHVlJykgPj0gMCB8fCBzaG93V2hhdCA9PT0gJ2FsbCcpKSkge1xuXHRcdFx0aXRlbS52YWx1ZSA9IGlmYWNlLmdldFZhbHVlKClcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIGlmYWNlLm9wdGlvbnMgPT0gJ29iamVjdCcgJiYgT2JqZWN0LmtleXMoaWZhY2Uub3B0aW9ucykubGVuZ3RoICE9IDAgJiZcblx0XHRcdCgoc2hvd09wdGlvbnMuaW5kZXhPZignb3B0aW9ucycpID49IDAgfHwgc2hvd1doYXQgPT09ICdhbGwnKSkpIHtcblx0XHRcdGl0ZW0ub3B0aW9ucyA9IGlmYWNlLm9wdGlvbnNcblx0XHR9XHRcblxuXHRcdFx0XHRcdFxuXHRcdC8vY29uc29sZS5sb2coJ25hbWUnLCBuYW1lKVxuXHRcdGl0ZW0uY2hpbGRzID0gW11cblxuXG5cdFx0dmFyIHBhcmVudHMgPSAkKHRoaXMpLnBhcmVudHMoJy5DdXN0b21Db250cm9sJylcblx0XHQvL2NvbnNvbGUubG9nKCdwYXJlbnRzJywgcGFyZW50cylcblx0XHRpZiAocGFyZW50cy5sZW5ndGggIT0gMCkge1xuXHRcdFx0dmFyIHBhcmVudCA9IHBhcmVudHMuZXEoMClcblx0XHRcdGl0ZW0ucGFyZW50ID0gcGFyZW50XG5cdFx0XHR0cmVlLmZvckVhY2goZnVuY3Rpb24oaSkge1xuXHRcdFx0XHRpZiAoaS5lbHQuZ2V0KDApID09IHBhcmVudC5nZXQoMCkpIHtcblx0XHRcdFx0XHRpLmNoaWxkcy5wdXNoKGl0ZW0pXG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0XHRcblxuXHRcdH1cblx0fSlcblx0Ly9jb25zb2xlLmxvZygndHJlZScsIHRyZWUpXG5cblx0dmFyIHJldCA9IFtdXG5cdHRyZWUuZm9yRWFjaChmdW5jdGlvbihpKSB7XG5cdFx0aWYgKGkucGFyZW50ID09IG51bGwpIHtcblx0XHRcdHJldC5wdXNoKGkpXG5cdFx0fVxuXHRcdGlmIChpLmNoaWxkcy5sZW5ndGggPT0gMCkge1xuXHRcdFx0ZGVsZXRlIGkuY2hpbGRzXG5cdFx0fVxuXHRcdGRlbGV0ZSBpLnBhcmVudFxuXHRcdGRlbGV0ZSBpLmVsdFxuXHR9KVxuXG5cdHJldHVybiBKU09OLnN0cmluZ2lmeShyZXQsIG51bGwsIDQpXG5cbn1cblxufSkoKTtcbiIsIihmdW5jdGlvbigpe1xuXG52YXIgcmVnaXN0ZXJlZE9iamVjdHMgPSB7XG5cdHNlcnZpY2VzOiB7fVxufVxuXG52YXIge3NlcnZpY2VzfSA9IHJlZ2lzdGVyZWRPYmplY3RzXG5cbmZ1bmN0aW9uIGlzRGVwc09rKGRlcHMpIHtcblx0cmV0dXJuIGRlcHMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cikge1xuXG5cdFx0cmV0dXJuIHByZXYgJiYgKGN1ciAhPSB1bmRlZmluZWQpXG5cdH0sIHRydWUpXHRcdFxufVxuXG4kJC5nZXRPYmplY3REb21haW4gPSBmdW5jdGlvbihkb21haW4pIHtcblx0cmV0dXJuIHJlZ2lzdGVyZWRPYmplY3RzW2RvbWFpbl1cbn1cblxuJCQucmVnaXN0ZXJPYmplY3QgPSBmdW5jdGlvbihkb21haW4sIG5hbWUsIGFyZzEsIGFyZzIpIHtcblx0dmFyIGRlcHMgPSBbXVxuXHR2YXIgZm4gPSBhcmcxXG5cdGlmIChBcnJheS5pc0FycmF5KGFyZzEpKSB7XG5cdFx0ZGVwcyA9IGFyZzFcblx0XHRmbiA9IGFyZzJcblx0fVxuXHRpZiAodHlwZW9mIGRvbWFpbiAhPSAnc3RyaW5nJyB8fCB0eXBlb2YgbmFtZSAhPSAnc3RyaW5nJyB8fCB0eXBlb2YgZm4gPT0gJ3VuZGVmaW5lZCcgfHwgIUFycmF5LmlzQXJyYXkoZGVwcykpIHtcblx0XHR0aHJvdygnW0NvcmVdIHJlZ2lzdGVyT2JqZWN0IGNhbGxlZCB3aXRoIGJhZCBhcmd1bWVudHMnKVxuXHR9IFxuXHRjb25zb2xlLmxvZyhgW0NvcmVdIHJlZ2lzdGVyIG9iamVjdCAnJHtkb21haW59OiR7bmFtZX0nIHdpdGggZGVwc2AsIGRlcHMpXG5cdGlmIChyZWdpc3RlcmVkT2JqZWN0c1tkb21haW5dID09IHVuZGVmaW5lZCkge1xuXHRcdHJlZ2lzdGVyZWRPYmplY3RzW2RvbWFpbl0gPSB7fVxuXHR9XG5cdHJlZ2lzdGVyZWRPYmplY3RzW2RvbWFpbl1bbmFtZV0gPSB7ZGVwczogZGVwcywgZm4gOmZuLCBzdGF0dXM6ICdub3Rsb2FkZWQnfVxufVx0XG5cbiQkLmdldE9iamVjdCA9IGZ1bmN0aW9uKGRvbWFpbiwgbmFtZSkge1xuXHQvL2NvbnNvbGUubG9nKGBbQ29yZV0gZ2V0T2JqZWN0ICR7ZG9tYWlufToke25hbWV9YClcblx0dmFyIGRvbWFpbiA9IHJlZ2lzdGVyZWRPYmplY3RzW2RvbWFpbl1cblx0dmFyIHJldCA9IGRvbWFpbiAmJiBkb21haW5bbmFtZV1cblx0aWYgKHJldCAmJiByZXQuc3RhdHVzID09ICdub3Rsb2FkZWQnKSB7XG5cdFx0cmV0LmRlcHMgPSAkJC5nZXRTZXJ2aWNlcyhyZXQuZGVwcylcblx0XHRyZXQuc3RhdHVzID0gaXNEZXBzT2socmV0LmRlcHMpID8gJ29rJyA6ICdrbydcblx0fVxuXHRyZXR1cm4gcmV0XG59XG5cbiQkLmdldFNlcnZpY2VzID0gZnVuY3Rpb24oZGVwcykge1xuXHQvL2NvbnNvbGUubG9nKCdbQ29yZV0gZ2V0U2VydmljZXMnLCBkZXBzKVxuXHRyZXR1cm4gZGVwcy5tYXAoZnVuY3Rpb24oZGVwTmFtZSkge1xuXHRcdHZhciBzcnYgPSBzZXJ2aWNlc1tkZXBOYW1lXVxuXHRcdGlmIChzcnYpIHtcblx0XHRcdGlmIChzcnYuc3RhdHVzID09ICdub3Rsb2FkZWQnKSB7XG5cdFx0XHRcdHZhciBkZXBzMiA9ICQkLmdldFNlcnZpY2VzKHNydi5kZXBzKVxuXHRcdFx0XHR2YXIgY29uZmlnID0gc3J2LmNvbmZpZyB8fCB7fVxuXHRcdFx0XHRjb25zb2xlLmxvZyhgW0NvcmVdIGluc3RhbmNlIHNlcnZpY2UgJyR7ZGVwTmFtZX0nIHdpdGggY29uZmlnYCwgY29uZmlnKVxuXHRcdFx0XHR2YXIgYXJncyA9IFtjb25maWddLmNvbmNhdChkZXBzMilcblx0XHRcdFx0c3J2Lm9iaiA9IHNydi5mbi5hcHBseShudWxsLCBhcmdzKVxuXHRcdFx0XHRzcnYuc3RhdHVzID0gJ3JlYWR5J1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHNydi5vYmpcdFx0XHRcdFxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdC8vc3J2LnN0YXR1cyA9ICdub3RyZWdpc3RlcmVkJ1xuXHRcdFx0dGhyb3coYFtDb3JlXSBzZXJ2aWNlICcke2RlcE5hbWV9JyBpcyBub3QgcmVnaXN0ZXJlZGApXG5cdFx0fVxuXG5cdH0pXG59XG5cblxuXG4kJC5jb25maWd1cmVTZXJ2aWNlID0gZnVuY3Rpb24obmFtZSwgY29uZmlnKSB7XG5cdGNvbnNvbGUubG9nKCdbQ29yZV0gY29uZmlndXJlU2VydmljZScsIG5hbWUsIGNvbmZpZylcblx0aWYgKHR5cGVvZiBuYW1lICE9ICdzdHJpbmcnIHx8IHR5cGVvZiBjb25maWcgIT0gJ29iamVjdCcpIHtcblx0XHRjb25zb2xlLndhcm4oJ1tDb3JlXSBjb25maWd1cmVTZXJ2aWNlIGNhbGxlZCB3aXRoIGJhZCBhcmd1bWVudHMnKVxuXHRcdHJldHVyblxuXHR9IFx0XG5cblx0dmFyIHNydiA9IHNlcnZpY2VzW25hbWVdXG5cdGlmIChzcnYpIHtcblx0XHRzcnYuY29uZmlnID0gY29uZmlnXG5cdH1cblx0ZWxzZSB7XG5cdFx0dGhyb3coYFtjb25maWd1cmVTZXJ2aWNlXSBzZXJ2aWNlICcke25hbWV9JyBpcyBub3QgcmVnaXN0ZXJlZGApXG5cdH1cblxufVxuXG4kJC5yZWdpc3RlclNlcnZpY2UgPSBmdW5jdGlvbihuYW1lLCBhcmcxLCBhcmcyKSB7XG5cdCQkLnJlZ2lzdGVyT2JqZWN0KCdzZXJ2aWNlcycsIG5hbWUsIGFyZzEsIGFyZzIpXG59XG5cbiQkLmdldFJlZ2lzdGVyZWRTZXJ2aWNlcyA9IGZ1bmN0aW9uKCkge1xuXHR2YXIgcmV0ID0gW11cblx0Zm9yKHZhciBrIGluIHNlcnZpY2VzKSB7XG5cdFx0dmFyIGluZm8gPSBzZXJ2aWNlc1trXVxuXHRcdHJldC5wdXNoKHtuYW1lOiBrLCBzdGF0dXM6IGluZm8uc3RhdHVzfSlcblx0fVxuXHRyZXR1cm4gcmV0XG59XG5cblxufSkoKTsiLCIkJC5zaG93QWxlcnQgPSBmdW5jdGlvbih0ZXh0LCB0aXRsZSwgY2FsbGJhY2spIHtcblx0dGl0bGUgPSB0aXRsZSB8fCAnSW5mb3JtYXRpb24nXG5cdCQoJzxkaXY+Jywge3RpdGxlOiB0aXRsZX0pXG5cdFx0LmFwcGVuZCgkKCc8cD4nKS5odG1sKHRleHQpKVxuXHRcdC5kaWFsb2coe1xuXHRcdFx0Y2xhc3Nlczoge1xuXHRcdFx0XHQndWktZGlhbG9nLXRpdGxlYmFyLWNsb3NlJzogJ25vLWNsb3NlJ1xuXHRcdFx0fSxcblx0XHRcdC8vd2lkdGg6ICdhdXRvJyxcblx0XHRcdG1pbldpZHRoOiAyMDAsXG5cdFx0XHRtYXhIZWlnaHQ6IDQwMCxcblx0XHRcdG1vZGFsOiB0cnVlLFxuXHRcdFx0Y2xvc2U6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQkKHRoaXMpLmRpYWxvZygnZGVzdHJveScpXG5cdFx0XHR9LFxuXHRcdFx0YnV0dG9uczogW1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dGV4dDogJ0Nsb3NlJyxcblx0XHRcdFx0XHRjbGljazogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHQkKHRoaXMpLmRpYWxvZygnY2xvc2UnKVxuXHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0XHRcdGNhbGxiYWNrKClcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdF1cblx0XHR9KVxufTtcdFxuXG4iLCIkJC5zaG93Q29uZmlybSA9IGZ1bmN0aW9uKHRleHQsIHRpdGxlLCBjYWxsYmFjaykge1xuXHR0aXRsZSA9IHRpdGxlIHx8ICdJbmZvcm1hdGlvbidcblx0JCgnPGRpdj4nLCB7dGl0bGU6IHRpdGxlfSlcblx0XHQuYXBwZW5kKCQoJzxwPicpLmh0bWwodGV4dCkpXG5cdFx0LmRpYWxvZyh7XG5cblx0XHRcdG1vZGFsOiB0cnVlLFxuXG5cdFx0XHRjbG9zZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdCQodGhpcykuZGlhbG9nKCdkZXN0cm95Jylcblx0XHRcdH0sXG5cdFx0XHRidXR0b25zOiBbXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR0ZXh0OiAnQ2FuY2VsJyxcblx0XHRcdFx0XHQvL2NsYXNzOiAndzMtYnV0dG9uIHczLXJlZCBibi1uby1jb3JuZXInLFxuXHRcdFx0XHRcdGNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdCQodGhpcykuZGlhbG9nKCdjbG9zZScpXG5cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR0ZXh0OiAnT0snLFxuXHRcdFx0XHRcdC8vY2xhc3M6ICd3My1idXR0b24gdzMtYmx1ZSBibi1uby1jb3JuZXInLFxuXHRcdFx0XHRcdGNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdCQodGhpcykuZGlhbG9nKCdjbG9zZScpXG5cdFx0XHRcdFx0XHRpZiAodHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRcdFx0Y2FsbGJhY2soKVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVx0XHRcdFx0XHRcblx0XHRcdF1cblx0XHR9KVxufTtcblx0XG5cbiIsIiQkLnNob3dQaWN0dXJlID0gZnVuY3Rpb24odGl0bGUsIHBpY3R1cmVVcmwpIHtcblx0JCgnPGRpdj4nLCB7dGl0bGU6IHRpdGxlfSlcblx0XHQuYXBwZW5kKCQoJzxkaXY+Jywge2NsYXNzOiAnYm4tZmxleC1jb2wgYm4tYWxpZ24tY2VudGVyJ30pXG5cdFx0XHQuYXBwZW5kKCQoJzxpbWc+Jywge3NyYzogcGljdHVyZVVybH0pKVxuXHRcdClcblx0XHQuZGlhbG9nKHtcblxuXHRcdFx0bW9kYWw6IHRydWUsXG5cdFx0XHR3aWR0aDogJ2F1dG8nLFxuXHRcdFx0bWF4SGVpZ2h0OiA2MDAsXG5cdFx0XHRtYXhXaWR0aDogNjAwLFxuXHRcdFx0Ly9wb3NpdGlvbjoge215OiAnY2VudGVyIGNlbnRlcicsIGF0OiAnY2VudGVyIGNlbnRlcid9LFxuXG5cdFx0XHRjbG9zZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdCQodGhpcykuZGlhbG9nKCdkZXN0cm95Jylcblx0XHRcdH1cblxuXHRcdH0pXG59O1xuXG5cblxuIiwiJCQuc2hvd1Byb21wdCA9IGZ1bmN0aW9uKGxhYmVsLCB0aXRsZSwgY2FsbGJhY2ssIG9wdGlvbnMpIHtcblx0dGl0bGUgPSB0aXRsZSB8fCAnSW5mb3JtYXRpb24nXG5cdG9wdGlvbnMgPSAkLmV4dGVuZCh7dHlwZTogJ3RleHQnfSwgb3B0aW9ucylcblx0Ly9jb25zb2xlLmxvZygnb3B0aW9ucycsIG9wdGlvbnMpXG5cblx0dmFyIGRpdiA9ICQoJzxkaXY+Jywge3RpdGxlOiB0aXRsZX0pXG5cdFx0LmFwcGVuZCgkKCc8Zm9ybT4nKVxuXHRcdFx0LmFwcGVuZCgkKCc8cD4nKS50ZXh0KGxhYmVsKSlcblx0XHRcdC5hcHBlbmQoJCgnPGlucHV0PicsIHtjbGFzczogJ3ZhbHVlJ30pLmF0dHIob3B0aW9ucykucHJvcCgncmVxdWlyZWQnLCB0cnVlKS5jc3MoJ3dpZHRoJywgJzEwMCUnKSlcblx0XHRcdC5hcHBlbmQoJCgnPGlucHV0PicsIHt0eXBlOiAnc3VibWl0J30pLmhpZGUoKSlcblx0XHRcdC5vbignc3VibWl0JywgZnVuY3Rpb24oZXYpIHtcblx0XHRcdFx0ZXYucHJldmVudERlZmF1bHQoKVxuXHRcdFx0XHRkaXYuZGlhbG9nKCdjbG9zZScpXG5cdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdHZhciB2YWwgPSBkaXYuZmluZCgnLnZhbHVlJykudmFsKClcblx0XHRcdFx0XHRjYWxsYmFjayh2YWwpXG5cdFx0XHRcdH1cdFx0XHRcdFxuXHRcdFx0fSlcblx0XHQpXG5cdFx0LmRpYWxvZyh7XG5cdFx0XHRjbGFzc2VzOiB7XG5cdFx0XHRcdCd1aS1kaWFsb2ctdGl0bGViYXItY2xvc2UnOiAnbm8tY2xvc2UnXG5cdFx0XHR9LFxuXHRcdFx0bW9kYWw6IHRydWUsXG5cdFx0XHRjbG9zZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdCQodGhpcykuZGlhbG9nKCdkZXN0cm95Jylcblx0XHRcdH0sXG5cdFx0XHRidXR0b25zOiBbXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR0ZXh0OiAnQ2FuY2VsJyxcblx0XHRcdFx0XHRjbGljazogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHQkKHRoaXMpLmRpYWxvZygnY2xvc2UnKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSxcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHRleHQ6ICdBcHBseScsXG5cdFx0XHRcdFx0Y2xpY2s6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0JCh0aGlzKS5maW5kKCdbdHlwZT1zdWJtaXRdJykuY2xpY2soKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XVxuXHRcdH0pXG59O1xuXG4iLCIoZnVuY3Rpb24oKSB7XG5cblx0JC5mbi5wcm9jZXNzQmluZGluZ3MgPSBmdW5jdGlvbigpIHtcblxuXHRcdHZhciBkYXRhID0ge31cblxuXHRcdHRoaXMuYm5GaW5kKCdibi1iaW5kJywgdHJ1ZSwgZnVuY3Rpb24oZWx0LCB2YXJOYW1lKSB7XG5cdFx0XHQvL2NvbnNvbGUubG9nKCdibi10ZXh0JywgdmFyTmFtZSlcblx0XHRcdGRhdGFbdmFyTmFtZV0gPSBlbHRcblx0XHR9KVxuXHRcdHRoaXMuYm5GaW5kKCdibi1pZmFjZScsIHRydWUsIGZ1bmN0aW9uKGVsdCwgdmFyTmFtZSkge1xuXHRcdFx0Ly9jb25zb2xlLmxvZygnYm4tdGV4dCcsIHZhck5hbWUpXG5cdFx0XHRkYXRhW3Zhck5hbWVdID0gZWx0LmludGVyZmFjZSgpXG5cdFx0fSlcblx0XHRyZXR1cm4gZGF0YVxuXHRcblx0fVxuXG59KSgpOyIsIihmdW5jdGlvbigpIHtcblx0XG5cblxuXHQkLmZuLmdldFBhcmVudEludGVyZmFjZSA9IGZ1bmN0aW9uKHBhcmVudEN0cmxOYW1lKSB7XG5cdFx0dmFyIHBhcmVudCA9IHRoaXMucGFyZW50KClcblx0XHRpZiAoIXBhcmVudC5oYXNDbGFzcyhwYXJlbnRDdHJsTmFtZSkpIHtcblx0XHRcdHJldHVyblxuXHRcdH1cblx0XHRyZXR1cm4gcGFyZW50LmludGVyZmFjZSgpXHRcdFxuXHR9XG5cblx0JC5mbi5wcm9jZXNzQ29udHJvbHMgPSBmdW5jdGlvbiggZGF0YSkge1xuXG5cdFx0ZGF0YSA9IGRhdGEgfHwge31cblxuXHRcdHRoaXMuYm5GaWx0ZXIoJ1tibi1jb250cm9sXScpLmVhY2goZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgZWx0ID0gJCh0aGlzKVxuXG5cdFx0XHR2YXIgY29udHJvbE5hbWUgPSBlbHQuYXR0cignYm4tY29udHJvbCcpXG5cdFx0XHRlbHQucmVtb3ZlQXR0cignYm4tY29udHJvbCcpXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdjb250cm9sTmFtZScsIGNvbnRyb2xOYW1lKVxuXG5cblxuXHRcdFx0JCQuY3JlYXRlQ29udHJvbChjb250cm9sTmFtZSwgZWx0KVxuXHRcdH0pXG5cblx0XHRyZXR1cm4gdGhpc1xuXG5cdH1cdFxuXG5cdCQuZm4uaW50ZXJmYWNlID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICh0aGlzLmxlbmd0aCA9PSAwKSA/IG51bGwgOiB0aGlzLmdldCgwKS5jdHJsXG5cdH1cblxuXHQkLmZuLmRpc3Bvc2UgPSBmdW5jdGlvbigpIHtcblx0XHRjb25zb2xlLmxvZygnW0NvcmVdIGRpc3Bvc2UnKVxuXHRcdHRoaXMuZmluZCgnLkN1c3RvbUNvbnRyb2wnKS5lYWNoKGZ1bmN0aW9uKCkge1x0XHRcblx0XHRcdHZhciBpZmFjZSA9ICQodGhpcykuaW50ZXJmYWNlKClcblx0XHRcdGlmICh0eXBlb2YgaWZhY2UgPT0gJ29iamVjdCcgJiYgdHlwZW9mIGlmYWNlLmRpc3Bvc2UgPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRpZmFjZS5kaXNwb3NlKClcblx0XHRcdH1cblx0XHRcdGRlbGV0ZSAkKHRoaXMpLmdldCgwKS5jdHJsXG5cdFx0fSlcblx0XHRyZXR1cm4gdGhpc1xuXHR9XG5cbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1xuXG5cdCQuZm4ucHJvY2Vzc0V2ZW50cyA9IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHQvL2NvbnNvbGUubG9nKCdwcm9jZXNzRXZlbnRzJywgZGF0YSlcblx0XHRpZiAodHlwZW9mIGRhdGEgIT0gJ29iamVjdCcpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoYFtjb3JlXSBwcm9jZXNzRXZlbnRzIGNhbGxlZCB3aXRoIGJhZCBwYXJhbWV0ZXIgJ2RhdGEnIChtdXN0IGJlIGFuIG9iamVjdCk6YCwgZGF0YSlcblx0XHRcdHJldHVyblxuXHRcdH1cblx0XHR0aGlzLmJuRmluZEV4KCdibi1ldmVudCcsIHRydWUsIGZ1bmN0aW9uKGVsdCwgYXR0ck5hbWUsIHZhck5hbWUpIHtcblx0XHRcdC8vY29uc29sZS5sb2coJ2JuLWV2ZW50JywgYXR0ck5hbWUsIHZhck5hbWUpXG5cdFx0XHR2YXIgZiA9IGF0dHJOYW1lLnNwbGl0KCcuJylcblx0XHRcdHZhciBldmVudE5hbWUgPSBmWzBdXG5cdFx0XHR2YXIgc2VsZWN0b3IgPSBmWzFdXG5cblx0XHRcdHZhciBmbiA9IGRhdGFbdmFyTmFtZV1cblx0XHRcdGlmICh0eXBlb2YgZm4gPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHR2YXIgaWZhY2UgPSBlbHQuaW50ZXJmYWNlKClcblx0XHRcdFx0aWYgKGlmYWNlICYmIHR5cGVvZiBpZmFjZS5vbiA9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0aWZhY2Uub24oZXZlbnROYW1lLCBmbi5iaW5kKGlmYWNlKSlcblx0XHRcdFx0XHRyZXR1cm5cblx0XHRcdFx0fVxuXG5cdFx0XHRcdHZhciB1c2VOYXRpdmVFdmVudHMgPSBbJ21vdXNlZW50ZXInLCAnbW91c2VsZWF2ZSddLmluZGV4T2YoZXZlbnROYW1lKSAhPSAtMVxuXG5cdFx0XHRcdGlmIChzZWxlY3RvciAhPSB1bmRlZmluZWQpIHtcblxuXHRcdFx0XHRcdGlmICh1c2VOYXRpdmVFdmVudHMpIHtcblx0XHRcdFx0XHRcdGVsdC5nZXQoMCkuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGZ1bmN0aW9uKGV2KSB7XG5cdFx0XHRcdFx0XHRcdHZhciB0YXJnZXQgPSAkKGV2LnRhcmdldClcblx0XHRcdFx0XHRcdFx0aWYgKHRhcmdldC5oYXNDbGFzcyhzZWxlY3RvcikpIHtcblx0XHRcdFx0XHRcdFx0XHRmbi5jYWxsKGV2LnRhcmdldCwgZXYpXG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0fSlcdFx0XHRcdFx0XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0ZWx0Lm9uKGV2ZW50TmFtZSwgJy4nICsgc2VsZWN0b3IsIGZuKVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdGlmICh1c2VOYXRpdmVFdmVudHMpIHtcblx0XHRcdFx0XHRcdGVsdC5nZXQoMCkuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGZ1bmN0aW9uKGV2KSB7XG5cdFx0XHRcdFx0XHRcdFx0Zm4uY2FsbChldi50YXJnZXQsIGV2KVxuXHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdGVsdC5vbihldmVudE5hbWUsIGZuKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVx0XHRcdFx0XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0Y29uc29sZS53YXJuKGBbQ29yZV0gcHJvY2Vzc0V2ZW50czogdmFyaWFibGUgJyR7dmFyTmFtZX0nIGlzIG5vdCBhIGZ1bmN0aW9uIGRlZmluZWQgaW4gZGF0YWAsIGRhdGEpXG5cdFx0XHR9XHRcdFxuXHRcdH0pXG5cdFx0cmV0dXJuIHRoaXNcblx0XG5cdH1cblxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XG5cblx0JC5mbi5nZXRWYWx1ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB0eXBlID0gdGhpcy5hdHRyKCd0eXBlJylcblx0XHRpZiAodGhpcy5nZXQoMCkudGFnTmFtZSA9PSAnSU5QVVQnICYmIHR5cGUgPT0gJ2NoZWNrYm94Jykge1xuXHRcdFx0cmV0dXJuIHRoaXMucHJvcCgnY2hlY2tlZCcpXG5cdFx0fVxuXHRcdHZhciBpZmFjZSA9IHRoaXMuaW50ZXJmYWNlKClcblx0XHRpZiAoaWZhY2UgJiYgdHlwZW9mIGlmYWNlLmdldFZhbHVlID09ICdmdW5jdGlvbicpIHtcblx0XHRcdHJldHVybiBpZmFjZS5nZXRWYWx1ZSgpXG5cdFx0fVxuXHRcdHZhciByZXQgPSB0aGlzLnZhbCgpXG5cblx0XHRpZiAodHlwZSA9PSAnbnVtYmVyJyB8fCB0eXBlID09ICdyYW5nZScpIHtcblx0XHRcdHJldCA9IHBhcnNlRmxvYXQocmV0KVxuXHRcdH1cblx0XHRyZXR1cm4gcmV0XG5cdH1cblxuXG5cdCQuZm4uc2V0VmFsdWUgPSBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdGlmICh0aGlzLmdldCgwKS50YWdOYW1lID09ICdJTlBVVCcgJiYgdGhpcy5hdHRyKCd0eXBlJykgPT0gJ2NoZWNrYm94Jykge1xuXHRcdFx0dGhpcy5wcm9wKCdjaGVja2VkJywgdmFsdWUpXG5cdFx0XHRyZXR1cm5cblx0XHR9XG5cblx0XHR2YXIgaWZhY2UgPSB0aGlzLmludGVyZmFjZSgpXG5cdFx0aWYgKGlmYWNlICYmIHR5cGVvZiBpZmFjZS5zZXRWYWx1ZSA9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRpZmFjZS5zZXRWYWx1ZSh2YWx1ZSlcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHR0aGlzLnZhbCh2YWx1ZSlcblx0XHR9XG5cdH1cblxuXG5cblx0JC5mbi5nZXRGb3JtRGF0YSA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciByZXQgPSB7fVxuXHRcdHRoaXMuZmluZCgnW25hbWVdJykuZWFjaChmdW5jdGlvbigpIHtcblx0XHRcdHZhciBlbHQgPSAkKHRoaXMpXG5cdFx0XHR2YXIgbmFtZSA9IGVsdC5hdHRyKCduYW1lJylcblx0XHRcdHJldFtuYW1lXSA9IGVsdC5nZXRWYWx1ZSgpXG5cblx0XHR9KVxuXG5cdFx0cmV0dXJuIHJldFxuXHR9XG5cblx0JC5mbi5yZXNldEZvcm0gPSBmdW5jdGlvbigpIHtcblx0XHRpZiAodGhpcy5nZXQoMCkudGFnTmFtZSA9PSBcIkZPUk1cIikge1xuXHRcdFx0dGhpcy5nZXQoMCkucmVzZXQoKVxuXHRcdH1cdFx0XG5cdH1cblxuXHQkLmZuLnNldEZvcm1EYXRhID0gZnVuY3Rpb24oZGF0YSkge1xuXG5cdFx0Ly9jb25zb2xlLmxvZygnc2V0Rm9ybURhdGEnLCBkYXRhKVxuXHRcdHRoaXMucmVzZXRGb3JtKClcblxuXHRcdGZvcih2YXIgbmFtZSBpbiBkYXRhKSB7XG5cdFx0XHR2YXIgdmFsdWUgPSBkYXRhW25hbWVdXG5cdFx0XHRjb25zb2xlLmxvZygnZm9yJywgbmFtZSwgdmFsdWUpXG5cdFx0XHR2YXIgZWx0ID0gdGhpcy5maW5kKGBbbmFtZT0ke25hbWV9XWApXG5cdFx0XHRjb25zb2xlLmxvZygnZWx0JywgZWx0Lmxlbmd0aClcblx0XHRcdGlmIChlbHQubGVuZ3RoKSB7XG5cdFx0XHRcdGVsdC5zZXRWYWx1ZSh2YWx1ZSlcdFx0XHRcdFxuXHRcdFx0fVxuXG5cdFx0XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXNcblx0fVxuXG5cdCQuZm4ucHJvY2Vzc0Zvcm1EYXRhID0gZnVuY3Rpb24oZGF0YSkge1xuXHRcdGlmIChkYXRhID09IHVuZGVmaW5lZCkge1xuXHRcdFx0cmV0dXJuIHRoaXNcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIGRhdGEgIT0gJ29iamVjdCcpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoYFtjb3JlXSBwcm9jZXNzRm9ybURhdGEgY2FsbGVkIHdpdGggYmFkIHBhcmFtZXRlciAnZGF0YScgKG11c3QgYmUgYW4gb2JqZWN0KTpgLCBkYXRhKVxuXHRcdFx0cmV0dXJuIHRoaXNcblx0XHR9XG5cblx0XHR0aGlzLmJuRmluZCgnYm4tZm9ybScsIHRydWUsIGZ1bmN0aW9uKGVsdCwgdmFyTmFtZSkge1xuXHRcdFx0Ly9jb25zb2xlLmxvZygnYm4tdGV4dCcsIHZhck5hbWUpXG5cdFx0XHR2YXIgdmFsdWUgPSBkYXRhW3Zhck5hbWVdXG5cdFx0XHRpZiAodHlwZW9mIHZhbHVlID09ICdvYmplY3QnKSB7XG5cdFx0XHRcdGVsdC5zZXRGb3JtRGF0YSh2YWx1ZSlcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRjb25zb2xlLndhcm4oYFtDb3JlXSBwcm9jZXNzRm9ybURhdGE6IHZhcmlhYmxlICcke3Zhck5hbWV9JyBpcyBub3QgYW4gb2JqZWN0IGRlZmluZWQgaW4gZGF0YWAsIGRhdGEpXG5cdFx0XHR9XG5cdFx0XHRcblx0XHR9KVxuXHRcdHJldHVybiB0aGlzXG5cdFxuXHR9XG5cblxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XG5cblxuXHQkLmZuLnByb2Nlc3NDb250ZXh0TWVudSA9IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRpZiAoZGF0YSA9PSB1bmRlZmluZWQpIHtcblx0XHRcdHJldHVybiB0aGlzXG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiBkYXRhICE9ICdvYmplY3QnKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKGBbY29yZV0gcHJvY2Vzc0NvbnRleHRNZW51IGNhbGxlZCB3aXRoIGJhZCBwYXJhbWV0ZXIgJ2RhdGEnIChtdXN0IGJlIGFuIG9iamVjdCk6YCwgZGF0YSlcblx0XHRcdHJldHVybiB0aGlzXG5cdFx0fVxuXG5cdFx0dGhpcy5ibkZpbmQoJ2JuLW1lbnUnLCB0cnVlLCBmdW5jdGlvbihlbHQsIHZhck5hbWUpIHtcblx0XHRcdC8vY29uc29sZS5sb2coJ2JuLXRleHQnLCB2YXJOYW1lKVxuXHRcdFx0dmFyIHZhbHVlID0gZGF0YVt2YXJOYW1lXVxuXHRcdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0Jykge1xuXHRcdFx0XHR2YXIgaWQgPSBlbHQudW5pcXVlSWQoKS5hdHRyKCdpZCcpXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdbcHJvY2Vzc0NvbnRleHRNZW51XSBpZCcsIGlkKVxuXHRcdFx0XHQkLmNvbnRleHRNZW51KHtcblx0XHRcdFx0XHRzZWxlY3RvcjogJyMnICsgaWQsXG5cdFx0XHRcdFx0Y2FsbGJhY2s6IGZ1bmN0aW9uKGtleSkge1xuXHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnW3Byb2Nlc3NDb250ZXh0TWVudV0gY2FsbGJhY2snLCBrZXkpXG5cdFx0XHRcdFx0XHRlbHQudHJpZ2dlcignbWVudUNoYW5nZScsIFtrZXldKVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0aXRlbXM6IHZhbHVlXG5cdFx0XHRcdH0pXG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0Y29uc29sZS53YXJuKGBbQ29yZV0gcHJvY2Vzc0NvbnRleHRNZW51OiB2YXJpYWJsZSAnJHt2YXJOYW1lfScgaXMgbm90IGFuIG9iamVjdCBkZWZpbmVkIGluIGRhdGFgLCBkYXRhKVxuXHRcdFx0fVxuXHRcdFx0XG5cdFx0fSlcblx0XHRyZXR1cm4gdGhpc1xuXHRcblx0fVxuXG5cbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1xuXG5cdGZ1bmN0aW9uIHNwbGl0QXR0cihhdHRyVmFsdWUsIGNiaykge1xuXHRcdGF0dHJWYWx1ZS5zcGxpdCgnLCcpLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuXHRcdFx0dmFyIGxpc3QgPSBpdGVtLnNwbGl0KCc6Jylcblx0XHRcdGlmIChsaXN0Lmxlbmd0aCA9PSAyKSB7XG5cdFx0XHRcdHZhciBuYW1lID0gbGlzdFswXS50cmltKClcblx0XHRcdFx0dmFyIHZhbHVlID0gbGlzdFsxXS50cmltKClcblx0XHRcdFx0Y2JrKG5hbWUsIHZhbHVlKVxuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoYFtDb3JlXSBzcGxpdEF0dHIoJHthdHRyTmFtZX0pICdhdHRyVmFsdWUnIG5vdCBjb3JyZWN0OmAsIGl0ZW0pXG5cdFx0XHR9XG5cdFx0fSlcdFx0XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRWYXJWYWx1ZSh2YXJOYW1lLCBkYXRhKSB7XG5cdFx0Ly9jb25zb2xlLmxvZygnZ2V0VmFyVmFsdWUnLCB2YXJOYW1lLCBkYXRhKVxuXHRcdHZhciByZXQgPSBkYXRhXG5cdFx0Zm9yKGxldCBmIG9mIHZhck5hbWUuc3BsaXQoJy4nKSkge1xuXHRcdFx0XG5cdFx0XHRpZiAodHlwZW9mIHJldCA9PSAnb2JqZWN0JyAmJiBmIGluIHJldCkge1xuXHRcdFx0XHRyZXQgPSByZXRbZl1cblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHQvL2NvbnNvbGUud2FybihgW0NvcmVdIGdldFZhclZhbHVlOiBhdHRyaWJ1dCAnJHt2YXJOYW1lfScgaXMgbm90IGluIG9iamVjdDpgLCBkYXRhKVxuXHRcdFx0XHRyZXR1cm4gdW5kZWZpbmVkXG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdC8vY29uc29sZS5sb2coJ2YnLCBmLCAncmV0JywgcmV0KVxuXHRcdH1cblx0XHQvL2NvbnNvbGUubG9nKCdyZXQnLCByZXQpXG5cdFx0cmV0dXJuIHJldFxuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0VmFsdWUoY3R4LCB2YXJOYW1lLCBmbikge1xuXG5cdFx0Ly9jb25zb2xlLmxvZygnW0NvcmVdIGdldFZhbHVlJywgdmFyTmFtZSwgY3R4KVxuXG5cdFx0dmFyIG5vdCA9IGZhbHNlXG5cdFx0aWYgKHZhck5hbWUuc3RhcnRzV2l0aCgnIScpKSB7XG5cdFx0XHR2YXJOYW1lID0gdmFyTmFtZS5zdWJzdHIoMSlcblx0XHRcdG5vdCA9IHRydWVcblx0XHR9XHRcdFx0XG5cblx0XHR2YXIgcHJlZml4TmFtZSA9IHZhck5hbWUuc3BsaXQoJy4nKVswXVxuXHRcdC8vY29uc29sZS5sb2coJ1tDb3JlXSBwcmVmaXhOYW1lJywgcHJlZml4TmFtZSlcblx0XHRpZiAoY3R4LnZhcnNUb1VwZGF0ZSAmJiBjdHgudmFyc1RvVXBkYXRlLmluZGV4T2YocHJlZml4TmFtZSkgPCAwKSB7XG5cdFx0XHRyZXR1cm5cblx0XHR9XG5cblx0XHR2YXIgZnVuYyA9IGN0eC5kYXRhW3Zhck5hbWVdXG5cdFx0dmFyIHZhbHVlXG5cblx0XHRpZiAodHlwZW9mIGZ1bmMgPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0dmFsdWUgPSBmdW5jLmNhbGwoY3R4LmRhdGEpXG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0dmFsdWUgPSBnZXRWYXJWYWx1ZSh2YXJOYW1lLCBjdHguZGF0YSlcblx0XHR9XG5cblx0XHRpZiAodmFsdWUgPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHQvL2NvbnNvbGUud2FybihgW0NvcmVdIHByb2Nlc3NUZW1wbGF0ZTogdmFyaWFibGUgJyR7dmFyTmFtZX0nIGlzIG5vdCBkZWZpbmVkIGluIG9iamVjdCBkYXRhOmAsIGRhdGEpXG5cdFx0XHRyZXR1cm5cblx0XHR9XG5cdFx0Ly9jb25zb2xlLmxvZygndmFsdWUnLCB2YWx1ZSlcblx0XHRpZiAodHlwZW9mIHZhbHVlID09ICdib29sZWFuJyAmJiBub3QpIHtcblx0XHRcdHZhbHVlID0gIXZhbHVlXG5cdFx0fVxuXHRcdGZuKHZhbHVlKVxuXHR9XG5cblx0ZnVuY3Rpb24gYm5JZihjdHgpIHtcblx0XHRnZXRWYWx1ZShjdHgsIGN0eC5kaXJWYWx1ZSwgZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdGlmICh2YWx1ZSA9PT0gZmFsc2UpIHtcblx0XHRcdFx0Y3R4LmVsdC5yZW1vdmUoKVxuXHRcdFx0fVxuXHRcdH0pXHRcdFxuXHR9XG5cblx0ZnVuY3Rpb24gYm5TaG93KGN0eCkge1xuXHRcdGdldFZhbHVlKGN0eCwgY3R4LmRpclZhbHVlLCBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PSAnYm9vbGVhbicpIHtcblx0XHRcdFx0Y3R4LmVsdC5iblZpc2libGUodmFsdWUpXG5cdFx0XHR9XHRcdFx0XHRcblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRjb25zb2xlLndhcm4oYFtDb3JlXSBibi1zaG93OiB2YXJpYWJsZSAnJHt2YXJOYW1lfScgaXMgbm90IGFuIGJvb2xlYW5gLCBkYXRhKVxuXHRcdFx0fVxuXHRcdH0pXHRcdFxuXHR9XG5cblxuXHRmdW5jdGlvbiBibkVhY2goY3R4KSB7XG5cdFx0dmFyIGYgPSBjdHguZGlyVmFsdWUuc3BsaXQoJyAnKVxuXHRcdGlmIChmLmxlbmd0aCAhPSAzIHx8IGZbMV0gIT0gJ29mJykge1xuXHRcdFx0Y29uc29sZS5lcnJvcignW0NvcmVdIGJuLWVhY2ggY2FsbGVkIHdpdGggYmFkIGFyZ3VtZW50czonLCBkaXJWYWx1ZSlcblx0XHRcdHJldHVyblxuXHRcdH1cblx0XHR2YXIgaXRlciA9IGZbMF1cblx0XHR2YXIgdmFyTmFtZSA9IGZbMl1cblx0XHQvL2NvbnNvbGUubG9nKCdibi1lYWNoIGl0ZXInLCBpdGVyLCAgY3R4LnRlbXBsYXRlKVxuXHRcdFxuXHRcdGdldFZhbHVlKGN0eCwgdmFyTmFtZSwgZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuXG5cdFx0XHRcdGN0eC5lbHQuZW1wdHkoKVxuXHRcdFx0XHRcblx0XHRcdFx0dmFsdWUuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XG5cdFx0XHRcdFx0dmFyIGl0ZW1EYXRhID0gJC5leHRlbmQoe30sIGN0eC5kYXRhKVxuXHRcdFx0XHRcdGl0ZW1EYXRhW2l0ZXJdID0gaXRlbVxuXHRcdFx0XHRcdC8vdmFyICRpdGVtID0gJChjdHgudGVtcGxhdGUpXG5cdFx0XHRcdFx0dmFyICRpdGVtID0gY3R4LnRlbXBsYXRlLmNsb25lKClcblx0XHRcdFx0XHQkaXRlbS5wcm9jZXNzVUkoaXRlbURhdGEpXG5cdFx0XHRcdFx0Y3R4LmVsdC5hcHBlbmQoJGl0ZW0pXG5cdFx0XHRcdH0pXG5cdFx0XHR9XHRcblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRjb25zb2xlLndhcm4oYFtDb3JlXSBibi1lYWNoOiB2YXJpYWJsZSAnJHt2YXJOYW1lfScgaXMgbm90IGFuIGFycmF5YCwgZGF0YSlcblx0XHRcdH1cdFx0XHRcblx0XHR9KVxuXHR9XG5cblx0ZnVuY3Rpb24gYm5UZXh0KGN0eCkge1xuXHRcdC8vY29uc29sZS5sb2coJ1tDb3JlXSBiblRleHQnLCBjdHgpXG5cdFx0Z2V0VmFsdWUoY3R4LCBjdHguZGlyVmFsdWUsIGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHRjdHguZWx0LnRleHQodmFsdWUpXG5cdFx0fSlcblx0fVxuXHRcblxuXHRmdW5jdGlvbiBibkZvcm0oY3R4KSB7XG5cdFx0Ly9jb25zb2xlLmxvZygnW0NvcmVdIGJuVGV4dCcsIGN0eClcblx0XHRnZXRWYWx1ZShjdHgsIGN0eC5kaXJWYWx1ZSwgZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdGN0eC5lbHQuc2V0Rm9ybURhdGEodmFsdWUpXG5cdFx0fSlcblx0fVxuXHRcblxuXHRmdW5jdGlvbiBibkh0bWwoY3R4KSB7XG5cdFx0Z2V0VmFsdWUoY3R4LCBjdHguZGlyVmFsdWUsIGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHRjdHguZWx0Lmh0bWwodmFsdWUpXG5cdFx0fSlcblx0fVxuXG5cdGZ1bmN0aW9uIGJuQ29tYm8oY3R4KSB7XG5cdFx0Z2V0VmFsdWUoY3R4LCBjdHguZGlyVmFsdWUsIGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHRjdHguZWx0LmluaXRDb21ibyh2YWx1ZSlcblx0XHR9KVxuXHR9XG5cblx0ZnVuY3Rpb24gYm5PcHRpb25zKGN0eCkge1xuXHRcdGdldFZhbHVlKGN0eCwgY3R4LmRpclZhbHVlLCBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0Y3R4LmVsdC5kYXRhKCckb3B0aW9ucycsIHZhbHVlKVxuXHRcdH0pXG5cdH1cblxuXG5cdGZ1bmN0aW9uIGJuVmFsKGN0eCkge1xuXHRcdGdldFZhbHVlKGN0eCwgY3R4LmRpclZhbHVlLCBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0Y3R4LmVsdC5zZXRWYWx1ZSh2YWx1ZSlcblx0XHR9KVxuXHR9XG5cblxuXHRmdW5jdGlvbiBiblByb3AoY3R4KSB7XG5cdFx0c3BsaXRBdHRyKGN0eC5kaXJWYWx1ZSwgZnVuY3Rpb24ocHJvcE5hbWUsIHZhck5hbWUpIHtcblx0XHRcdGdldFZhbHVlKGN0eCwgdmFyTmFtZSwgZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PSAnYm9vbGVhbicpIHtcblx0XHRcdFx0XHRjdHguZWx0LnByb3AocHJvcE5hbWUsIHZhbHVlKVxuXHRcdFx0XHR9XHRcdFx0XHRcblx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0Y29uc29sZS53YXJuKGBbQ29yZV0gYm4tcHJvcDogdmFyaWFibGUgJyR7dmFyTmFtZX0nIGlzIG5vdCBhbiBib29sZWFuYCwgZGF0YSlcblx0XHRcdFx0fVxuXHRcdFx0fSlcdFxuXHRcdH0pXG5cdH1cblxuXHRmdW5jdGlvbiBibkF0dHIoY3R4KSB7XG5cdFx0c3BsaXRBdHRyKGN0eC5kaXJWYWx1ZSwgZnVuY3Rpb24oYXR0ck5hbWUsIHZhck5hbWUpIHtcblx0XHRcdGdldFZhbHVlKGN0eCwgdmFyTmFtZSwgZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdFx0Y3R4LmVsdC5hdHRyKGF0dHJOYW1lLCB2YWx1ZSlcblx0XHRcdH0pXG5cdFx0fSlcblx0fVxuXG5cdGZ1bmN0aW9uIGJuU3R5bGUoY3R4KSB7XG5cdFx0c3BsaXRBdHRyKGN0eC5kaXJWYWx1ZSwgZnVuY3Rpb24oYXR0ck5hbWUsIHZhck5hbWUpIHtcblx0XHRcdGdldFZhbHVlKGN0eCwgdmFyTmFtZSwgZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdFx0Y3R4LmVsdC5jc3MoYXR0ck5hbWUsIHZhbHVlKVxuXHRcdFx0fSlcblx0XHR9KVxuXHR9XG5cblxuXHRmdW5jdGlvbiBibkRhdGEoY3R4KSB7XG5cdFx0c3BsaXRBdHRyKGN0eC5kaXJWYWx1ZSwgZnVuY3Rpb24oYXR0ck5hbWUsIHZhck5hbWUpIHtcblx0XHRcdGdldFZhbHVlKGN0eCwgdmFyTmFtZSwgZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdFx0Y3R4LmVsdC5zZXRQcm9wKGF0dHJOYW1lLCB2YWx1ZSlcblx0XHRcdH0pXG5cdFx0fSlcblx0fVxuXG5cblx0ZnVuY3Rpb24gYm5DbGFzcyhjdHgpIHtcblx0XHRzcGxpdEF0dHIoY3R4LmRpclZhbHVlLCBmdW5jdGlvbihwcm9wTmFtZSwgdmFyTmFtZSkge1xuXHRcdFx0Z2V0VmFsdWUoY3R4LCB2YXJOYW1lLCBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0XHRpZiAodHlwZW9mIHZhbHVlID09ICdib29sZWFuJykge1xuXHRcdFx0XHRcdGlmICh2YWx1ZSkge1xuXHRcdFx0XHRcdFx0Y3R4LmVsdC5hZGRDbGFzcyhwcm9wTmFtZSlcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHRjdHguZWx0LnJlbW92ZUNsYXNzKHByb3BOYW1lKVxuXHRcdFx0XHRcdH1cdFx0XHRcdFxuXHRcdFx0XHR9XHRcblx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0Y29uc29sZS53YXJuKGBbQ29yZV0gYm4tY2xhc3M6IHZhcmlhYmxlICcke3Zhck5hbWV9JyBpcyBub3QgYW4gYm9vbGVhbmAsIGRhdGEpXG5cdFx0XHRcdH1cblx0XHRcdH0pXHRcblx0XHR9KVxuXHR9XHRcblxuXG5cdHZhciBkaXJNYXAgPSB7XG5cdFx0J2JuLWVhY2gnOiBibkVhY2gsXHRcdFx0XG5cdFx0J2JuLWlmJzogYm5JZixcblx0XHQnYm4tdGV4dCc6IGJuVGV4dCxcdFxuXHRcdCdibi1odG1sJzogYm5IdG1sLFxuXHRcdCdibi1vcHRpb25zJzogYm5PcHRpb25zLFx0XHRcdFxuXHRcdCdibi1saXN0JzogYm5Db21ibyxcdFx0XHRcblx0XHQnYm4tdmFsJzogYm5WYWwsXHRcblx0XHQnYm4tcHJvcCc6IGJuUHJvcCxcblx0XHQnYm4tYXR0cic6IGJuQXR0cixcdFxuXHRcdCdibi1kYXRhJzogYm5EYXRhLFx0XHRcdFxuXHRcdCdibi1jbGFzcyc6IGJuQ2xhc3MsXG5cdFx0J2JuLXNob3cnOiBiblNob3csXG5cdFx0J2JuLXN0eWxlJzogYm5TdHlsZSxcblx0XHQnYm4tZm9ybSc6IGJuRm9ybVxuXHR9XG5cblx0JC5mbi5zZXRQcm9wID0gZnVuY3Rpb24oYXR0ck5hbWUsIHZhbHVlKSB7XG5cdFx0dmFyIGlmYWNlID0gdGhpcy5pbnRlcmZhY2UoKVxuXHRcdGlmIChpZmFjZSAmJiBpZmFjZS5zZXRQcm9wKSB7XG5cdFx0XHRpZmFjZS5zZXRQcm9wKGF0dHJOYW1lLCB2YWx1ZSlcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHR0aGlzLmRhdGEoYXR0ck5hbWUsIHZhbHVlKVxuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzXG5cdH1cblxuXG5cblx0JC5mbi5wcm9jZXNzVGVtcGxhdGUgPSBmdW5jdGlvbihkYXRhKSB7XG5cdFx0Ly9jb25zb2xlLmxvZygnW0NvcmVdIHByb2Nlc3NUZW1wbGF0ZScpXG5cdFx0dmFyIHRoYXQgPSB0aGlzXG5cblx0XHR2YXIgZGlyTGlzdCA9IFtdXG5cblx0XHRmb3IobGV0IGsgaW4gZGlyTWFwKSB7XG5cdFx0XHR0aGlzLmJuRmluZChrLCB0cnVlLCBmdW5jdGlvbihlbHQsIGRpclZhbHVlKSB7XG5cdFx0XHRcdHZhciB0ZW1wbGF0ZVxuXHRcdFx0XHRpZiAoayA9PSAnYm4tZWFjaCcpIHtcblx0XHRcdFx0XHR0ZW1wbGF0ZSA9IGVsdC5jaGlsZHJlbigpLnJlbW92ZSgpLmNsb25lKCkvLy5nZXQoMCkub3V0ZXJIVE1MXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygndGVtcGxhdGUnLCB0ZW1wbGF0ZSlcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoayA9PSAnYm4tdmFsJykge1xuXHRcdFx0XHRcdGVsdC5kYXRhKCckdmFsJywgZGlyVmFsdWUpXG5cdFx0XHRcdFx0dmFyIHVwZGF0ZUV2ZW50ID0gZWx0LmF0dHIoJ2JuLXVwZGF0ZScpXG5cdFx0XHRcdFx0aWYgKHVwZGF0ZUV2ZW50ICE9IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdFx0ZWx0LnJlbW92ZUF0dHIoJ2JuLXVwZGF0ZScpXG5cdFx0XHRcdFx0XHRlbHQub24odXBkYXRlRXZlbnQsIGZ1bmN0aW9uKGV2LCB1aSkge1xuXHRcdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCd1aScsIHVpKVxuXG5cdFx0XHRcdFx0XHRcdHZhciB2YWx1ZSA9ICh1aSAmJiAgdWkudmFsdWUpIHx8ICAkKHRoaXMpLmdldFZhbHVlKClcblx0XHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygndmFsdWUnLCB2YWx1ZSlcblx0XHRcdFx0XHRcdFx0dGhhdC50cmlnZ2VyKCdkYXRhOnVwZGF0ZScsIFtkaXJWYWx1ZSwgdmFsdWUsIGVsdF0pXG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGRpckxpc3QucHVzaCh7ZGlyZWN0aXZlOiBrLCBlbHQ6IGVsdCwgZGlyVmFsdWU6IGRpclZhbHVlLCB0ZW1wbGF0ZTogdGVtcGxhdGV9KVxuXHRcdFx0fSlcblx0XHR9XG5cblx0XHRpZiAoZGF0YSkge1xuXHRcdFx0dGhpcy51cGRhdGVUZW1wbGF0ZShkaXJMaXN0LCBkYXRhKVxuXHRcdH1cblx0XHRcdFx0XG5cdFx0cmV0dXJuIGRpckxpc3RcblxuXHR9XHRcblxuXHQkLmZuLnVwZGF0ZVRlbXBsYXRlID0gZnVuY3Rpb24oZGlyTGlzdCwgZGF0YSwgdmFyc1RvVXBkYXRlLCBleGNsdWRlRWx0KSB7XG5cdFx0Ly9jb25zb2xlLmxvZygnW2NvcmVdIHVwZGF0ZVRlbXBsYXRlJywgZGF0YSwgdmFyc1RvVXBkYXRlKVxuXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdkYXRhJywgZGF0YSlcblx0XHR2YXJzVG9VcGRhdGUgPSB2YXJzVG9VcGRhdGUgfHwgT2JqZWN0LmtleXMoZGF0YSlcblx0XHQvL2NvbnNvbGUubG9nKCd2YXJzVG9VcGRhdGUnLCB2YXJzVG9VcGRhdGUpXG5cblx0XHRkaXJMaXN0LmZvckVhY2goZnVuY3Rpb24oZGlySXRlbSkge1xuXHRcdFx0dmFyIGZuID0gZGlyTWFwW2Rpckl0ZW0uZGlyZWN0aXZlXVxuXHRcdFx0aWYgKHR5cGVvZiBmbiA9PSAnZnVuY3Rpb24nICYmIGRpckl0ZW0uZWx0ICE9IGV4Y2x1ZGVFbHQpIHtcblx0XHRcdFx0ZGlySXRlbS5kYXRhID0gZGF0YTtcblx0XHRcdFx0ZGlySXRlbS52YXJzVG9VcGRhdGUgPSB2YXJzVG9VcGRhdGU7XG5cdFx0XHRcdGZuKGRpckl0ZW0pXG5cdFx0XHR9XG5cdFx0fSlcdFx0XHRcblx0XHRcblxuXHRcdFxuXHRcdHJldHVybiB0aGlzXG5cblx0fVx0XG5cblxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XG5cblx0JC5mbi5wcm9jZXNzVUkgPSBmdW5jdGlvbihkYXRhKSB7XG5cdFx0Ly9jb25zb2xlLmxvZygncHJvY2Vzc1VJJywgZGF0YSwgdGhpcy5odG1sKCkpXG5cdFx0dmFyIGRpckxpc3QgPSB0aGlzLnByb2Nlc3NUZW1wbGF0ZShkYXRhKVxuXHRcdHRoaXMucHJvY2Vzc0NvbnRyb2xzKGRhdGEpXG5cdFx0Ly8ucHJvY2Vzc0Zvcm1EYXRhKGRhdGEpXG5cdFx0LnByb2Nlc3NDb250ZXh0TWVudShkYXRhKVxuXHRcdHJldHVybiBkaXJMaXN0XG5cdH1cblxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XG5cblx0JC5mbi5ibkZpbHRlciA9IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XG5cdFx0cmV0dXJuIHRoaXMuZmluZChzZWxlY3RvcikuYWRkKHRoaXMuZmlsdGVyKHNlbGVjdG9yKSlcblx0fVxuXG5cdCQuZm4uYm5GaW5kID0gZnVuY3Rpb24oYXR0ck5hbWUsIHJlbW92ZUF0dHIsIGNiaykge1xuXHRcdHRoaXMuYm5GaWx0ZXIoYFske2F0dHJOYW1lfV1gKS5lYWNoKGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGVsdCA9ICQodGhpcylcblx0XHRcdHZhciBhdHRyVmFsdWUgPSBlbHQuYXR0cihhdHRyTmFtZSlcblx0XHRcdGlmIChyZW1vdmVBdHRyKSB7XG5cdFx0XHRcdGVsdC5yZW1vdmVBdHRyKGF0dHJOYW1lKVxuXHRcdFx0fVx0XHRcblx0XHRcdGNiayhlbHQsIGF0dHJWYWx1ZSlcblx0XHR9KVxuXHR9XG5cblx0JC5mbi5ibkZpbmRFeCA9IGZ1bmN0aW9uKGF0dHJOYW1lLCByZW1vdmVBdHRyLCBjYmspIHtcblx0XHR0aGlzLmJuRmluZChhdHRyTmFtZSwgcmVtb3ZlQXR0ciwgZnVuY3Rpb24oZWx0LCBhdHRyVmFsdWUpIHtcblx0XHRcdGF0dHJWYWx1ZS5zcGxpdCgnLCcpLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuXHRcdFx0XHR2YXIgbGlzdCA9IGl0ZW0uc3BsaXQoJzonKVxuXHRcdFx0XHRpZiAobGlzdC5sZW5ndGggPT0gMikge1xuXHRcdFx0XHRcdHZhciBuYW1lID0gbGlzdFswXS50cmltKClcblx0XHRcdFx0XHR2YXIgdmFsdWUgPSBsaXN0WzFdLnRyaW0oKVxuXHRcdFx0XHRcdGNiayhlbHQsIG5hbWUsIHZhbHVlKVxuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoYFtDb3JlXSBibkZpbmRFeCgke2F0dHJOYW1lfSkgJ2F0dHJWYWx1ZScgbm90IGNvcnJlY3Q6YCwgaXRlbSlcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHR9KVxuXHR9XG5cblx0JC5mbi5iblZpc2libGUgPSBmdW5jdGlvbihpc1Zpc2libGUpIHtcblx0XHRpZiAoaXNWaXNpYmxlKSB7XG5cdFx0XHR0aGlzLnNob3coKVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHRoaXMuaGlkZSgpXG5cdFx0fVxuXHRcdHJldHVybiB0aGlzXHRcblx0fVxuXG5cdCQuZm4uaW5pdENvbWJvID0gZnVuY3Rpb24odmFsdWVzKSB7XG5cdFx0dGhpc1xuXHRcdC5lbXB0eSgpXG5cdFx0LmFwcGVuZCh2YWx1ZXMubWFwKGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHRyZXR1cm4gYDxvcHRpb24gdmFsdWU9JHt2YWx1ZX0+JHt2YWx1ZX08L29wdGlvbj5gXG5cdFx0fSkpXG5cblx0XHRyZXR1cm4gdGhpc1xuXHR9XG5cblxufSkoKTtcbiIsIihmdW5jdGlvbigpe1xuXG5cdFxuXHRmdW5jdGlvbiBpc09iamVjdChhKSB7XG5cdFx0cmV0dXJuICh0eXBlb2YgYSA9PSAnb2JqZWN0JykgJiYgIUFycmF5LmlzQXJyYXkoYSlcblx0fVxuXG5cdCQkLmNoZWNrVHlwZSA9IGZ1bmN0aW9uKHZhbHVlLCB0eXBlLCBpc09wdGlvbmFsKSB7XG5cdFx0Ly9jb25zb2xlLmxvZygnY2hlY2tUeXBlJyx2YWx1ZSwgdHlwZSwgaXNPcHRpb25hbClcblx0XHRpZiAodHlwZW9mIHZhbHVlID09ICd1bmRlZmluZWQnICYmIGlzT3B0aW9uYWwgPT09IHRydWUpIHtcblx0XHRcdHJldHVybiB0cnVlXG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiB0eXBlID09ICdzdHJpbmcnKSB7XG5cdFx0XHRyZXR1cm4gdHlwZW9mIHZhbHVlID09IHR5cGVcblx0XHR9XG5cblx0XHRpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcblx0XHRcdGlmICghQXJyYXkuaXNBcnJheSh0eXBlKSkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHRcdH1cblxuXHRcdFx0aWYgKHR5cGUubGVuZ3RoID09IDApIHtcblx0XHRcdFx0cmV0dXJuIHRydWUgLy8gbm8gaXRlbSB0eXBlIGNoZWNraW5nXG5cdFx0XHR9XG5cdFx0XHRmb3IobGV0IGkgb2YgdmFsdWUpIHtcblx0XHRcdFx0dmFyIHJldCA9IGZhbHNlXG5cdFx0XHRcdGZvcihsZXQgdCBvZiB0eXBlKSB7XG5cdFx0XHRcdFx0cmV0IHw9ICQkLmNoZWNrVHlwZShpLCB0KVxuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICghcmV0KSB7XG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHRydWVcblx0XHR9XG5cblx0XHRpZiAoaXNPYmplY3QodHlwZSkpIHtcblx0XHRcdGlmICghaXNPYmplY3QodmFsdWUpKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZVxuXHRcdFx0fVxuXHRcdFx0Zm9yKGxldCBmIGluIHR5cGUpIHtcblxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdmJywgZiwgJ3ZhbHVlJywgdmFsdWUpXG5cdFx0XHRcdHZhciBuZXdUeXBlID0gdHlwZVtmXVxuXG5cdFx0XHRcdHZhciBpc09wdGlvbmFsID0gZmFsc2Vcblx0XHRcdFx0aWYgKGYuc3RhcnRzV2l0aCgnJCcpKSB7XG5cdFx0XHRcdFx0ZiA9IGYuc3Vic3RyKDEpXG5cdFx0XHRcdFx0aXNPcHRpb25hbCA9IHRydWVcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoISQkLmNoZWNrVHlwZSh2YWx1ZVtmXSwgbmV3VHlwZSwgaXNPcHRpb25hbCkpIHtcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHRcdFx0fVxuXG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB0cnVlXG5cdFx0fVxuXHRcdHJldHVybiBmYWxzZVxuXHR9XHRcblxuXG59KSgpO1xuIiwiJCQuZGF0YVVSTHRvQmxvYiA9IGZ1bmN0aW9uKGRhdGFVUkwpIHtcbiAgLy8gRGVjb2RlIHRoZSBkYXRhVVJMXG4gIHZhciBzcGxpdCA9IGRhdGFVUkwuc3BsaXQoL1s6LDtdLylcbiAgdmFyIG1pbWVUeXBlID0gc3BsaXRbMV1cbiAgdmFyIGVuY29kYWdlID0gc3BsaXRbMl1cbiAgaWYgKGVuY29kYWdlICE9ICdiYXNlNjQnKSB7XG4gIFx0cmV0dXJuXG4gIH1cbiAgdmFyIGRhdGEgPSBzcGxpdFszXVxuXG4gIGNvbnNvbGUubG9nKCdtaW1lVHlwZScsIG1pbWVUeXBlKVxuICBjb25zb2xlLmxvZygnZW5jb2RhZ2UnLCBlbmNvZGFnZSlcbiAgLy9jb25zb2xlLmxvZygnZGF0YScsIGRhdGEpXG5cbiAgdmFyIGJpbmFyeSA9IGF0b2IoZGF0YSlcbiAvLyBDcmVhdGUgOC1iaXQgdW5zaWduZWQgYXJyYXlcbiAgdmFyIGFycmF5ID0gW11cbiAgZm9yKHZhciBpID0gMDsgaSA8IGJpbmFyeS5sZW5ndGg7IGkrKykge1xuICBcdGFycmF5LnB1c2goYmluYXJ5LmNoYXJDb2RlQXQoaSkpXG4gIH1cblxuICAvLyBSZXR1cm4gb3VyIEJsb2Igb2JqZWN0XG5cdHJldHVybiBuZXcgQmxvYihbIG5ldyBVaW50OEFycmF5KGFycmF5KSBdLCB7bWltZVR5cGV9KVxufTtcbiIsIiQkLmV4dHJhY3QgPSBmdW5jdGlvbihvYmosIHZhbHVlcykge1xuXHRpZiAodHlwZW9mIHZhbHVlcyA9PSAnc3RyaW5nJykge1xuXHRcdHZhbHVlcyA9IHZhbHVlcy5zcGxpdCgnLCcpXG5cdH1cblx0aWYgKCFBcnJheS5pc0FycmF5KHZhbHVlcykgJiYgdHlwZW9mIHZhbHVlcyA9PSAnb2JqZWN0Jykge1xuXHRcdHZhbHVlcyA9IE9iamVjdC5rZXlzKHZhbHVlcylcblx0fVxuXHR2YXIgcmV0ID0ge31cblx0Zm9yKHZhciBrIGluIG9iaikge1xuXHRcdGlmICh2YWx1ZXMuaW5kZXhPZihrKSA+PSAwKSB7XG5cdFx0XHRyZXRba10gPSBvYmpba11cblx0XHR9XG5cdH1cblx0cmV0dXJuIHJldFxufTtcbiIsIiQkLmlzSW1hZ2UgPSBmdW5jdGlvbihmaWxlTmFtZSkge1xuXHRyZXR1cm4gKC9cXC4oZ2lmfGpwZ3xqcGVnfHBuZykkL2kpLnRlc3QoZmlsZU5hbWUpXG59O1xuIiwiJCQubG9hZFN0eWxlID0gZnVuY3Rpb24oc3R5bGVGaWxlUGF0aCwgY2FsbGJhY2spIHtcdFxuXHQvL2NvbnNvbGUubG9nKCdbQ29yZV0gbG9hZFN0eWxlJywgc3R5bGVGaWxlUGF0aClcblxuXHQkKGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjc3NPayA9ICQoJ2hlYWQnKS5maW5kKGBsaW5rW2hyZWY9XCIke3N0eWxlRmlsZVBhdGh9XCJdYCkubGVuZ3RoXG5cdFx0aWYgKGNzc09rICE9IDEpIHtcblx0XHRcdGNvbnNvbGUubG9nKGBbQ29yZV0gbG9hZGluZyAnJHtzdHlsZUZpbGVQYXRofScgZGVwZW5kYW5jeWApXG5cdFx0XHQkKCc8bGluaz4nLCB7aHJlZjogc3R5bGVGaWxlUGF0aCwgcmVsOiAnc3R5bGVzaGVldCd9KVxuXHRcdFx0Lm9uKCdsb2FkJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGBbQ29yZV0gJyR7c3R5bGVGaWxlUGF0aH0nIGxvYWRlZGApXG5cdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdGNhbGxiYWNrKClcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHRcdC5hcHBlbmRUbygkKCdoZWFkJykpXG5cdFx0fVxuXHR9KVxufTtcbiIsIiQkLm9iajJBcnJheSA9IGZ1bmN0aW9uKG9iaikge1xuXHR2YXIgcmV0ID0gW11cblx0Zm9yKHZhciBrZXkgaW4gb2JqKSB7XG5cdFx0cmV0LnB1c2goe2tleToga2V5LCB2YWx1ZTogb2JqW2tleV19KVxuXHR9XG5cdHJldHVybiByZXRcbn07XG4iLCIoZnVuY3Rpb24oKSB7XG5cbnZhciBpbnB1dEZpbGUgPSAkKCc8aW5wdXQ+Jywge3R5cGU6ICdmaWxlJ30pLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbigpIHtcblx0dmFyIG9uQXBwbHkgPSAkKHRoaXMpLmRhdGEoJ29uQXBwbHknKVxuXHR2YXIgZmlsZU5hbWUgPSB0aGlzLmZpbGVzWzBdXG5cdGlmICh0eXBlb2Ygb25BcHBseSA9PSAnZnVuY3Rpb24nKSB7XG5cdFx0b25BcHBseShmaWxlTmFtZSlcblx0fVxufSlcblxuJCQub3BlbkZpbGVEaWFsb2cgPSBmdW5jdGlvbihvbkFwcGx5KSB7XG5cdGlucHV0RmlsZS5kYXRhKCdvbkFwcGx5Jywgb25BcHBseSlcblx0aW5wdXRGaWxlLmNsaWNrKClcbn1cblxufSkoKTtcblxuIiwiJCQucmVhZEZpbGVBc0RhdGFVUkwgPSBmdW5jdGlvbihmaWxlTmFtZSwgb25SZWFkKSB7XG5cdHZhciBmaWxlUmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKVxuXG5cdGZpbGVSZWFkZXIub25sb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHR5cGVvZiBvblJlYWQgPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0b25SZWFkKGZpbGVSZWFkZXIucmVzdWx0KVxuXHRcdH1cblx0fVxuXHRmaWxlUmVhZGVyLnJlYWRBc0RhdGFVUkwoZmlsZU5hbWUpXG59O1xuIiwiJCQucmVhZFRleHRGaWxlID0gZnVuY3Rpb24oZmlsZU5hbWUsIG9uUmVhZCkge1xuXHR2YXIgZmlsZVJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKClcblxuXHRmaWxlUmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuXHRcdGlmICh0eXBlb2Ygb25SZWFkID09ICdmdW5jdGlvbicpIHtcblx0XHRcdG9uUmVhZChmaWxlUmVhZGVyLnJlc3VsdClcblx0XHR9XG5cdH1cblx0ZmlsZVJlYWRlci5yZWFkQXNUZXh0KGZpbGVOYW1lKVxufTtcbiJdfQ==
