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
			var elt = this.find(`[name=${name}]`)
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
	


$$.showForm = function(formDesc, onApply) {
	//console.log('showForm', formDesc)

	var div = $('<div>', {title: formDesc.title})

	var form = $('<form>')
		.appendTo(div)
		.on('submit', function(ev) {
			ev.preventDefault()
			div.dialog('close')
			if (typeof onApply == 'function') {
				onApply(form.getFormData())
			}				
		})
	var submitBtn = $('<input>', {type: 'submit', hidden: true}).appendTo(form)

	const fieldsDesc = formDesc.fields
	for(let fieldName in fieldsDesc) {
		const fieldDesc = fieldsDesc[fieldName]

		const {label, input, value, attrs} = fieldDesc

		const divField = $('<div>', {class: 'bn-flex-row bn-space-between w3-margin-bottom'}).appendTo(form)
		var $label = $('<label>').text(label).appendTo(divField)

		if (input === 'input') {
			var $input = $('<input>')
				.width(100)
				.attr(attrs)
				.attr('name', fieldName)
				.val(value)
				.prop('required', true)
				.uniqueId()
				.appendTo(divField)

			$label.attr('for', $input.attr('id'))
		}
	}

	if (formDesc.data != undefined) {
		form.setFormData(formDesc.data)
	}

	div.dialog({
		modal: true,
		//width: 'auto',
		close: function() {
			$(this).dialog('destroy')
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmpzIiwiYm9vdC9pbmRleC5qcyIsImNvbnRyb2xsZXJzL2RpYWxvZ0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9mb3JtRGlhbG9nQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL3ZpZXcuanMiLCJjb3JlL2NvbnRyb2xzLmpzIiwiY29yZS9vYmplY3RzQW5kU2VydmljZXMuanMiLCJwbHVnaW5zL2JpbmRpbmcuanMiLCJwbHVnaW5zL2NvbnRyb2wuanMiLCJwbHVnaW5zL2V2ZW50LmpzIiwicGx1Z2lucy9mb3JtLmpzIiwicGx1Z2lucy9tZW51LmpzIiwicGx1Z2lucy90ZW1wbGF0ZS5qcyIsInBsdWdpbnMvdWkuanMiLCJwbHVnaW5zL3V0aWwuanMiLCJ1aS9zaG93QWxlcnQuanMiLCJ1aS9zaG93Q29uZmlybS5qcyIsInVpL3Nob3dGb3JtLmpzIiwidWkvc2hvd1BpY3R1cmUuanMiLCJ1aS9zaG93UHJvbXB0LmpzIiwidXRpbC9jaGVja1R5cGUuanMiLCJ1dGlsL2RhdGFVUkx0b0Jsb2IuanMiLCJ1dGlsL2V4dHJhY3QuanMiLCJ1dGlsL2lzSW1hZ2UuanMiLCJ1dGlsL2xvYWRTdHlsZS5qcyIsInV0aWwvb2JqMkFycmF5LmpzIiwidXRpbC9vcGVuRmlsZURpYWxvZy5qcyIsInV0aWwvcmVhZEZpbGVBc0RhdGFVUkwuanMiLCJ1dGlsL3JlYWRUZXh0RmlsZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzVHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNVRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiY29yZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe1xuXG5cdFxuXHR3aW5kb3cuJCQgPSB7fVxuXG59KSgpO1xuIiwiKGZ1bmN0aW9uKCl7XG5cbnZhciBjdXJSb3V0ZVxuXHRcblxuXG4kJC5zdGFydEFwcCA9IGZ1bmN0aW9uKG1haW5Db250cm9sTmFtZSwgY29uZmlnKSB7XG5cdCQkLnZpZXdDb250cm9sbGVyKCdib2R5Jywge1xuXHRcdHRlbXBsYXRlOiBgPGRpdiBibi1jb250cm9sPVwiJHttYWluQ29udHJvbE5hbWV9XCIgY2xhc3M9XCJtYWluUGFuZWxcIiBibi1vcHRpb25zPVwiY29uZmlnXCI+PC9kaXY+YCxcblx0XHRkYXRhOiB7Y29uZmlnfVxuXHR9KVxufVxuXG5mdW5jdGlvbiBwcm9jZXNzUm91dGUoKSB7XG5cdHZhciBwcmV2Um91dGUgPSBjdXJSb3V0ZVxuXHR2YXIgaHJlZiA9IGxvY2F0aW9uLmhyZWZcblx0dmFyIGlkeCA9IGhyZWYuaW5kZXhPZignIycpXG5cdGN1clJvdXRlID0gKGlkeCAhPT0gLTEpICA/IGhyZWYuc3Vic3RyKGlkeCsxKSA6ICcvJ1xuXHQvL2NvbnNvbGUubG9nKCdbQ29yZV0gbmV3Um91dGUnLCBjdXJSb3V0ZSwgcHJldlJvdXRlKVxuXG5cblx0JCh3aW5kb3cpLnRyaWdnZXIoJ3JvdXRlQ2hhbmdlJywge2N1clJvdXRlOmN1clJvdXRlLCBwcmV2Um91dGU6IHByZXZSb3V0ZX0pXG5cbn1cdFxuXG4kJC5jb25maWdSZWFkeSA9IGZ1bmN0aW9uKG9uQ29uZmlnUmVhZHkpIHtcblxuXG5cdCQoZnVuY3Rpb24oKSB7XG5cblx0XHR2YXIgYXBwTmFtZSA9IGxvY2F0aW9uLnBhdGhuYW1lLnNwbGl0KCcvJylbMl1cblxuXHRcdGNvbnNvbGUubG9nKGBbQ29yZV0gQXBwICcke2FwcE5hbWV9JyBzdGFydGVkIDopYClcblx0XHRjb25zb2xlLmxvZygnW0NvcmVdIGpRdWVyeSB2ZXJzaW9uJywgJC5mbi5qcXVlcnkpXG5cdFx0Y29uc29sZS5sb2coJ1tDb3JlXSBqUXVlcnkgVUkgdmVyc2lvbicsICQudWkudmVyc2lvbilcblxuXHRcdFxuXG5cblx0XHQkKHdpbmRvdykub24oJ3BvcHN0YXRlJywgZnVuY3Rpb24oZXZ0KSB7XG5cdFx0XHQvL2NvbnNvbGUubG9nKCdbcG9wc3RhdGVdIHN0YXRlJywgZXZ0LnN0YXRlKVxuXHRcdFx0cHJvY2Vzc1JvdXRlKClcblx0XHR9KVxuXG5cblx0XHQkLmdldEpTT04oYC9hcGkvYXBwL2NvbmZpZy8ke2FwcE5hbWV9YClcblx0XHQudGhlbihmdW5jdGlvbihjb25maWcpIHtcblxuXHRcdFx0Y29uc29sZS5sb2coJ2NvbmZpZycsIGNvbmZpZylcblxuXHRcdFx0dmFyIG9wdGlvbnMgPSB7XG5cdFx0XHRcdHVzZXJOYW1lOiBjb25maWcuJHVzZXJOYW1lLFxuXHRcdFx0XHRhcHBOYW1lXG5cdFx0XHR9XG5cblxuXHRcdFx0JCQuY29uZmlndXJlU2VydmljZSgnV2ViU29ja2V0U2VydmljZScsIG9wdGlvbnMpXG5cdFx0XHQkJC5jb25maWd1cmVTZXJ2aWNlKCdVc2VyU2VydmljZScsIG9wdGlvbnMpXG5cblx0XHRcblx0XHRcdFxuXHRcdFx0XG5cdFx0XHR0cnkge1xuXHRcdFx0XHQkKCdib2R5JykucHJvY2Vzc0NvbnRyb2xzKCkgLy8gcHJvY2VzcyBIZWFkZXJDb250cm9sXG5cdFx0XHRcdFxuXHRcdFx0XHRvbkNvbmZpZ1JlYWR5KGNvbmZpZylcblx0XHRcdH1cblx0XHRcdGNhdGNoKGUpIHtcblx0XHRcdFx0dmFyIGh0bWwgPSBgXG5cdFx0XHRcdFx0PGRpdiBjbGFzcz1cInczLWNvbnRhaW5lclwiPlxuXHRcdFx0XHRcdFx0PHAgY2xhc3M9XCJ3My10ZXh0LXJlZFwiPiR7ZX08L3A+XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdGBcblx0XHRcdFx0JCgnYm9keScpLmh0bWwoaHRtbClcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0XG5cdFx0XHRwcm9jZXNzUm91dGUoKVxuXHRcdH0pXG5cdFx0LmNhdGNoKChqcXhocikgPT4ge1xuXHRcdFx0Y29uc29sZS5sb2coJ2pxeGhyJywganF4aHIpXG5cdFx0XHQvL3ZhciB0ZXh0ID0gSlNPTi5zdHJpbmdpZnkoanF4aHIucmVzcG9uc2VKU09OLCBudWxsLCA0KVxuXHRcdFx0dmFyIHRleHQgPSBqcXhoci5yZXNwb25zZVRleHRcblx0XHRcdHZhciBodG1sID0gYFxuXHRcdFx0XHQ8ZGl2IGNsYXNzPVwidzMtY29udGFpbmVyXCI+XG5cdFx0XHRcdFx0PHAgY2xhc3M9XCJ3My10ZXh0LXJlZFwiPiR7dGV4dH08L3A+XG5cdFx0XHRcdFx0PGEgaHJlZj1cIi9kaXNjb25uZWN0XCIgY2xhc3M9XCJ3My1idG4gdzMtYmx1ZVwiPkxvZ291dDwvYT5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHRgXG5cdFx0XHQkKCdib2R5JykuaHRtbChodG1sKVxuXHRcdH0pXHRcdFx0XHRcblx0XHRcdFxuXHR9KVxuXHRcblxufVxuXG5cdFxufSkoKTtcbiIsIiQkLmRpYWxvZ0NvbnRyb2xsZXIgPSBmdW5jdGlvbih0aXRsZSwgb3B0aW9ucykge1xuXHR2YXIgZGl2ID0gJCgnPGRpdj4nLCB7dGl0bGU6IHRpdGxlfSlcblxuXHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGRpdiwgb3B0aW9ucylcblxuXHR2YXIgZGxnT3B0aW9ucyA9ICQuZXh0ZW5kKHtcblx0XHRhdXRvT3BlbjogZmFsc2UsXG5cdFx0bW9kYWw6IHRydWUsXG5cdFx0d2lkdGg6ICdhdXRvJyxcdFx0XG5cdH0sIG9wdGlvbnMub3B0aW9ucylcblxuXHQvL2NvbnNvbGUubG9nKCdkbGdPcHRpb25zJywgZGxnT3B0aW9ucylcblxuXHRkaXYuZGlhbG9nKGRsZ09wdGlvbnMpXG5cblx0Y3RybC5zaG93ID0gZnVuY3Rpb24oKSB7XG5cdFx0ZGl2LmRpYWxvZygnb3BlbicpXG5cdH1cblxuXHRjdHJsLmhpZGUgPSBmdW5jdGlvbigpIHtcblx0XHRkaXYuZGlhbG9nKCdjbG9zZScpXG5cdH1cblxuXHRjdHJsLnNldE9wdGlvbiA9IGZ1bmN0aW9uKG9wdGlvbk5hbWUsIHZhbHVlKSB7XG5cdFx0ZGl2LmRpYWxvZygnb3B0aW9uJywgb3B0aW9uTmFtZSwgdmFsdWUpXG5cdH1cblxuXHRyZXR1cm4gY3RybFxufTtcblxuIiwiJCQuZm9ybURpYWxvZ0NvbnRyb2xsZXIgPSBmdW5jdGlvbih0aXRsZSwgb3B0aW9ucykge1xuXHR2YXIgZGl2ID0gJCgnPGRpdj4nLCB7dGl0bGU6IHRpdGxlfSlcblx0dmFyIGZvcm0gPSAkKCc8Zm9ybT4nKVxuXHRcdC5hcHBlbmRUbyhkaXYpXG5cdFx0Lm9uKCdzdWJtaXQnLCBmdW5jdGlvbihldikge1xuXHRcdFx0ZXYucHJldmVudERlZmF1bHQoKVxuXHRcdFx0ZGl2LmRpYWxvZygnY2xvc2UnKVxuXHRcdFx0aWYgKHR5cGVvZiBvcHRpb25zLm9uQXBwbHkgPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRvcHRpb25zLm9uQXBwbHkuY2FsbChjdHJsLCBjdHJsLmVsdC5nZXRGb3JtRGF0YSgpKVxuXHRcdFx0fVx0XHRcdFx0XG5cdFx0fSlcblx0dmFyIHN1Ym1pdEJ0biA9ICQoJzxpbnB1dD4nLCB7dHlwZTogJ3N1Ym1pdCcsIGhpZGRlbjogdHJ1ZX0pLmFwcGVuZFRvKGZvcm0pXG5cblx0dmFyIGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihmb3JtLCBvcHRpb25zKVxuXHRkaXYuZGlhbG9nKHtcblx0XHRhdXRvT3BlbjogZmFsc2UsXG5cdFx0bW9kYWw6IHRydWUsXG5cdFx0d2lkdGg6ICdhdXRvJyxcblx0XHRjbG9zZTogZnVuY3Rpb24oKSB7XG5cdFx0XHQvLyQodGhpcykuZGlhbG9nKCdkZXN0cm95Jylcblx0XHR9LFxuXHRcdGJ1dHRvbnM6IHtcblx0XHRcdCdDYW5jZWwnOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0JCh0aGlzKS5kaWFsb2coJ2Nsb3NlJylcblx0XHRcdH0sXG5cdFx0XHQnQXBwbHknOiBmdW5jdGlvbigpIHtcdFx0XHRcdFx0XG5cdFx0XHRcdHN1Ym1pdEJ0bi5jbGljaygpXG5cdFx0XHR9XG5cdFx0fVxuXHR9KVxuXHRjdHJsLnNob3cgPSBmdW5jdGlvbihkYXRhLCBvbkFwcGx5KSB7XG5cdFx0aWYgKHR5cGVvZiBjdHJsLmJlZm9yZVNob3cgPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0Y3RybC5iZWZvcmVTaG93KClcblx0XHR9XG5cdFx0b3B0aW9ucy5vbkFwcGx5ID0gb25BcHBseVxuXHRcdGN0cmwuZWx0LnNldEZvcm1EYXRhKGRhdGEpXG5cdFx0ZGl2LmRpYWxvZygnb3BlbicpXG5cdH1cblxuXHRyZXR1cm4gY3RybFxufTtcbiIsIihmdW5jdGlvbigpe1xuXG5cblxuY2xhc3MgVmlld0NvbnRyb2xsZXIge1xuICAgIGNvbnN0cnVjdG9yKGVsdCwgb3B0aW9ucykge1xuICAgIFx0Ly9jb25zb2xlLmxvZygnVmlld0NvbnRyb2xsZXInLCBvcHRpb25zKVxuICAgIFx0aWYgKHR5cGVvZiBlbHQgPT0gJ3N0cmluZycpIHtcbiAgICBcdFx0ZWx0ID0gJChlbHQpXG4gICAgXHR9XG5cbiAgICBcdG9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgb3B0aW9ucylcbiAgICAgICAgdGhpcy5lbHQgPSBlbHRcblxuICAgICAgICB0aGlzLmVsdC5vbignZGF0YTp1cGRhdGUnLCAoZXYsIG5hbWUsIHZhbHVlLCBleGNsdWRlRWx0KSA9PiB7XG4gICAgICAgIFx0Ly9jb25zb2xlLmxvZygnW1ZpZXdDb250cm9sbGVyXSBkYXRhOmNoYW5nZScsIG5hbWUsIHZhbHVlKVxuICAgICAgICBcdHRoaXMuc2V0RGF0YShuYW1lLCB2YWx1ZSwgZXhjbHVkZUVsdClcbiAgICAgICAgfSlcblxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMudGVtcGxhdGUgPT0gJ3N0cmluZycpIHtcbiAgICAgICAgXHR0aGlzLmVsdCA9ICQob3B0aW9ucy50ZW1wbGF0ZSkuYXBwZW5kVG8oZWx0KVxuICAgICAgICB9XG4gICAgICAgIHRoaXMubW9kZWwgPSAkLmV4dGVuZCh7fSwgb3B0aW9ucy5kYXRhKVxuICAgICAgICB0aGlzLnJ1bGVzID0gJC5leHRlbmQoe30sIG9wdGlvbnMucnVsZXMpXG4gICAgICAgIHRoaXMud2F0Y2hlcyA9ICQuZXh0ZW5kKHt9LCBvcHRpb25zLndhdGNoZXMpXG5cbiAgICAgICAgLy8gZ2VuZXJhdGUgYXV0b21hdGljIHJ1bGVzIGZvciBjb21wdXRlZCBkYXRhIChha2EgZnVuY3Rpb24pXG4gICAgICAgIGZvcih2YXIgayBpbiB0aGlzLm1vZGVsKSB7XG4gICAgICAgIFx0dmFyIGRhdGEgPSB0aGlzLm1vZGVsW2tdXG4gICAgICAgIFx0aWYgKHR5cGVvZiBkYXRhID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgXHRcdHZhciBmdW5jVGV4dCA9IGRhdGEudG9TdHJpbmcoKVxuICAgICAgICBcdFx0Ly9jb25zb2xlLmxvZygnZnVuY1RleHQnLCBmdW5jVGV4dClcbiAgICAgICAgXHRcdHZhciBydWxlcyA9IFtdXG4gICAgICAgIFx0XHRmdW5jVGV4dC5yZXBsYWNlKC90aGlzLihbYS16QS1aMC05Xy1dezEsfSkvZywgZnVuY3Rpb24obWF0Y2gsIGNhcHR1cmVPbmUpIHtcbiAgICAgICAgXHRcdFx0Ly9jb25zb2xlLmxvZygnY2FwdHVyZU9uZScsIGNhcHR1cmVPbmUpXG4gICAgICAgIFx0XHRcdHJ1bGVzLnB1c2goY2FwdHVyZU9uZSlcbiAgICAgICAgXHRcdH0pXG4gICAgICAgIFx0XHR0aGlzLnJ1bGVzW2tdID0gcnVsZXMudG9TdHJpbmcoKVxuICAgICAgICBcdH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vY29uc29sZS5sb2coJ3J1bGVzJywgdGhpcy5ydWxlcylcbiAgICAgICAgdGhpcy5kaXJMaXN0ID0gdGhpcy5lbHQucHJvY2Vzc1VJKHRoaXMubW9kZWwpXG5cblxuICAgICAgICAvL3RoaXMuZWx0LnByb2Nlc3NVSSh0aGlzLm1vZGVsKVxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMuZXZlbnRzID09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICB0aGlzLmVsdC5wcm9jZXNzRXZlbnRzKG9wdGlvbnMuZXZlbnRzKVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zY29wZSA9IHRoaXMuZWx0LnByb2Nlc3NCaW5kaW5ncygpXG4gICAgICAgIC8vY29uc29sZS5sb2coJ3Njb3BlJywgdGhpcy5zY29wZSlcbiAgICAgICBcbiAgICAgICAgdmFyIGluaXQgPSBvcHRpb25zLmluaXRcbiAgICAgICAgaWYgKHR5cGVvZiBpbml0ID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgXHRpbml0LmNhbGwodGhpcylcbiAgICAgICAgfVxuICAgIH0gXG5cbiAgICBzZXREYXRhKGFyZzEsIGFyZzIsIGV4Y2x1ZGVFbHQpIHtcbiAgICAgICAgLy9jb25zb2xlLmxvZygnW1ZpZXdDb250cm9sbGVyXSBzZXREYXRhJywgYXJnMSwgYXJnMilcbiAgICAgICAgdmFyIGRhdGEgPSBhcmcxXG4gICAgICAgIGlmICh0eXBlb2YgYXJnMSA9PSAnc3RyaW5nJykge1xuICAgICAgICBcdGRhdGEgPSB7fVxuICAgICAgICBcdGRhdGFbYXJnMV0gPSBhcmcyXG4gICAgICAgIH1cbiAgICAgICAgLy9jb25zb2xlLmxvZygnW1ZpZXdDb250cm9sbGVyXSBzZXREYXRhJywgZGF0YSlcbiAgICAgICAgJC5leHRlbmQodGhpcy5tb2RlbCwgZGF0YSlcbiAgICAgICAgLy9jb25zb2xlLmxvZygnbW9kZWwnLCB0aGlzLm1vZGVsKVxuICAgICAgICB0aGlzLnVwZGF0ZShPYmplY3Qua2V5cyhkYXRhKSwgZXhjbHVkZUVsdClcbiAgICB9XG5cbiAgICB1cGRhdGUoZmllbGRzTmFtZSwgZXhjbHVkZUVsdCkge1xuICAgIFx0Ly9jb25zb2xlLmxvZygnW1ZpZXdDb250cm9sbGVyXSB1cGRhdGUnLCBmaWVsZHNOYW1lKVxuICAgIFx0aWYgKHR5cGVvZiBmaWVsZHNOYW1lID09ICdzdHJpbmcnKSB7XG4gICAgXHRcdGZpZWxkc05hbWUgPSBmaWVsZHNOYW1lLnNwbGl0KCcsJylcbiAgICBcdH1cblxuXG4gICAgXHRpZiAoQXJyYXkuaXNBcnJheShmaWVsZHNOYW1lKSkge1xuICAgIFx0XHR2YXIgZmllbGRzU2V0ID0ge31cbiAgICBcdFx0ZmllbGRzTmFtZS5mb3JFYWNoKChmaWVsZCkgPT4ge1xuXG4gICAgXHRcdFx0dmFyIHdhdGNoID0gdGhpcy53YXRjaGVzW2ZpZWxkXVxuICAgIFx0XHRcdGlmICh0eXBlb2Ygd2F0Y2ggPT0gJ2Z1bmN0aW9uJykge1xuICAgIFx0XHRcdFx0d2F0Y2guY2FsbChudWxsLCB0aGlzLm1vZGVsW2ZpZWxkXSlcbiAgICBcdFx0XHR9XG4gICAgXHRcdFx0ZmllbGRzU2V0W2ZpZWxkXSA9IDFcblxuICAgIFx0XHRcdGZvcih2YXIgcnVsZSBpbiB0aGlzLnJ1bGVzKSB7XG4gICAgXHRcdFx0XHRpZiAodGhpcy5ydWxlc1tydWxlXS5zcGxpdCgnLCcpLmluZGV4T2YoZmllbGQpICE9IC0xKSB7XG4gICAgXHRcdFx0XHRcdGZpZWxkc1NldFtydWxlXSA9IDFcbiAgICBcdFx0XHRcdH1cbiAgICBcdFx0XHR9XG4gICAgXHRcdH0pXG5cblxuICAgIFx0XHR0aGlzLmVsdC51cGRhdGVUZW1wbGF0ZSh0aGlzLmRpckxpc3QsIHRoaXMubW9kZWwsIE9iamVjdC5rZXlzKGZpZWxkc1NldCksIGV4Y2x1ZGVFbHQpXG4gICAgXHR9XG5cbiAgICB9XG59XG5cblxuICAgICQkLnZpZXdDb250cm9sbGVyID0gZnVuY3Rpb24gKGVsdCwgb3B0aW9ucykge1xuICAgICAgICByZXR1cm4gbmV3IFZpZXdDb250cm9sbGVyKGVsdCwgb3B0aW9ucylcbiAgICB9XG5cbn0pKCk7IiwiKGZ1bmN0aW9uKCl7XG5cblxuXG4kJC5yZWdpc3RlckNvbnRyb2wgPSBmdW5jdGlvbihuYW1lLCBhcmcxLCBhcmcyKSB7XG5cdCQkLnJlZ2lzdGVyT2JqZWN0KCdjb250cm9scycsIG5hbWUsIGFyZzEsIGFyZzIpXG59XG5cbiQkLnJlZ2lzdGVyQ29udHJvbEV4ID0gZnVuY3Rpb24obmFtZSwgb3B0aW9ucykge1xuXHRpZiAoISQkLmNoZWNrVHlwZShvcHRpb25zLCB7XG5cdFx0JGRlcHM6IFsnc3RyaW5nJ10sXG5cdFx0JGlmYWNlOiAnc3RyaW5nJyxcblx0XHQkZXZlbnRzOiAnc3RyaW5nJyxcblx0XHRpbml0OiAnZnVuY3Rpb24nXG5cdH0pKSB7XG5cdFx0Y29uc29sZS5lcnJvcihgW0NvcmVdIHJlZ2lzdGVyQ29udHJvbEV4OiBiYWQgb3B0aW9uc2AsIG9wdGlvbnMpXG5cdFx0cmV0dXJuXG5cdH1cblxuXG5cdHZhciBkZXBzID0gb3B0aW9ucy5kZXBzIHx8IFtdXG5cblxuXHQkJC5yZWdpc3Rlck9iamVjdCgnY29udHJvbHMnLCBuYW1lLCBkZXBzLCBvcHRpb25zKVxufVxuXG5cblxuJCQuY3JlYXRlQ29udHJvbCA9IGZ1bmN0aW9uKGNvbnRyb2xOYW1lLCBlbHQpIHtcblx0ZWx0LmFkZENsYXNzKGNvbnRyb2xOYW1lKVxuXHRlbHQuYWRkQ2xhc3MoJ0N1c3RvbUNvbnRyb2wnKS51bmlxdWVJZCgpXHRcblx0dmFyIGN0cmwgPSAkJC5nZXRPYmplY3QoJ2NvbnRyb2xzJywgY29udHJvbE5hbWUpXG5cdFx0XG5cdGlmIChjdHJsICE9IHVuZGVmaW5lZCkge1xuXHRcdC8vY29uc29sZS5sb2coJ2NyZWF0ZUNvbnRyb2wnLCBjb250cm9sTmFtZSwgY3RybClcblx0XHRpZiAoY3RybC5zdGF0dXMgPT09ICAnb2snKSB7XG5cdFx0XHRcblx0XHRcdHZhciBpZmFjZSA9IHt9XG5cblx0XHRcdFxuXHRcdFx0aWYgKHR5cGVvZiBjdHJsLmZuID09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0dmFyIGFyZ3MgPSBbZWx0XS5jb25jYXQoY3RybC5kZXBzKVxuXHRcdFx0XHR2YXIgZGVmYXVsdE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZWx0LmRhdGEoJyRvcHRpb25zJykpXG5cdFx0XHRcdGNvbnNvbGUubG9nKGBbQ29yZV0gaW5zdGFuY2UgY29udHJvbCAnJHtjb250cm9sTmFtZX0nYClcblx0XHRcdFx0Y3RybC5mbi5hcHBseShpZmFjZSwgYXJncylcdFxuXHRcdFx0XHRpZmFjZS5vcHRpb25zID0gZGVmYXVsdE9wdGlvbnNcblx0XHRcdFx0XHRcdFx0XG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmICh0eXBlb2YgY3RybC5mbiA9PSAnb2JqZWN0Jykge1xuXHRcdFx0XHR2YXIgaW5pdCA9IGN0cmwuZm4uaW5pdFxuXHRcdFx0XHR2YXIgcHJvcHMgPSBjdHJsLmZuLnByb3BzIHx8IHt9XG5cdFx0XHRcdHZhciBkZWZhdWx0T3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBjdHJsLmZuLm9wdGlvbnMsIGVsdC5kYXRhKCckb3B0aW9ucycpKVxuXG5cdFx0XHRcdHZhciBvcHRpb25zID0ge31cblxuXHRcdFx0XHRmb3IodmFyIG8gaW4gZGVmYXVsdE9wdGlvbnMpIHtcblx0XHRcdFx0XHRvcHRpb25zW29dID0gKGVsdC5kYXRhKG8pICE9IHVuZGVmaW5lZCkgPyBlbHQuZGF0YShvKSA6IGRlZmF1bHRPcHRpb25zW29dXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRmb3IodmFyIHAgaW4gcHJvcHMpIHtcblx0XHRcdFx0XHRvcHRpb25zW3BdID0gKGVsdC5kYXRhKHApICE9IHVuZGVmaW5lZCkgPyBlbHQuZGF0YShwKSA6IHByb3BzW3BdLnZhbFxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnQ29tcHV0ZWQgT3B0aW9ucycsIG9wdGlvbnMpXG5cblx0XHRcdFx0aWYgKHR5cGVvZiBpbml0ID09ICdmdW5jdGlvbicpIHtcblxuXHRcdFx0XHRcdHZhciBhcmdzID0gW2VsdCwgb3B0aW9uc10uY29uY2F0KGN0cmwuZGVwcylcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhgW0NvcmVdIGluc3RhbmNlIGNvbnRyb2wgJyR7Y29udHJvbE5hbWV9JyB3aXRoIG9wdGlvbnNgLCBvcHRpb25zKVxuXHRcdFx0XHRcdGluaXQuYXBwbHkoaWZhY2UsIGFyZ3MpXG5cdFx0XHRcdFx0aWZhY2Uub3B0aW9ucyA9IG9wdGlvbnNcblx0XHRcdFx0XHRpZmFjZS5ldmVudHMgPSBjdHJsLmZuLmV2ZW50c1xuXG5cdFx0XHRcdFx0aWYgKE9iamVjdC5rZXlzKHByb3BzKS5sZW5ndGggIT0gMCkge1xuXHRcdFx0XHRcdFx0aWZhY2Uuc2V0UHJvcCA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XG5cdFx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coYFtDb3JlXSBzZXREYXRhYCwgbmFtZSwgdmFsdWUpXG5cdFx0XHRcdFx0XHRcdHZhciBzZXR0ZXIgPSBwcm9wc1tuYW1lXSAmJiBwcm9wc1tuYW1lXS5zZXRcblx0XHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBzZXR0ZXIgPT0gJ3N0cmluZycpIHtcblx0XHRcdFx0XHRcdFx0XHR2YXIgc2V0dGVyID0gaWZhY2Vbc2V0dGVyXVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdGlmICh0eXBlb2Ygc2V0dGVyID09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRcdFx0XHRzZXR0ZXIuY2FsbChudWxsLCB2YWx1ZSlcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdFx0aWZhY2Uub3B0aW9uc1tuYW1lXSA9IHZhbHVlXG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGlmYWNlLnByb3BzID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRcdHZhciByZXQgPSB7fVxuXHRcdFx0XHRcdFx0XHRmb3IodmFyIGsgaW4gcHJvcHMpIHtcblx0XHRcdFx0XHRcdFx0XHRyZXRba10gPSBpZmFjZS5vcHRpb25zW2tdXG5cblx0XHRcdFx0XHRcdFx0XHR2YXIgZ2V0dGVyID0gcHJvcHNba10uZ2V0XG5cdFx0XHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBnZXR0ZXIgPT0gJ3N0cmluZycpIHtcblx0XHRcdFx0XHRcdFx0XHRcdGdldHRlciA9IGlmYWNlW2dldHRlcl1cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdGlmICh0eXBlb2YgZ2V0dGVyID09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRcdFx0XHRcdHJldFtrXSA9IGdldHRlci5jYWxsKG51bGwpXG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdHJldHVybiByZXRcblx0XHRcdFx0XHRcdH1cdFx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRjb25zb2xlLndhcm4oYFtDb3JlXSBjb250cm9sICcke2NvbnRyb2xOYW1lfScgbWlzc2luZyBpbml0IGZ1bmN0aW9uYClcblx0XHRcdFx0fVxuXG5cdFx0XHR9XG5cblx0XHRcdGlmYWNlLm5hbWUgPSBjb250cm9sTmFtZVxuXHRcdFx0ZWx0LmdldCgwKS5jdHJsID0gaWZhY2Vcblx0XHRcdFxuXHRcdFx0cmV0dXJuIGlmYWNlXHRcdFx0XHRcblx0XHR9XG5cblxuXHR9XG5cdGVsc2Uge1xuXHRcdHRocm93KGBbQ29yZV0gY29udHJvbCAnJHtjb250cm9sTmFtZX0nIGlzIG5vdCByZWdpc3RlcmVkYClcblx0fVxufVxuXG4kJC5nZXRSZWdpc3RlcmVkQ29udHJvbHMgPSBmdW5jdGlvbigpIHtcblx0dmFyIGNvbnRyb2xzID0gJCQuZ2V0T2JqZWN0RG9tYWluKCdjb250cm9scycpXG5cdHJldHVybiBPYmplY3Qua2V5cyhjb250cm9scykuZmlsdGVyKChuYW1lKSA9PiAhbmFtZS5zdGFydHNXaXRoKCckJykpXG59XG5cbiQkLmdldFJlZ2lzdGVyZWRDb250cm9sc0V4ID0gZnVuY3Rpb24oKSB7XG5cdHZhciBjb250cm9scyA9ICQkLmdldE9iamVjdERvbWFpbignY29udHJvbHMnKVxuXHR2YXIgbGlicyA9IHt9XG5cdGZvcih2YXIgayBpbiBjb250cm9scykge1xuXHRcdHZhciBpbmZvID0gY29udHJvbHNba10uZm5cblx0XHR2YXIgbGliTmFtZSA9IGluZm8ubGliXG5cdFx0aWYgKHR5cGVvZiBsaWJOYW1lID09ICdzdHJpbmcnKSB7XG5cdFx0XHRpZiAobGlic1tsaWJOYW1lXSA9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0bGlic1tsaWJOYW1lXSA9IFtdXG5cdFx0XHR9XG5cdFx0XHRsaWJzW2xpYk5hbWVdLnB1c2goaylcblxuXHRcdH1cblx0fVxuXHRyZXR1cm4gbGlic1xufVxuXG4kJC5nZXRDb250cm9sSW5mbyA9IGZ1bmN0aW9uKGNvbnRyb2xOYW1lKSB7XG5cdHZhciBjb250cm9scyA9ICQkLmdldE9iamVjdERvbWFpbignY29udHJvbHMnKVxuXHR2YXIgaW5mbyA9IGNvbnRyb2xzW2NvbnRyb2xOYW1lXVxuXG5cdGlmIChpbmZvID09IHVuZGVmaW5lZCkge1xuXHRcdGNvbnNvbGUubG9nKGBjb250cm9sICcke2NvbnRyb2xOYW1lfScgaXMgbm90IHJlZ2lzdGVyZWRgKVxuXHRcdHJldHVyblxuXHR9XG5cdGluZm8gPSBpbmZvLmZuXG5cblx0dmFyIHJldCA9ICQkLmV4dHJhY3QoaW5mbywgJ2RlcHMsb3B0aW9ucyxsaWInKVxuXG5cdGlmICh0eXBlb2YgaW5mby5ldmVudHMgPT0gJ3N0cmluZycpIHtcblx0XHRyZXQuZXZlbnRzID0gaW5mby5ldmVudHMuc3BsaXQoJywnKVxuXHR9XG5cblx0dmFyIHByb3BzID0ge31cblx0Zm9yKHZhciBrIGluIGluZm8ucHJvcHMpIHtcblx0XHRwcm9wc1trXSA9IGluZm8ucHJvcHNba10udmFsXG5cdH1cblx0aWYgKE9iamVjdC5rZXlzKHByb3BzKS5sZW5ndGggIT0gMCkge1xuXHRcdHJldC5wcm9wcyA9IHByb3BzXG5cdH1cblx0aWYgKHR5cGVvZiBpbmZvLmlmYWNlID09ICdzdHJpbmcnKSB7XG5cdFx0cmV0LmlmYWNlID0gaW5mby5pZmFjZS5zcGxpdCgnOycpXG5cdH1cblx0cmV0dXJuIHJldFxuXHQvL3JldHVybiBjb250cm9sc1tjb250cm9sTmFtZV0uZm5cbn1cblxuXG4kJC5nZXRDb250cm9sc1RyZWUgPSBmdW5jdGlvbihzaG93V2hhdCkge1xuXHRzaG93V2hhdCA9IHNob3dXaGF0IHx8ICcnXG5cdHZhciBzaG93T3B0aW9ucyA9IHNob3dXaGF0LnNwbGl0KCcsJylcblx0dmFyIHRyZWUgPSBbXVxuXHQkKCcuQ3VzdG9tQ29udHJvbCcpLmVhY2goZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGlmYWNlID0gJCh0aGlzKS5pbnRlcmZhY2UoKVxuXG5cdFx0dmFyIGl0ZW0gPSB7bmFtZTppZmFjZS5uYW1lLCBlbHQ6ICQodGhpcyksIHBhcmVudDogbnVsbH1cblx0XHRpdGVtLmlkID0gJCh0aGlzKS5hdHRyKCdpZCcpXG5cblx0XHRpZiAodHlwZW9mIGlmYWNlLmV2ZW50cyA9PSAnc3RyaW5nJyAmJlxuXHRcdFx0KChzaG93T3B0aW9ucy5pbmRleE9mKCdldmVudHMnKSA+PSAwIHx8IHNob3dXaGF0ID09PSAnYWxsJykpKSB7XG5cdFx0XHRpdGVtLmV2ZW50cyA9IGlmYWNlLmV2ZW50cy5zcGxpdCgnLCcpXG5cdFx0fVx0XHRcdFxuXG5cdFx0dHJlZS5wdXNoKGl0ZW0pXG5cblx0XHRpZiAoc2hvd09wdGlvbnMuaW5kZXhPZignaWZhY2UnKSA+PSAwIHx8IHNob3dXaGF0ID09PSAnYWxsJykge1xuXG5cdFx0XHR2YXIgZnVuYyA9IFtdXG5cdFx0XHRmb3IodmFyIGsgaW4gaWZhY2UpIHtcblx0XHRcdFx0aWYgKHR5cGVvZiBpZmFjZVtrXSA9PSAnZnVuY3Rpb24nICYmIGsgIT0gJ3Byb3BzJyAmJiBrICE9ICdzZXRQcm9wJykge1xuXHRcdFx0XHRcdGZ1bmMucHVzaChrKVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRpZiAoZnVuYy5sZW5ndGggIT0gMCkge1xuXHRcdFx0XHRpdGVtLmlmYWNlID0gZnVuY1xuXHRcdFx0fVx0XHRcdFx0XG5cdFx0fVxuXG5cblxuXHRcdGlmICh0eXBlb2YgaWZhY2UucHJvcHMgPT0gJ2Z1bmN0aW9uJyAmJiBcblx0XHRcdCgoc2hvd09wdGlvbnMuaW5kZXhPZigncHJvcHMnKSA+PSAwIHx8IHNob3dXaGF0ID09PSAnYWxsJykpKSB7XG5cdFx0XHRpdGVtLnByb3BzID0gaWZhY2UucHJvcHMoKVxuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgaWZhY2UuZ2V0VmFsdWUgPT0gJ2Z1bmN0aW9uJyAmJlxuXHRcdFx0KChzaG93T3B0aW9ucy5pbmRleE9mKCd2YWx1ZScpID49IDAgfHwgc2hvd1doYXQgPT09ICdhbGwnKSkpIHtcblx0XHRcdGl0ZW0udmFsdWUgPSBpZmFjZS5nZXRWYWx1ZSgpXG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiBpZmFjZS5vcHRpb25zID09ICdvYmplY3QnICYmIE9iamVjdC5rZXlzKGlmYWNlLm9wdGlvbnMpLmxlbmd0aCAhPSAwICYmXG5cdFx0XHQoKHNob3dPcHRpb25zLmluZGV4T2YoJ29wdGlvbnMnKSA+PSAwIHx8IHNob3dXaGF0ID09PSAnYWxsJykpKSB7XG5cdFx0XHRpdGVtLm9wdGlvbnMgPSBpZmFjZS5vcHRpb25zXG5cdFx0fVx0XG5cblx0XHRcdFx0XHRcblx0XHQvL2NvbnNvbGUubG9nKCduYW1lJywgbmFtZSlcblx0XHRpdGVtLmNoaWxkcyA9IFtdXG5cblxuXHRcdHZhciBwYXJlbnRzID0gJCh0aGlzKS5wYXJlbnRzKCcuQ3VzdG9tQ29udHJvbCcpXG5cdFx0Ly9jb25zb2xlLmxvZygncGFyZW50cycsIHBhcmVudHMpXG5cdFx0aWYgKHBhcmVudHMubGVuZ3RoICE9IDApIHtcblx0XHRcdHZhciBwYXJlbnQgPSBwYXJlbnRzLmVxKDApXG5cdFx0XHRpdGVtLnBhcmVudCA9IHBhcmVudFxuXHRcdFx0dHJlZS5mb3JFYWNoKGZ1bmN0aW9uKGkpIHtcblx0XHRcdFx0aWYgKGkuZWx0LmdldCgwKSA9PSBwYXJlbnQuZ2V0KDApKSB7XG5cdFx0XHRcdFx0aS5jaGlsZHMucHVzaChpdGVtKVxuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdFx0XG5cblx0XHR9XG5cdH0pXG5cdC8vY29uc29sZS5sb2coJ3RyZWUnLCB0cmVlKVxuXG5cdHZhciByZXQgPSBbXVxuXHR0cmVlLmZvckVhY2goZnVuY3Rpb24oaSkge1xuXHRcdGlmIChpLnBhcmVudCA9PSBudWxsKSB7XG5cdFx0XHRyZXQucHVzaChpKVxuXHRcdH1cblx0XHRpZiAoaS5jaGlsZHMubGVuZ3RoID09IDApIHtcblx0XHRcdGRlbGV0ZSBpLmNoaWxkc1xuXHRcdH1cblx0XHRkZWxldGUgaS5wYXJlbnRcblx0XHRkZWxldGUgaS5lbHRcblx0fSlcblxuXHRyZXR1cm4gSlNPTi5zdHJpbmdpZnkocmV0LCBudWxsLCA0KVxuXG59XG5cbn0pKCk7XG4iLCIoZnVuY3Rpb24oKXtcblxudmFyIHJlZ2lzdGVyZWRPYmplY3RzID0ge1xuXHRzZXJ2aWNlczoge31cbn1cblxudmFyIHtzZXJ2aWNlc30gPSByZWdpc3RlcmVkT2JqZWN0c1xuXG5mdW5jdGlvbiBpc0RlcHNPayhkZXBzKSB7XG5cdHJldHVybiBkZXBzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXIpIHtcblxuXHRcdHJldHVybiBwcmV2ICYmIChjdXIgIT0gdW5kZWZpbmVkKVxuXHR9LCB0cnVlKVx0XHRcbn1cblxuJCQuZ2V0T2JqZWN0RG9tYWluID0gZnVuY3Rpb24oZG9tYWluKSB7XG5cdHJldHVybiByZWdpc3RlcmVkT2JqZWN0c1tkb21haW5dXG59XG5cbiQkLnJlZ2lzdGVyT2JqZWN0ID0gZnVuY3Rpb24oZG9tYWluLCBuYW1lLCBhcmcxLCBhcmcyKSB7XG5cdHZhciBkZXBzID0gW11cblx0dmFyIGZuID0gYXJnMVxuXHRpZiAoQXJyYXkuaXNBcnJheShhcmcxKSkge1xuXHRcdGRlcHMgPSBhcmcxXG5cdFx0Zm4gPSBhcmcyXG5cdH1cblx0aWYgKHR5cGVvZiBkb21haW4gIT0gJ3N0cmluZycgfHwgdHlwZW9mIG5hbWUgIT0gJ3N0cmluZycgfHwgdHlwZW9mIGZuID09ICd1bmRlZmluZWQnIHx8ICFBcnJheS5pc0FycmF5KGRlcHMpKSB7XG5cdFx0dGhyb3coJ1tDb3JlXSByZWdpc3Rlck9iamVjdCBjYWxsZWQgd2l0aCBiYWQgYXJndW1lbnRzJylcblx0fSBcblx0Y29uc29sZS5sb2coYFtDb3JlXSByZWdpc3RlciBvYmplY3QgJyR7ZG9tYWlufToke25hbWV9JyB3aXRoIGRlcHNgLCBkZXBzKVxuXHRpZiAocmVnaXN0ZXJlZE9iamVjdHNbZG9tYWluXSA9PSB1bmRlZmluZWQpIHtcblx0XHRyZWdpc3RlcmVkT2JqZWN0c1tkb21haW5dID0ge31cblx0fVxuXHRyZWdpc3RlcmVkT2JqZWN0c1tkb21haW5dW25hbWVdID0ge2RlcHM6IGRlcHMsIGZuIDpmbiwgc3RhdHVzOiAnbm90bG9hZGVkJ31cbn1cdFxuXG4kJC5nZXRPYmplY3QgPSBmdW5jdGlvbihkb21haW4sIG5hbWUpIHtcblx0Ly9jb25zb2xlLmxvZyhgW0NvcmVdIGdldE9iamVjdCAke2RvbWFpbn06JHtuYW1lfWApXG5cdHZhciBkb21haW4gPSByZWdpc3RlcmVkT2JqZWN0c1tkb21haW5dXG5cdHZhciByZXQgPSBkb21haW4gJiYgZG9tYWluW25hbWVdXG5cdGlmIChyZXQgJiYgcmV0LnN0YXR1cyA9PSAnbm90bG9hZGVkJykge1xuXHRcdHJldC5kZXBzID0gJCQuZ2V0U2VydmljZXMocmV0LmRlcHMpXG5cdFx0cmV0LnN0YXR1cyA9IGlzRGVwc09rKHJldC5kZXBzKSA/ICdvaycgOiAna28nXG5cdH1cblx0cmV0dXJuIHJldFxufVxuXG4kJC5nZXRTZXJ2aWNlcyA9IGZ1bmN0aW9uKGRlcHMpIHtcblx0Ly9jb25zb2xlLmxvZygnW0NvcmVdIGdldFNlcnZpY2VzJywgZGVwcylcblx0cmV0dXJuIGRlcHMubWFwKGZ1bmN0aW9uKGRlcE5hbWUpIHtcblx0XHR2YXIgc3J2ID0gc2VydmljZXNbZGVwTmFtZV1cblx0XHRpZiAoc3J2KSB7XG5cdFx0XHRpZiAoc3J2LnN0YXR1cyA9PSAnbm90bG9hZGVkJykge1xuXHRcdFx0XHR2YXIgZGVwczIgPSAkJC5nZXRTZXJ2aWNlcyhzcnYuZGVwcylcblx0XHRcdFx0dmFyIGNvbmZpZyA9IHNydi5jb25maWcgfHwge31cblx0XHRcdFx0Y29uc29sZS5sb2coYFtDb3JlXSBpbnN0YW5jZSBzZXJ2aWNlICcke2RlcE5hbWV9JyB3aXRoIGNvbmZpZ2AsIGNvbmZpZylcblx0XHRcdFx0dmFyIGFyZ3MgPSBbY29uZmlnXS5jb25jYXQoZGVwczIpXG5cdFx0XHRcdHNydi5vYmogPSBzcnYuZm4uYXBwbHkobnVsbCwgYXJncylcblx0XHRcdFx0c3J2LnN0YXR1cyA9ICdyZWFkeSdcblx0XHRcdH1cblx0XHRcdHJldHVybiBzcnYub2JqXHRcdFx0XHRcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHQvL3Nydi5zdGF0dXMgPSAnbm90cmVnaXN0ZXJlZCdcblx0XHRcdHRocm93KGBbQ29yZV0gc2VydmljZSAnJHtkZXBOYW1lfScgaXMgbm90IHJlZ2lzdGVyZWRgKVxuXHRcdH1cblxuXHR9KVxufVxuXG5cblxuJCQuY29uZmlndXJlU2VydmljZSA9IGZ1bmN0aW9uKG5hbWUsIGNvbmZpZykge1xuXHRjb25zb2xlLmxvZygnW0NvcmVdIGNvbmZpZ3VyZVNlcnZpY2UnLCBuYW1lLCBjb25maWcpXG5cdGlmICh0eXBlb2YgbmFtZSAhPSAnc3RyaW5nJyB8fCB0eXBlb2YgY29uZmlnICE9ICdvYmplY3QnKSB7XG5cdFx0Y29uc29sZS53YXJuKCdbQ29yZV0gY29uZmlndXJlU2VydmljZSBjYWxsZWQgd2l0aCBiYWQgYXJndW1lbnRzJylcblx0XHRyZXR1cm5cblx0fSBcdFxuXG5cdHZhciBzcnYgPSBzZXJ2aWNlc1tuYW1lXVxuXHRpZiAoc3J2KSB7XG5cdFx0c3J2LmNvbmZpZyA9IGNvbmZpZ1xuXHR9XG5cdGVsc2Uge1xuXHRcdHRocm93KGBbY29uZmlndXJlU2VydmljZV0gc2VydmljZSAnJHtuYW1lfScgaXMgbm90IHJlZ2lzdGVyZWRgKVxuXHR9XG5cbn1cblxuJCQucmVnaXN0ZXJTZXJ2aWNlID0gZnVuY3Rpb24obmFtZSwgYXJnMSwgYXJnMikge1xuXHQkJC5yZWdpc3Rlck9iamVjdCgnc2VydmljZXMnLCBuYW1lLCBhcmcxLCBhcmcyKVxufVxuXG4kJC5nZXRSZWdpc3RlcmVkU2VydmljZXMgPSBmdW5jdGlvbigpIHtcblx0dmFyIHJldCA9IFtdXG5cdGZvcih2YXIgayBpbiBzZXJ2aWNlcykge1xuXHRcdHZhciBpbmZvID0gc2VydmljZXNba11cblx0XHRyZXQucHVzaCh7bmFtZTogaywgc3RhdHVzOiBpbmZvLnN0YXR1c30pXG5cdH1cblx0cmV0dXJuIHJldFxufVxuXG5cbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1xuXG5cdCQuZm4ucHJvY2Vzc0JpbmRpbmdzID0gZnVuY3Rpb24oKSB7XG5cblx0XHR2YXIgZGF0YSA9IHt9XG5cblx0XHR0aGlzLmJuRmluZCgnYm4tYmluZCcsIHRydWUsIGZ1bmN0aW9uKGVsdCwgdmFyTmFtZSkge1xuXHRcdFx0Ly9jb25zb2xlLmxvZygnYm4tdGV4dCcsIHZhck5hbWUpXG5cdFx0XHRkYXRhW3Zhck5hbWVdID0gZWx0XG5cdFx0fSlcblx0XHR0aGlzLmJuRmluZCgnYm4taWZhY2UnLCB0cnVlLCBmdW5jdGlvbihlbHQsIHZhck5hbWUpIHtcblx0XHRcdC8vY29uc29sZS5sb2coJ2JuLXRleHQnLCB2YXJOYW1lKVxuXHRcdFx0ZGF0YVt2YXJOYW1lXSA9IGVsdC5pbnRlcmZhY2UoKVxuXHRcdH0pXG5cdFx0cmV0dXJuIGRhdGFcblx0XG5cdH1cblxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XG5cdFxuXG5cblx0JC5mbi5nZXRQYXJlbnRJbnRlcmZhY2UgPSBmdW5jdGlvbihwYXJlbnRDdHJsTmFtZSkge1xuXHRcdHZhciBwYXJlbnQgPSB0aGlzLnBhcmVudCgpXG5cdFx0aWYgKCFwYXJlbnQuaGFzQ2xhc3MocGFyZW50Q3RybE5hbWUpKSB7XG5cdFx0XHRyZXR1cm5cblx0XHR9XG5cdFx0cmV0dXJuIHBhcmVudC5pbnRlcmZhY2UoKVx0XHRcblx0fVxuXG5cdCQuZm4ucHJvY2Vzc0NvbnRyb2xzID0gZnVuY3Rpb24oIGRhdGEpIHtcblxuXHRcdGRhdGEgPSBkYXRhIHx8IHt9XG5cblx0XHR0aGlzLmJuRmlsdGVyKCdbYm4tY29udHJvbF0nKS5lYWNoKGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGVsdCA9ICQodGhpcylcblxuXHRcdFx0dmFyIGNvbnRyb2xOYW1lID0gZWx0LmF0dHIoJ2JuLWNvbnRyb2wnKVxuXHRcdFx0ZWx0LnJlbW92ZUF0dHIoJ2JuLWNvbnRyb2wnKVxuXHRcdFx0Ly9jb25zb2xlLmxvZygnY29udHJvbE5hbWUnLCBjb250cm9sTmFtZSlcblxuXG5cblx0XHRcdCQkLmNyZWF0ZUNvbnRyb2woY29udHJvbE5hbWUsIGVsdClcblx0XHR9KVxuXG5cdFx0cmV0dXJuIHRoaXNcblxuXHR9XHRcblxuXHQkLmZuLmludGVyZmFjZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAodGhpcy5sZW5ndGggPT0gMCkgPyBudWxsIDogdGhpcy5nZXQoMCkuY3RybFxuXHR9XG5cblx0JC5mbi5kaXNwb3NlID0gZnVuY3Rpb24oKSB7XG5cdFx0Y29uc29sZS5sb2coJ1tDb3JlXSBkaXNwb3NlJylcblx0XHR0aGlzLmZpbmQoJy5DdXN0b21Db250cm9sJykuZWFjaChmdW5jdGlvbigpIHtcdFx0XG5cdFx0XHR2YXIgaWZhY2UgPSAkKHRoaXMpLmludGVyZmFjZSgpXG5cdFx0XHRpZiAodHlwZW9mIGlmYWNlID09ICdvYmplY3QnICYmIHR5cGVvZiBpZmFjZS5kaXNwb3NlID09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0aWZhY2UuZGlzcG9zZSgpXG5cdFx0XHR9XG5cdFx0XHRkZWxldGUgJCh0aGlzKS5nZXQoMCkuY3RybFxuXHRcdH0pXG5cdFx0cmV0dXJuIHRoaXNcblx0fVxuXG59KSgpOyIsIihmdW5jdGlvbigpIHtcblxuXHQkLmZuLnByb2Nlc3NFdmVudHMgPSBmdW5jdGlvbihkYXRhKSB7XG5cdFx0Ly9jb25zb2xlLmxvZygncHJvY2Vzc0V2ZW50cycsIGRhdGEpXG5cdFx0aWYgKHR5cGVvZiBkYXRhICE9ICdvYmplY3QnKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKGBbY29yZV0gcHJvY2Vzc0V2ZW50cyBjYWxsZWQgd2l0aCBiYWQgcGFyYW1ldGVyICdkYXRhJyAobXVzdCBiZSBhbiBvYmplY3QpOmAsIGRhdGEpXG5cdFx0XHRyZXR1cm5cblx0XHR9XG5cdFx0dGhpcy5ibkZpbmRFeCgnYm4tZXZlbnQnLCB0cnVlLCBmdW5jdGlvbihlbHQsIGF0dHJOYW1lLCB2YXJOYW1lKSB7XG5cdFx0XHQvL2NvbnNvbGUubG9nKCdibi1ldmVudCcsIGF0dHJOYW1lLCB2YXJOYW1lKVxuXHRcdFx0dmFyIGYgPSBhdHRyTmFtZS5zcGxpdCgnLicpXG5cdFx0XHR2YXIgZXZlbnROYW1lID0gZlswXVxuXHRcdFx0dmFyIHNlbGVjdG9yID0gZlsxXVxuXG5cdFx0XHR2YXIgZm4gPSBkYXRhW3Zhck5hbWVdXG5cdFx0XHRpZiAodHlwZW9mIGZuID09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0dmFyIGlmYWNlID0gZWx0LmludGVyZmFjZSgpXG5cdFx0XHRcdGlmIChpZmFjZSAmJiB0eXBlb2YgaWZhY2Uub24gPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdGlmYWNlLm9uKGV2ZW50TmFtZSwgZm4uYmluZChpZmFjZSkpXG5cdFx0XHRcdFx0cmV0dXJuXG5cdFx0XHRcdH1cblxuXHRcdFx0XHR2YXIgdXNlTmF0aXZlRXZlbnRzID0gWydtb3VzZWVudGVyJywgJ21vdXNlbGVhdmUnXS5pbmRleE9mKGV2ZW50TmFtZSkgIT0gLTFcblxuXHRcdFx0XHRpZiAoc2VsZWN0b3IgIT0gdW5kZWZpbmVkKSB7XG5cblx0XHRcdFx0XHRpZiAodXNlTmF0aXZlRXZlbnRzKSB7XG5cdFx0XHRcdFx0XHRlbHQuZ2V0KDApLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBmdW5jdGlvbihldikge1xuXHRcdFx0XHRcdFx0XHR2YXIgdGFyZ2V0ID0gJChldi50YXJnZXQpXG5cdFx0XHRcdFx0XHRcdGlmICh0YXJnZXQuaGFzQ2xhc3Moc2VsZWN0b3IpKSB7XG5cdFx0XHRcdFx0XHRcdFx0Zm4uY2FsbChldi50YXJnZXQsIGV2KVxuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdH0pXHRcdFx0XHRcdFxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdGVsdC5vbihldmVudE5hbWUsICcuJyArIHNlbGVjdG9yLCBmbilcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRpZiAodXNlTmF0aXZlRXZlbnRzKSB7XG5cdFx0XHRcdFx0XHRlbHQuZ2V0KDApLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBmdW5jdGlvbihldikge1xuXHRcdFx0XHRcdFx0XHRcdGZuLmNhbGwoZXYudGFyZ2V0LCBldilcblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHRlbHQub24oZXZlbnROYW1lLCBmbilcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cdFx0XHRcdFxuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdGNvbnNvbGUud2FybihgW0NvcmVdIHByb2Nlc3NFdmVudHM6IHZhcmlhYmxlICcke3Zhck5hbWV9JyBpcyBub3QgYSBmdW5jdGlvbiBkZWZpbmVkIGluIGRhdGFgLCBkYXRhKVxuXHRcdFx0fVx0XHRcblx0XHR9KVxuXHRcdHJldHVybiB0aGlzXG5cdFxuXHR9XG5cbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1xuXG5cdCQuZm4uZ2V0VmFsdWUgPSBmdW5jdGlvbigpIHtcblx0XHR2YXIgdHlwZSA9IHRoaXMuYXR0cigndHlwZScpXG5cdFx0aWYgKHRoaXMuZ2V0KDApLnRhZ05hbWUgPT0gJ0lOUFVUJyAmJiB0eXBlID09ICdjaGVja2JveCcpIHtcblx0XHRcdHJldHVybiB0aGlzLnByb3AoJ2NoZWNrZWQnKVxuXHRcdH1cblx0XHR2YXIgaWZhY2UgPSB0aGlzLmludGVyZmFjZSgpXG5cdFx0aWYgKGlmYWNlICYmIHR5cGVvZiBpZmFjZS5nZXRWYWx1ZSA9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRyZXR1cm4gaWZhY2UuZ2V0VmFsdWUoKVxuXHRcdH1cblx0XHR2YXIgcmV0ID0gdGhpcy52YWwoKVxuXG5cdFx0aWYgKHR5cGUgPT0gJ251bWJlcicgfHwgdHlwZSA9PSAncmFuZ2UnKSB7XG5cdFx0XHRyZXQgPSBwYXJzZUZsb2F0KHJldClcblx0XHR9XG5cdFx0cmV0dXJuIHJldFxuXHR9XG5cblxuXHQkLmZuLnNldFZhbHVlID0gZnVuY3Rpb24odmFsdWUpIHtcblx0XHRpZiAodGhpcy5nZXQoMCkudGFnTmFtZSA9PSAnSU5QVVQnICYmIHRoaXMuYXR0cigndHlwZScpID09ICdjaGVja2JveCcpIHtcblx0XHRcdHRoaXMucHJvcCgnY2hlY2tlZCcsIHZhbHVlKVxuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXG5cdFx0dmFyIGlmYWNlID0gdGhpcy5pbnRlcmZhY2UoKVxuXHRcdGlmIChpZmFjZSAmJiB0eXBlb2YgaWZhY2Uuc2V0VmFsdWUgPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0aWZhY2Uuc2V0VmFsdWUodmFsdWUpXG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0dGhpcy52YWwodmFsdWUpXG5cdFx0fVxuXHR9XG5cblxuXG5cdCQuZm4uZ2V0Rm9ybURhdGEgPSBmdW5jdGlvbigpIHtcblx0XHR2YXIgcmV0ID0ge31cblx0XHR0aGlzLmZpbmQoJ1tuYW1lXScpLmVhY2goZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgZWx0ID0gJCh0aGlzKVxuXHRcdFx0dmFyIG5hbWUgPSBlbHQuYXR0cignbmFtZScpXG5cdFx0XHRyZXRbbmFtZV0gPSBlbHQuZ2V0VmFsdWUoKVxuXG5cdFx0fSlcblxuXHRcdHJldHVybiByZXRcblx0fVxuXG5cdCQuZm4ucmVzZXRGb3JtID0gZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHRoaXMuZ2V0KDApLnRhZ05hbWUgPT0gXCJGT1JNXCIpIHtcblx0XHRcdHRoaXMuZ2V0KDApLnJlc2V0KClcblx0XHR9XHRcdFxuXHR9XG5cblx0JC5mbi5zZXRGb3JtRGF0YSA9IGZ1bmN0aW9uKGRhdGEpIHtcblxuXHRcdC8vY29uc29sZS5sb2coJ3NldEZvcm1EYXRhJywgZGF0YSlcblx0XHR0aGlzLnJlc2V0Rm9ybSgpXG5cblx0XHRmb3IodmFyIG5hbWUgaW4gZGF0YSkge1xuXHRcdFx0dmFyIHZhbHVlID0gZGF0YVtuYW1lXVxuXHRcdFx0dmFyIGVsdCA9IHRoaXMuZmluZChgW25hbWU9JHtuYW1lfV1gKVxuXHRcdFx0aWYgKGVsdC5sZW5ndGgpIHtcblx0XHRcdFx0ZWx0LnNldFZhbHVlKHZhbHVlKVx0XHRcdFx0XG5cdFx0XHR9XG5cblx0XHRcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpc1xuXHR9XG5cblx0JC5mbi5wcm9jZXNzRm9ybURhdGEgPSBmdW5jdGlvbihkYXRhKSB7XG5cdFx0aWYgKGRhdGEgPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRyZXR1cm4gdGhpc1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgZGF0YSAhPSAnb2JqZWN0Jykge1xuXHRcdFx0Y29uc29sZS5lcnJvcihgW2NvcmVdIHByb2Nlc3NGb3JtRGF0YSBjYWxsZWQgd2l0aCBiYWQgcGFyYW1ldGVyICdkYXRhJyAobXVzdCBiZSBhbiBvYmplY3QpOmAsIGRhdGEpXG5cdFx0XHRyZXR1cm4gdGhpc1xuXHRcdH1cblxuXHRcdHRoaXMuYm5GaW5kKCdibi1mb3JtJywgdHJ1ZSwgZnVuY3Rpb24oZWx0LCB2YXJOYW1lKSB7XG5cdFx0XHQvL2NvbnNvbGUubG9nKCdibi10ZXh0JywgdmFyTmFtZSlcblx0XHRcdHZhciB2YWx1ZSA9IGRhdGFbdmFyTmFtZV1cblx0XHRcdGlmICh0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCcpIHtcblx0XHRcdFx0ZWx0LnNldEZvcm1EYXRhKHZhbHVlKVxuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdGNvbnNvbGUud2FybihgW0NvcmVdIHByb2Nlc3NGb3JtRGF0YTogdmFyaWFibGUgJyR7dmFyTmFtZX0nIGlzIG5vdCBhbiBvYmplY3QgZGVmaW5lZCBpbiBkYXRhYCwgZGF0YSlcblx0XHRcdH1cblx0XHRcdFxuXHRcdH0pXG5cdFx0cmV0dXJuIHRoaXNcblx0XG5cdH1cblxuXG59KSgpOyIsIihmdW5jdGlvbigpIHtcblxuXG5cdCQuZm4ucHJvY2Vzc0NvbnRleHRNZW51ID0gZnVuY3Rpb24oZGF0YSkge1xuXHRcdGlmIChkYXRhID09IHVuZGVmaW5lZCkge1xuXHRcdFx0cmV0dXJuIHRoaXNcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIGRhdGEgIT0gJ29iamVjdCcpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoYFtjb3JlXSBwcm9jZXNzQ29udGV4dE1lbnUgY2FsbGVkIHdpdGggYmFkIHBhcmFtZXRlciAnZGF0YScgKG11c3QgYmUgYW4gb2JqZWN0KTpgLCBkYXRhKVxuXHRcdFx0cmV0dXJuIHRoaXNcblx0XHR9XG5cblx0XHR0aGlzLmJuRmluZCgnYm4tbWVudScsIHRydWUsIGZ1bmN0aW9uKGVsdCwgdmFyTmFtZSkge1xuXHRcdFx0Ly9jb25zb2xlLmxvZygnYm4tdGV4dCcsIHZhck5hbWUpXG5cdFx0XHR2YXIgdmFsdWUgPSBkYXRhW3Zhck5hbWVdXG5cdFx0XHRpZiAodHlwZW9mIHZhbHVlID09ICdvYmplY3QnKSB7XG5cdFx0XHRcdHZhciBpZCA9IGVsdC51bmlxdWVJZCgpLmF0dHIoJ2lkJylcblx0XHRcdFx0Y29uc29sZS5sb2coJ1twcm9jZXNzQ29udGV4dE1lbnVdIGlkJywgaWQpXG5cdFx0XHRcdCQuY29udGV4dE1lbnUoe1xuXHRcdFx0XHRcdHNlbGVjdG9yOiAnIycgKyBpZCxcblx0XHRcdFx0XHRjYWxsYmFjazogZnVuY3Rpb24oa2V5KSB7XG5cdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdbcHJvY2Vzc0NvbnRleHRNZW51XSBjYWxsYmFjaycsIGtleSlcblx0XHRcdFx0XHRcdGVsdC50cmlnZ2VyKCdtZW51Q2hhbmdlJywgW2tleV0pXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRpdGVtczogdmFsdWVcblx0XHRcdFx0fSlcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRjb25zb2xlLndhcm4oYFtDb3JlXSBwcm9jZXNzQ29udGV4dE1lbnU6IHZhcmlhYmxlICcke3Zhck5hbWV9JyBpcyBub3QgYW4gb2JqZWN0IGRlZmluZWQgaW4gZGF0YWAsIGRhdGEpXG5cdFx0XHR9XG5cdFx0XHRcblx0XHR9KVxuXHRcdHJldHVybiB0aGlzXG5cdFxuXHR9XG5cblxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XG5cblx0ZnVuY3Rpb24gc3BsaXRBdHRyKGF0dHJWYWx1ZSwgY2JrKSB7XG5cdFx0YXR0clZhbHVlLnNwbGl0KCcsJykuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XG5cdFx0XHR2YXIgbGlzdCA9IGl0ZW0uc3BsaXQoJzonKVxuXHRcdFx0aWYgKGxpc3QubGVuZ3RoID09IDIpIHtcblx0XHRcdFx0dmFyIG5hbWUgPSBsaXN0WzBdLnRyaW0oKVxuXHRcdFx0XHR2YXIgdmFsdWUgPSBsaXN0WzFdLnRyaW0oKVxuXHRcdFx0XHRjYmsobmFtZSwgdmFsdWUpXG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0Y29uc29sZS5lcnJvcihgW0NvcmVdIHNwbGl0QXR0cigke2F0dHJOYW1lfSkgJ2F0dHJWYWx1ZScgbm90IGNvcnJlY3Q6YCwgaXRlbSlcblx0XHRcdH1cblx0XHR9KVx0XHRcblx0fVxuXG5cdGZ1bmN0aW9uIGdldFZhclZhbHVlKHZhck5hbWUsIGRhdGEpIHtcblx0XHQvL2NvbnNvbGUubG9nKCdnZXRWYXJWYWx1ZScsIHZhck5hbWUsIGRhdGEpXG5cdFx0dmFyIHJldCA9IGRhdGFcblx0XHRmb3IobGV0IGYgb2YgdmFyTmFtZS5zcGxpdCgnLicpKSB7XG5cdFx0XHRcblx0XHRcdGlmICh0eXBlb2YgcmV0ID09ICdvYmplY3QnICYmIGYgaW4gcmV0KSB7XG5cdFx0XHRcdHJldCA9IHJldFtmXVxuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdC8vY29uc29sZS53YXJuKGBbQ29yZV0gZ2V0VmFyVmFsdWU6IGF0dHJpYnV0ICcke3Zhck5hbWV9JyBpcyBub3QgaW4gb2JqZWN0OmAsIGRhdGEpXG5cdFx0XHRcdHJldHVybiB1bmRlZmluZWRcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0Ly9jb25zb2xlLmxvZygnZicsIGYsICdyZXQnLCByZXQpXG5cdFx0fVxuXHRcdC8vY29uc29sZS5sb2coJ3JldCcsIHJldClcblx0XHRyZXR1cm4gcmV0XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRWYWx1ZShjdHgsIHZhck5hbWUsIGZuKSB7XG5cblx0XHQvL2NvbnNvbGUubG9nKCdbQ29yZV0gZ2V0VmFsdWUnLCB2YXJOYW1lLCBjdHgpXG5cblx0XHR2YXIgbm90ID0gZmFsc2Vcblx0XHRpZiAodmFyTmFtZS5zdGFydHNXaXRoKCchJykpIHtcblx0XHRcdHZhck5hbWUgPSB2YXJOYW1lLnN1YnN0cigxKVxuXHRcdFx0bm90ID0gdHJ1ZVxuXHRcdH1cdFx0XHRcblxuXHRcdHZhciBwcmVmaXhOYW1lID0gdmFyTmFtZS5zcGxpdCgnLicpWzBdXG5cdFx0Ly9jb25zb2xlLmxvZygnW0NvcmVdIHByZWZpeE5hbWUnLCBwcmVmaXhOYW1lKVxuXHRcdGlmIChjdHgudmFyc1RvVXBkYXRlICYmIGN0eC52YXJzVG9VcGRhdGUuaW5kZXhPZihwcmVmaXhOYW1lKSA8IDApIHtcblx0XHRcdHJldHVyblxuXHRcdH1cblxuXHRcdHZhciBmdW5jID0gY3R4LmRhdGFbdmFyTmFtZV1cblx0XHR2YXIgdmFsdWVcblxuXHRcdGlmICh0eXBlb2YgZnVuYyA9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHR2YWx1ZSA9IGZ1bmMuY2FsbChjdHguZGF0YSlcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHR2YWx1ZSA9IGdldFZhclZhbHVlKHZhck5hbWUsIGN0eC5kYXRhKVxuXHRcdH1cblxuXHRcdGlmICh2YWx1ZSA9PSB1bmRlZmluZWQpIHtcblx0XHRcdC8vY29uc29sZS53YXJuKGBbQ29yZV0gcHJvY2Vzc1RlbXBsYXRlOiB2YXJpYWJsZSAnJHt2YXJOYW1lfScgaXMgbm90IGRlZmluZWQgaW4gb2JqZWN0IGRhdGE6YCwgZGF0YSlcblx0XHRcdHJldHVyblxuXHRcdH1cblx0XHQvL2NvbnNvbGUubG9nKCd2YWx1ZScsIHZhbHVlKVxuXHRcdGlmICh0eXBlb2YgdmFsdWUgPT0gJ2Jvb2xlYW4nICYmIG5vdCkge1xuXHRcdFx0dmFsdWUgPSAhdmFsdWVcblx0XHR9XG5cdFx0Zm4odmFsdWUpXG5cdH1cblxuXHRmdW5jdGlvbiBibklmKGN0eCkge1xuXHRcdGdldFZhbHVlKGN0eCwgY3R4LmRpclZhbHVlLCBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0aWYgKHZhbHVlID09PSBmYWxzZSkge1xuXHRcdFx0XHRjdHguZWx0LnJlbW92ZSgpXG5cdFx0XHR9XG5cdFx0fSlcdFx0XG5cdH1cblxuXHRmdW5jdGlvbiBiblNob3coY3R4KSB7XG5cdFx0Z2V0VmFsdWUoY3R4LCBjdHguZGlyVmFsdWUsIGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHRpZiAodHlwZW9mIHZhbHVlID09ICdib29sZWFuJykge1xuXHRcdFx0XHRjdHguZWx0LmJuVmlzaWJsZSh2YWx1ZSlcblx0XHRcdH1cdFx0XHRcdFxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdGNvbnNvbGUud2FybihgW0NvcmVdIGJuLXNob3c6IHZhcmlhYmxlICcke3Zhck5hbWV9JyBpcyBub3QgYW4gYm9vbGVhbmAsIGRhdGEpXG5cdFx0XHR9XG5cdFx0fSlcdFx0XG5cdH1cblxuXG5cdGZ1bmN0aW9uIGJuRWFjaChjdHgpIHtcblx0XHR2YXIgZiA9IGN0eC5kaXJWYWx1ZS5zcGxpdCgnICcpXG5cdFx0aWYgKGYubGVuZ3RoICE9IDMgfHwgZlsxXSAhPSAnb2YnKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKCdbQ29yZV0gYm4tZWFjaCBjYWxsZWQgd2l0aCBiYWQgYXJndW1lbnRzOicsIGRpclZhbHVlKVxuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXHRcdHZhciBpdGVyID0gZlswXVxuXHRcdHZhciB2YXJOYW1lID0gZlsyXVxuXHRcdC8vY29uc29sZS5sb2coJ2JuLWVhY2ggaXRlcicsIGl0ZXIsICBjdHgudGVtcGxhdGUpXG5cdFx0XG5cdFx0Z2V0VmFsdWUoY3R4LCB2YXJOYW1lLCBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0aWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG5cblx0XHRcdFx0Y3R4LmVsdC5lbXB0eSgpXG5cdFx0XHRcdFxuXHRcdFx0XHR2YWx1ZS5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcblx0XHRcdFx0XHR2YXIgaXRlbURhdGEgPSAkLmV4dGVuZCh7fSwgY3R4LmRhdGEpXG5cdFx0XHRcdFx0aXRlbURhdGFbaXRlcl0gPSBpdGVtXG5cdFx0XHRcdFx0Ly92YXIgJGl0ZW0gPSAkKGN0eC50ZW1wbGF0ZSlcblx0XHRcdFx0XHR2YXIgJGl0ZW0gPSBjdHgudGVtcGxhdGUuY2xvbmUoKVxuXHRcdFx0XHRcdCRpdGVtLnByb2Nlc3NVSShpdGVtRGF0YSlcblx0XHRcdFx0XHRjdHguZWx0LmFwcGVuZCgkaXRlbSlcblx0XHRcdFx0fSlcblx0XHRcdH1cdFxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdGNvbnNvbGUud2FybihgW0NvcmVdIGJuLWVhY2g6IHZhcmlhYmxlICcke3Zhck5hbWV9JyBpcyBub3QgYW4gYXJyYXlgLCBkYXRhKVxuXHRcdFx0fVx0XHRcdFxuXHRcdH0pXG5cdH1cblxuXHRmdW5jdGlvbiBiblRleHQoY3R4KSB7XG5cdFx0Ly9jb25zb2xlLmxvZygnW0NvcmVdIGJuVGV4dCcsIGN0eClcblx0XHRnZXRWYWx1ZShjdHgsIGN0eC5kaXJWYWx1ZSwgZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdGN0eC5lbHQudGV4dCh2YWx1ZSlcblx0XHR9KVxuXHR9XG5cdFxuXG5cdGZ1bmN0aW9uIGJuRm9ybShjdHgpIHtcblx0XHQvL2NvbnNvbGUubG9nKCdbQ29yZV0gYm5UZXh0JywgY3R4KVxuXHRcdGdldFZhbHVlKGN0eCwgY3R4LmRpclZhbHVlLCBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0Y3R4LmVsdC5zZXRGb3JtRGF0YSh2YWx1ZSlcblx0XHR9KVxuXHR9XG5cdFxuXG5cdGZ1bmN0aW9uIGJuSHRtbChjdHgpIHtcblx0XHRnZXRWYWx1ZShjdHgsIGN0eC5kaXJWYWx1ZSwgZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdGN0eC5lbHQuaHRtbCh2YWx1ZSlcblx0XHR9KVxuXHR9XG5cblx0ZnVuY3Rpb24gYm5Db21ibyhjdHgpIHtcblx0XHRnZXRWYWx1ZShjdHgsIGN0eC5kaXJWYWx1ZSwgZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdGN0eC5lbHQuaW5pdENvbWJvKHZhbHVlKVxuXHRcdH0pXG5cdH1cblxuXHRmdW5jdGlvbiBibk9wdGlvbnMoY3R4KSB7XG5cdFx0Z2V0VmFsdWUoY3R4LCBjdHguZGlyVmFsdWUsIGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHRjdHguZWx0LmRhdGEoJyRvcHRpb25zJywgdmFsdWUpXG5cdFx0fSlcblx0fVxuXG5cblx0ZnVuY3Rpb24gYm5WYWwoY3R4KSB7XG5cdFx0Z2V0VmFsdWUoY3R4LCBjdHguZGlyVmFsdWUsIGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHRjdHguZWx0LnNldFZhbHVlKHZhbHVlKVxuXHRcdH0pXG5cdH1cblxuXG5cdGZ1bmN0aW9uIGJuUHJvcChjdHgpIHtcblx0XHRzcGxpdEF0dHIoY3R4LmRpclZhbHVlLCBmdW5jdGlvbihwcm9wTmFtZSwgdmFyTmFtZSkge1xuXHRcdFx0Z2V0VmFsdWUoY3R4LCB2YXJOYW1lLCBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0XHRpZiAodHlwZW9mIHZhbHVlID09ICdib29sZWFuJykge1xuXHRcdFx0XHRcdGN0eC5lbHQucHJvcChwcm9wTmFtZSwgdmFsdWUpXG5cdFx0XHRcdH1cdFx0XHRcdFxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRjb25zb2xlLndhcm4oYFtDb3JlXSBibi1wcm9wOiB2YXJpYWJsZSAnJHt2YXJOYW1lfScgaXMgbm90IGFuIGJvb2xlYW5gLCBkYXRhKVxuXHRcdFx0XHR9XG5cdFx0XHR9KVx0XG5cdFx0fSlcblx0fVxuXG5cdGZ1bmN0aW9uIGJuQXR0cihjdHgpIHtcblx0XHRzcGxpdEF0dHIoY3R4LmRpclZhbHVlLCBmdW5jdGlvbihhdHRyTmFtZSwgdmFyTmFtZSkge1xuXHRcdFx0Z2V0VmFsdWUoY3R4LCB2YXJOYW1lLCBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0XHRjdHguZWx0LmF0dHIoYXR0ck5hbWUsIHZhbHVlKVxuXHRcdFx0fSlcblx0XHR9KVxuXHR9XG5cblx0ZnVuY3Rpb24gYm5TdHlsZShjdHgpIHtcblx0XHRzcGxpdEF0dHIoY3R4LmRpclZhbHVlLCBmdW5jdGlvbihhdHRyTmFtZSwgdmFyTmFtZSkge1xuXHRcdFx0Z2V0VmFsdWUoY3R4LCB2YXJOYW1lLCBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0XHRjdHguZWx0LmNzcyhhdHRyTmFtZSwgdmFsdWUpXG5cdFx0XHR9KVxuXHRcdH0pXG5cdH1cblxuXG5cdGZ1bmN0aW9uIGJuRGF0YShjdHgpIHtcblx0XHRzcGxpdEF0dHIoY3R4LmRpclZhbHVlLCBmdW5jdGlvbihhdHRyTmFtZSwgdmFyTmFtZSkge1xuXHRcdFx0Z2V0VmFsdWUoY3R4LCB2YXJOYW1lLCBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0XHRjdHguZWx0LnNldFByb3AoYXR0ck5hbWUsIHZhbHVlKVxuXHRcdFx0fSlcblx0XHR9KVxuXHR9XG5cblxuXHRmdW5jdGlvbiBibkNsYXNzKGN0eCkge1xuXHRcdHNwbGl0QXR0cihjdHguZGlyVmFsdWUsIGZ1bmN0aW9uKHByb3BOYW1lLCB2YXJOYW1lKSB7XG5cdFx0XHRnZXRWYWx1ZShjdHgsIHZhck5hbWUsIGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHRcdGlmICh0eXBlb2YgdmFsdWUgPT0gJ2Jvb2xlYW4nKSB7XG5cdFx0XHRcdFx0aWYgKHZhbHVlKSB7XG5cdFx0XHRcdFx0XHRjdHguZWx0LmFkZENsYXNzKHByb3BOYW1lKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdGN0eC5lbHQucmVtb3ZlQ2xhc3MocHJvcE5hbWUpXG5cdFx0XHRcdFx0fVx0XHRcdFx0XG5cdFx0XHRcdH1cdFxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRjb25zb2xlLndhcm4oYFtDb3JlXSBibi1jbGFzczogdmFyaWFibGUgJyR7dmFyTmFtZX0nIGlzIG5vdCBhbiBib29sZWFuYCwgZGF0YSlcblx0XHRcdFx0fVxuXHRcdFx0fSlcdFxuXHRcdH0pXG5cdH1cdFxuXG5cblx0dmFyIGRpck1hcCA9IHtcblx0XHQnYm4tZWFjaCc6IGJuRWFjaCxcdFx0XHRcblx0XHQnYm4taWYnOiBibklmLFxuXHRcdCdibi10ZXh0JzogYm5UZXh0LFx0XG5cdFx0J2JuLWh0bWwnOiBibkh0bWwsXG5cdFx0J2JuLW9wdGlvbnMnOiBibk9wdGlvbnMsXHRcdFx0XG5cdFx0J2JuLWxpc3QnOiBibkNvbWJvLFx0XHRcdFxuXHRcdCdibi12YWwnOiBiblZhbCxcdFxuXHRcdCdibi1wcm9wJzogYm5Qcm9wLFxuXHRcdCdibi1hdHRyJzogYm5BdHRyLFx0XG5cdFx0J2JuLWRhdGEnOiBibkRhdGEsXHRcdFx0XG5cdFx0J2JuLWNsYXNzJzogYm5DbGFzcyxcblx0XHQnYm4tc2hvdyc6IGJuU2hvdyxcblx0XHQnYm4tc3R5bGUnOiBiblN0eWxlLFxuXHRcdCdibi1mb3JtJzogYm5Gb3JtXG5cdH1cblxuXHQkLmZuLnNldFByb3AgPSBmdW5jdGlvbihhdHRyTmFtZSwgdmFsdWUpIHtcblx0XHR2YXIgaWZhY2UgPSB0aGlzLmludGVyZmFjZSgpXG5cdFx0aWYgKGlmYWNlICYmIGlmYWNlLnNldFByb3ApIHtcblx0XHRcdGlmYWNlLnNldFByb3AoYXR0ck5hbWUsIHZhbHVlKVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHRoaXMuZGF0YShhdHRyTmFtZSwgdmFsdWUpXG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXNcblx0fVxuXG5cblxuXHQkLmZuLnByb2Nlc3NUZW1wbGF0ZSA9IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHQvL2NvbnNvbGUubG9nKCdbQ29yZV0gcHJvY2Vzc1RlbXBsYXRlJylcblx0XHR2YXIgdGhhdCA9IHRoaXNcblxuXHRcdHZhciBkaXJMaXN0ID0gW11cblxuXHRcdGZvcihsZXQgayBpbiBkaXJNYXApIHtcblx0XHRcdHRoaXMuYm5GaW5kKGssIHRydWUsIGZ1bmN0aW9uKGVsdCwgZGlyVmFsdWUpIHtcblx0XHRcdFx0dmFyIHRlbXBsYXRlXG5cdFx0XHRcdGlmIChrID09ICdibi1lYWNoJykge1xuXHRcdFx0XHRcdHRlbXBsYXRlID0gZWx0LmNoaWxkcmVuKCkucmVtb3ZlKCkuY2xvbmUoKS8vLmdldCgwKS5vdXRlckhUTUxcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCd0ZW1wbGF0ZScsIHRlbXBsYXRlKVxuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChrID09ICdibi12YWwnKSB7XG5cdFx0XHRcdFx0ZWx0LmRhdGEoJyR2YWwnLCBkaXJWYWx1ZSlcblx0XHRcdFx0XHR2YXIgdXBkYXRlRXZlbnQgPSBlbHQuYXR0cignYm4tdXBkYXRlJylcblx0XHRcdFx0XHRpZiAodXBkYXRlRXZlbnQgIT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0XHRlbHQucmVtb3ZlQXR0cignYm4tdXBkYXRlJylcblx0XHRcdFx0XHRcdGVsdC5vbih1cGRhdGVFdmVudCwgZnVuY3Rpb24oZXYsIHVpKSB7XG5cdFx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ3VpJywgdWkpXG5cblx0XHRcdFx0XHRcdFx0dmFyIHZhbHVlID0gKHVpICYmICB1aS52YWx1ZSkgfHwgICQodGhpcykuZ2V0VmFsdWUoKVxuXHRcdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCd2YWx1ZScsIHZhbHVlKVxuXHRcdFx0XHRcdFx0XHR0aGF0LnRyaWdnZXIoJ2RhdGE6dXBkYXRlJywgW2RpclZhbHVlLCB2YWx1ZSwgZWx0XSlcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0ZGlyTGlzdC5wdXNoKHtkaXJlY3RpdmU6IGssIGVsdDogZWx0LCBkaXJWYWx1ZTogZGlyVmFsdWUsIHRlbXBsYXRlOiB0ZW1wbGF0ZX0pXG5cdFx0XHR9KVxuXHRcdH1cblxuXHRcdGlmIChkYXRhKSB7XG5cdFx0XHR0aGlzLnVwZGF0ZVRlbXBsYXRlKGRpckxpc3QsIGRhdGEpXG5cdFx0fVxuXHRcdFx0XHRcblx0XHRyZXR1cm4gZGlyTGlzdFxuXG5cdH1cdFxuXG5cdCQuZm4udXBkYXRlVGVtcGxhdGUgPSBmdW5jdGlvbihkaXJMaXN0LCBkYXRhLCB2YXJzVG9VcGRhdGUsIGV4Y2x1ZGVFbHQpIHtcblx0XHQvL2NvbnNvbGUubG9nKCdbY29yZV0gdXBkYXRlVGVtcGxhdGUnLCBkYXRhLCB2YXJzVG9VcGRhdGUpXG5cblx0XHRcdC8vY29uc29sZS5sb2coJ2RhdGEnLCBkYXRhKVxuXHRcdHZhcnNUb1VwZGF0ZSA9IHZhcnNUb1VwZGF0ZSB8fCBPYmplY3Qua2V5cyhkYXRhKVxuXHRcdC8vY29uc29sZS5sb2coJ3ZhcnNUb1VwZGF0ZScsIHZhcnNUb1VwZGF0ZSlcblxuXHRcdGRpckxpc3QuZm9yRWFjaChmdW5jdGlvbihkaXJJdGVtKSB7XG5cdFx0XHR2YXIgZm4gPSBkaXJNYXBbZGlySXRlbS5kaXJlY3RpdmVdXG5cdFx0XHRpZiAodHlwZW9mIGZuID09ICdmdW5jdGlvbicgJiYgZGlySXRlbS5lbHQgIT0gZXhjbHVkZUVsdCkge1xuXHRcdFx0XHRkaXJJdGVtLmRhdGEgPSBkYXRhO1xuXHRcdFx0XHRkaXJJdGVtLnZhcnNUb1VwZGF0ZSA9IHZhcnNUb1VwZGF0ZTtcblx0XHRcdFx0Zm4oZGlySXRlbSlcblx0XHRcdH1cblx0XHR9KVx0XHRcdFxuXHRcdFxuXG5cdFx0XG5cdFx0cmV0dXJuIHRoaXNcblxuXHR9XHRcblxuXG59KSgpOyIsIihmdW5jdGlvbigpIHtcblxuXHQkLmZuLnByb2Nlc3NVSSA9IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHQvL2NvbnNvbGUubG9nKCdwcm9jZXNzVUknLCBkYXRhLCB0aGlzLmh0bWwoKSlcblx0XHR2YXIgZGlyTGlzdCA9IHRoaXMucHJvY2Vzc1RlbXBsYXRlKGRhdGEpXG5cdFx0dGhpcy5wcm9jZXNzQ29udHJvbHMoZGF0YSlcblx0XHQvLy5wcm9jZXNzRm9ybURhdGEoZGF0YSlcblx0XHQucHJvY2Vzc0NvbnRleHRNZW51KGRhdGEpXG5cdFx0cmV0dXJuIGRpckxpc3Rcblx0fVxuXG59KSgpOyIsIihmdW5jdGlvbigpIHtcblxuXHQkLmZuLmJuRmlsdGVyID0gZnVuY3Rpb24oc2VsZWN0b3IpIHtcblx0XHRyZXR1cm4gdGhpcy5maW5kKHNlbGVjdG9yKS5hZGQodGhpcy5maWx0ZXIoc2VsZWN0b3IpKVxuXHR9XG5cblx0JC5mbi5ibkZpbmQgPSBmdW5jdGlvbihhdHRyTmFtZSwgcmVtb3ZlQXR0ciwgY2JrKSB7XG5cdFx0dGhpcy5ibkZpbHRlcihgWyR7YXR0ck5hbWV9XWApLmVhY2goZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgZWx0ID0gJCh0aGlzKVxuXHRcdFx0dmFyIGF0dHJWYWx1ZSA9IGVsdC5hdHRyKGF0dHJOYW1lKVxuXHRcdFx0aWYgKHJlbW92ZUF0dHIpIHtcblx0XHRcdFx0ZWx0LnJlbW92ZUF0dHIoYXR0ck5hbWUpXG5cdFx0XHR9XHRcdFxuXHRcdFx0Y2JrKGVsdCwgYXR0clZhbHVlKVxuXHRcdH0pXG5cdH1cblxuXHQkLmZuLmJuRmluZEV4ID0gZnVuY3Rpb24oYXR0ck5hbWUsIHJlbW92ZUF0dHIsIGNiaykge1xuXHRcdHRoaXMuYm5GaW5kKGF0dHJOYW1lLCByZW1vdmVBdHRyLCBmdW5jdGlvbihlbHQsIGF0dHJWYWx1ZSkge1xuXHRcdFx0YXR0clZhbHVlLnNwbGl0KCcsJykuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XG5cdFx0XHRcdHZhciBsaXN0ID0gaXRlbS5zcGxpdCgnOicpXG5cdFx0XHRcdGlmIChsaXN0Lmxlbmd0aCA9PSAyKSB7XG5cdFx0XHRcdFx0dmFyIG5hbWUgPSBsaXN0WzBdLnRyaW0oKVxuXHRcdFx0XHRcdHZhciB2YWx1ZSA9IGxpc3RbMV0udHJpbSgpXG5cdFx0XHRcdFx0Y2JrKGVsdCwgbmFtZSwgdmFsdWUpXG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0Y29uc29sZS5lcnJvcihgW0NvcmVdIGJuRmluZEV4KCR7YXR0ck5hbWV9KSAnYXR0clZhbHVlJyBub3QgY29ycmVjdDpgLCBpdGVtKVxuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdH0pXG5cdH1cblxuXHQkLmZuLmJuVmlzaWJsZSA9IGZ1bmN0aW9uKGlzVmlzaWJsZSkge1xuXHRcdGlmIChpc1Zpc2libGUpIHtcblx0XHRcdHRoaXMuc2hvdygpXG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0dGhpcy5oaWRlKClcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXNcdFxuXHR9XG5cblx0JC5mbi5pbml0Q29tYm8gPSBmdW5jdGlvbih2YWx1ZXMpIHtcblx0XHR0aGlzXG5cdFx0LmVtcHR5KClcblx0XHQuYXBwZW5kKHZhbHVlcy5tYXAoZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdHJldHVybiBgPG9wdGlvbiB2YWx1ZT0ke3ZhbHVlfT4ke3ZhbHVlfTwvb3B0aW9uPmBcblx0XHR9KSlcblxuXHRcdHJldHVybiB0aGlzXG5cdH1cblxuXG59KSgpO1xuIiwiJCQuc2hvd0FsZXJ0ID0gZnVuY3Rpb24odGV4dCwgdGl0bGUsIGNhbGxiYWNrKSB7XG5cdHRpdGxlID0gdGl0bGUgfHwgJ0luZm9ybWF0aW9uJ1xuXHQkKCc8ZGl2PicsIHt0aXRsZTogdGl0bGV9KVxuXHRcdC5hcHBlbmQoJCgnPHA+JykuaHRtbCh0ZXh0KSlcblx0XHQuZGlhbG9nKHtcblx0XHRcdGNsYXNzZXM6IHtcblx0XHRcdFx0J3VpLWRpYWxvZy10aXRsZWJhci1jbG9zZSc6ICduby1jbG9zZSdcblx0XHRcdH0sXG5cdFx0XHQvL3dpZHRoOiAnYXV0bycsXG5cdFx0XHRtaW5XaWR0aDogMjAwLFxuXHRcdFx0bWF4SGVpZ2h0OiA0MDAsXG5cdFx0XHRtb2RhbDogdHJ1ZSxcblx0XHRcdGNsb3NlOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0JCh0aGlzKS5kaWFsb2coJ2Rlc3Ryb3knKVxuXHRcdFx0fSxcblx0XHRcdGJ1dHRvbnM6IFtcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHRleHQ6ICdDbG9zZScsXG5cdFx0XHRcdFx0Y2xpY2s6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0JCh0aGlzKS5kaWFsb2coJ2Nsb3NlJylcblx0XHRcdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdFx0XHRjYWxsYmFjaygpXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRdXG5cdFx0fSlcbn07XHRcblxuIiwiJCQuc2hvd0NvbmZpcm0gPSBmdW5jdGlvbih0ZXh0LCB0aXRsZSwgY2FsbGJhY2spIHtcblx0dGl0bGUgPSB0aXRsZSB8fCAnSW5mb3JtYXRpb24nXG5cdCQoJzxkaXY+Jywge3RpdGxlOiB0aXRsZX0pXG5cdFx0LmFwcGVuZCgkKCc8cD4nKS5odG1sKHRleHQpKVxuXHRcdC5kaWFsb2coe1xuXG5cdFx0XHRtb2RhbDogdHJ1ZSxcblxuXHRcdFx0Y2xvc2U6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQkKHRoaXMpLmRpYWxvZygnZGVzdHJveScpXG5cdFx0XHR9LFxuXHRcdFx0YnV0dG9uczogW1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dGV4dDogJ0NhbmNlbCcsXG5cdFx0XHRcdFx0Ly9jbGFzczogJ3czLWJ1dHRvbiB3My1yZWQgYm4tbm8tY29ybmVyJyxcblx0XHRcdFx0XHRjbGljazogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHQkKHRoaXMpLmRpYWxvZygnY2xvc2UnKVxuXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dGV4dDogJ09LJyxcblx0XHRcdFx0XHQvL2NsYXNzOiAndzMtYnV0dG9uIHczLWJsdWUgYm4tbm8tY29ybmVyJyxcblx0XHRcdFx0XHRjbGljazogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHQkKHRoaXMpLmRpYWxvZygnY2xvc2UnKVxuXHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0XHRcdGNhbGxiYWNrKClcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cdFx0XHRcdFx0XG5cdFx0XHRdXG5cdFx0fSlcbn07XG5cdFxuXG4iLCIkJC5zaG93Rm9ybSA9IGZ1bmN0aW9uKGZvcm1EZXNjLCBvbkFwcGx5KSB7XG5cdC8vY29uc29sZS5sb2coJ3Nob3dGb3JtJywgZm9ybURlc2MpXG5cblx0dmFyIGRpdiA9ICQoJzxkaXY+Jywge3RpdGxlOiBmb3JtRGVzYy50aXRsZX0pXG5cblx0dmFyIGZvcm0gPSAkKCc8Zm9ybT4nKVxuXHRcdC5hcHBlbmRUbyhkaXYpXG5cdFx0Lm9uKCdzdWJtaXQnLCBmdW5jdGlvbihldikge1xuXHRcdFx0ZXYucHJldmVudERlZmF1bHQoKVxuXHRcdFx0ZGl2LmRpYWxvZygnY2xvc2UnKVxuXHRcdFx0aWYgKHR5cGVvZiBvbkFwcGx5ID09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0b25BcHBseShmb3JtLmdldEZvcm1EYXRhKCkpXG5cdFx0XHR9XHRcdFx0XHRcblx0XHR9KVxuXHR2YXIgc3VibWl0QnRuID0gJCgnPGlucHV0PicsIHt0eXBlOiAnc3VibWl0JywgaGlkZGVuOiB0cnVlfSkuYXBwZW5kVG8oZm9ybSlcblxuXHRjb25zdCBmaWVsZHNEZXNjID0gZm9ybURlc2MuZmllbGRzXG5cdGZvcihsZXQgZmllbGROYW1lIGluIGZpZWxkc0Rlc2MpIHtcblx0XHRjb25zdCBmaWVsZERlc2MgPSBmaWVsZHNEZXNjW2ZpZWxkTmFtZV1cblxuXHRcdGNvbnN0IHtsYWJlbCwgaW5wdXQsIHZhbHVlLCBhdHRyc30gPSBmaWVsZERlc2NcblxuXHRcdGNvbnN0IGRpdkZpZWxkID0gJCgnPGRpdj4nLCB7Y2xhc3M6ICdibi1mbGV4LXJvdyBibi1zcGFjZS1iZXR3ZWVuIHczLW1hcmdpbi1ib3R0b20nfSkuYXBwZW5kVG8oZm9ybSlcblx0XHR2YXIgJGxhYmVsID0gJCgnPGxhYmVsPicpLnRleHQobGFiZWwpLmFwcGVuZFRvKGRpdkZpZWxkKVxuXG5cdFx0aWYgKGlucHV0ID09PSAnaW5wdXQnKSB7XG5cdFx0XHR2YXIgJGlucHV0ID0gJCgnPGlucHV0PicpXG5cdFx0XHRcdC53aWR0aCgxMDApXG5cdFx0XHRcdC5hdHRyKGF0dHJzKVxuXHRcdFx0XHQuYXR0cignbmFtZScsIGZpZWxkTmFtZSlcblx0XHRcdFx0LnZhbCh2YWx1ZSlcblx0XHRcdFx0LnByb3AoJ3JlcXVpcmVkJywgdHJ1ZSlcblx0XHRcdFx0LnVuaXF1ZUlkKClcblx0XHRcdFx0LmFwcGVuZFRvKGRpdkZpZWxkKVxuXG5cdFx0XHQkbGFiZWwuYXR0cignZm9yJywgJGlucHV0LmF0dHIoJ2lkJykpXG5cdFx0fVxuXHR9XG5cblx0aWYgKGZvcm1EZXNjLmRhdGEgIT0gdW5kZWZpbmVkKSB7XG5cdFx0Zm9ybS5zZXRGb3JtRGF0YShmb3JtRGVzYy5kYXRhKVxuXHR9XG5cblx0ZGl2LmRpYWxvZyh7XG5cdFx0bW9kYWw6IHRydWUsXG5cdFx0Ly93aWR0aDogJ2F1dG8nLFxuXHRcdGNsb3NlOiBmdW5jdGlvbigpIHtcblx0XHRcdCQodGhpcykuZGlhbG9nKCdkZXN0cm95Jylcblx0XHR9LFxuXHRcdGJ1dHRvbnM6IHtcblx0XHRcdCdDYW5jZWwnOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0JCh0aGlzKS5kaWFsb2coJ2Nsb3NlJylcblx0XHRcdH0sXG5cdFx0XHQnQXBwbHknOiBmdW5jdGlvbigpIHtcdFx0XHRcdFx0XG5cdFx0XHRcdHN1Ym1pdEJ0bi5jbGljaygpXG5cdFx0XHR9XG5cdFx0fVxuXHR9KVxuXG59O1xuIiwiJCQuc2hvd1BpY3R1cmUgPSBmdW5jdGlvbih0aXRsZSwgcGljdHVyZVVybCkge1xuXHQkKCc8ZGl2PicsIHt0aXRsZTogdGl0bGV9KVxuXHRcdC5hcHBlbmQoJCgnPGRpdj4nLCB7Y2xhc3M6ICdibi1mbGV4LWNvbCBibi1hbGlnbi1jZW50ZXInfSlcblx0XHRcdC5hcHBlbmQoJCgnPGltZz4nLCB7c3JjOiBwaWN0dXJlVXJsfSkpXG5cdFx0KVxuXHRcdC5kaWFsb2coe1xuXG5cdFx0XHRtb2RhbDogdHJ1ZSxcblx0XHRcdHdpZHRoOiAnYXV0bycsXG5cdFx0XHRtYXhIZWlnaHQ6IDYwMCxcblx0XHRcdG1heFdpZHRoOiA2MDAsXG5cdFx0XHQvL3Bvc2l0aW9uOiB7bXk6ICdjZW50ZXIgY2VudGVyJywgYXQ6ICdjZW50ZXIgY2VudGVyJ30sXG5cblx0XHRcdGNsb3NlOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0JCh0aGlzKS5kaWFsb2coJ2Rlc3Ryb3knKVxuXHRcdFx0fVxuXG5cdFx0fSlcbn07XG5cblxuXG4iLCIkJC5zaG93UHJvbXB0ID0gZnVuY3Rpb24obGFiZWwsIHRpdGxlLCBjYWxsYmFjaywgb3B0aW9ucykge1xuXHR0aXRsZSA9IHRpdGxlIHx8ICdJbmZvcm1hdGlvbidcblx0b3B0aW9ucyA9ICQuZXh0ZW5kKHt0eXBlOiAndGV4dCd9LCBvcHRpb25zKVxuXHQvL2NvbnNvbGUubG9nKCdvcHRpb25zJywgb3B0aW9ucylcblxuXHR2YXIgZGl2ID0gJCgnPGRpdj4nLCB7dGl0bGU6IHRpdGxlfSlcblx0XHQuYXBwZW5kKCQoJzxmb3JtPicpXG5cdFx0XHQuYXBwZW5kKCQoJzxwPicpLnRleHQobGFiZWwpKVxuXHRcdFx0LmFwcGVuZCgkKCc8aW5wdXQ+Jywge2NsYXNzOiAndmFsdWUnfSkuYXR0cihvcHRpb25zKS5wcm9wKCdyZXF1aXJlZCcsIHRydWUpLmNzcygnd2lkdGgnLCAnMTAwJScpKVxuXHRcdFx0LmFwcGVuZCgkKCc8aW5wdXQ+Jywge3R5cGU6ICdzdWJtaXQnfSkuaGlkZSgpKVxuXHRcdFx0Lm9uKCdzdWJtaXQnLCBmdW5jdGlvbihldikge1xuXHRcdFx0XHRldi5wcmV2ZW50RGVmYXVsdCgpXG5cdFx0XHRcdGRpdi5kaWFsb2coJ2Nsb3NlJylcblx0XHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0dmFyIHZhbCA9IGRpdi5maW5kKCcudmFsdWUnKS52YWwoKVxuXHRcdFx0XHRcdGNhbGxiYWNrKHZhbClcblx0XHRcdFx0fVx0XHRcdFx0XG5cdFx0XHR9KVxuXHRcdClcblx0XHQuZGlhbG9nKHtcblx0XHRcdGNsYXNzZXM6IHtcblx0XHRcdFx0J3VpLWRpYWxvZy10aXRsZWJhci1jbG9zZSc6ICduby1jbG9zZSdcblx0XHRcdH0sXG5cdFx0XHRtb2RhbDogdHJ1ZSxcblx0XHRcdGNsb3NlOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0JCh0aGlzKS5kaWFsb2coJ2Rlc3Ryb3knKVxuXHRcdFx0fSxcblx0XHRcdGJ1dHRvbnM6IFtcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHRleHQ6ICdDYW5jZWwnLFxuXHRcdFx0XHRcdGNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdCQodGhpcykuZGlhbG9nKCdjbG9zZScpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dGV4dDogJ0FwcGx5Jyxcblx0XHRcdFx0XHRjbGljazogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHQkKHRoaXMpLmZpbmQoJ1t0eXBlPXN1Ym1pdF0nKS5jbGljaygpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRdXG5cdFx0fSlcbn07XG5cbiIsIihmdW5jdGlvbigpe1xuXG5cdFxuXHRmdW5jdGlvbiBpc09iamVjdChhKSB7XG5cdFx0cmV0dXJuICh0eXBlb2YgYSA9PSAnb2JqZWN0JykgJiYgIUFycmF5LmlzQXJyYXkoYSlcblx0fVxuXG5cdCQkLmNoZWNrVHlwZSA9IGZ1bmN0aW9uKHZhbHVlLCB0eXBlLCBpc09wdGlvbmFsKSB7XG5cdFx0Ly9jb25zb2xlLmxvZygnY2hlY2tUeXBlJyx2YWx1ZSwgdHlwZSwgaXNPcHRpb25hbClcblx0XHRpZiAodHlwZW9mIHZhbHVlID09ICd1bmRlZmluZWQnICYmIGlzT3B0aW9uYWwgPT09IHRydWUpIHtcblx0XHRcdHJldHVybiB0cnVlXG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiB0eXBlID09ICdzdHJpbmcnKSB7XG5cdFx0XHRyZXR1cm4gdHlwZW9mIHZhbHVlID09IHR5cGVcblx0XHR9XG5cblx0XHRpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcblx0XHRcdGlmICghQXJyYXkuaXNBcnJheSh0eXBlKSkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHRcdH1cblxuXHRcdFx0aWYgKHR5cGUubGVuZ3RoID09IDApIHtcblx0XHRcdFx0cmV0dXJuIHRydWUgLy8gbm8gaXRlbSB0eXBlIGNoZWNraW5nXG5cdFx0XHR9XG5cdFx0XHRmb3IobGV0IGkgb2YgdmFsdWUpIHtcblx0XHRcdFx0dmFyIHJldCA9IGZhbHNlXG5cdFx0XHRcdGZvcihsZXQgdCBvZiB0eXBlKSB7XG5cdFx0XHRcdFx0cmV0IHw9ICQkLmNoZWNrVHlwZShpLCB0KVxuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICghcmV0KSB7XG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHRydWVcblx0XHR9XG5cblx0XHRpZiAoaXNPYmplY3QodHlwZSkpIHtcblx0XHRcdGlmICghaXNPYmplY3QodmFsdWUpKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZVxuXHRcdFx0fVxuXHRcdFx0Zm9yKGxldCBmIGluIHR5cGUpIHtcblxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdmJywgZiwgJ3ZhbHVlJywgdmFsdWUpXG5cdFx0XHRcdHZhciBuZXdUeXBlID0gdHlwZVtmXVxuXG5cdFx0XHRcdHZhciBpc09wdGlvbmFsID0gZmFsc2Vcblx0XHRcdFx0aWYgKGYuc3RhcnRzV2l0aCgnJCcpKSB7XG5cdFx0XHRcdFx0ZiA9IGYuc3Vic3RyKDEpXG5cdFx0XHRcdFx0aXNPcHRpb25hbCA9IHRydWVcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoISQkLmNoZWNrVHlwZSh2YWx1ZVtmXSwgbmV3VHlwZSwgaXNPcHRpb25hbCkpIHtcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHRcdFx0fVxuXG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB0cnVlXG5cdFx0fVxuXHRcdHJldHVybiBmYWxzZVxuXHR9XHRcblxuXG59KSgpO1xuIiwiJCQuZGF0YVVSTHRvQmxvYiA9IGZ1bmN0aW9uKGRhdGFVUkwpIHtcbiAgLy8gRGVjb2RlIHRoZSBkYXRhVVJMXG4gIHZhciBzcGxpdCA9IGRhdGFVUkwuc3BsaXQoL1s6LDtdLylcbiAgdmFyIG1pbWVUeXBlID0gc3BsaXRbMV1cbiAgdmFyIGVuY29kYWdlID0gc3BsaXRbMl1cbiAgaWYgKGVuY29kYWdlICE9ICdiYXNlNjQnKSB7XG4gIFx0cmV0dXJuXG4gIH1cbiAgdmFyIGRhdGEgPSBzcGxpdFszXVxuXG4gIGNvbnNvbGUubG9nKCdtaW1lVHlwZScsIG1pbWVUeXBlKVxuICBjb25zb2xlLmxvZygnZW5jb2RhZ2UnLCBlbmNvZGFnZSlcbiAgLy9jb25zb2xlLmxvZygnZGF0YScsIGRhdGEpXG5cbiAgdmFyIGJpbmFyeSA9IGF0b2IoZGF0YSlcbiAvLyBDcmVhdGUgOC1iaXQgdW5zaWduZWQgYXJyYXlcbiAgdmFyIGFycmF5ID0gW11cbiAgZm9yKHZhciBpID0gMDsgaSA8IGJpbmFyeS5sZW5ndGg7IGkrKykge1xuICBcdGFycmF5LnB1c2goYmluYXJ5LmNoYXJDb2RlQXQoaSkpXG4gIH1cblxuICAvLyBSZXR1cm4gb3VyIEJsb2Igb2JqZWN0XG5cdHJldHVybiBuZXcgQmxvYihbIG5ldyBVaW50OEFycmF5KGFycmF5KSBdLCB7bWltZVR5cGV9KVxufTtcbiIsIiQkLmV4dHJhY3QgPSBmdW5jdGlvbihvYmosIHZhbHVlcykge1xuXHRpZiAodHlwZW9mIHZhbHVlcyA9PSAnc3RyaW5nJykge1xuXHRcdHZhbHVlcyA9IHZhbHVlcy5zcGxpdCgnLCcpXG5cdH1cblx0aWYgKCFBcnJheS5pc0FycmF5KHZhbHVlcykgJiYgdHlwZW9mIHZhbHVlcyA9PSAnb2JqZWN0Jykge1xuXHRcdHZhbHVlcyA9IE9iamVjdC5rZXlzKHZhbHVlcylcblx0fVxuXHR2YXIgcmV0ID0ge31cblx0Zm9yKHZhciBrIGluIG9iaikge1xuXHRcdGlmICh2YWx1ZXMuaW5kZXhPZihrKSA+PSAwKSB7XG5cdFx0XHRyZXRba10gPSBvYmpba11cblx0XHR9XG5cdH1cblx0cmV0dXJuIHJldFxufTtcbiIsIiQkLmlzSW1hZ2UgPSBmdW5jdGlvbihmaWxlTmFtZSkge1xuXHRyZXR1cm4gKC9cXC4oZ2lmfGpwZ3xqcGVnfHBuZykkL2kpLnRlc3QoZmlsZU5hbWUpXG59O1xuIiwiJCQubG9hZFN0eWxlID0gZnVuY3Rpb24oc3R5bGVGaWxlUGF0aCwgY2FsbGJhY2spIHtcdFxuXHQvL2NvbnNvbGUubG9nKCdbQ29yZV0gbG9hZFN0eWxlJywgc3R5bGVGaWxlUGF0aClcblxuXHQkKGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjc3NPayA9ICQoJ2hlYWQnKS5maW5kKGBsaW5rW2hyZWY9XCIke3N0eWxlRmlsZVBhdGh9XCJdYCkubGVuZ3RoXG5cdFx0aWYgKGNzc09rICE9IDEpIHtcblx0XHRcdGNvbnNvbGUubG9nKGBbQ29yZV0gbG9hZGluZyAnJHtzdHlsZUZpbGVQYXRofScgZGVwZW5kYW5jeWApXG5cdFx0XHQkKCc8bGluaz4nLCB7aHJlZjogc3R5bGVGaWxlUGF0aCwgcmVsOiAnc3R5bGVzaGVldCd9KVxuXHRcdFx0Lm9uKCdsb2FkJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGBbQ29yZV0gJyR7c3R5bGVGaWxlUGF0aH0nIGxvYWRlZGApXG5cdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdGNhbGxiYWNrKClcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHRcdC5hcHBlbmRUbygkKCdoZWFkJykpXG5cdFx0fVxuXHR9KVxufTtcbiIsIiQkLm9iajJBcnJheSA9IGZ1bmN0aW9uKG9iaikge1xuXHR2YXIgcmV0ID0gW11cblx0Zm9yKHZhciBrZXkgaW4gb2JqKSB7XG5cdFx0cmV0LnB1c2goe2tleToga2V5LCB2YWx1ZTogb2JqW2tleV19KVxuXHR9XG5cdHJldHVybiByZXRcbn07XG4iLCIoZnVuY3Rpb24oKSB7XG5cbnZhciBpbnB1dEZpbGUgPSAkKCc8aW5wdXQ+Jywge3R5cGU6ICdmaWxlJ30pLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbigpIHtcblx0dmFyIG9uQXBwbHkgPSAkKHRoaXMpLmRhdGEoJ29uQXBwbHknKVxuXHR2YXIgZmlsZU5hbWUgPSB0aGlzLmZpbGVzWzBdXG5cdGlmICh0eXBlb2Ygb25BcHBseSA9PSAnZnVuY3Rpb24nKSB7XG5cdFx0b25BcHBseShmaWxlTmFtZSlcblx0fVxufSlcblxuJCQub3BlbkZpbGVEaWFsb2cgPSBmdW5jdGlvbihvbkFwcGx5KSB7XG5cdGlucHV0RmlsZS5kYXRhKCdvbkFwcGx5Jywgb25BcHBseSlcblx0aW5wdXRGaWxlLmNsaWNrKClcbn1cblxufSkoKTtcblxuIiwiJCQucmVhZEZpbGVBc0RhdGFVUkwgPSBmdW5jdGlvbihmaWxlTmFtZSwgb25SZWFkKSB7XG5cdHZhciBmaWxlUmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKVxuXG5cdGZpbGVSZWFkZXIub25sb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHR5cGVvZiBvblJlYWQgPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0b25SZWFkKGZpbGVSZWFkZXIucmVzdWx0KVxuXHRcdH1cblx0fVxuXHRmaWxlUmVhZGVyLnJlYWRBc0RhdGFVUkwoZmlsZU5hbWUpXG59O1xuIiwiJCQucmVhZFRleHRGaWxlID0gZnVuY3Rpb24oZmlsZU5hbWUsIG9uUmVhZCkge1xuXHR2YXIgZmlsZVJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKClcblxuXHRmaWxlUmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuXHRcdGlmICh0eXBlb2Ygb25SZWFkID09ICdmdW5jdGlvbicpIHtcblx0XHRcdG9uUmVhZChmaWxlUmVhZGVyLnJlc3VsdClcblx0XHR9XG5cdH1cblx0ZmlsZVJlYWRlci5yZWFkQXNUZXh0KGZpbGVOYW1lKVxufTtcbiJdfQ==
