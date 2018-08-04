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
		
			
			$('body').processControls() // process HeaderControl
			
			try {
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
$$.dialogController = function(title, options) {
	var div = $('<div>', {title: title})

	var ctrl = $$.viewController(div, options)
	div.dialog({
		autoOpen: false,
		modal: true,
		width: 'auto',
		buttons: {
			'Cancel': function() {
				$(this).dialog('close')
			},
			'Apply': function() {					
				$(this).dialog('close')
				if (typeof options.onApply == 'function') {
					options.onApply.call(ctrl)
				}	
			}
		}
	})
	ctrl.show = function() {
		div.dialog('open')
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

	$.fn.setFormData = function(data) {

		//console.log('setFormData', data)
		if (this.get(0).tagName == "FORM") {
			this.get(0).reset()
		}

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

$$.showAlert = function(text, title, callback) {
	title = title || 'Information'
	$('<div>', {title: title})
		.append($('<p>').html(text))
		.dialog({
			classes: {
				'ui-dialog-titlebar-close': 'no-close'
			},
			width: 'auto',
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmpzIiwiYm9vdC9pbmRleC5qcyIsImNvcmUvY29udHJvbHMuanMiLCJjb3JlL29iamVjdHNBbmRTZXJ2aWNlcy5qcyIsImNvbnRyb2xsZXJzL2RpYWxvZ0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9mb3JtRGlhbG9nQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL3ZpZXcuanMiLCJwbHVnaW5zL2JpbmRpbmcuanMiLCJwbHVnaW5zL2NvbnRyb2wuanMiLCJwbHVnaW5zL2V2ZW50LmpzIiwicGx1Z2lucy9mb3JtLmpzIiwicGx1Z2lucy9tZW51LmpzIiwicGx1Z2lucy90ZW1wbGF0ZS5qcyIsInBsdWdpbnMvdWkuanMiLCJwbHVnaW5zL3V0aWwuanMiLCJ1aS9zaG93QWxlcnQuanMiLCJ1aS9zaG93Q29uZmlybS5qcyIsInVpL3Nob3dQaWN0dXJlLmpzIiwidWkvc2hvd1Byb21wdC5qcyIsInV0aWwvY2hlY2tUeXBlLmpzIiwidXRpbC9kYXRhVVJMdG9CbG9iLmpzIiwidXRpbC9leHRyYWN0LmpzIiwidXRpbC9pc0ltYWdlLmpzIiwidXRpbC9sb2FkU3R5bGUuanMiLCJ1dGlsL29iajJBcnJheS5qcyIsInV0aWwvb3BlbkZpbGVEaWFsb2cuanMiLCJ1dGlsL3JlYWRGaWxlQXNEYXRhVVJMLmpzIiwidXRpbC9yZWFkVGV4dEZpbGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzVUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJjb3JlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7XHJcblxyXG5cdFxyXG5cdHdpbmRvdy4kJCA9IHt9XHJcblxyXG59KSgpO1xyXG4iLCIoZnVuY3Rpb24oKXtcclxuXHJcbnZhciBjdXJSb3V0ZVxyXG5cdFxyXG5cclxuXHJcbiQkLnN0YXJ0QXBwID0gZnVuY3Rpb24obWFpbkNvbnRyb2xOYW1lLCBjb25maWcpIHtcclxuXHQkJC52aWV3Q29udHJvbGxlcignYm9keScsIHtcclxuXHRcdHRlbXBsYXRlOiBgPGRpdiBibi1jb250cm9sPVwiJHttYWluQ29udHJvbE5hbWV9XCIgY2xhc3M9XCJtYWluUGFuZWxcIiBibi1vcHRpb25zPVwiY29uZmlnXCI+PC9kaXY+YCxcclxuXHRcdGRhdGE6IHtjb25maWd9XHJcblx0fSlcclxufVxyXG5cclxuZnVuY3Rpb24gcHJvY2Vzc1JvdXRlKCkge1xyXG5cdHZhciBwcmV2Um91dGUgPSBjdXJSb3V0ZVxyXG5cdHZhciBocmVmID0gbG9jYXRpb24uaHJlZlxyXG5cdHZhciBpZHggPSBocmVmLmluZGV4T2YoJyMnKVxyXG5cdGN1clJvdXRlID0gKGlkeCAhPT0gLTEpICA/IGhyZWYuc3Vic3RyKGlkeCsxKSA6ICcvJ1xyXG5cdC8vY29uc29sZS5sb2coJ1tDb3JlXSBuZXdSb3V0ZScsIGN1clJvdXRlLCBwcmV2Um91dGUpXHJcblxyXG5cclxuXHQkKHdpbmRvdykudHJpZ2dlcigncm91dGVDaGFuZ2UnLCB7Y3VyUm91dGU6Y3VyUm91dGUsIHByZXZSb3V0ZTogcHJldlJvdXRlfSlcclxuXHJcbn1cdFxyXG5cclxuJCQuY29uZmlnUmVhZHkgPSBmdW5jdGlvbihvbkNvbmZpZ1JlYWR5KSB7XHJcblxyXG5cclxuXHQkKGZ1bmN0aW9uKCkge1xyXG5cclxuXHRcdHZhciBhcHBOYW1lID0gbG9jYXRpb24ucGF0aG5hbWUuc3BsaXQoJy8nKVsyXVxyXG5cclxuXHRcdGNvbnNvbGUubG9nKGBbQ29yZV0gQXBwICcke2FwcE5hbWV9JyBzdGFydGVkIDopYClcclxuXHRcdGNvbnNvbGUubG9nKCdbQ29yZV0galF1ZXJ5IHZlcnNpb24nLCAkLmZuLmpxdWVyeSlcclxuXHRcdGNvbnNvbGUubG9nKCdbQ29yZV0galF1ZXJ5IFVJIHZlcnNpb24nLCAkLnVpLnZlcnNpb24pXHJcblxyXG5cdFx0XHJcblxyXG5cclxuXHRcdCQod2luZG93KS5vbigncG9wc3RhdGUnLCBmdW5jdGlvbihldnQpIHtcclxuXHRcdFx0Ly9jb25zb2xlLmxvZygnW3BvcHN0YXRlXSBzdGF0ZScsIGV2dC5zdGF0ZSlcclxuXHRcdFx0cHJvY2Vzc1JvdXRlKClcclxuXHRcdH0pXHJcblxyXG5cclxuXHRcdCQuZ2V0SlNPTihgL2FwaS9hcHAvY29uZmlnLyR7YXBwTmFtZX1gKVxyXG5cdFx0LnRoZW4oZnVuY3Rpb24oY29uZmlnKSB7XHJcblxyXG5cdFx0XHRjb25zb2xlLmxvZygnY29uZmlnJywgY29uZmlnKVxyXG5cclxuXHRcdFx0dmFyIG9wdGlvbnMgPSB7XHJcblx0XHRcdFx0dXNlck5hbWU6IGNvbmZpZy4kdXNlck5hbWUsXHJcblx0XHRcdFx0YXBwTmFtZVxyXG5cdFx0XHR9XHJcblxyXG5cclxuXHRcdFx0JCQuY29uZmlndXJlU2VydmljZSgnV2ViU29ja2V0U2VydmljZScsIG9wdGlvbnMpXHJcblx0XHRcclxuXHRcdFx0XHJcblx0XHRcdCQoJ2JvZHknKS5wcm9jZXNzQ29udHJvbHMoKSAvLyBwcm9jZXNzIEhlYWRlckNvbnRyb2xcclxuXHRcdFx0XHJcblx0XHRcdHRyeSB7XHJcblx0XHRcdFx0b25Db25maWdSZWFkeShjb25maWcpXHJcblx0XHRcdH1cclxuXHRcdFx0Y2F0Y2goZSkge1xyXG5cdFx0XHRcdHZhciBodG1sID0gYFxyXG5cdFx0XHRcdFx0PGRpdiBjbGFzcz1cInczLWNvbnRhaW5lclwiPlxyXG5cdFx0XHRcdFx0XHQ8cCBjbGFzcz1cInczLXRleHQtcmVkXCI+JHtlfTwvcD5cclxuXHRcdFx0XHRcdDwvZGl2PlxyXG5cdFx0XHRcdGBcclxuXHRcdFx0XHQkKCdib2R5JykuaHRtbChodG1sKVxyXG5cdFx0XHR9XHJcblx0XHRcdFxyXG5cdFx0XHRcclxuXHRcdFx0cHJvY2Vzc1JvdXRlKClcclxuXHRcdH0pXHJcblx0XHQuY2F0Y2goKGpxeGhyKSA9PiB7XHJcblx0XHRcdGNvbnNvbGUubG9nKCdqcXhocicsIGpxeGhyKVxyXG5cdFx0XHQvL3ZhciB0ZXh0ID0gSlNPTi5zdHJpbmdpZnkoanF4aHIucmVzcG9uc2VKU09OLCBudWxsLCA0KVxyXG5cdFx0XHR2YXIgdGV4dCA9IGpxeGhyLnJlc3BvbnNlVGV4dFxyXG5cdFx0XHR2YXIgaHRtbCA9IGBcclxuXHRcdFx0XHQ8ZGl2IGNsYXNzPVwidzMtY29udGFpbmVyXCI+XHJcblx0XHRcdFx0XHQ8cCBjbGFzcz1cInczLXRleHQtcmVkXCI+JHt0ZXh0fTwvcD5cclxuXHRcdFx0XHRcdDxhIGhyZWY9XCIvZGlzY29ubmVjdFwiIGNsYXNzPVwidzMtYnRuIHczLWJsdWVcIj5Mb2dvdXQ8L2E+XHJcblx0XHRcdFx0PC9kaXY+XHJcblx0XHRcdGBcclxuXHRcdFx0JCgnYm9keScpLmh0bWwoaHRtbClcclxuXHRcdH0pXHRcdFx0XHRcclxuXHRcdFx0XHJcblx0fSlcclxuXHRcclxuXHJcbn1cclxuXHJcblx0XHJcbn0pKCk7XHJcbiIsIihmdW5jdGlvbigpe1xyXG5cclxuXHJcblxyXG4kJC5yZWdpc3RlckNvbnRyb2wgPSBmdW5jdGlvbihuYW1lLCBhcmcxLCBhcmcyKSB7XHJcblx0JCQucmVnaXN0ZXJPYmplY3QoJ2NvbnRyb2xzJywgbmFtZSwgYXJnMSwgYXJnMilcclxufVxyXG5cclxuJCQucmVnaXN0ZXJDb250cm9sRXggPSBmdW5jdGlvbihuYW1lLCBvcHRpb25zKSB7XHJcblx0aWYgKCEkJC5jaGVja1R5cGUob3B0aW9ucywge1xyXG5cdFx0JGRlcHM6IFsnc3RyaW5nJ10sXHJcblx0XHQkaWZhY2U6ICdzdHJpbmcnLFxyXG5cdFx0JGV2ZW50czogJ3N0cmluZycsXHJcblx0XHRpbml0OiAnZnVuY3Rpb24nXHJcblx0fSkpIHtcclxuXHRcdGNvbnNvbGUuZXJyb3IoYFtDb3JlXSByZWdpc3RlckNvbnRyb2xFeDogYmFkIG9wdGlvbnNgLCBvcHRpb25zKVxyXG5cdFx0cmV0dXJuXHJcblx0fVxyXG5cclxuXHJcblx0dmFyIGRlcHMgPSBvcHRpb25zLmRlcHMgfHwgW11cclxuXHJcblxyXG5cdCQkLnJlZ2lzdGVyT2JqZWN0KCdjb250cm9scycsIG5hbWUsIGRlcHMsIG9wdGlvbnMpXHJcbn1cclxuXHJcblxyXG5cclxuJCQuY3JlYXRlQ29udHJvbCA9IGZ1bmN0aW9uKGNvbnRyb2xOYW1lLCBlbHQpIHtcclxuXHRlbHQuYWRkQ2xhc3MoY29udHJvbE5hbWUpXHJcblx0ZWx0LmFkZENsYXNzKCdDdXN0b21Db250cm9sJykudW5pcXVlSWQoKVx0XHJcblx0dmFyIGN0cmwgPSAkJC5nZXRPYmplY3QoJ2NvbnRyb2xzJywgY29udHJvbE5hbWUpXHJcblx0XHRcclxuXHRpZiAoY3RybCAhPSB1bmRlZmluZWQpIHtcclxuXHRcdC8vY29uc29sZS5sb2coJ2NyZWF0ZUNvbnRyb2wnLCBjb250cm9sTmFtZSwgY3RybClcclxuXHRcdGlmIChjdHJsLnN0YXR1cyA9PT0gICdvaycpIHtcclxuXHRcdFx0XHJcblx0XHRcdHZhciBpZmFjZSA9IHt9XHJcblxyXG5cdFx0XHRcclxuXHRcdFx0aWYgKHR5cGVvZiBjdHJsLmZuID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0XHR2YXIgYXJncyA9IFtlbHRdLmNvbmNhdChjdHJsLmRlcHMpXHJcblx0XHRcdFx0dmFyIGRlZmF1bHRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIGVsdC5kYXRhKCckb3B0aW9ucycpKVxyXG5cdFx0XHRcdGNvbnNvbGUubG9nKGBbQ29yZV0gaW5zdGFuY2UgY29udHJvbCAnJHtjb250cm9sTmFtZX0nYClcclxuXHRcdFx0XHRjdHJsLmZuLmFwcGx5KGlmYWNlLCBhcmdzKVx0XHJcblx0XHRcdFx0aWZhY2Uub3B0aW9ucyA9IGRlZmF1bHRPcHRpb25zXHJcblx0XHRcdFx0XHRcdFx0XHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBpZiAodHlwZW9mIGN0cmwuZm4gPT0gJ29iamVjdCcpIHtcclxuXHRcdFx0XHR2YXIgaW5pdCA9IGN0cmwuZm4uaW5pdFxyXG5cdFx0XHRcdHZhciBwcm9wcyA9IGN0cmwuZm4ucHJvcHMgfHwge31cclxuXHRcdFx0XHR2YXIgZGVmYXVsdE9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgY3RybC5mbi5vcHRpb25zLCBlbHQuZGF0YSgnJG9wdGlvbnMnKSlcclxuXHJcblx0XHRcdFx0dmFyIG9wdGlvbnMgPSB7fVxyXG5cclxuXHRcdFx0XHRmb3IodmFyIG8gaW4gZGVmYXVsdE9wdGlvbnMpIHtcclxuXHRcdFx0XHRcdG9wdGlvbnNbb10gPSAoZWx0LmRhdGEobykgIT0gdW5kZWZpbmVkKSA/IGVsdC5kYXRhKG8pIDogZGVmYXVsdE9wdGlvbnNbb11cclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdGZvcih2YXIgcCBpbiBwcm9wcykge1xyXG5cdFx0XHRcdFx0b3B0aW9uc1twXSA9IChlbHQuZGF0YShwKSAhPSB1bmRlZmluZWQpID8gZWx0LmRhdGEocCkgOiBwcm9wc1twXS52YWxcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ0NvbXB1dGVkIE9wdGlvbnMnLCBvcHRpb25zKVxyXG5cclxuXHRcdFx0XHRpZiAodHlwZW9mIGluaXQgPT0gJ2Z1bmN0aW9uJykge1xyXG5cclxuXHRcdFx0XHRcdHZhciBhcmdzID0gW2VsdCwgb3B0aW9uc10uY29uY2F0KGN0cmwuZGVwcylcclxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKGBbQ29yZV0gaW5zdGFuY2UgY29udHJvbCAnJHtjb250cm9sTmFtZX0nIHdpdGggb3B0aW9uc2AsIG9wdGlvbnMpXHJcblx0XHRcdFx0XHRpbml0LmFwcGx5KGlmYWNlLCBhcmdzKVxyXG5cdFx0XHRcdFx0aWZhY2Uub3B0aW9ucyA9IG9wdGlvbnNcclxuXHRcdFx0XHRcdGlmYWNlLmV2ZW50cyA9IGN0cmwuZm4uZXZlbnRzXHJcblxyXG5cdFx0XHRcdFx0aWYgKE9iamVjdC5rZXlzKHByb3BzKS5sZW5ndGggIT0gMCkge1xyXG5cdFx0XHRcdFx0XHRpZmFjZS5zZXRQcm9wID0gZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcclxuXHRcdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKGBbQ29yZV0gc2V0RGF0YWAsIG5hbWUsIHZhbHVlKVxyXG5cdFx0XHRcdFx0XHRcdHZhciBzZXR0ZXIgPSBwcm9wc1tuYW1lXSAmJiBwcm9wc1tuYW1lXS5zZXRcclxuXHRcdFx0XHRcdFx0XHRpZiAodHlwZW9mIHNldHRlciA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdFx0XHRcdFx0dmFyIHNldHRlciA9IGlmYWNlW3NldHRlcl1cclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBzZXR0ZXIgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdFx0XHRcdFx0c2V0dGVyLmNhbGwobnVsbCwgdmFsdWUpXHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0XHRcdGlmYWNlLm9wdGlvbnNbbmFtZV0gPSB2YWx1ZVxyXG5cdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0XHRpZmFjZS5wcm9wcyA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRcdHZhciByZXQgPSB7fVxyXG5cdFx0XHRcdFx0XHRcdGZvcih2YXIgayBpbiBwcm9wcykge1xyXG5cdFx0XHRcdFx0XHRcdFx0cmV0W2tdID0gaWZhY2Uub3B0aW9uc1trXVxyXG5cclxuXHRcdFx0XHRcdFx0XHRcdHZhciBnZXR0ZXIgPSBwcm9wc1trXS5nZXRcclxuXHRcdFx0XHRcdFx0XHRcdGlmICh0eXBlb2YgZ2V0dGVyID09ICdzdHJpbmcnKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRcdGdldHRlciA9IGlmYWNlW2dldHRlcl1cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0XHRpZiAodHlwZW9mIGdldHRlciA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRcdHJldFtrXSA9IGdldHRlci5jYWxsKG51bGwpXHJcblx0XHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdHJldHVybiByZXRcclxuXHRcdFx0XHRcdFx0fVx0XHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0Y29uc29sZS53YXJuKGBbQ29yZV0gY29udHJvbCAnJHtjb250cm9sTmFtZX0nIG1pc3NpbmcgaW5pdCBmdW5jdGlvbmApXHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWZhY2UubmFtZSA9IGNvbnRyb2xOYW1lXHJcblx0XHRcdGVsdC5nZXQoMCkuY3RybCA9IGlmYWNlXHJcblx0XHRcdFxyXG5cdFx0XHRyZXR1cm4gaWZhY2VcdFx0XHRcdFxyXG5cdFx0fVxyXG5cclxuXHJcblx0fVxyXG5cdGVsc2Uge1xyXG5cdFx0dGhyb3coYFtDb3JlXSBjb250cm9sICcke2NvbnRyb2xOYW1lfScgaXMgbm90IHJlZ2lzdGVyZWRgKVxyXG5cdH1cclxufVxyXG5cclxuJCQuZ2V0UmVnaXN0ZXJlZENvbnRyb2xzID0gZnVuY3Rpb24oKSB7XHJcblx0dmFyIGNvbnRyb2xzID0gJCQuZ2V0T2JqZWN0RG9tYWluKCdjb250cm9scycpXHJcblx0cmV0dXJuIE9iamVjdC5rZXlzKGNvbnRyb2xzKS5maWx0ZXIoKG5hbWUpID0+ICFuYW1lLnN0YXJ0c1dpdGgoJyQnKSlcclxufVxyXG5cclxuJCQuZ2V0UmVnaXN0ZXJlZENvbnRyb2xzRXggPSBmdW5jdGlvbigpIHtcclxuXHR2YXIgY29udHJvbHMgPSAkJC5nZXRPYmplY3REb21haW4oJ2NvbnRyb2xzJylcclxuXHR2YXIgbGlicyA9IHt9XHJcblx0Zm9yKHZhciBrIGluIGNvbnRyb2xzKSB7XHJcblx0XHR2YXIgaW5mbyA9IGNvbnRyb2xzW2tdLmZuXHJcblx0XHR2YXIgbGliTmFtZSA9IGluZm8ubGliXHJcblx0XHRpZiAodHlwZW9mIGxpYk5hbWUgPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0aWYgKGxpYnNbbGliTmFtZV0gPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0bGlic1tsaWJOYW1lXSA9IFtdXHJcblx0XHRcdH1cclxuXHRcdFx0bGlic1tsaWJOYW1lXS5wdXNoKGspXHJcblxyXG5cdFx0fVxyXG5cdH1cclxuXHRyZXR1cm4gbGlic1xyXG59XHJcblxyXG4kJC5nZXRDb250cm9sSW5mbyA9IGZ1bmN0aW9uKGNvbnRyb2xOYW1lKSB7XHJcblx0dmFyIGNvbnRyb2xzID0gJCQuZ2V0T2JqZWN0RG9tYWluKCdjb250cm9scycpXHJcblx0dmFyIGluZm8gPSBjb250cm9sc1tjb250cm9sTmFtZV1cclxuXHJcblx0aWYgKGluZm8gPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRjb25zb2xlLmxvZyhgY29udHJvbCAnJHtjb250cm9sTmFtZX0nIGlzIG5vdCByZWdpc3RlcmVkYClcclxuXHRcdHJldHVyblxyXG5cdH1cclxuXHRpbmZvID0gaW5mby5mblxyXG5cclxuXHR2YXIgcmV0ID0gJCQuZXh0cmFjdChpbmZvLCAnZGVwcyxvcHRpb25zLGxpYicpXHJcblxyXG5cdGlmICh0eXBlb2YgaW5mby5ldmVudHMgPT0gJ3N0cmluZycpIHtcclxuXHRcdHJldC5ldmVudHMgPSBpbmZvLmV2ZW50cy5zcGxpdCgnLCcpXHJcblx0fVxyXG5cclxuXHR2YXIgcHJvcHMgPSB7fVxyXG5cdGZvcih2YXIgayBpbiBpbmZvLnByb3BzKSB7XHJcblx0XHRwcm9wc1trXSA9IGluZm8ucHJvcHNba10udmFsXHJcblx0fVxyXG5cdGlmIChPYmplY3Qua2V5cyhwcm9wcykubGVuZ3RoICE9IDApIHtcclxuXHRcdHJldC5wcm9wcyA9IHByb3BzXHJcblx0fVxyXG5cdGlmICh0eXBlb2YgaW5mby5pZmFjZSA9PSAnc3RyaW5nJykge1xyXG5cdFx0cmV0LmlmYWNlID0gaW5mby5pZmFjZS5zcGxpdCgnOycpXHJcblx0fVxyXG5cdHJldHVybiByZXRcclxuXHQvL3JldHVybiBjb250cm9sc1tjb250cm9sTmFtZV0uZm5cclxufVxyXG5cclxuXHJcbiQkLmdldENvbnRyb2xzVHJlZSA9IGZ1bmN0aW9uKHNob3dXaGF0KSB7XHJcblx0c2hvd1doYXQgPSBzaG93V2hhdCB8fCAnJ1xyXG5cdHZhciBzaG93T3B0aW9ucyA9IHNob3dXaGF0LnNwbGl0KCcsJylcclxuXHR2YXIgdHJlZSA9IFtdXHJcblx0JCgnLkN1c3RvbUNvbnRyb2wnKS5lYWNoKGZ1bmN0aW9uKCkge1xyXG5cdFx0dmFyIGlmYWNlID0gJCh0aGlzKS5pbnRlcmZhY2UoKVxyXG5cclxuXHRcdHZhciBpdGVtID0ge25hbWU6aWZhY2UubmFtZSwgZWx0OiAkKHRoaXMpLCBwYXJlbnQ6IG51bGx9XHJcblx0XHRpdGVtLmlkID0gJCh0aGlzKS5hdHRyKCdpZCcpXHJcblxyXG5cdFx0aWYgKHR5cGVvZiBpZmFjZS5ldmVudHMgPT0gJ3N0cmluZycgJiZcclxuXHRcdFx0KChzaG93T3B0aW9ucy5pbmRleE9mKCdldmVudHMnKSA+PSAwIHx8IHNob3dXaGF0ID09PSAnYWxsJykpKSB7XHJcblx0XHRcdGl0ZW0uZXZlbnRzID0gaWZhY2UuZXZlbnRzLnNwbGl0KCcsJylcclxuXHRcdH1cdFx0XHRcclxuXHJcblx0XHR0cmVlLnB1c2goaXRlbSlcclxuXHJcblx0XHRpZiAoc2hvd09wdGlvbnMuaW5kZXhPZignaWZhY2UnKSA+PSAwIHx8IHNob3dXaGF0ID09PSAnYWxsJykge1xyXG5cclxuXHRcdFx0dmFyIGZ1bmMgPSBbXVxyXG5cdFx0XHRmb3IodmFyIGsgaW4gaWZhY2UpIHtcclxuXHRcdFx0XHRpZiAodHlwZW9mIGlmYWNlW2tdID09ICdmdW5jdGlvbicgJiYgayAhPSAncHJvcHMnICYmIGsgIT0gJ3NldFByb3AnKSB7XHJcblx0XHRcdFx0XHRmdW5jLnB1c2goaylcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKGZ1bmMubGVuZ3RoICE9IDApIHtcclxuXHRcdFx0XHRpdGVtLmlmYWNlID0gZnVuY1xyXG5cdFx0XHR9XHRcdFx0XHRcclxuXHRcdH1cclxuXHJcblxyXG5cclxuXHRcdGlmICh0eXBlb2YgaWZhY2UucHJvcHMgPT0gJ2Z1bmN0aW9uJyAmJiBcclxuXHRcdFx0KChzaG93T3B0aW9ucy5pbmRleE9mKCdwcm9wcycpID49IDAgfHwgc2hvd1doYXQgPT09ICdhbGwnKSkpIHtcclxuXHRcdFx0aXRlbS5wcm9wcyA9IGlmYWNlLnByb3BzKClcclxuXHRcdH1cclxuXHJcblx0XHRpZiAodHlwZW9mIGlmYWNlLmdldFZhbHVlID09ICdmdW5jdGlvbicgJiZcclxuXHRcdFx0KChzaG93T3B0aW9ucy5pbmRleE9mKCd2YWx1ZScpID49IDAgfHwgc2hvd1doYXQgPT09ICdhbGwnKSkpIHtcclxuXHRcdFx0aXRlbS52YWx1ZSA9IGlmYWNlLmdldFZhbHVlKClcclxuXHRcdH1cclxuXHJcblx0XHRpZiAodHlwZW9mIGlmYWNlLm9wdGlvbnMgPT0gJ29iamVjdCcgJiYgT2JqZWN0LmtleXMoaWZhY2Uub3B0aW9ucykubGVuZ3RoICE9IDAgJiZcclxuXHRcdFx0KChzaG93T3B0aW9ucy5pbmRleE9mKCdvcHRpb25zJykgPj0gMCB8fCBzaG93V2hhdCA9PT0gJ2FsbCcpKSkge1xyXG5cdFx0XHRpdGVtLm9wdGlvbnMgPSBpZmFjZS5vcHRpb25zXHJcblx0XHR9XHRcclxuXHJcblx0XHRcdFx0XHRcclxuXHRcdC8vY29uc29sZS5sb2coJ25hbWUnLCBuYW1lKVxyXG5cdFx0aXRlbS5jaGlsZHMgPSBbXVxyXG5cclxuXHJcblx0XHR2YXIgcGFyZW50cyA9ICQodGhpcykucGFyZW50cygnLkN1c3RvbUNvbnRyb2wnKVxyXG5cdFx0Ly9jb25zb2xlLmxvZygncGFyZW50cycsIHBhcmVudHMpXHJcblx0XHRpZiAocGFyZW50cy5sZW5ndGggIT0gMCkge1xyXG5cdFx0XHR2YXIgcGFyZW50ID0gcGFyZW50cy5lcSgwKVxyXG5cdFx0XHRpdGVtLnBhcmVudCA9IHBhcmVudFxyXG5cdFx0XHR0cmVlLmZvckVhY2goZnVuY3Rpb24oaSkge1xyXG5cdFx0XHRcdGlmIChpLmVsdC5nZXQoMCkgPT0gcGFyZW50LmdldCgwKSkge1xyXG5cdFx0XHRcdFx0aS5jaGlsZHMucHVzaChpdGVtKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSlcclxuXHRcdFx0XHJcblxyXG5cdFx0fVxyXG5cdH0pXHJcblx0Ly9jb25zb2xlLmxvZygndHJlZScsIHRyZWUpXHJcblxyXG5cdHZhciByZXQgPSBbXVxyXG5cdHRyZWUuZm9yRWFjaChmdW5jdGlvbihpKSB7XHJcblx0XHRpZiAoaS5wYXJlbnQgPT0gbnVsbCkge1xyXG5cdFx0XHRyZXQucHVzaChpKVxyXG5cdFx0fVxyXG5cdFx0aWYgKGkuY2hpbGRzLmxlbmd0aCA9PSAwKSB7XHJcblx0XHRcdGRlbGV0ZSBpLmNoaWxkc1xyXG5cdFx0fVxyXG5cdFx0ZGVsZXRlIGkucGFyZW50XHJcblx0XHRkZWxldGUgaS5lbHRcclxuXHR9KVxyXG5cclxuXHRyZXR1cm4gSlNPTi5zdHJpbmdpZnkocmV0LCBudWxsLCA0KVxyXG5cclxufVxyXG5cclxufSkoKTtcclxuIiwiKGZ1bmN0aW9uKCl7XHJcblxyXG52YXIgcmVnaXN0ZXJlZE9iamVjdHMgPSB7XHJcblx0c2VydmljZXM6IHt9XHJcbn1cclxuXHJcbnZhciB7c2VydmljZXN9ID0gcmVnaXN0ZXJlZE9iamVjdHNcclxuXHJcbmZ1bmN0aW9uIGlzRGVwc09rKGRlcHMpIHtcclxuXHRyZXR1cm4gZGVwcy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XHJcblxyXG5cdFx0cmV0dXJuIHByZXYgJiYgKGN1ciAhPSB1bmRlZmluZWQpXHJcblx0fSwgdHJ1ZSlcdFx0XHJcbn1cclxuXHJcbiQkLmdldE9iamVjdERvbWFpbiA9IGZ1bmN0aW9uKGRvbWFpbikge1xyXG5cdHJldHVybiByZWdpc3RlcmVkT2JqZWN0c1tkb21haW5dXHJcbn1cclxuXHJcbiQkLnJlZ2lzdGVyT2JqZWN0ID0gZnVuY3Rpb24oZG9tYWluLCBuYW1lLCBhcmcxLCBhcmcyKSB7XHJcblx0dmFyIGRlcHMgPSBbXVxyXG5cdHZhciBmbiA9IGFyZzFcclxuXHRpZiAoQXJyYXkuaXNBcnJheShhcmcxKSkge1xyXG5cdFx0ZGVwcyA9IGFyZzFcclxuXHRcdGZuID0gYXJnMlxyXG5cdH1cclxuXHRpZiAodHlwZW9mIGRvbWFpbiAhPSAnc3RyaW5nJyB8fCB0eXBlb2YgbmFtZSAhPSAnc3RyaW5nJyB8fCB0eXBlb2YgZm4gPT0gJ3VuZGVmaW5lZCcgfHwgIUFycmF5LmlzQXJyYXkoZGVwcykpIHtcclxuXHRcdHRocm93KCdbQ29yZV0gcmVnaXN0ZXJPYmplY3QgY2FsbGVkIHdpdGggYmFkIGFyZ3VtZW50cycpXHJcblx0fSBcclxuXHRjb25zb2xlLmxvZyhgW0NvcmVdIHJlZ2lzdGVyIG9iamVjdCAnJHtkb21haW59OiR7bmFtZX0nIHdpdGggZGVwc2AsIGRlcHMpXHJcblx0aWYgKHJlZ2lzdGVyZWRPYmplY3RzW2RvbWFpbl0gPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRyZWdpc3RlcmVkT2JqZWN0c1tkb21haW5dID0ge31cclxuXHR9XHJcblx0cmVnaXN0ZXJlZE9iamVjdHNbZG9tYWluXVtuYW1lXSA9IHtkZXBzOiBkZXBzLCBmbiA6Zm4sIHN0YXR1czogJ25vdGxvYWRlZCd9XHJcbn1cdFxyXG5cclxuJCQuZ2V0T2JqZWN0ID0gZnVuY3Rpb24oZG9tYWluLCBuYW1lKSB7XHJcblx0Ly9jb25zb2xlLmxvZyhgW0NvcmVdIGdldE9iamVjdCAke2RvbWFpbn06JHtuYW1lfWApXHJcblx0dmFyIGRvbWFpbiA9IHJlZ2lzdGVyZWRPYmplY3RzW2RvbWFpbl1cclxuXHR2YXIgcmV0ID0gZG9tYWluICYmIGRvbWFpbltuYW1lXVxyXG5cdGlmIChyZXQgJiYgcmV0LnN0YXR1cyA9PSAnbm90bG9hZGVkJykge1xyXG5cdFx0cmV0LmRlcHMgPSAkJC5nZXRTZXJ2aWNlcyhyZXQuZGVwcylcclxuXHRcdHJldC5zdGF0dXMgPSBpc0RlcHNPayhyZXQuZGVwcykgPyAnb2snIDogJ2tvJ1xyXG5cdH1cclxuXHRyZXR1cm4gcmV0XHJcbn1cclxuXHJcbiQkLmdldFNlcnZpY2VzID0gZnVuY3Rpb24oZGVwcykge1xyXG5cdC8vY29uc29sZS5sb2coJ1tDb3JlXSBnZXRTZXJ2aWNlcycsIGRlcHMpXHJcblx0cmV0dXJuIGRlcHMubWFwKGZ1bmN0aW9uKGRlcE5hbWUpIHtcclxuXHRcdHZhciBzcnYgPSBzZXJ2aWNlc1tkZXBOYW1lXVxyXG5cdFx0aWYgKHNydikge1xyXG5cdFx0XHRpZiAoc3J2LnN0YXR1cyA9PSAnbm90bG9hZGVkJykge1xyXG5cdFx0XHRcdHZhciBkZXBzMiA9ICQkLmdldFNlcnZpY2VzKHNydi5kZXBzKVxyXG5cdFx0XHRcdHZhciBjb25maWcgPSBzcnYuY29uZmlnIHx8IHt9XHJcblx0XHRcdFx0Y29uc29sZS5sb2coYFtDb3JlXSBpbnN0YW5jZSBzZXJ2aWNlICcke2RlcE5hbWV9JyB3aXRoIGNvbmZpZ2AsIGNvbmZpZylcclxuXHRcdFx0XHR2YXIgYXJncyA9IFtjb25maWddLmNvbmNhdChkZXBzMilcclxuXHRcdFx0XHRzcnYub2JqID0gc3J2LmZuLmFwcGx5KG51bGwsIGFyZ3MpXHJcblx0XHRcdFx0c3J2LnN0YXR1cyA9ICdyZWFkeSdcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gc3J2Lm9ialx0XHRcdFx0XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0Ly9zcnYuc3RhdHVzID0gJ25vdHJlZ2lzdGVyZWQnXHJcblx0XHRcdHRocm93KGBbQ29yZV0gc2VydmljZSAnJHtkZXBOYW1lfScgaXMgbm90IHJlZ2lzdGVyZWRgKVxyXG5cdFx0fVxyXG5cclxuXHR9KVxyXG59XHJcblxyXG5cclxuXHJcbiQkLmNvbmZpZ3VyZVNlcnZpY2UgPSBmdW5jdGlvbihuYW1lLCBjb25maWcpIHtcclxuXHRjb25zb2xlLmxvZygnW0NvcmVdIGNvbmZpZ3VyZVNlcnZpY2UnLCBuYW1lLCBjb25maWcpXHJcblx0aWYgKHR5cGVvZiBuYW1lICE9ICdzdHJpbmcnIHx8IHR5cGVvZiBjb25maWcgIT0gJ29iamVjdCcpIHtcclxuXHRcdGNvbnNvbGUud2FybignW0NvcmVdIGNvbmZpZ3VyZVNlcnZpY2UgY2FsbGVkIHdpdGggYmFkIGFyZ3VtZW50cycpXHJcblx0XHRyZXR1cm5cclxuXHR9IFx0XHJcblxyXG5cdHZhciBzcnYgPSBzZXJ2aWNlc1tuYW1lXVxyXG5cdGlmIChzcnYpIHtcclxuXHRcdHNydi5jb25maWcgPSBjb25maWdcclxuXHR9XHJcblx0ZWxzZSB7XHJcblx0XHR0aHJvdyhgW2NvbmZpZ3VyZVNlcnZpY2VdIHNlcnZpY2UgJyR7bmFtZX0nIGlzIG5vdCByZWdpc3RlcmVkYClcclxuXHR9XHJcblxyXG59XHJcblxyXG4kJC5yZWdpc3RlclNlcnZpY2UgPSBmdW5jdGlvbihuYW1lLCBhcmcxLCBhcmcyKSB7XHJcblx0JCQucmVnaXN0ZXJPYmplY3QoJ3NlcnZpY2VzJywgbmFtZSwgYXJnMSwgYXJnMilcclxufVxyXG5cclxuJCQuZ2V0UmVnaXN0ZXJlZFNlcnZpY2VzID0gZnVuY3Rpb24oKSB7XHJcblx0dmFyIHJldCA9IFtdXHJcblx0Zm9yKHZhciBrIGluIHNlcnZpY2VzKSB7XHJcblx0XHR2YXIgaW5mbyA9IHNlcnZpY2VzW2tdXHJcblx0XHRyZXQucHVzaCh7bmFtZTogaywgc3RhdHVzOiBpbmZvLnN0YXR1c30pXHJcblx0fVxyXG5cdHJldHVybiByZXRcclxufVxyXG5cclxuXHJcbn0pKCk7IiwiJCQuZGlhbG9nQ29udHJvbGxlciA9IGZ1bmN0aW9uKHRpdGxlLCBvcHRpb25zKSB7XHJcblx0dmFyIGRpdiA9ICQoJzxkaXY+Jywge3RpdGxlOiB0aXRsZX0pXHJcblxyXG5cdHZhciBjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoZGl2LCBvcHRpb25zKVxyXG5cdGRpdi5kaWFsb2coe1xyXG5cdFx0YXV0b09wZW46IGZhbHNlLFxyXG5cdFx0bW9kYWw6IHRydWUsXHJcblx0XHR3aWR0aDogJ2F1dG8nLFxyXG5cdFx0YnV0dG9uczoge1xyXG5cdFx0XHQnQ2FuY2VsJzogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0JCh0aGlzKS5kaWFsb2coJ2Nsb3NlJylcclxuXHRcdFx0fSxcclxuXHRcdFx0J0FwcGx5JzogZnVuY3Rpb24oKSB7XHRcdFx0XHRcdFxyXG5cdFx0XHRcdCQodGhpcykuZGlhbG9nKCdjbG9zZScpXHJcblx0XHRcdFx0aWYgKHR5cGVvZiBvcHRpb25zLm9uQXBwbHkgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdFx0b3B0aW9ucy5vbkFwcGx5LmNhbGwoY3RybClcclxuXHRcdFx0XHR9XHRcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH0pXHJcblx0Y3RybC5zaG93ID0gZnVuY3Rpb24oKSB7XHJcblx0XHRkaXYuZGlhbG9nKCdvcGVuJylcclxuXHR9XHJcblx0cmV0dXJuIGN0cmxcclxufTtcclxuXHJcbiIsIiQkLmZvcm1EaWFsb2dDb250cm9sbGVyID0gZnVuY3Rpb24odGl0bGUsIG9wdGlvbnMpIHtcclxuXHR2YXIgZGl2ID0gJCgnPGRpdj4nLCB7dGl0bGU6IHRpdGxlfSlcclxuXHR2YXIgZm9ybSA9ICQoJzxmb3JtPicpXHJcblx0XHQuYXBwZW5kVG8oZGl2KVxyXG5cdFx0Lm9uKCdzdWJtaXQnLCBmdW5jdGlvbihldikge1xyXG5cdFx0XHRldi5wcmV2ZW50RGVmYXVsdCgpXHJcblx0XHRcdGRpdi5kaWFsb2coJ2Nsb3NlJylcclxuXHRcdFx0aWYgKHR5cGVvZiBvcHRpb25zLm9uQXBwbHkgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdG9wdGlvbnMub25BcHBseS5jYWxsKGN0cmwsIGN0cmwuZWx0LmdldEZvcm1EYXRhKCkpXHJcblx0XHRcdH1cdFx0XHRcdFxyXG5cdFx0fSlcclxuXHR2YXIgc3VibWl0QnRuID0gJCgnPGlucHV0PicsIHt0eXBlOiAnc3VibWl0JywgaGlkZGVuOiB0cnVlfSkuYXBwZW5kVG8oZm9ybSlcclxuXHJcblx0dmFyIGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihmb3JtLCBvcHRpb25zKVxyXG5cdGRpdi5kaWFsb2coe1xyXG5cdFx0YXV0b09wZW46IGZhbHNlLFxyXG5cdFx0bW9kYWw6IHRydWUsXHJcblx0XHR3aWR0aDogJ2F1dG8nLFxyXG5cdFx0Y2xvc2U6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHQvLyQodGhpcykuZGlhbG9nKCdkZXN0cm95JylcclxuXHRcdH0sXHJcblx0XHRidXR0b25zOiB7XHJcblx0XHRcdCdDYW5jZWwnOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHQkKHRoaXMpLmRpYWxvZygnY2xvc2UnKVxyXG5cdFx0XHR9LFxyXG5cdFx0XHQnQXBwbHknOiBmdW5jdGlvbigpIHtcdFx0XHRcdFx0XHJcblx0XHRcdFx0c3VibWl0QnRuLmNsaWNrKClcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH0pXHJcblx0Y3RybC5zaG93ID0gZnVuY3Rpb24oZGF0YSwgb25BcHBseSkge1xyXG5cdFx0aWYgKHR5cGVvZiBjdHJsLmJlZm9yZVNob3cgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRjdHJsLmJlZm9yZVNob3coKVxyXG5cdFx0fVxyXG5cdFx0b3B0aW9ucy5vbkFwcGx5ID0gb25BcHBseVxyXG5cdFx0Y3RybC5lbHQuc2V0Rm9ybURhdGEoZGF0YSlcclxuXHRcdGRpdi5kaWFsb2coJ29wZW4nKVxyXG5cdH1cclxuXHJcblx0cmV0dXJuIGN0cmxcclxufTtcclxuIiwiKGZ1bmN0aW9uKCl7XHJcblxyXG5cclxuXHJcbmNsYXNzIFZpZXdDb250cm9sbGVyIHtcclxuICAgIGNvbnN0cnVjdG9yKGVsdCwgb3B0aW9ucykge1xyXG4gICAgXHQvL2NvbnNvbGUubG9nKCdWaWV3Q29udHJvbGxlcicsIG9wdGlvbnMpXHJcbiAgICBcdGlmICh0eXBlb2YgZWx0ID09ICdzdHJpbmcnKSB7XHJcbiAgICBcdFx0ZWx0ID0gJChlbHQpXHJcbiAgICBcdH1cclxuXHJcbiAgICBcdG9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgb3B0aW9ucylcclxuICAgICAgICB0aGlzLmVsdCA9IGVsdFxyXG5cclxuICAgICAgICB0aGlzLmVsdC5vbignZGF0YTp1cGRhdGUnLCAoZXYsIG5hbWUsIHZhbHVlLCBleGNsdWRlRWx0KSA9PiB7XHJcbiAgICAgICAgXHQvL2NvbnNvbGUubG9nKCdbVmlld0NvbnRyb2xsZXJdIGRhdGE6Y2hhbmdlJywgbmFtZSwgdmFsdWUpXHJcbiAgICAgICAgXHR0aGlzLnNldERhdGEobmFtZSwgdmFsdWUsIGV4Y2x1ZGVFbHQpXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnRlbXBsYXRlID09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgXHR0aGlzLmVsdCA9ICQob3B0aW9ucy50ZW1wbGF0ZSkuYXBwZW5kVG8oZWx0KVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLm1vZGVsID0gJC5leHRlbmQoe30sIG9wdGlvbnMuZGF0YSlcclxuICAgICAgICB0aGlzLnJ1bGVzID0gJC5leHRlbmQoe30sIG9wdGlvbnMucnVsZXMpXHJcbiAgICAgICAgdGhpcy53YXRjaGVzID0gJC5leHRlbmQoe30sIG9wdGlvbnMud2F0Y2hlcylcclxuXHJcbiAgICAgICAgLy8gZ2VuZXJhdGUgYXV0b21hdGljIHJ1bGVzIGZvciBjb21wdXRlZCBkYXRhIChha2EgZnVuY3Rpb24pXHJcbiAgICAgICAgZm9yKHZhciBrIGluIHRoaXMubW9kZWwpIHtcclxuICAgICAgICBcdHZhciBkYXRhID0gdGhpcy5tb2RlbFtrXVxyXG4gICAgICAgIFx0aWYgKHR5cGVvZiBkYXRhID09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICBcdFx0dmFyIGZ1bmNUZXh0ID0gZGF0YS50b1N0cmluZygpXHJcbiAgICAgICAgXHRcdC8vY29uc29sZS5sb2coJ2Z1bmNUZXh0JywgZnVuY1RleHQpXHJcbiAgICAgICAgXHRcdHZhciBydWxlcyA9IFtdXHJcbiAgICAgICAgXHRcdGZ1bmNUZXh0LnJlcGxhY2UoL3RoaXMuKFthLXpBLVowLTlfLV17MSx9KS9nLCBmdW5jdGlvbihtYXRjaCwgY2FwdHVyZU9uZSkge1xyXG4gICAgICAgIFx0XHRcdC8vY29uc29sZS5sb2coJ2NhcHR1cmVPbmUnLCBjYXB0dXJlT25lKVxyXG4gICAgICAgIFx0XHRcdHJ1bGVzLnB1c2goY2FwdHVyZU9uZSlcclxuICAgICAgICBcdFx0fSlcclxuICAgICAgICBcdFx0dGhpcy5ydWxlc1trXSA9IHJ1bGVzLnRvU3RyaW5nKClcclxuICAgICAgICBcdH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vY29uc29sZS5sb2coJ3J1bGVzJywgdGhpcy5ydWxlcylcclxuICAgICAgICB0aGlzLmRpckxpc3QgPSB0aGlzLmVsdC5wcm9jZXNzVUkodGhpcy5tb2RlbClcclxuXHJcblxyXG4gICAgICAgIC8vdGhpcy5lbHQucHJvY2Vzc1VJKHRoaXMubW9kZWwpXHJcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmV2ZW50cyA9PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICB0aGlzLmVsdC5wcm9jZXNzRXZlbnRzKG9wdGlvbnMuZXZlbnRzKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5zY29wZSA9IHRoaXMuZWx0LnByb2Nlc3NCaW5kaW5ncygpXHJcbiAgICAgICAgLy9jb25zb2xlLmxvZygnc2NvcGUnLCB0aGlzLnNjb3BlKVxyXG4gICAgICAgXHJcbiAgICAgICAgdmFyIGluaXQgPSBvcHRpb25zLmluaXRcclxuICAgICAgICBpZiAodHlwZW9mIGluaXQgPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIFx0aW5pdC5jYWxsKHRoaXMpXHJcbiAgICAgICAgfVxyXG4gICAgfSBcclxuXHJcbiAgICBzZXREYXRhKGFyZzEsIGFyZzIsIGV4Y2x1ZGVFbHQpIHtcclxuICAgICAgICAvL2NvbnNvbGUubG9nKCdbVmlld0NvbnRyb2xsZXJdIHNldERhdGEnLCBhcmcxLCBhcmcyKVxyXG4gICAgICAgIHZhciBkYXRhID0gYXJnMVxyXG4gICAgICAgIGlmICh0eXBlb2YgYXJnMSA9PSAnc3RyaW5nJykge1xyXG4gICAgICAgIFx0ZGF0YSA9IHt9XHJcbiAgICAgICAgXHRkYXRhW2FyZzFdID0gYXJnMlxyXG4gICAgICAgIH1cclxuICAgICAgICAvL2NvbnNvbGUubG9nKCdbVmlld0NvbnRyb2xsZXJdIHNldERhdGEnLCBkYXRhKVxyXG4gICAgICAgICQuZXh0ZW5kKHRoaXMubW9kZWwsIGRhdGEpXHJcbiAgICAgICAgLy9jb25zb2xlLmxvZygnbW9kZWwnLCB0aGlzLm1vZGVsKVxyXG4gICAgICAgIHRoaXMudXBkYXRlKE9iamVjdC5rZXlzKGRhdGEpLCBleGNsdWRlRWx0KVxyXG4gICAgfVxyXG5cclxuICAgIHVwZGF0ZShmaWVsZHNOYW1lLCBleGNsdWRlRWx0KSB7XHJcbiAgICBcdC8vY29uc29sZS5sb2coJ1tWaWV3Q29udHJvbGxlcl0gdXBkYXRlJywgZmllbGRzTmFtZSlcclxuICAgIFx0aWYgKHR5cGVvZiBmaWVsZHNOYW1lID09ICdzdHJpbmcnKSB7XHJcbiAgICBcdFx0ZmllbGRzTmFtZSA9IGZpZWxkc05hbWUuc3BsaXQoJywnKVxyXG4gICAgXHR9XHJcblxyXG5cclxuICAgIFx0aWYgKEFycmF5LmlzQXJyYXkoZmllbGRzTmFtZSkpIHtcclxuICAgIFx0XHR2YXIgZmllbGRzU2V0ID0ge31cclxuICAgIFx0XHRmaWVsZHNOYW1lLmZvckVhY2goKGZpZWxkKSA9PiB7XHJcblxyXG4gICAgXHRcdFx0dmFyIHdhdGNoID0gdGhpcy53YXRjaGVzW2ZpZWxkXVxyXG4gICAgXHRcdFx0aWYgKHR5cGVvZiB3YXRjaCA9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICBcdFx0XHRcdHdhdGNoLmNhbGwobnVsbCwgdGhpcy5tb2RlbFtmaWVsZF0pXHJcbiAgICBcdFx0XHR9XHJcbiAgICBcdFx0XHRmaWVsZHNTZXRbZmllbGRdID0gMVxyXG5cclxuICAgIFx0XHRcdGZvcih2YXIgcnVsZSBpbiB0aGlzLnJ1bGVzKSB7XHJcbiAgICBcdFx0XHRcdGlmICh0aGlzLnJ1bGVzW3J1bGVdLnNwbGl0KCcsJykuaW5kZXhPZihmaWVsZCkgIT0gLTEpIHtcclxuICAgIFx0XHRcdFx0XHRmaWVsZHNTZXRbcnVsZV0gPSAxXHJcbiAgICBcdFx0XHRcdH1cclxuICAgIFx0XHRcdH1cclxuICAgIFx0XHR9KVxyXG5cclxuXHJcbiAgICBcdFx0dGhpcy5lbHQudXBkYXRlVGVtcGxhdGUodGhpcy5kaXJMaXN0LCB0aGlzLm1vZGVsLCBPYmplY3Qua2V5cyhmaWVsZHNTZXQpLCBleGNsdWRlRWx0KVxyXG4gICAgXHR9XHJcblxyXG4gICAgfVxyXG59XHJcblxyXG5cclxuICAgICQkLnZpZXdDb250cm9sbGVyID0gZnVuY3Rpb24gKGVsdCwgb3B0aW9ucykge1xyXG4gICAgICAgIHJldHVybiBuZXcgVmlld0NvbnRyb2xsZXIoZWx0LCBvcHRpb25zKVxyXG4gICAgfVxyXG5cclxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdCQuZm4ucHJvY2Vzc0JpbmRpbmdzID0gZnVuY3Rpb24oKSB7XHJcblxyXG5cdFx0dmFyIGRhdGEgPSB7fVxyXG5cclxuXHRcdHRoaXMuYm5GaW5kKCdibi1iaW5kJywgdHJ1ZSwgZnVuY3Rpb24oZWx0LCB2YXJOYW1lKSB7XHJcblx0XHRcdC8vY29uc29sZS5sb2coJ2JuLXRleHQnLCB2YXJOYW1lKVxyXG5cdFx0XHRkYXRhW3Zhck5hbWVdID0gZWx0XHJcblx0XHR9KVxyXG5cdFx0dGhpcy5ibkZpbmQoJ2JuLWlmYWNlJywgdHJ1ZSwgZnVuY3Rpb24oZWx0LCB2YXJOYW1lKSB7XHJcblx0XHRcdC8vY29uc29sZS5sb2coJ2JuLXRleHQnLCB2YXJOYW1lKVxyXG5cdFx0XHRkYXRhW3Zhck5hbWVdID0gZWx0LmludGVyZmFjZSgpXHJcblx0XHR9KVxyXG5cdFx0cmV0dXJuIGRhdGFcclxuXHRcclxuXHR9XHJcblxyXG59KSgpOyIsIihmdW5jdGlvbigpIHtcclxuXHRcclxuXHJcblxyXG5cdCQuZm4uZ2V0UGFyZW50SW50ZXJmYWNlID0gZnVuY3Rpb24ocGFyZW50Q3RybE5hbWUpIHtcclxuXHRcdHZhciBwYXJlbnQgPSB0aGlzLnBhcmVudCgpXHJcblx0XHRpZiAoIXBhcmVudC5oYXNDbGFzcyhwYXJlbnRDdHJsTmFtZSkpIHtcclxuXHRcdFx0cmV0dXJuXHJcblx0XHR9XHJcblx0XHRyZXR1cm4gcGFyZW50LmludGVyZmFjZSgpXHRcdFxyXG5cdH1cclxuXHJcblx0JC5mbi5wcm9jZXNzQ29udHJvbHMgPSBmdW5jdGlvbiggZGF0YSkge1xyXG5cclxuXHRcdGRhdGEgPSBkYXRhIHx8IHt9XHJcblxyXG5cdFx0dGhpcy5ibkZpbHRlcignW2JuLWNvbnRyb2xdJykuZWFjaChmdW5jdGlvbigpIHtcclxuXHRcdFx0dmFyIGVsdCA9ICQodGhpcylcclxuXHJcblx0XHRcdHZhciBjb250cm9sTmFtZSA9IGVsdC5hdHRyKCdibi1jb250cm9sJylcclxuXHRcdFx0ZWx0LnJlbW92ZUF0dHIoJ2JuLWNvbnRyb2wnKVxyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdjb250cm9sTmFtZScsIGNvbnRyb2xOYW1lKVxyXG5cclxuXHJcblxyXG5cdFx0XHQkJC5jcmVhdGVDb250cm9sKGNvbnRyb2xOYW1lLCBlbHQpXHJcblx0XHR9KVxyXG5cclxuXHRcdHJldHVybiB0aGlzXHJcblxyXG5cdH1cdFxyXG5cclxuXHQkLmZuLmludGVyZmFjZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0cmV0dXJuICh0aGlzLmxlbmd0aCA9PSAwKSA/IG51bGwgOiB0aGlzLmdldCgwKS5jdHJsXHJcblx0fVxyXG5cclxuXHQkLmZuLmRpc3Bvc2UgPSBmdW5jdGlvbigpIHtcclxuXHRcdGNvbnNvbGUubG9nKCdbQ29yZV0gZGlzcG9zZScpXHJcblx0XHR0aGlzLmZpbmQoJy5DdXN0b21Db250cm9sJykuZWFjaChmdW5jdGlvbigpIHtcdFx0XHJcblx0XHRcdHZhciBpZmFjZSA9ICQodGhpcykuaW50ZXJmYWNlKClcclxuXHRcdFx0aWYgKHR5cGVvZiBpZmFjZSA9PSAnb2JqZWN0JyAmJiB0eXBlb2YgaWZhY2UuZGlzcG9zZSA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0aWZhY2UuZGlzcG9zZSgpXHJcblx0XHRcdH1cclxuXHRcdFx0ZGVsZXRlICQodGhpcykuZ2V0KDApLmN0cmxcclxuXHRcdH0pXHJcblx0XHRyZXR1cm4gdGhpc1xyXG5cdH1cclxuXHJcbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1xyXG5cclxuXHQkLmZuLnByb2Nlc3NFdmVudHMgPSBmdW5jdGlvbihkYXRhKSB7XHJcblx0XHQvL2NvbnNvbGUubG9nKCdwcm9jZXNzRXZlbnRzJywgZGF0YSlcclxuXHRcdGlmICh0eXBlb2YgZGF0YSAhPSAnb2JqZWN0Jykge1xyXG5cdFx0XHRjb25zb2xlLmVycm9yKGBbY29yZV0gcHJvY2Vzc0V2ZW50cyBjYWxsZWQgd2l0aCBiYWQgcGFyYW1ldGVyICdkYXRhJyAobXVzdCBiZSBhbiBvYmplY3QpOmAsIGRhdGEpXHJcblx0XHRcdHJldHVyblxyXG5cdFx0fVxyXG5cdFx0dGhpcy5ibkZpbmRFeCgnYm4tZXZlbnQnLCB0cnVlLCBmdW5jdGlvbihlbHQsIGF0dHJOYW1lLCB2YXJOYW1lKSB7XHJcblx0XHRcdC8vY29uc29sZS5sb2coJ2JuLWV2ZW50JywgYXR0ck5hbWUsIHZhck5hbWUpXHJcblx0XHRcdHZhciBmID0gYXR0ck5hbWUuc3BsaXQoJy4nKVxyXG5cdFx0XHR2YXIgZXZlbnROYW1lID0gZlswXVxyXG5cdFx0XHR2YXIgc2VsZWN0b3IgPSBmWzFdXHJcblxyXG5cdFx0XHR2YXIgZm4gPSBkYXRhW3Zhck5hbWVdXHJcblx0XHRcdGlmICh0eXBlb2YgZm4gPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdHZhciBpZmFjZSA9IGVsdC5pbnRlcmZhY2UoKVxyXG5cdFx0XHRcdGlmIChpZmFjZSAmJiB0eXBlb2YgaWZhY2Uub24gPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdFx0aWZhY2Uub24oZXZlbnROYW1lLCBmbi5iaW5kKGlmYWNlKSlcclxuXHRcdFx0XHRcdHJldHVyblxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0dmFyIHVzZU5hdGl2ZUV2ZW50cyA9IFsnbW91c2VlbnRlcicsICdtb3VzZWxlYXZlJ10uaW5kZXhPZihldmVudE5hbWUpICE9IC0xXHJcblxyXG5cdFx0XHRcdGlmIChzZWxlY3RvciAhPSB1bmRlZmluZWQpIHtcclxuXHJcblx0XHRcdFx0XHRpZiAodXNlTmF0aXZlRXZlbnRzKSB7XHJcblx0XHRcdFx0XHRcdGVsdC5nZXQoMCkuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGZ1bmN0aW9uKGV2KSB7XHJcblx0XHRcdFx0XHRcdFx0dmFyIHRhcmdldCA9ICQoZXYudGFyZ2V0KVxyXG5cdFx0XHRcdFx0XHRcdGlmICh0YXJnZXQuaGFzQ2xhc3Moc2VsZWN0b3IpKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRmbi5jYWxsKGV2LnRhcmdldCwgZXYpXHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFx0fSlcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdFx0ZWx0Lm9uKGV2ZW50TmFtZSwgJy4nICsgc2VsZWN0b3IsIGZuKVxyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHRpZiAodXNlTmF0aXZlRXZlbnRzKSB7XHJcblx0XHRcdFx0XHRcdGVsdC5nZXQoMCkuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGZ1bmN0aW9uKGV2KSB7XHJcblx0XHRcdFx0XHRcdFx0XHRmbi5jYWxsKGV2LnRhcmdldCwgZXYpXHJcblx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHRcdGVsdC5vbihldmVudE5hbWUsIGZuKVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cdFx0XHRcdFxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdGNvbnNvbGUud2FybihgW0NvcmVdIHByb2Nlc3NFdmVudHM6IHZhcmlhYmxlICcke3Zhck5hbWV9JyBpcyBub3QgYSBmdW5jdGlvbiBkZWZpbmVkIGluIGRhdGFgLCBkYXRhKVxyXG5cdFx0XHR9XHRcdFxyXG5cdFx0fSlcclxuXHRcdHJldHVybiB0aGlzXHJcblx0XHJcblx0fVxyXG5cclxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdCQuZm4uZ2V0VmFsdWUgPSBmdW5jdGlvbigpIHtcclxuXHRcdHZhciB0eXBlID0gdGhpcy5hdHRyKCd0eXBlJylcclxuXHRcdGlmICh0aGlzLmdldCgwKS50YWdOYW1lID09ICdJTlBVVCcgJiYgdHlwZSA9PSAnY2hlY2tib3gnKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLnByb3AoJ2NoZWNrZWQnKVxyXG5cdFx0fVxyXG5cdFx0dmFyIGlmYWNlID0gdGhpcy5pbnRlcmZhY2UoKVxyXG5cdFx0aWYgKGlmYWNlICYmIHR5cGVvZiBpZmFjZS5nZXRWYWx1ZSA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdHJldHVybiBpZmFjZS5nZXRWYWx1ZSgpXHJcblx0XHR9XHJcblx0XHR2YXIgcmV0ID0gdGhpcy52YWwoKVxyXG5cclxuXHRcdGlmICh0eXBlID09ICdudW1iZXInIHx8IHR5cGUgPT0gJ3JhbmdlJykge1xyXG5cdFx0XHRyZXQgPSBwYXJzZUZsb2F0KHJldClcclxuXHRcdH1cclxuXHRcdHJldHVybiByZXRcclxuXHR9XHJcblxyXG5cclxuXHQkLmZuLnNldFZhbHVlID0gZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdGlmICh0aGlzLmdldCgwKS50YWdOYW1lID09ICdJTlBVVCcgJiYgdGhpcy5hdHRyKCd0eXBlJykgPT0gJ2NoZWNrYm94Jykge1xyXG5cdFx0XHR0aGlzLnByb3AoJ2NoZWNrZWQnLCB2YWx1ZSlcclxuXHRcdFx0cmV0dXJuXHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIGlmYWNlID0gdGhpcy5pbnRlcmZhY2UoKVxyXG5cdFx0aWYgKGlmYWNlICYmIHR5cGVvZiBpZmFjZS5zZXRWYWx1ZSA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdGlmYWNlLnNldFZhbHVlKHZhbHVlKVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHRoaXMudmFsKHZhbHVlKVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblxyXG5cclxuXHQkLmZuLmdldEZvcm1EYXRhID0gZnVuY3Rpb24oKSB7XHJcblx0XHR2YXIgcmV0ID0ge31cclxuXHRcdHRoaXMuZmluZCgnW25hbWVdJykuZWFjaChmdW5jdGlvbigpIHtcclxuXHRcdFx0dmFyIGVsdCA9ICQodGhpcylcclxuXHRcdFx0dmFyIG5hbWUgPSBlbHQuYXR0cignbmFtZScpXHJcblx0XHRcdHJldFtuYW1lXSA9IGVsdC5nZXRWYWx1ZSgpXHJcblxyXG5cdFx0fSlcclxuXHJcblx0XHRyZXR1cm4gcmV0XHJcblx0fVxyXG5cclxuXHQkLmZuLnNldEZvcm1EYXRhID0gZnVuY3Rpb24oZGF0YSkge1xyXG5cclxuXHRcdC8vY29uc29sZS5sb2coJ3NldEZvcm1EYXRhJywgZGF0YSlcclxuXHRcdGlmICh0aGlzLmdldCgwKS50YWdOYW1lID09IFwiRk9STVwiKSB7XHJcblx0XHRcdHRoaXMuZ2V0KDApLnJlc2V0KClcclxuXHRcdH1cclxuXHJcblx0XHRmb3IodmFyIG5hbWUgaW4gZGF0YSkge1xyXG5cdFx0XHR2YXIgdmFsdWUgPSBkYXRhW25hbWVdXHJcblx0XHRcdGNvbnNvbGUubG9nKCdmb3InLCBuYW1lLCB2YWx1ZSlcclxuXHRcdFx0dmFyIGVsdCA9IHRoaXMuZmluZChgW25hbWU9JHtuYW1lfV1gKVxyXG5cdFx0XHRjb25zb2xlLmxvZygnZWx0JywgZWx0Lmxlbmd0aClcclxuXHRcdFx0aWYgKGVsdC5sZW5ndGgpIHtcclxuXHRcdFx0XHRlbHQuc2V0VmFsdWUodmFsdWUpXHRcdFx0XHRcclxuXHRcdFx0fVxyXG5cclxuXHRcdFxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB0aGlzXHJcblx0fVxyXG5cclxuXHQkLmZuLnByb2Nlc3NGb3JtRGF0YSA9IGZ1bmN0aW9uKGRhdGEpIHtcclxuXHRcdGlmIChkYXRhID09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRyZXR1cm4gdGhpc1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmICh0eXBlb2YgZGF0YSAhPSAnb2JqZWN0Jykge1xyXG5cdFx0XHRjb25zb2xlLmVycm9yKGBbY29yZV0gcHJvY2Vzc0Zvcm1EYXRhIGNhbGxlZCB3aXRoIGJhZCBwYXJhbWV0ZXIgJ2RhdGEnIChtdXN0IGJlIGFuIG9iamVjdCk6YCwgZGF0YSlcclxuXHRcdFx0cmV0dXJuIHRoaXNcclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLmJuRmluZCgnYm4tZm9ybScsIHRydWUsIGZ1bmN0aW9uKGVsdCwgdmFyTmFtZSkge1xyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdibi10ZXh0JywgdmFyTmFtZSlcclxuXHRcdFx0dmFyIHZhbHVlID0gZGF0YVt2YXJOYW1lXVxyXG5cdFx0XHRpZiAodHlwZW9mIHZhbHVlID09ICdvYmplY3QnKSB7XHJcblx0XHRcdFx0ZWx0LnNldEZvcm1EYXRhKHZhbHVlKVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdGNvbnNvbGUud2FybihgW0NvcmVdIHByb2Nlc3NGb3JtRGF0YTogdmFyaWFibGUgJyR7dmFyTmFtZX0nIGlzIG5vdCBhbiBvYmplY3QgZGVmaW5lZCBpbiBkYXRhYCwgZGF0YSlcclxuXHRcdFx0fVxyXG5cdFx0XHRcclxuXHRcdH0pXHJcblx0XHRyZXR1cm4gdGhpc1xyXG5cdFxyXG5cdH1cclxuXHJcblxyXG59KSgpOyIsIihmdW5jdGlvbigpIHtcclxuXHJcblxyXG5cdCQuZm4ucHJvY2Vzc0NvbnRleHRNZW51ID0gZnVuY3Rpb24oZGF0YSkge1xyXG5cdFx0aWYgKGRhdGEgPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdHJldHVybiB0aGlzXHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKHR5cGVvZiBkYXRhICE9ICdvYmplY3QnKSB7XHJcblx0XHRcdGNvbnNvbGUuZXJyb3IoYFtjb3JlXSBwcm9jZXNzQ29udGV4dE1lbnUgY2FsbGVkIHdpdGggYmFkIHBhcmFtZXRlciAnZGF0YScgKG11c3QgYmUgYW4gb2JqZWN0KTpgLCBkYXRhKVxyXG5cdFx0XHRyZXR1cm4gdGhpc1xyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMuYm5GaW5kKCdibi1tZW51JywgdHJ1ZSwgZnVuY3Rpb24oZWx0LCB2YXJOYW1lKSB7XHJcblx0XHRcdC8vY29uc29sZS5sb2coJ2JuLXRleHQnLCB2YXJOYW1lKVxyXG5cdFx0XHR2YXIgdmFsdWUgPSBkYXRhW3Zhck5hbWVdXHJcblx0XHRcdGlmICh0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCcpIHtcclxuXHRcdFx0XHR2YXIgaWQgPSBlbHQudW5pcXVlSWQoKS5hdHRyKCdpZCcpXHJcblx0XHRcdFx0Y29uc29sZS5sb2coJ1twcm9jZXNzQ29udGV4dE1lbnVdIGlkJywgaWQpXHJcblx0XHRcdFx0JC5jb250ZXh0TWVudSh7XHJcblx0XHRcdFx0XHRzZWxlY3RvcjogJyMnICsgaWQsXHJcblx0XHRcdFx0XHRjYWxsYmFjazogZnVuY3Rpb24oa2V5KSB7XHJcblx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ1twcm9jZXNzQ29udGV4dE1lbnVdIGNhbGxiYWNrJywga2V5KVxyXG5cdFx0XHRcdFx0XHRlbHQudHJpZ2dlcignbWVudUNoYW5nZScsIFtrZXldKVxyXG5cdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdGl0ZW1zOiB2YWx1ZVxyXG5cdFx0XHRcdH0pXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0Y29uc29sZS53YXJuKGBbQ29yZV0gcHJvY2Vzc0NvbnRleHRNZW51OiB2YXJpYWJsZSAnJHt2YXJOYW1lfScgaXMgbm90IGFuIG9iamVjdCBkZWZpbmVkIGluIGRhdGFgLCBkYXRhKVxyXG5cdFx0XHR9XHJcblx0XHRcdFxyXG5cdFx0fSlcclxuXHRcdHJldHVybiB0aGlzXHJcblx0XHJcblx0fVxyXG5cclxuXHJcbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1xyXG5cclxuXHRmdW5jdGlvbiBzcGxpdEF0dHIoYXR0clZhbHVlLCBjYmspIHtcclxuXHRcdGF0dHJWYWx1ZS5zcGxpdCgnLCcpLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xyXG5cdFx0XHR2YXIgbGlzdCA9IGl0ZW0uc3BsaXQoJzonKVxyXG5cdFx0XHRpZiAobGlzdC5sZW5ndGggPT0gMikge1xyXG5cdFx0XHRcdHZhciBuYW1lID0gbGlzdFswXS50cmltKClcclxuXHRcdFx0XHR2YXIgdmFsdWUgPSBsaXN0WzFdLnRyaW0oKVxyXG5cdFx0XHRcdGNiayhuYW1lLCB2YWx1ZSlcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRjb25zb2xlLmVycm9yKGBbQ29yZV0gc3BsaXRBdHRyKCR7YXR0ck5hbWV9KSAnYXR0clZhbHVlJyBub3QgY29ycmVjdDpgLCBpdGVtKVxyXG5cdFx0XHR9XHJcblx0XHR9KVx0XHRcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGdldFZhclZhbHVlKHZhck5hbWUsIGRhdGEpIHtcclxuXHRcdC8vY29uc29sZS5sb2coJ2dldFZhclZhbHVlJywgdmFyTmFtZSwgZGF0YSlcclxuXHRcdHZhciByZXQgPSBkYXRhXHJcblx0XHRmb3IobGV0IGYgb2YgdmFyTmFtZS5zcGxpdCgnLicpKSB7XHJcblx0XHRcdFxyXG5cdFx0XHRpZiAodHlwZW9mIHJldCA9PSAnb2JqZWN0JyAmJiBmIGluIHJldCkge1xyXG5cdFx0XHRcdHJldCA9IHJldFtmXVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdC8vY29uc29sZS53YXJuKGBbQ29yZV0gZ2V0VmFyVmFsdWU6IGF0dHJpYnV0ICcke3Zhck5hbWV9JyBpcyBub3QgaW4gb2JqZWN0OmAsIGRhdGEpXHJcblx0XHRcdFx0cmV0dXJuIHVuZGVmaW5lZFxyXG5cdFx0XHR9XHJcblx0XHRcdFxyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdmJywgZiwgJ3JldCcsIHJldClcclxuXHRcdH1cclxuXHRcdC8vY29uc29sZS5sb2coJ3JldCcsIHJldClcclxuXHRcdHJldHVybiByZXRcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGdldFZhbHVlKGN0eCwgdmFyTmFtZSwgZm4pIHtcclxuXHJcblx0XHQvL2NvbnNvbGUubG9nKCdbQ29yZV0gZ2V0VmFsdWUnLCB2YXJOYW1lLCBjdHgpXHJcblxyXG5cdFx0dmFyIG5vdCA9IGZhbHNlXHJcblx0XHRpZiAodmFyTmFtZS5zdGFydHNXaXRoKCchJykpIHtcclxuXHRcdFx0dmFyTmFtZSA9IHZhck5hbWUuc3Vic3RyKDEpXHJcblx0XHRcdG5vdCA9IHRydWVcclxuXHRcdH1cdFx0XHRcclxuXHJcblx0XHR2YXIgcHJlZml4TmFtZSA9IHZhck5hbWUuc3BsaXQoJy4nKVswXVxyXG5cdFx0Ly9jb25zb2xlLmxvZygnW0NvcmVdIHByZWZpeE5hbWUnLCBwcmVmaXhOYW1lKVxyXG5cdFx0aWYgKGN0eC52YXJzVG9VcGRhdGUgJiYgY3R4LnZhcnNUb1VwZGF0ZS5pbmRleE9mKHByZWZpeE5hbWUpIDwgMCkge1xyXG5cdFx0XHRyZXR1cm5cclxuXHRcdH1cclxuXHJcblx0XHR2YXIgZnVuYyA9IGN0eC5kYXRhW3Zhck5hbWVdXHJcblx0XHR2YXIgdmFsdWVcclxuXHJcblx0XHRpZiAodHlwZW9mIGZ1bmMgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHR2YWx1ZSA9IGZ1bmMuY2FsbChjdHguZGF0YSlcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHR2YWx1ZSA9IGdldFZhclZhbHVlKHZhck5hbWUsIGN0eC5kYXRhKVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmICh2YWx1ZSA9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0Ly9jb25zb2xlLndhcm4oYFtDb3JlXSBwcm9jZXNzVGVtcGxhdGU6IHZhcmlhYmxlICcke3Zhck5hbWV9JyBpcyBub3QgZGVmaW5lZCBpbiBvYmplY3QgZGF0YTpgLCBkYXRhKVxyXG5cdFx0XHRyZXR1cm5cclxuXHRcdH1cclxuXHRcdC8vY29uc29sZS5sb2coJ3ZhbHVlJywgdmFsdWUpXHJcblx0XHRpZiAodHlwZW9mIHZhbHVlID09ICdib29sZWFuJyAmJiBub3QpIHtcclxuXHRcdFx0dmFsdWUgPSAhdmFsdWVcclxuXHRcdH1cclxuXHRcdGZuKHZhbHVlKVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gYm5JZihjdHgpIHtcclxuXHRcdGdldFZhbHVlKGN0eCwgY3R4LmRpclZhbHVlLCBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRpZiAodmFsdWUgPT09IGZhbHNlKSB7XHJcblx0XHRcdFx0Y3R4LmVsdC5yZW1vdmUoKVxyXG5cdFx0XHR9XHJcblx0XHR9KVx0XHRcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGJuU2hvdyhjdHgpIHtcclxuXHRcdGdldFZhbHVlKGN0eCwgY3R4LmRpclZhbHVlLCBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRpZiAodHlwZW9mIHZhbHVlID09ICdib29sZWFuJykge1xyXG5cdFx0XHRcdGN0eC5lbHQuYm5WaXNpYmxlKHZhbHVlKVxyXG5cdFx0XHR9XHRcdFx0XHRcclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0Y29uc29sZS53YXJuKGBbQ29yZV0gYm4tc2hvdzogdmFyaWFibGUgJyR7dmFyTmFtZX0nIGlzIG5vdCBhbiBib29sZWFuYCwgZGF0YSlcclxuXHRcdFx0fVxyXG5cdFx0fSlcdFx0XHJcblx0fVxyXG5cclxuXHJcblx0ZnVuY3Rpb24gYm5FYWNoKGN0eCkge1xyXG5cdFx0dmFyIGYgPSBjdHguZGlyVmFsdWUuc3BsaXQoJyAnKVxyXG5cdFx0aWYgKGYubGVuZ3RoICE9IDMgfHwgZlsxXSAhPSAnb2YnKSB7XHJcblx0XHRcdGNvbnNvbGUuZXJyb3IoJ1tDb3JlXSBibi1lYWNoIGNhbGxlZCB3aXRoIGJhZCBhcmd1bWVudHM6JywgZGlyVmFsdWUpXHJcblx0XHRcdHJldHVyblxyXG5cdFx0fVxyXG5cdFx0dmFyIGl0ZXIgPSBmWzBdXHJcblx0XHR2YXIgdmFyTmFtZSA9IGZbMl1cclxuXHRcdC8vY29uc29sZS5sb2coJ2JuLWVhY2ggaXRlcicsIGl0ZXIsICBjdHgudGVtcGxhdGUpXHJcblx0XHRcclxuXHRcdGdldFZhbHVlKGN0eCwgdmFyTmFtZSwgZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0aWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XHJcblxyXG5cdFx0XHRcdGN0eC5lbHQuZW1wdHkoKVxyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdHZhbHVlLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xyXG5cdFx0XHRcdFx0dmFyIGl0ZW1EYXRhID0gJC5leHRlbmQoe30sIGN0eC5kYXRhKVxyXG5cdFx0XHRcdFx0aXRlbURhdGFbaXRlcl0gPSBpdGVtXHJcblx0XHRcdFx0XHQvL3ZhciAkaXRlbSA9ICQoY3R4LnRlbXBsYXRlKVxyXG5cdFx0XHRcdFx0dmFyICRpdGVtID0gY3R4LnRlbXBsYXRlLmNsb25lKClcclxuXHRcdFx0XHRcdCRpdGVtLnByb2Nlc3NVSShpdGVtRGF0YSlcclxuXHRcdFx0XHRcdGN0eC5lbHQuYXBwZW5kKCRpdGVtKVxyXG5cdFx0XHRcdH0pXHJcblx0XHRcdH1cdFxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRjb25zb2xlLndhcm4oYFtDb3JlXSBibi1lYWNoOiB2YXJpYWJsZSAnJHt2YXJOYW1lfScgaXMgbm90IGFuIGFycmF5YCwgZGF0YSlcclxuXHRcdFx0fVx0XHRcdFxyXG5cdFx0fSlcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGJuVGV4dChjdHgpIHtcclxuXHRcdC8vY29uc29sZS5sb2coJ1tDb3JlXSBiblRleHQnLCBjdHgpXHJcblx0XHRnZXRWYWx1ZShjdHgsIGN0eC5kaXJWYWx1ZSwgZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0Y3R4LmVsdC50ZXh0KHZhbHVlKVxyXG5cdFx0fSlcclxuXHR9XHJcblx0XHJcblxyXG5cdGZ1bmN0aW9uIGJuRm9ybShjdHgpIHtcclxuXHRcdC8vY29uc29sZS5sb2coJ1tDb3JlXSBiblRleHQnLCBjdHgpXHJcblx0XHRnZXRWYWx1ZShjdHgsIGN0eC5kaXJWYWx1ZSwgZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0Y3R4LmVsdC5zZXRGb3JtRGF0YSh2YWx1ZSlcclxuXHRcdH0pXHJcblx0fVxyXG5cdFxyXG5cclxuXHRmdW5jdGlvbiBibkh0bWwoY3R4KSB7XHJcblx0XHRnZXRWYWx1ZShjdHgsIGN0eC5kaXJWYWx1ZSwgZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0Y3R4LmVsdC5odG1sKHZhbHVlKVxyXG5cdFx0fSlcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGJuQ29tYm8oY3R4KSB7XHJcblx0XHRnZXRWYWx1ZShjdHgsIGN0eC5kaXJWYWx1ZSwgZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0Y3R4LmVsdC5pbml0Q29tYm8odmFsdWUpXHJcblx0XHR9KVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gYm5PcHRpb25zKGN0eCkge1xyXG5cdFx0Z2V0VmFsdWUoY3R4LCBjdHguZGlyVmFsdWUsIGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdGN0eC5lbHQuZGF0YSgnJG9wdGlvbnMnLCB2YWx1ZSlcclxuXHRcdH0pXHJcblx0fVxyXG5cclxuXHJcblx0ZnVuY3Rpb24gYm5WYWwoY3R4KSB7XHJcblx0XHRnZXRWYWx1ZShjdHgsIGN0eC5kaXJWYWx1ZSwgZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0Y3R4LmVsdC5zZXRWYWx1ZSh2YWx1ZSlcclxuXHRcdH0pXHJcblx0fVxyXG5cclxuXHJcblx0ZnVuY3Rpb24gYm5Qcm9wKGN0eCkge1xyXG5cdFx0c3BsaXRBdHRyKGN0eC5kaXJWYWx1ZSwgZnVuY3Rpb24ocHJvcE5hbWUsIHZhck5hbWUpIHtcclxuXHRcdFx0Z2V0VmFsdWUoY3R4LCB2YXJOYW1lLCBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRcdGlmICh0eXBlb2YgdmFsdWUgPT0gJ2Jvb2xlYW4nKSB7XHJcblx0XHRcdFx0XHRjdHguZWx0LnByb3AocHJvcE5hbWUsIHZhbHVlKVxyXG5cdFx0XHRcdH1cdFx0XHRcdFxyXG5cdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0Y29uc29sZS53YXJuKGBbQ29yZV0gYm4tcHJvcDogdmFyaWFibGUgJyR7dmFyTmFtZX0nIGlzIG5vdCBhbiBib29sZWFuYCwgZGF0YSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pXHRcclxuXHRcdH0pXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBibkF0dHIoY3R4KSB7XHJcblx0XHRzcGxpdEF0dHIoY3R4LmRpclZhbHVlLCBmdW5jdGlvbihhdHRyTmFtZSwgdmFyTmFtZSkge1xyXG5cdFx0XHRnZXRWYWx1ZShjdHgsIHZhck5hbWUsIGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdFx0Y3R4LmVsdC5hdHRyKGF0dHJOYW1lLCB2YWx1ZSlcclxuXHRcdFx0fSlcclxuXHRcdH0pXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBiblN0eWxlKGN0eCkge1xyXG5cdFx0c3BsaXRBdHRyKGN0eC5kaXJWYWx1ZSwgZnVuY3Rpb24oYXR0ck5hbWUsIHZhck5hbWUpIHtcclxuXHRcdFx0Z2V0VmFsdWUoY3R4LCB2YXJOYW1lLCBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRcdGN0eC5lbHQuY3NzKGF0dHJOYW1lLCB2YWx1ZSlcclxuXHRcdFx0fSlcclxuXHRcdH0pXHJcblx0fVxyXG5cclxuXHJcblx0ZnVuY3Rpb24gYm5EYXRhKGN0eCkge1xyXG5cdFx0c3BsaXRBdHRyKGN0eC5kaXJWYWx1ZSwgZnVuY3Rpb24oYXR0ck5hbWUsIHZhck5hbWUpIHtcclxuXHRcdFx0Z2V0VmFsdWUoY3R4LCB2YXJOYW1lLCBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRcdGN0eC5lbHQuc2V0UHJvcChhdHRyTmFtZSwgdmFsdWUpXHJcblx0XHRcdH0pXHJcblx0XHR9KVxyXG5cdH1cclxuXHJcblxyXG5cdGZ1bmN0aW9uIGJuQ2xhc3MoY3R4KSB7XHJcblx0XHRzcGxpdEF0dHIoY3R4LmRpclZhbHVlLCBmdW5jdGlvbihwcm9wTmFtZSwgdmFyTmFtZSkge1xyXG5cdFx0XHRnZXRWYWx1ZShjdHgsIHZhck5hbWUsIGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PSAnYm9vbGVhbicpIHtcclxuXHRcdFx0XHRcdGlmICh2YWx1ZSkge1xyXG5cdFx0XHRcdFx0XHRjdHguZWx0LmFkZENsYXNzKHByb3BOYW1lKVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHRcdGN0eC5lbHQucmVtb3ZlQ2xhc3MocHJvcE5hbWUpXHJcblx0XHRcdFx0XHR9XHRcdFx0XHRcclxuXHRcdFx0XHR9XHRcclxuXHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdGNvbnNvbGUud2FybihgW0NvcmVdIGJuLWNsYXNzOiB2YXJpYWJsZSAnJHt2YXJOYW1lfScgaXMgbm90IGFuIGJvb2xlYW5gLCBkYXRhKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSlcdFxyXG5cdFx0fSlcclxuXHR9XHRcclxuXHJcblxyXG5cdHZhciBkaXJNYXAgPSB7XHJcblx0XHQnYm4tZWFjaCc6IGJuRWFjaCxcdFx0XHRcclxuXHRcdCdibi1pZic6IGJuSWYsXHJcblx0XHQnYm4tdGV4dCc6IGJuVGV4dCxcdFxyXG5cdFx0J2JuLWh0bWwnOiBibkh0bWwsXHJcblx0XHQnYm4tb3B0aW9ucyc6IGJuT3B0aW9ucyxcdFx0XHRcclxuXHRcdCdibi1saXN0JzogYm5Db21ibyxcdFx0XHRcclxuXHRcdCdibi12YWwnOiBiblZhbCxcdFxyXG5cdFx0J2JuLXByb3AnOiBiblByb3AsXHJcblx0XHQnYm4tYXR0cic6IGJuQXR0cixcdFxyXG5cdFx0J2JuLWRhdGEnOiBibkRhdGEsXHRcdFx0XHJcblx0XHQnYm4tY2xhc3MnOiBibkNsYXNzLFxyXG5cdFx0J2JuLXNob3cnOiBiblNob3csXHJcblx0XHQnYm4tc3R5bGUnOiBiblN0eWxlLFxyXG5cdFx0J2JuLWZvcm0nOiBibkZvcm1cclxuXHR9XHJcblxyXG5cdCQuZm4uc2V0UHJvcCA9IGZ1bmN0aW9uKGF0dHJOYW1lLCB2YWx1ZSkge1xyXG5cdFx0dmFyIGlmYWNlID0gdGhpcy5pbnRlcmZhY2UoKVxyXG5cdFx0aWYgKGlmYWNlICYmIGlmYWNlLnNldFByb3ApIHtcclxuXHRcdFx0aWZhY2Uuc2V0UHJvcChhdHRyTmFtZSwgdmFsdWUpXHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0dGhpcy5kYXRhKGF0dHJOYW1lLCB2YWx1ZSlcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gdGhpc1xyXG5cdH1cclxuXHJcblxyXG5cclxuXHQkLmZuLnByb2Nlc3NUZW1wbGF0ZSA9IGZ1bmN0aW9uKGRhdGEpIHtcclxuXHRcdC8vY29uc29sZS5sb2coJ1tDb3JlXSBwcm9jZXNzVGVtcGxhdGUnKVxyXG5cdFx0dmFyIHRoYXQgPSB0aGlzXHJcblxyXG5cdFx0dmFyIGRpckxpc3QgPSBbXVxyXG5cclxuXHRcdGZvcihsZXQgayBpbiBkaXJNYXApIHtcclxuXHRcdFx0dGhpcy5ibkZpbmQoaywgdHJ1ZSwgZnVuY3Rpb24oZWx0LCBkaXJWYWx1ZSkge1xyXG5cdFx0XHRcdHZhciB0ZW1wbGF0ZVxyXG5cdFx0XHRcdGlmIChrID09ICdibi1lYWNoJykge1xyXG5cdFx0XHRcdFx0dGVtcGxhdGUgPSBlbHQuY2hpbGRyZW4oKS5yZW1vdmUoKS5jbG9uZSgpLy8uZ2V0KDApLm91dGVySFRNTFxyXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygndGVtcGxhdGUnLCB0ZW1wbGF0ZSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKGsgPT0gJ2JuLXZhbCcpIHtcclxuXHRcdFx0XHRcdGVsdC5kYXRhKCckdmFsJywgZGlyVmFsdWUpXHJcblx0XHRcdFx0XHR2YXIgdXBkYXRlRXZlbnQgPSBlbHQuYXR0cignYm4tdXBkYXRlJylcclxuXHRcdFx0XHRcdGlmICh1cGRhdGVFdmVudCAhPSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRcdFx0ZWx0LnJlbW92ZUF0dHIoJ2JuLXVwZGF0ZScpXHJcblx0XHRcdFx0XHRcdGVsdC5vbih1cGRhdGVFdmVudCwgZnVuY3Rpb24oZXYsIHVpKSB7XHJcblx0XHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygndWknLCB1aSlcclxuXHJcblx0XHRcdFx0XHRcdFx0dmFyIHZhbHVlID0gKHVpICYmICB1aS52YWx1ZSkgfHwgICQodGhpcykuZ2V0VmFsdWUoKVxyXG5cdFx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ3ZhbHVlJywgdmFsdWUpXHJcblx0XHRcdFx0XHRcdFx0dGhhdC50cmlnZ2VyKCdkYXRhOnVwZGF0ZScsIFtkaXJWYWx1ZSwgdmFsdWUsIGVsdF0pXHJcblx0XHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRkaXJMaXN0LnB1c2goe2RpcmVjdGl2ZTogaywgZWx0OiBlbHQsIGRpclZhbHVlOiBkaXJWYWx1ZSwgdGVtcGxhdGU6IHRlbXBsYXRlfSlcclxuXHRcdFx0fSlcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoZGF0YSkge1xyXG5cdFx0XHR0aGlzLnVwZGF0ZVRlbXBsYXRlKGRpckxpc3QsIGRhdGEpXHJcblx0XHR9XHJcblx0XHRcdFx0XHJcblx0XHRyZXR1cm4gZGlyTGlzdFxyXG5cclxuXHR9XHRcclxuXHJcblx0JC5mbi51cGRhdGVUZW1wbGF0ZSA9IGZ1bmN0aW9uKGRpckxpc3QsIGRhdGEsIHZhcnNUb1VwZGF0ZSwgZXhjbHVkZUVsdCkge1xyXG5cdFx0Ly9jb25zb2xlLmxvZygnW2NvcmVdIHVwZGF0ZVRlbXBsYXRlJywgZGF0YSwgdmFyc1RvVXBkYXRlKVxyXG5cclxuXHRcdFx0Ly9jb25zb2xlLmxvZygnZGF0YScsIGRhdGEpXHJcblx0XHR2YXJzVG9VcGRhdGUgPSB2YXJzVG9VcGRhdGUgfHwgT2JqZWN0LmtleXMoZGF0YSlcclxuXHRcdC8vY29uc29sZS5sb2coJ3ZhcnNUb1VwZGF0ZScsIHZhcnNUb1VwZGF0ZSlcclxuXHJcblx0XHRkaXJMaXN0LmZvckVhY2goZnVuY3Rpb24oZGlySXRlbSkge1xyXG5cdFx0XHR2YXIgZm4gPSBkaXJNYXBbZGlySXRlbS5kaXJlY3RpdmVdXHJcblx0XHRcdGlmICh0eXBlb2YgZm4gPT0gJ2Z1bmN0aW9uJyAmJiBkaXJJdGVtLmVsdCAhPSBleGNsdWRlRWx0KSB7XHJcblx0XHRcdFx0ZGlySXRlbS5kYXRhID0gZGF0YTtcclxuXHRcdFx0XHRkaXJJdGVtLnZhcnNUb1VwZGF0ZSA9IHZhcnNUb1VwZGF0ZTtcclxuXHRcdFx0XHRmbihkaXJJdGVtKVxyXG5cdFx0XHR9XHJcblx0XHR9KVx0XHRcdFxyXG5cdFx0XHJcblxyXG5cdFx0XHJcblx0XHRyZXR1cm4gdGhpc1xyXG5cclxuXHR9XHRcclxuXHJcblxyXG59KSgpOyIsIihmdW5jdGlvbigpIHtcclxuXHJcblx0JC5mbi5wcm9jZXNzVUkgPSBmdW5jdGlvbihkYXRhKSB7XHJcblx0XHQvL2NvbnNvbGUubG9nKCdwcm9jZXNzVUknLCBkYXRhLCB0aGlzLmh0bWwoKSlcclxuXHRcdHZhciBkaXJMaXN0ID0gdGhpcy5wcm9jZXNzVGVtcGxhdGUoZGF0YSlcclxuXHRcdHRoaXMucHJvY2Vzc0NvbnRyb2xzKGRhdGEpXHJcblx0XHQvLy5wcm9jZXNzRm9ybURhdGEoZGF0YSlcclxuXHRcdC5wcm9jZXNzQ29udGV4dE1lbnUoZGF0YSlcclxuXHRcdHJldHVybiBkaXJMaXN0XHJcblx0fVxyXG5cclxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdCQuZm4uYm5GaWx0ZXIgPSBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG5cdFx0cmV0dXJuIHRoaXMuZmluZChzZWxlY3RvcikuYWRkKHRoaXMuZmlsdGVyKHNlbGVjdG9yKSlcclxuXHR9XHJcblxyXG5cdCQuZm4uYm5GaW5kID0gZnVuY3Rpb24oYXR0ck5hbWUsIHJlbW92ZUF0dHIsIGNiaykge1xyXG5cdFx0dGhpcy5ibkZpbHRlcihgWyR7YXR0ck5hbWV9XWApLmVhY2goZnVuY3Rpb24oKSB7XHJcblx0XHRcdHZhciBlbHQgPSAkKHRoaXMpXHJcblx0XHRcdHZhciBhdHRyVmFsdWUgPSBlbHQuYXR0cihhdHRyTmFtZSlcclxuXHRcdFx0aWYgKHJlbW92ZUF0dHIpIHtcclxuXHRcdFx0XHRlbHQucmVtb3ZlQXR0cihhdHRyTmFtZSlcclxuXHRcdFx0fVx0XHRcclxuXHRcdFx0Y2JrKGVsdCwgYXR0clZhbHVlKVxyXG5cdFx0fSlcclxuXHR9XHJcblxyXG5cdCQuZm4uYm5GaW5kRXggPSBmdW5jdGlvbihhdHRyTmFtZSwgcmVtb3ZlQXR0ciwgY2JrKSB7XHJcblx0XHR0aGlzLmJuRmluZChhdHRyTmFtZSwgcmVtb3ZlQXR0ciwgZnVuY3Rpb24oZWx0LCBhdHRyVmFsdWUpIHtcclxuXHRcdFx0YXR0clZhbHVlLnNwbGl0KCcsJykuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XHJcblx0XHRcdFx0dmFyIGxpc3QgPSBpdGVtLnNwbGl0KCc6JylcclxuXHRcdFx0XHRpZiAobGlzdC5sZW5ndGggPT0gMikge1xyXG5cdFx0XHRcdFx0dmFyIG5hbWUgPSBsaXN0WzBdLnRyaW0oKVxyXG5cdFx0XHRcdFx0dmFyIHZhbHVlID0gbGlzdFsxXS50cmltKClcclxuXHRcdFx0XHRcdGNiayhlbHQsIG5hbWUsIHZhbHVlKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoYFtDb3JlXSBibkZpbmRFeCgke2F0dHJOYW1lfSkgJ2F0dHJWYWx1ZScgbm90IGNvcnJlY3Q6YCwgaXRlbSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pXHJcblx0XHR9KVxyXG5cdH1cclxuXHJcblx0JC5mbi5iblZpc2libGUgPSBmdW5jdGlvbihpc1Zpc2libGUpIHtcclxuXHRcdGlmIChpc1Zpc2libGUpIHtcclxuXHRcdFx0dGhpcy5zaG93KClcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHR0aGlzLmhpZGUoKVxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHRoaXNcdFxyXG5cdH1cclxuXHJcblx0JC5mbi5pbml0Q29tYm8gPSBmdW5jdGlvbih2YWx1ZXMpIHtcclxuXHRcdHRoaXNcclxuXHRcdC5lbXB0eSgpXHJcblx0XHQuYXBwZW5kKHZhbHVlcy5tYXAoZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0cmV0dXJuIGA8b3B0aW9uIHZhbHVlPSR7dmFsdWV9PiR7dmFsdWV9PC9vcHRpb24+YFxyXG5cdFx0fSkpXHJcblxyXG5cdFx0cmV0dXJuIHRoaXNcclxuXHR9XHJcblxyXG5cclxufSkoKTtcclxuIiwiJCQuc2hvd0FsZXJ0ID0gZnVuY3Rpb24odGV4dCwgdGl0bGUsIGNhbGxiYWNrKSB7XHJcblx0dGl0bGUgPSB0aXRsZSB8fCAnSW5mb3JtYXRpb24nXHJcblx0JCgnPGRpdj4nLCB7dGl0bGU6IHRpdGxlfSlcclxuXHRcdC5hcHBlbmQoJCgnPHA+JykuaHRtbCh0ZXh0KSlcclxuXHRcdC5kaWFsb2coe1xyXG5cdFx0XHRjbGFzc2VzOiB7XHJcblx0XHRcdFx0J3VpLWRpYWxvZy10aXRsZWJhci1jbG9zZSc6ICduby1jbG9zZSdcclxuXHRcdFx0fSxcclxuXHRcdFx0d2lkdGg6ICdhdXRvJyxcclxuXHRcdFx0bWF4SGVpZ2h0OiA0MDAsXHJcblx0XHRcdG1vZGFsOiB0cnVlLFxyXG5cdFx0XHRjbG9zZTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0JCh0aGlzKS5kaWFsb2coJ2Rlc3Ryb3knKVxyXG5cdFx0XHR9LFxyXG5cdFx0XHRidXR0b25zOiBbXHJcblx0XHRcdFx0e1xyXG5cdFx0XHRcdFx0dGV4dDogJ0Nsb3NlJyxcclxuXHRcdFx0XHRcdGNsaWNrOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0JCh0aGlzKS5kaWFsb2coJ2Nsb3NlJylcclxuXHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0XHRcdFx0Y2FsbGJhY2soKVxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRdXHJcblx0XHR9KVxyXG59O1x0XHJcblxyXG4iLCIkJC5zaG93Q29uZmlybSA9IGZ1bmN0aW9uKHRleHQsIHRpdGxlLCBjYWxsYmFjaykge1xyXG5cdHRpdGxlID0gdGl0bGUgfHwgJ0luZm9ybWF0aW9uJ1xyXG5cdCQoJzxkaXY+Jywge3RpdGxlOiB0aXRsZX0pXHJcblx0XHQuYXBwZW5kKCQoJzxwPicpLmh0bWwodGV4dCkpXHJcblx0XHQuZGlhbG9nKHtcclxuXHJcblx0XHRcdG1vZGFsOiB0cnVlLFxyXG5cclxuXHRcdFx0Y2xvc2U6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdCQodGhpcykuZGlhbG9nKCdkZXN0cm95JylcclxuXHRcdFx0fSxcclxuXHRcdFx0YnV0dG9uczogW1xyXG5cdFx0XHRcdHtcclxuXHRcdFx0XHRcdHRleHQ6ICdDYW5jZWwnLFxyXG5cdFx0XHRcdFx0Ly9jbGFzczogJ3czLWJ1dHRvbiB3My1yZWQgYm4tbm8tY29ybmVyJyxcclxuXHRcdFx0XHRcdGNsaWNrOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0JCh0aGlzKS5kaWFsb2coJ2Nsb3NlJylcclxuXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHR7XHJcblx0XHRcdFx0XHR0ZXh0OiAnT0snLFxyXG5cdFx0XHRcdFx0Ly9jbGFzczogJ3czLWJ1dHRvbiB3My1ibHVlIGJuLW5vLWNvcm5lcicsXHJcblx0XHRcdFx0XHRjbGljazogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdCQodGhpcykuZGlhbG9nKCdjbG9zZScpXHJcblx0XHRcdFx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdFx0XHRcdGNhbGxiYWNrKClcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cdFx0XHRcdFx0XHJcblx0XHRcdF1cclxuXHRcdH0pXHJcbn07XHJcblx0XHJcblxyXG4iLCIkJC5zaG93UGljdHVyZSA9IGZ1bmN0aW9uKHRpdGxlLCBwaWN0dXJlVXJsKSB7XHJcblx0JCgnPGRpdj4nLCB7dGl0bGU6IHRpdGxlfSlcclxuXHRcdC5hcHBlbmQoJCgnPGRpdj4nLCB7Y2xhc3M6ICdibi1mbGV4LWNvbCBibi1hbGlnbi1jZW50ZXInfSlcclxuXHRcdFx0LmFwcGVuZCgkKCc8aW1nPicsIHtzcmM6IHBpY3R1cmVVcmx9KSlcclxuXHRcdClcclxuXHRcdC5kaWFsb2coe1xyXG5cclxuXHRcdFx0bW9kYWw6IHRydWUsXHJcblx0XHRcdHdpZHRoOiAnYXV0bycsXHJcblx0XHRcdG1heEhlaWdodDogNjAwLFxyXG5cdFx0XHRtYXhXaWR0aDogNjAwLFxyXG5cdFx0XHQvL3Bvc2l0aW9uOiB7bXk6ICdjZW50ZXIgY2VudGVyJywgYXQ6ICdjZW50ZXIgY2VudGVyJ30sXHJcblxyXG5cdFx0XHRjbG9zZTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0JCh0aGlzKS5kaWFsb2coJ2Rlc3Ryb3knKVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0fSlcclxufTtcclxuXHJcblxyXG5cclxuIiwiJCQuc2hvd1Byb21wdCA9IGZ1bmN0aW9uKGxhYmVsLCB0aXRsZSwgY2FsbGJhY2ssIG9wdGlvbnMpIHtcclxuXHR0aXRsZSA9IHRpdGxlIHx8ICdJbmZvcm1hdGlvbidcclxuXHRvcHRpb25zID0gJC5leHRlbmQoe3R5cGU6ICd0ZXh0J30sIG9wdGlvbnMpXHJcblx0Ly9jb25zb2xlLmxvZygnb3B0aW9ucycsIG9wdGlvbnMpXHJcblxyXG5cdHZhciBkaXYgPSAkKCc8ZGl2PicsIHt0aXRsZTogdGl0bGV9KVxyXG5cdFx0LmFwcGVuZCgkKCc8Zm9ybT4nKVxyXG5cdFx0XHQuYXBwZW5kKCQoJzxwPicpLnRleHQobGFiZWwpKVxyXG5cdFx0XHQuYXBwZW5kKCQoJzxpbnB1dD4nLCB7Y2xhc3M6ICd2YWx1ZSd9KS5hdHRyKG9wdGlvbnMpLnByb3AoJ3JlcXVpcmVkJywgdHJ1ZSkuY3NzKCd3aWR0aCcsICcxMDAlJykpXHJcblx0XHRcdC5hcHBlbmQoJCgnPGlucHV0PicsIHt0eXBlOiAnc3VibWl0J30pLmhpZGUoKSlcclxuXHRcdFx0Lm9uKCdzdWJtaXQnLCBmdW5jdGlvbihldikge1xyXG5cdFx0XHRcdGV2LnByZXZlbnREZWZhdWx0KClcclxuXHRcdFx0XHRkaXYuZGlhbG9nKCdjbG9zZScpXHJcblx0XHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0XHR2YXIgdmFsID0gZGl2LmZpbmQoJy52YWx1ZScpLnZhbCgpXHJcblx0XHRcdFx0XHRjYWxsYmFjayh2YWwpXHJcblx0XHRcdFx0fVx0XHRcdFx0XHJcblx0XHRcdH0pXHJcblx0XHQpXHJcblx0XHQuZGlhbG9nKHtcclxuXHRcdFx0Y2xhc3Nlczoge1xyXG5cdFx0XHRcdCd1aS1kaWFsb2ctdGl0bGViYXItY2xvc2UnOiAnbm8tY2xvc2UnXHJcblx0XHRcdH0sXHJcblx0XHRcdG1vZGFsOiB0cnVlLFxyXG5cdFx0XHRjbG9zZTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0JCh0aGlzKS5kaWFsb2coJ2Rlc3Ryb3knKVxyXG5cdFx0XHR9LFxyXG5cdFx0XHRidXR0b25zOiBbXHJcblx0XHRcdFx0e1xyXG5cdFx0XHRcdFx0dGV4dDogJ0NhbmNlbCcsXHJcblx0XHRcdFx0XHRjbGljazogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdCQodGhpcykuZGlhbG9nKCdjbG9zZScpXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHR7XHJcblx0XHRcdFx0XHR0ZXh0OiAnQXBwbHknLFxyXG5cdFx0XHRcdFx0Y2xpY2s6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHQkKHRoaXMpLmZpbmQoJ1t0eXBlPXN1Ym1pdF0nKS5jbGljaygpXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRdXHJcblx0XHR9KVxyXG59O1xyXG5cclxuIiwiKGZ1bmN0aW9uKCl7XHJcblxyXG5cdFxyXG5cdGZ1bmN0aW9uIGlzT2JqZWN0KGEpIHtcclxuXHRcdHJldHVybiAodHlwZW9mIGEgPT0gJ29iamVjdCcpICYmICFBcnJheS5pc0FycmF5KGEpXHJcblx0fVxyXG5cclxuXHQkJC5jaGVja1R5cGUgPSBmdW5jdGlvbih2YWx1ZSwgdHlwZSwgaXNPcHRpb25hbCkge1xyXG5cdFx0Ly9jb25zb2xlLmxvZygnY2hlY2tUeXBlJyx2YWx1ZSwgdHlwZSwgaXNPcHRpb25hbClcclxuXHRcdGlmICh0eXBlb2YgdmFsdWUgPT0gJ3VuZGVmaW5lZCcgJiYgaXNPcHRpb25hbCA9PT0gdHJ1ZSkge1xyXG5cdFx0XHRyZXR1cm4gdHJ1ZVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmICh0eXBlb2YgdHlwZSA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRyZXR1cm4gdHlwZW9mIHZhbHVlID09IHR5cGVcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcclxuXHRcdFx0aWYgKCFBcnJheS5pc0FycmF5KHR5cGUpKSB7XHJcblx0XHRcdFx0cmV0dXJuIGZhbHNlXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmICh0eXBlLmxlbmd0aCA9PSAwKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRydWUgLy8gbm8gaXRlbSB0eXBlIGNoZWNraW5nXHJcblx0XHRcdH1cclxuXHRcdFx0Zm9yKGxldCBpIG9mIHZhbHVlKSB7XHJcblx0XHRcdFx0dmFyIHJldCA9IGZhbHNlXHJcblx0XHRcdFx0Zm9yKGxldCB0IG9mIHR5cGUpIHtcclxuXHRcdFx0XHRcdHJldCB8PSAkJC5jaGVja1R5cGUoaSwgdClcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKCFyZXQpIHtcclxuXHRcdFx0XHRcdHJldHVybiBmYWxzZVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmV0dXJuIHRydWVcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoaXNPYmplY3QodHlwZSkpIHtcclxuXHRcdFx0aWYgKCFpc09iamVjdCh2YWx1ZSkpIHtcclxuXHRcdFx0XHRyZXR1cm4gZmFsc2VcclxuXHRcdFx0fVxyXG5cdFx0XHRmb3IobGV0IGYgaW4gdHlwZSkge1xyXG5cclxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdmJywgZiwgJ3ZhbHVlJywgdmFsdWUpXHJcblx0XHRcdFx0dmFyIG5ld1R5cGUgPSB0eXBlW2ZdXHJcblxyXG5cdFx0XHRcdHZhciBpc09wdGlvbmFsID0gZmFsc2VcclxuXHRcdFx0XHRpZiAoZi5zdGFydHNXaXRoKCckJykpIHtcclxuXHRcdFx0XHRcdGYgPSBmLnN1YnN0cigxKVxyXG5cdFx0XHRcdFx0aXNPcHRpb25hbCA9IHRydWVcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKCEkJC5jaGVja1R5cGUodmFsdWVbZl0sIG5ld1R5cGUsIGlzT3B0aW9uYWwpKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2VcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4gdHJ1ZVxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIGZhbHNlXHJcblx0fVx0XHJcblxyXG5cclxufSkoKTtcclxuIiwiJCQuZGF0YVVSTHRvQmxvYiA9IGZ1bmN0aW9uKGRhdGFVUkwpIHtcclxuICAvLyBEZWNvZGUgdGhlIGRhdGFVUkxcclxuICB2YXIgc3BsaXQgPSBkYXRhVVJMLnNwbGl0KC9bOiw7XS8pXHJcbiAgdmFyIG1pbWVUeXBlID0gc3BsaXRbMV1cclxuICB2YXIgZW5jb2RhZ2UgPSBzcGxpdFsyXVxyXG4gIGlmIChlbmNvZGFnZSAhPSAnYmFzZTY0Jykge1xyXG4gIFx0cmV0dXJuXHJcbiAgfVxyXG4gIHZhciBkYXRhID0gc3BsaXRbM11cclxuXHJcbiAgY29uc29sZS5sb2coJ21pbWVUeXBlJywgbWltZVR5cGUpXHJcbiAgY29uc29sZS5sb2coJ2VuY29kYWdlJywgZW5jb2RhZ2UpXHJcbiAgLy9jb25zb2xlLmxvZygnZGF0YScsIGRhdGEpXHJcblxyXG4gIHZhciBiaW5hcnkgPSBhdG9iKGRhdGEpXHJcbiAvLyBDcmVhdGUgOC1iaXQgdW5zaWduZWQgYXJyYXlcclxuICB2YXIgYXJyYXkgPSBbXVxyXG4gIGZvcih2YXIgaSA9IDA7IGkgPCBiaW5hcnkubGVuZ3RoOyBpKyspIHtcclxuICBcdGFycmF5LnB1c2goYmluYXJ5LmNoYXJDb2RlQXQoaSkpXHJcbiAgfVxyXG5cclxuICAvLyBSZXR1cm4gb3VyIEJsb2Igb2JqZWN0XHJcblx0cmV0dXJuIG5ldyBCbG9iKFsgbmV3IFVpbnQ4QXJyYXkoYXJyYXkpIF0sIHttaW1lVHlwZX0pXHJcbn07XHJcbiIsIiQkLmV4dHJhY3QgPSBmdW5jdGlvbihvYmosIHZhbHVlcykge1xyXG5cdGlmICh0eXBlb2YgdmFsdWVzID09ICdzdHJpbmcnKSB7XHJcblx0XHR2YWx1ZXMgPSB2YWx1ZXMuc3BsaXQoJywnKVxyXG5cdH1cclxuXHRpZiAoIUFycmF5LmlzQXJyYXkodmFsdWVzKSAmJiB0eXBlb2YgdmFsdWVzID09ICdvYmplY3QnKSB7XHJcblx0XHR2YWx1ZXMgPSBPYmplY3Qua2V5cyh2YWx1ZXMpXHJcblx0fVxyXG5cdHZhciByZXQgPSB7fVxyXG5cdGZvcih2YXIgayBpbiBvYmopIHtcclxuXHRcdGlmICh2YWx1ZXMuaW5kZXhPZihrKSA+PSAwKSB7XHJcblx0XHRcdHJldFtrXSA9IG9ialtrXVxyXG5cdFx0fVxyXG5cdH1cclxuXHRyZXR1cm4gcmV0XHJcbn07XHJcbiIsIiQkLmlzSW1hZ2UgPSBmdW5jdGlvbihmaWxlTmFtZSkge1xyXG5cdHJldHVybiAoL1xcLihnaWZ8anBnfGpwZWd8cG5nKSQvaSkudGVzdChmaWxlTmFtZSlcclxufTtcclxuIiwiJCQubG9hZFN0eWxlID0gZnVuY3Rpb24oc3R5bGVGaWxlUGF0aCwgY2FsbGJhY2spIHtcdFxyXG5cdC8vY29uc29sZS5sb2coJ1tDb3JlXSBsb2FkU3R5bGUnLCBzdHlsZUZpbGVQYXRoKVxyXG5cclxuXHQkKGZ1bmN0aW9uKCkge1xyXG5cdFx0dmFyIGNzc09rID0gJCgnaGVhZCcpLmZpbmQoYGxpbmtbaHJlZj1cIiR7c3R5bGVGaWxlUGF0aH1cIl1gKS5sZW5ndGhcclxuXHRcdGlmIChjc3NPayAhPSAxKSB7XHJcblx0XHRcdGNvbnNvbGUubG9nKGBbQ29yZV0gbG9hZGluZyAnJHtzdHlsZUZpbGVQYXRofScgZGVwZW5kYW5jeWApXHJcblx0XHRcdCQoJzxsaW5rPicsIHtocmVmOiBzdHlsZUZpbGVQYXRoLCByZWw6ICdzdHlsZXNoZWV0J30pXHJcblx0XHRcdC5vbignbG9hZCcsIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKGBbQ29yZV0gJyR7c3R5bGVGaWxlUGF0aH0nIGxvYWRlZGApXHJcblx0XHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0XHRjYWxsYmFjaygpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KVxyXG5cdFx0XHQuYXBwZW5kVG8oJCgnaGVhZCcpKVxyXG5cdFx0fVxyXG5cdH0pXHJcbn07XHJcbiIsIiQkLm9iajJBcnJheSA9IGZ1bmN0aW9uKG9iaikge1xyXG5cdHZhciByZXQgPSBbXVxyXG5cdGZvcih2YXIga2V5IGluIG9iaikge1xyXG5cdFx0cmV0LnB1c2goe2tleToga2V5LCB2YWx1ZTogb2JqW2tleV19KVxyXG5cdH1cclxuXHRyZXR1cm4gcmV0XHJcbn07XHJcbiIsIihmdW5jdGlvbigpIHtcclxuXHJcbnZhciBpbnB1dEZpbGUgPSAkKCc8aW5wdXQ+Jywge3R5cGU6ICdmaWxlJ30pLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbigpIHtcclxuXHR2YXIgb25BcHBseSA9ICQodGhpcykuZGF0YSgnb25BcHBseScpXHJcblx0dmFyIGZpbGVOYW1lID0gdGhpcy5maWxlc1swXVxyXG5cdGlmICh0eXBlb2Ygb25BcHBseSA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRvbkFwcGx5KGZpbGVOYW1lKVxyXG5cdH1cclxufSlcclxuXHJcbiQkLm9wZW5GaWxlRGlhbG9nID0gZnVuY3Rpb24ob25BcHBseSkge1xyXG5cdGlucHV0RmlsZS5kYXRhKCdvbkFwcGx5Jywgb25BcHBseSlcclxuXHRpbnB1dEZpbGUuY2xpY2soKVxyXG59XHJcblxyXG59KSgpO1xyXG5cclxuIiwiJCQucmVhZEZpbGVBc0RhdGFVUkwgPSBmdW5jdGlvbihmaWxlTmFtZSwgb25SZWFkKSB7XHJcblx0dmFyIGZpbGVSZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpXHJcblxyXG5cdGZpbGVSZWFkZXIub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcblx0XHRpZiAodHlwZW9mIG9uUmVhZCA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdG9uUmVhZChmaWxlUmVhZGVyLnJlc3VsdClcclxuXHRcdH1cclxuXHR9XHJcblx0ZmlsZVJlYWRlci5yZWFkQXNEYXRhVVJMKGZpbGVOYW1lKVxyXG59O1xyXG4iLCIkJC5yZWFkVGV4dEZpbGUgPSBmdW5jdGlvbihmaWxlTmFtZSwgb25SZWFkKSB7XHJcblx0dmFyIGZpbGVSZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpXHJcblxyXG5cdGZpbGVSZWFkZXIub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcblx0XHRpZiAodHlwZW9mIG9uUmVhZCA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdG9uUmVhZChmaWxlUmVhZGVyLnJlc3VsdClcclxuXHRcdH1cclxuXHR9XHJcblx0ZmlsZVJlYWRlci5yZWFkQXNUZXh0KGZpbGVOYW1lKVxyXG59O1xyXG4iXX0=
