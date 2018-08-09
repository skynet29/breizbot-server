
$$.registerControlEx('MilSymbolControl', {
	deps: ['MilSymbolService'],
	props: {
		size: {val: 20, set: 'setSize'},
		sidc: {val: '', set: 'setSIDC'},
		uniqueDesignation: {val: '', set: 'setUniqueDesignation'}
	},
	iface: 'setSIDC(sidc);setSize(size);setUniqueDesignation(name)',


	
	lib: 'milsymbol',
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




//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1pbHN5bWJvbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWlsc3ltYm9sLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG4kJC5yZWdpc3RlckNvbnRyb2xFeCgnTWlsU3ltYm9sQ29udHJvbCcsIHtcblx0ZGVwczogWydNaWxTeW1ib2xTZXJ2aWNlJ10sXG5cdHByb3BzOiB7XG5cdFx0c2l6ZToge3ZhbDogMjAsIHNldDogJ3NldFNpemUnfSxcblx0XHRzaWRjOiB7dmFsOiAnJywgc2V0OiAnc2V0U0lEQyd9LFxuXHRcdHVuaXF1ZURlc2lnbmF0aW9uOiB7dmFsOiAnJywgc2V0OiAnc2V0VW5pcXVlRGVzaWduYXRpb24nfVxuXHR9LFxuXHRpZmFjZTogJ3NldFNJREMoc2lkYyk7c2V0U2l6ZShzaXplKTtzZXRVbmlxdWVEZXNpZ25hdGlvbihuYW1lKScsXG5cblxuXHRcblx0bGliOiAnbWlsc3ltYm9sJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgZGF0YSwgbXMpIHtcblxuXHRcdGZ1bmN0aW9uIGNyZWF0ZVN5bWJvbENvZGUoKSB7XG5cdFx0XHQvL2NvbnNvbGUubG9nKCdjcmVhdGVTeW1ib2xDb2RlJywgb3B0aW9ucylcblxuXG5cdFx0XHR2YXIgc3ltYm9sID0gbmV3IG1zLlN5bWJvbChkYXRhLnNpZGMsIHtcblx0XHRcdFx0c2l6ZTogZGF0YS5zaXplLFxuXHRcdFx0XHR1bmlxdWVEZXNpZ25hdGlvbjogZGF0YS51bmlxdWVEZXNpZ25hdGlvblxuXHRcdFx0fSlcblx0XHRcdHJldHVybiBzeW1ib2xcblx0XHR9XG5cblx0XHR2YXIgc3ltYm9sID0gY3JlYXRlU3ltYm9sQ29kZSgpXG5cdFx0dmFyIGltZyA9ICQoJzxpbWc+Jylcblx0XHRcdC5hdHRyKCdzcmMnLCBzeW1ib2wudG9EYXRhVVJMKCkpXG5cdFx0XHQuYXBwZW5kVG8oZWx0KVxuXG5cblx0XHR0aGlzLnNldFNpemUgPSBmdW5jdGlvbihzaXplKSB7XG5cdFx0XHRkYXRhLnNpemUgPSBzaXplXG5cdFx0XHRzeW1ib2wuc2V0T3B0aW9ucyh7c2l6ZTogc2l6ZX0pXG5cdFx0XHRpbWcuYXR0cignc3JjJywgc3ltYm9sLnRvRGF0YVVSTCgpKVxuXHRcdH1cblxuXHRcdHRoaXMuc2V0VW5pcXVlRGVzaWduYXRpb24gPSBmdW5jdGlvbih1bmlxdWVEZXNpZ25hdGlvbikge1xuXHRcdFx0ZGF0YS51bmlxdWVEZXNpZ25hdGlvbiA9IHVuaXF1ZURlc2lnbmF0aW9uXG5cdFx0XHRzeW1ib2wuc2V0T3B0aW9ucyh7dW5pcXVlRGVzaWduYXRpb246IHVuaXF1ZURlc2lnbmF0aW9ufSlcblx0XHRcdGltZy5hdHRyKCdzcmMnLCBzeW1ib2wudG9EYXRhVVJMKCkpXG5cdFx0fVxuXG5cdFx0dGhpcy5zZXRTSURDID0gZnVuY3Rpb24oc2lkYykge1xuXHRcdFx0ZGF0YS5zaWRjID0gc2lkY1xuXHRcdFx0c3ltYm9sID0gY3JlYXRlU3ltYm9sQ29kZSgpXG5cdFx0XHRpbWcuYXR0cignc3JjJywgc3ltYm9sLnRvRGF0YVVSTCgpKVxuXHRcdH1cblxuXG5cdH1cbn0pO1xuXG5cblxuIl19
