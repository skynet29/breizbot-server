
$$.registerControlEx('MilSymbolControl', {
	deps: ['MilSymbolService'],
	props: {
		size: {val: 20, set: 'setSize'},
		sidc: {val: '', set: 'setSIDC'},
		uniqueDesignation: {val: '', set: 'setUniqueDesignation'}
	},
	iface: 'setSIDC(sidc);setSize(size);setUniqueDesignation(name)',


	init: function(elt, data, ms) {

		function createSymbolCode() {
			//console.log('createSymbolCode', options)


			var symbol = new ms.Symbol(data.sidc, {
				size: data.size,
				uniqueDesignation: data.uniqueDesignation
			})
			return symbol
		}

		var symbol = createSymbolCode()
		var img = $('<img>')
			.attr('src', symbol.toDataURL())
			.appendTo(elt)


		this.setSize = function(size) {
			data.size = size
			symbol.setOptions({size: size})
			img.attr('src', symbol.toDataURL())
		}

		this.setUniqueDesignation = function(uniqueDesignation) {
			data.uniqueDesignation = uniqueDesignation
			symbol.setOptions({uniqueDesignation: uniqueDesignation})
			img.attr('src', symbol.toDataURL())
		}

		this.setSIDC = function(sidc) {
			data.sidc = sidc
			symbol = createSymbolCode()
			img.attr('src', symbol.toDataURL())
		}


	}
});



