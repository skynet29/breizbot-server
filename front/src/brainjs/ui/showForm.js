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

		const divField = $('<div>', {class: 'bn-flex-row bn-space-between'}).appendTo(form)
		$('<label>').text(label).appendTo(divField)

		if (input === 'input') {
			$('<input>')
				.width(100)
				.attr(attrs)
				.attr('name', fieldName)
				.val(value)
				.prop('required', true)
				.appendTo(divField)
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
