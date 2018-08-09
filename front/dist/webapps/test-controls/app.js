$$.configReady(function(config) {


	var dialogCtrl = $$.formDialogController('Create new user', {
		template: "<fieldset>\n	<div bn-control=\"InputGroupControl\">\n	  <label>Name</label>\n	  <input type=\"text\" name=\"name\" value=\"Jane Smith\" required=\"\">\n	</div>\n\n	<div bn-control=\"InputGroupControl\">\n	  <label >Email</label>\n	  <input type=\"text\" name=\"email\" value=\"jane@smith.com\" required=\"\">		     		\n	</div>\n\n	<div bn-control=\"InputGroupControl\">\n	  <label>Password</label>\n	  <input type=\"password\" name=\"password\" value=\"xxxxxxx\">		     		\n	</div>\n\n</fieldset>\n",
		onApply: function(data) {
			console.log('onApply', data)
		}
	})

	var ctrl = window.app = $$.viewController('body', {
		template: "<div id=\"main\" style=\"padding: 10px\" class=\"scrollPanel\">\n\n	<h1>PictureCarouselControl</h1>\n	<div bn-control=\"PictureCarouselControl\" data-animate-delay=\"1000\" data-index=\"1\" bn-data=\"images: images\">\n\n	</div>\n\n	<h1>SliderControl</h1>\n	<p>Range: <span bn-text=\"range\"></span></p>\n	<div bn-control=\"SliderControl\" data-max=\"150\" data-orientation=\"horizontal\" data-range=\"false\" bn-val=\"sliderValue\" bn-update=\"input\"></div>\n\n	<h1>DialogControl</h1>\n 	<button bn-event=\"click: onOpenDialog\">Open Dialog</button>\n 	<div bn-control=\"DialogControl\" title=\"Dialog\" bn-iface=\"dialogCtrl\" bn-options=\"dialogCtrlOptions\">\n 		<p>Hello World</p>\n 	</div>\n\n 	<h1>FormDialogController</h1>\n 	<button bn-event=\"click: onCreateNewUser\">Create new user</button>\n\n\n 	<h1>AccordionControl</h1>\n 	<div bn-control=\"AccordionControl\" bn-options=\"accordionCtrlOptions\">\n 		<div title=\"Section 1\">\n 			<p>\n 			Mauris mauris ante, blandit et, ultrices a, suscipit eget, quam. Integer\n    		ut neque. Vivamus nisi metus, molestie vel, gravida in, condimentum sit\n    		amet, nunc. Nam a nibh. Donec suscipit eros. Nam mi. Proin viverra leo ut\n    		odio. Curabitur malesuada. Vestibulum a velit eu ante scelerisque vulputate.\n	    	</p>\n 		</div>\n	<div title=\"Section 2\">\n 			<p>    Sed non urna. Donec et ante. Phasellus eu ligula. Vestibulum sit amet\n    purus. Vivamus hendrerit, dolor at aliquet laoreet, mauris turpis porttitor\n    velit, faucibus interdum tellus libero ac justo. Vivamus non quam. In\n    suscipit faucibus urna.\n	    	</p>\n 		</div>\n 	 </div>\n\n\n	<h1>TabControl</h1>\n\n	<div bn-control=\"TabControl\" bn-iface=\"tabCtrl\" bn-event=\"activate: onTabCtrlActivate\">\n		<div title=\"Circle\">\n			<svg width=\"200\" height=\"100\">\n				<circle r=\"20\" cx=\"100\" cy=\"50\"></circle>	\n			</svg>\n		</div>\n		<div title=\"Rectangle\" data-removable=\"true\">\n			<svg width=\"200\" height=\"100\">\n				<rect x=\"10\" y=\"10\" width=\"100\" height=\"50\"></rect>	\n			</svg>\n			\n		</div>\n	</div>\n\n	<button bn-event=\"click: onAddTab\">Add Tab...</button>\n	<button bn-event=\"click: onRemoveSelTab\">Remove selected Tab</button>\n\n	<h1>TreeControl</h1>\n	<div bn-control=\"TreeControl\" bn-iface=\"treeCtrl\" bn-event=\"activate: onTreeCtrlActivate, contextMenuAction: onTreeCtrlContextMenuAction\" data-checkbox=\"true\" bn-options=\"treeCtrlOptions\">\n<!-- 		<ul>\n			<li class=\"folder\">Node 1\n				<ul>\n					<li>Node 1.1</li>\n					<li>Node 1.2</li>\n				</ul>\n			</li>\n\n			<li>Node 2</li>\n		</ul>\n -->	</div>\n\n 	<button bn-event=\"click: onAddNode\">Add Node...</button>\n 	<button bn-event=\"click: onRemoveSelNode\">Remove selected node</button>\n\n 	<h1>ToolbarControl</h1>\n\n 	<div bn-control=\"ToolbarControl\">\n 		<button title=\"Open\" bn-event=\"click: onOpenFile\"><i class=\"fa fa-folder-open\"></i></button>\n\n 		<button title=\"Cut\"><i class=\"fa fa-cut\"></i></button>\n 		<button title=\"Copy\"><i class=\"fa fa-copy\"></i></button>\n 		<button title=\"Paste\"><i class=\"fa fa-paste\"></i></button>\n		<select id=\"car-type\">\n			<option>Compact car</option>\n			<option>Midsize car</option>\n			<option>Full size car</option>\n			<option>SUV</option>\n			<option>Luxury</option>\n			<option>Truck</option>\n			<option>Van</option>\n		</select> 		\n\n 	</div>\n\n 	<h1>DatePickerControl</h1>\n 	<p>Date: <input type=\"text\" bn-control=\"DatePickerControl\" data-show-button-panel=\"true\" bn-event=\"change: onDatePickerChange\" bn-val=\"date\"></p>\n\n 	<h1>InputGroupControl</h1>\n 	<div bn-control=\"InputGroupControl\">\n 		<label>Name</label>\n 		<input type=\"text\">\n 	</div>\n\n 	<h1>SpinnerControl</h1>\n 	<p>\n 		<label>Value</label>\n 		<input type=\"number\" bn-control=\"SpinnerControl\" bn-event=\"spinstop: onSpinnerValueChange\" value=\"5\" max=\"10\" step=\"0.01\"> 		\n 	</p>\n\n<!--  	<h1>TimeSpinnerControl</h1>\n 	<p>\n 		<label>Value</label>\n 		<input bn-control=\"TimeSpinnerControl\"> 		\n 	</p> -->\n\n</div>",
		events: {
			onAddTab: function() {
				$$.showPrompt('Tab title', 'Add Tab', function(title) {
					ctrl.scope.tabCtrl.addTab(title, {removable: false})
				})					
				
			},
			onRemoveSelTab: function() {
				var tabIndex = ctrl.scope.tabCtrl.getSelectedTabIndex()
				console.log('tabIndex', tabIndex)
				ctrl.scope.tabCtrl.removeTab(tabIndex)
			},
			onTabCtrlActivate: function() {
				console.log('onTabCtrlActivate', this.getSelectedTabIndex())
			},
			onTreeCtrlActivate: function() {
				console.log('onTreeCtrlActivate', this.getActiveNode().title)
			},
			onAddNode: function() {
				var activeNode = ctrl.scope.treeCtrl.getActiveNode()
				if (activeNode != null) {
					$$.showPrompt('Node title', 'Add Node', function(value) {
						activeNode.addNode({title: value})
						activeNode.setExpanded(true)
					})					
				}

			},
			onRemoveSelNode: function() {
				var activeNode = ctrl.scope.treeCtrl.getActiveNode()
				if (activeNode != null) {
					activeNode.remove()
				}
			},
			onTreeCtrlContextMenuAction: function(node, action) {
				console.log('onTreeCtrlContextMenuAction', node.title, action)
			},
			onDatePickerChange: function() {
				console.log('onDatePickerChange', $(this).getValue())
			},
			onSpinnerValueChange: function() {
				console.log('onSpinnerValueChange', $(this).getValue())	
			},
			onCreateNewUser: function() {
				console.log('onCreateNewUser')	

				dialogCtrl.show({name: 'Marc Delomez', email:'marc.delomez@thalesgroup.com'})
			},
			onOpenFile: function() {
				console.log('onOpenFile')
				$$.openFileDialog(function(fileName) {
					console.log('fileName', fileName)
					$$.readTextFile(fileName, function(text) {
						console.log('text', text)
					})
				})
			},
			onOpenDialog: function() {
				console.log('onOpenDialog')
				ctrl.scope.dialogCtrl.open()
			}

		},
		rules: {
			range: 'sliderValue'
		},
		data: {
			range: function() {
				return `${this.sliderValue[0]} - ${this.sliderValue[1]}`
			},
			date: new Date(1972, 0, 3),
			treeCtrlOptions: {
				selectMode: 1,
				source: [
					{title: 'Node 1', folder: true, children: [
						{title: 'Node 1.1'},
						{title: 'Node 1.2'}
					]},
					{title: 'Node 2'}
				],
				contextMenu: {
					menu: {
						edit: {name: 'Edit', icon: 'edit'},
						cut: {name: 'Cut', icon: 'cut'}
					}
/*					menu: function(node) {
						console.log('menu', node)
						return {
							paste: {name: 'Paste', icon: 'paste'},

						}
					}
*/				}
			},
			accordionCtrlOptions: {
				icons: {
      				header: "ui-icon-circle-arrow-e",
			      	activeHeader: "ui-icon-circle-arrow-s"
    			}
			},
			dialogCtrlOptions: {
				buttons: {
					'Cancel': function() {
						this.close()
					}
				}
			},
			sliderValue: [30, 60],
			images: ['image1.png', 'image2.png', 'image3.png', 'image4.png'].map((i) => '/pages/test-controls/assets/' + i)
		}

	})
})

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJCQuY29uZmlnUmVhZHkoZnVuY3Rpb24oY29uZmlnKSB7XG5cblxuXHR2YXIgZGlhbG9nQ3RybCA9ICQkLmZvcm1EaWFsb2dDb250cm9sbGVyKCdDcmVhdGUgbmV3IHVzZXInLCB7XG5cdFx0dGVtcGxhdGU6IFwiPGZpZWxkc2V0Plxcblx0PGRpdiBibi1jb250cm9sPVxcXCJJbnB1dEdyb3VwQ29udHJvbFxcXCI+XFxuXHQgIDxsYWJlbD5OYW1lPC9sYWJlbD5cXG5cdCAgPGlucHV0IHR5cGU9XFxcInRleHRcXFwiIG5hbWU9XFxcIm5hbWVcXFwiIHZhbHVlPVxcXCJKYW5lIFNtaXRoXFxcIiByZXF1aXJlZD1cXFwiXFxcIj5cXG5cdDwvZGl2Plxcblxcblx0PGRpdiBibi1jb250cm9sPVxcXCJJbnB1dEdyb3VwQ29udHJvbFxcXCI+XFxuXHQgIDxsYWJlbCA+RW1haWw8L2xhYmVsPlxcblx0ICA8aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgbmFtZT1cXFwiZW1haWxcXFwiIHZhbHVlPVxcXCJqYW5lQHNtaXRoLmNvbVxcXCIgcmVxdWlyZWQ9XFxcIlxcXCI+XHRcdCAgICAgXHRcdFxcblx0PC9kaXY+XFxuXFxuXHQ8ZGl2IGJuLWNvbnRyb2w9XFxcIklucHV0R3JvdXBDb250cm9sXFxcIj5cXG5cdCAgPGxhYmVsPlBhc3N3b3JkPC9sYWJlbD5cXG5cdCAgPGlucHV0IHR5cGU9XFxcInBhc3N3b3JkXFxcIiBuYW1lPVxcXCJwYXNzd29yZFxcXCIgdmFsdWU9XFxcInh4eHh4eHhcXFwiPlx0XHQgICAgIFx0XHRcXG5cdDwvZGl2PlxcblxcbjwvZmllbGRzZXQ+XFxuXCIsXG5cdFx0b25BcHBseTogZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0Y29uc29sZS5sb2coJ29uQXBwbHknLCBkYXRhKVxuXHRcdH1cblx0fSlcblxuXHR2YXIgY3RybCA9IHdpbmRvdy5hcHAgPSAkJC52aWV3Q29udHJvbGxlcignYm9keScsIHtcblx0XHR0ZW1wbGF0ZTogXCI8ZGl2IGlkPVxcXCJtYWluXFxcIiBzdHlsZT1cXFwicGFkZGluZzogMTBweFxcXCIgY2xhc3M9XFxcInNjcm9sbFBhbmVsXFxcIj5cXG5cXG5cdDxoMT5QaWN0dXJlQ2Fyb3VzZWxDb250cm9sPC9oMT5cXG5cdDxkaXYgYm4tY29udHJvbD1cXFwiUGljdHVyZUNhcm91c2VsQ29udHJvbFxcXCIgZGF0YS1hbmltYXRlLWRlbGF5PVxcXCIxMDAwXFxcIiBkYXRhLWluZGV4PVxcXCIxXFxcIiBibi1kYXRhPVxcXCJpbWFnZXM6IGltYWdlc1xcXCI+XFxuXFxuXHQ8L2Rpdj5cXG5cXG5cdDxoMT5TbGlkZXJDb250cm9sPC9oMT5cXG5cdDxwPlJhbmdlOiA8c3BhbiBibi10ZXh0PVxcXCJyYW5nZVxcXCI+PC9zcGFuPjwvcD5cXG5cdDxkaXYgYm4tY29udHJvbD1cXFwiU2xpZGVyQ29udHJvbFxcXCIgZGF0YS1tYXg9XFxcIjE1MFxcXCIgZGF0YS1vcmllbnRhdGlvbj1cXFwiaG9yaXpvbnRhbFxcXCIgZGF0YS1yYW5nZT1cXFwiZmFsc2VcXFwiIGJuLXZhbD1cXFwic2xpZGVyVmFsdWVcXFwiIGJuLXVwZGF0ZT1cXFwiaW5wdXRcXFwiPjwvZGl2Plxcblxcblx0PGgxPkRpYWxvZ0NvbnRyb2w8L2gxPlxcbiBcdDxidXR0b24gYm4tZXZlbnQ9XFxcImNsaWNrOiBvbk9wZW5EaWFsb2dcXFwiPk9wZW4gRGlhbG9nPC9idXR0b24+XFxuIFx0PGRpdiBibi1jb250cm9sPVxcXCJEaWFsb2dDb250cm9sXFxcIiB0aXRsZT1cXFwiRGlhbG9nXFxcIiBibi1pZmFjZT1cXFwiZGlhbG9nQ3RybFxcXCIgYm4tb3B0aW9ucz1cXFwiZGlhbG9nQ3RybE9wdGlvbnNcXFwiPlxcbiBcdFx0PHA+SGVsbG8gV29ybGQ8L3A+XFxuIFx0PC9kaXY+XFxuXFxuIFx0PGgxPkZvcm1EaWFsb2dDb250cm9sbGVyPC9oMT5cXG4gXHQ8YnV0dG9uIGJuLWV2ZW50PVxcXCJjbGljazogb25DcmVhdGVOZXdVc2VyXFxcIj5DcmVhdGUgbmV3IHVzZXI8L2J1dHRvbj5cXG5cXG5cXG4gXHQ8aDE+QWNjb3JkaW9uQ29udHJvbDwvaDE+XFxuIFx0PGRpdiBibi1jb250cm9sPVxcXCJBY2NvcmRpb25Db250cm9sXFxcIiBibi1vcHRpb25zPVxcXCJhY2NvcmRpb25DdHJsT3B0aW9uc1xcXCI+XFxuIFx0XHQ8ZGl2IHRpdGxlPVxcXCJTZWN0aW9uIDFcXFwiPlxcbiBcdFx0XHQ8cD5cXG4gXHRcdFx0TWF1cmlzIG1hdXJpcyBhbnRlLCBibGFuZGl0IGV0LCB1bHRyaWNlcyBhLCBzdXNjaXBpdCBlZ2V0LCBxdWFtLiBJbnRlZ2VyXFxuICAgIFx0XHR1dCBuZXF1ZS4gVml2YW11cyBuaXNpIG1ldHVzLCBtb2xlc3RpZSB2ZWwsIGdyYXZpZGEgaW4sIGNvbmRpbWVudHVtIHNpdFxcbiAgICBcdFx0YW1ldCwgbnVuYy4gTmFtIGEgbmliaC4gRG9uZWMgc3VzY2lwaXQgZXJvcy4gTmFtIG1pLiBQcm9pbiB2aXZlcnJhIGxlbyB1dFxcbiAgICBcdFx0b2Rpby4gQ3VyYWJpdHVyIG1hbGVzdWFkYS4gVmVzdGlidWx1bSBhIHZlbGl0IGV1IGFudGUgc2NlbGVyaXNxdWUgdnVscHV0YXRlLlxcblx0ICAgIFx0PC9wPlxcbiBcdFx0PC9kaXY+XFxuXHQ8ZGl2IHRpdGxlPVxcXCJTZWN0aW9uIDJcXFwiPlxcbiBcdFx0XHQ8cD4gICAgU2VkIG5vbiB1cm5hLiBEb25lYyBldCBhbnRlLiBQaGFzZWxsdXMgZXUgbGlndWxhLiBWZXN0aWJ1bHVtIHNpdCBhbWV0XFxuICAgIHB1cnVzLiBWaXZhbXVzIGhlbmRyZXJpdCwgZG9sb3IgYXQgYWxpcXVldCBsYW9yZWV0LCBtYXVyaXMgdHVycGlzIHBvcnR0aXRvclxcbiAgICB2ZWxpdCwgZmF1Y2lidXMgaW50ZXJkdW0gdGVsbHVzIGxpYmVybyBhYyBqdXN0by4gVml2YW11cyBub24gcXVhbS4gSW5cXG4gICAgc3VzY2lwaXQgZmF1Y2lidXMgdXJuYS5cXG5cdCAgICBcdDwvcD5cXG4gXHRcdDwvZGl2PlxcbiBcdCA8L2Rpdj5cXG5cXG5cXG5cdDxoMT5UYWJDb250cm9sPC9oMT5cXG5cXG5cdDxkaXYgYm4tY29udHJvbD1cXFwiVGFiQ29udHJvbFxcXCIgYm4taWZhY2U9XFxcInRhYkN0cmxcXFwiIGJuLWV2ZW50PVxcXCJhY3RpdmF0ZTogb25UYWJDdHJsQWN0aXZhdGVcXFwiPlxcblx0XHQ8ZGl2IHRpdGxlPVxcXCJDaXJjbGVcXFwiPlxcblx0XHRcdDxzdmcgd2lkdGg9XFxcIjIwMFxcXCIgaGVpZ2h0PVxcXCIxMDBcXFwiPlxcblx0XHRcdFx0PGNpcmNsZSByPVxcXCIyMFxcXCIgY3g9XFxcIjEwMFxcXCIgY3k9XFxcIjUwXFxcIj48L2NpcmNsZT5cdFxcblx0XHRcdDwvc3ZnPlxcblx0XHQ8L2Rpdj5cXG5cdFx0PGRpdiB0aXRsZT1cXFwiUmVjdGFuZ2xlXFxcIiBkYXRhLXJlbW92YWJsZT1cXFwidHJ1ZVxcXCI+XFxuXHRcdFx0PHN2ZyB3aWR0aD1cXFwiMjAwXFxcIiBoZWlnaHQ9XFxcIjEwMFxcXCI+XFxuXHRcdFx0XHQ8cmVjdCB4PVxcXCIxMFxcXCIgeT1cXFwiMTBcXFwiIHdpZHRoPVxcXCIxMDBcXFwiIGhlaWdodD1cXFwiNTBcXFwiPjwvcmVjdD5cdFxcblx0XHRcdDwvc3ZnPlxcblx0XHRcdFxcblx0XHQ8L2Rpdj5cXG5cdDwvZGl2Plxcblxcblx0PGJ1dHRvbiBibi1ldmVudD1cXFwiY2xpY2s6IG9uQWRkVGFiXFxcIj5BZGQgVGFiLi4uPC9idXR0b24+XFxuXHQ8YnV0dG9uIGJuLWV2ZW50PVxcXCJjbGljazogb25SZW1vdmVTZWxUYWJcXFwiPlJlbW92ZSBzZWxlY3RlZCBUYWI8L2J1dHRvbj5cXG5cXG5cdDxoMT5UcmVlQ29udHJvbDwvaDE+XFxuXHQ8ZGl2IGJuLWNvbnRyb2w9XFxcIlRyZWVDb250cm9sXFxcIiBibi1pZmFjZT1cXFwidHJlZUN0cmxcXFwiIGJuLWV2ZW50PVxcXCJhY3RpdmF0ZTogb25UcmVlQ3RybEFjdGl2YXRlLCBjb250ZXh0TWVudUFjdGlvbjogb25UcmVlQ3RybENvbnRleHRNZW51QWN0aW9uXFxcIiBkYXRhLWNoZWNrYm94PVxcXCJ0cnVlXFxcIiBibi1vcHRpb25zPVxcXCJ0cmVlQ3RybE9wdGlvbnNcXFwiPlxcbjwhLS0gXHRcdDx1bD5cXG5cdFx0XHQ8bGkgY2xhc3M9XFxcImZvbGRlclxcXCI+Tm9kZSAxXFxuXHRcdFx0XHQ8dWw+XFxuXHRcdFx0XHRcdDxsaT5Ob2RlIDEuMTwvbGk+XFxuXHRcdFx0XHRcdDxsaT5Ob2RlIDEuMjwvbGk+XFxuXHRcdFx0XHQ8L3VsPlxcblx0XHRcdDwvbGk+XFxuXFxuXHRcdFx0PGxpPk5vZGUgMjwvbGk+XFxuXHRcdDwvdWw+XFxuIC0tPlx0PC9kaXY+XFxuXFxuIFx0PGJ1dHRvbiBibi1ldmVudD1cXFwiY2xpY2s6IG9uQWRkTm9kZVxcXCI+QWRkIE5vZGUuLi48L2J1dHRvbj5cXG4gXHQ8YnV0dG9uIGJuLWV2ZW50PVxcXCJjbGljazogb25SZW1vdmVTZWxOb2RlXFxcIj5SZW1vdmUgc2VsZWN0ZWQgbm9kZTwvYnV0dG9uPlxcblxcbiBcdDxoMT5Ub29sYmFyQ29udHJvbDwvaDE+XFxuXFxuIFx0PGRpdiBibi1jb250cm9sPVxcXCJUb29sYmFyQ29udHJvbFxcXCI+XFxuIFx0XHQ8YnV0dG9uIHRpdGxlPVxcXCJPcGVuXFxcIiBibi1ldmVudD1cXFwiY2xpY2s6IG9uT3BlbkZpbGVcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1mb2xkZXItb3BlblxcXCI+PC9pPjwvYnV0dG9uPlxcblxcbiBcdFx0PGJ1dHRvbiB0aXRsZT1cXFwiQ3V0XFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtY3V0XFxcIj48L2k+PC9idXR0b24+XFxuIFx0XHQ8YnV0dG9uIHRpdGxlPVxcXCJDb3B5XFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtY29weVxcXCI+PC9pPjwvYnV0dG9uPlxcbiBcdFx0PGJ1dHRvbiB0aXRsZT1cXFwiUGFzdGVcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1wYXN0ZVxcXCI+PC9pPjwvYnV0dG9uPlxcblx0XHQ8c2VsZWN0IGlkPVxcXCJjYXItdHlwZVxcXCI+XFxuXHRcdFx0PG9wdGlvbj5Db21wYWN0IGNhcjwvb3B0aW9uPlxcblx0XHRcdDxvcHRpb24+TWlkc2l6ZSBjYXI8L29wdGlvbj5cXG5cdFx0XHQ8b3B0aW9uPkZ1bGwgc2l6ZSBjYXI8L29wdGlvbj5cXG5cdFx0XHQ8b3B0aW9uPlNVVjwvb3B0aW9uPlxcblx0XHRcdDxvcHRpb24+THV4dXJ5PC9vcHRpb24+XFxuXHRcdFx0PG9wdGlvbj5UcnVjazwvb3B0aW9uPlxcblx0XHRcdDxvcHRpb24+VmFuPC9vcHRpb24+XFxuXHRcdDwvc2VsZWN0PiBcdFx0XFxuXFxuIFx0PC9kaXY+XFxuXFxuIFx0PGgxPkRhdGVQaWNrZXJDb250cm9sPC9oMT5cXG4gXHQ8cD5EYXRlOiA8aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgYm4tY29udHJvbD1cXFwiRGF0ZVBpY2tlckNvbnRyb2xcXFwiIGRhdGEtc2hvdy1idXR0b24tcGFuZWw9XFxcInRydWVcXFwiIGJuLWV2ZW50PVxcXCJjaGFuZ2U6IG9uRGF0ZVBpY2tlckNoYW5nZVxcXCIgYm4tdmFsPVxcXCJkYXRlXFxcIj48L3A+XFxuXFxuIFx0PGgxPklucHV0R3JvdXBDb250cm9sPC9oMT5cXG4gXHQ8ZGl2IGJuLWNvbnRyb2w9XFxcIklucHV0R3JvdXBDb250cm9sXFxcIj5cXG4gXHRcdDxsYWJlbD5OYW1lPC9sYWJlbD5cXG4gXHRcdDxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIj5cXG4gXHQ8L2Rpdj5cXG5cXG4gXHQ8aDE+U3Bpbm5lckNvbnRyb2w8L2gxPlxcbiBcdDxwPlxcbiBcdFx0PGxhYmVsPlZhbHVlPC9sYWJlbD5cXG4gXHRcdDxpbnB1dCB0eXBlPVxcXCJudW1iZXJcXFwiIGJuLWNvbnRyb2w9XFxcIlNwaW5uZXJDb250cm9sXFxcIiBibi1ldmVudD1cXFwic3BpbnN0b3A6IG9uU3Bpbm5lclZhbHVlQ2hhbmdlXFxcIiB2YWx1ZT1cXFwiNVxcXCIgbWF4PVxcXCIxMFxcXCIgc3RlcD1cXFwiMC4wMVxcXCI+IFx0XHRcXG4gXHQ8L3A+XFxuXFxuPCEtLSAgXHQ8aDE+VGltZVNwaW5uZXJDb250cm9sPC9oMT5cXG4gXHQ8cD5cXG4gXHRcdDxsYWJlbD5WYWx1ZTwvbGFiZWw+XFxuIFx0XHQ8aW5wdXQgYm4tY29udHJvbD1cXFwiVGltZVNwaW5uZXJDb250cm9sXFxcIj4gXHRcdFxcbiBcdDwvcD4gLS0+XFxuXFxuPC9kaXY+XCIsXG5cdFx0ZXZlbnRzOiB7XG5cdFx0XHRvbkFkZFRhYjogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdCQkLnNob3dQcm9tcHQoJ1RhYiB0aXRsZScsICdBZGQgVGFiJywgZnVuY3Rpb24odGl0bGUpIHtcblx0XHRcdFx0XHRjdHJsLnNjb3BlLnRhYkN0cmwuYWRkVGFiKHRpdGxlLCB7cmVtb3ZhYmxlOiBmYWxzZX0pXG5cdFx0XHRcdH0pXHRcdFx0XHRcdFxuXHRcdFx0XHRcblx0XHRcdH0sXG5cdFx0XHRvblJlbW92ZVNlbFRhYjogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZhciB0YWJJbmRleCA9IGN0cmwuc2NvcGUudGFiQ3RybC5nZXRTZWxlY3RlZFRhYkluZGV4KClcblx0XHRcdFx0Y29uc29sZS5sb2coJ3RhYkluZGV4JywgdGFiSW5kZXgpXG5cdFx0XHRcdGN0cmwuc2NvcGUudGFiQ3RybC5yZW1vdmVUYWIodGFiSW5kZXgpXG5cdFx0XHR9LFxuXHRcdFx0b25UYWJDdHJsQWN0aXZhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRjb25zb2xlLmxvZygnb25UYWJDdHJsQWN0aXZhdGUnLCB0aGlzLmdldFNlbGVjdGVkVGFiSW5kZXgoKSlcblx0XHRcdH0sXG5cdFx0XHRvblRyZWVDdHJsQWN0aXZhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRjb25zb2xlLmxvZygnb25UcmVlQ3RybEFjdGl2YXRlJywgdGhpcy5nZXRBY3RpdmVOb2RlKCkudGl0bGUpXG5cdFx0XHR9LFxuXHRcdFx0b25BZGROb2RlOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIGFjdGl2ZU5vZGUgPSBjdHJsLnNjb3BlLnRyZWVDdHJsLmdldEFjdGl2ZU5vZGUoKVxuXHRcdFx0XHRpZiAoYWN0aXZlTm9kZSAhPSBudWxsKSB7XG5cdFx0XHRcdFx0JCQuc2hvd1Byb21wdCgnTm9kZSB0aXRsZScsICdBZGQgTm9kZScsIGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHRcdFx0XHRhY3RpdmVOb2RlLmFkZE5vZGUoe3RpdGxlOiB2YWx1ZX0pXG5cdFx0XHRcdFx0XHRhY3RpdmVOb2RlLnNldEV4cGFuZGVkKHRydWUpXG5cdFx0XHRcdFx0fSlcdFx0XHRcdFx0XG5cdFx0XHRcdH1cblxuXHRcdFx0fSxcblx0XHRcdG9uUmVtb3ZlU2VsTm9kZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZhciBhY3RpdmVOb2RlID0gY3RybC5zY29wZS50cmVlQ3RybC5nZXRBY3RpdmVOb2RlKClcblx0XHRcdFx0aWYgKGFjdGl2ZU5vZGUgIT0gbnVsbCkge1xuXHRcdFx0XHRcdGFjdGl2ZU5vZGUucmVtb3ZlKClcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdG9uVHJlZUN0cmxDb250ZXh0TWVudUFjdGlvbjogZnVuY3Rpb24obm9kZSwgYWN0aW9uKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKCdvblRyZWVDdHJsQ29udGV4dE1lbnVBY3Rpb24nLCBub2RlLnRpdGxlLCBhY3Rpb24pXG5cdFx0XHR9LFxuXHRcdFx0b25EYXRlUGlja2VyQ2hhbmdlOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coJ29uRGF0ZVBpY2tlckNoYW5nZScsICQodGhpcykuZ2V0VmFsdWUoKSlcblx0XHRcdH0sXG5cdFx0XHRvblNwaW5uZXJWYWx1ZUNoYW5nZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKCdvblNwaW5uZXJWYWx1ZUNoYW5nZScsICQodGhpcykuZ2V0VmFsdWUoKSlcdFxuXHRcdFx0fSxcblx0XHRcdG9uQ3JlYXRlTmV3VXNlcjogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKCdvbkNyZWF0ZU5ld1VzZXInKVx0XG5cblx0XHRcdFx0ZGlhbG9nQ3RybC5zaG93KHtuYW1lOiAnTWFyYyBEZWxvbWV6JywgZW1haWw6J21hcmMuZGVsb21lekB0aGFsZXNncm91cC5jb20nfSlcblx0XHRcdH0sXG5cdFx0XHRvbk9wZW5GaWxlOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coJ29uT3BlbkZpbGUnKVxuXHRcdFx0XHQkJC5vcGVuRmlsZURpYWxvZyhmdW5jdGlvbihmaWxlTmFtZSkge1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCdmaWxlTmFtZScsIGZpbGVOYW1lKVxuXHRcdFx0XHRcdCQkLnJlYWRUZXh0RmlsZShmaWxlTmFtZSwgZnVuY3Rpb24odGV4dCkge1xuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ3RleHQnLCB0ZXh0KVxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdH0pXG5cdFx0XHR9LFxuXHRcdFx0b25PcGVuRGlhbG9nOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coJ29uT3BlbkRpYWxvZycpXG5cdFx0XHRcdGN0cmwuc2NvcGUuZGlhbG9nQ3RybC5vcGVuKClcblx0XHRcdH1cblxuXHRcdH0sXG5cdFx0cnVsZXM6IHtcblx0XHRcdHJhbmdlOiAnc2xpZGVyVmFsdWUnXG5cdFx0fSxcblx0XHRkYXRhOiB7XG5cdFx0XHRyYW5nZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHJldHVybiBgJHt0aGlzLnNsaWRlclZhbHVlWzBdfSAtICR7dGhpcy5zbGlkZXJWYWx1ZVsxXX1gXG5cdFx0XHR9LFxuXHRcdFx0ZGF0ZTogbmV3IERhdGUoMTk3MiwgMCwgMyksXG5cdFx0XHR0cmVlQ3RybE9wdGlvbnM6IHtcblx0XHRcdFx0c2VsZWN0TW9kZTogMSxcblx0XHRcdFx0c291cmNlOiBbXG5cdFx0XHRcdFx0e3RpdGxlOiAnTm9kZSAxJywgZm9sZGVyOiB0cnVlLCBjaGlsZHJlbjogW1xuXHRcdFx0XHRcdFx0e3RpdGxlOiAnTm9kZSAxLjEnfSxcblx0XHRcdFx0XHRcdHt0aXRsZTogJ05vZGUgMS4yJ31cblx0XHRcdFx0XHRdfSxcblx0XHRcdFx0XHR7dGl0bGU6ICdOb2RlIDInfVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRjb250ZXh0TWVudToge1xuXHRcdFx0XHRcdG1lbnU6IHtcblx0XHRcdFx0XHRcdGVkaXQ6IHtuYW1lOiAnRWRpdCcsIGljb246ICdlZGl0J30sXG5cdFx0XHRcdFx0XHRjdXQ6IHtuYW1lOiAnQ3V0JywgaWNvbjogJ2N1dCd9XG5cdFx0XHRcdFx0fVxuLypcdFx0XHRcdFx0bWVudTogZnVuY3Rpb24obm9kZSkge1xuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ21lbnUnLCBub2RlKVxuXHRcdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdFx0cGFzdGU6IHtuYW1lOiAnUGFzdGUnLCBpY29uOiAncGFzdGUnfSxcblxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cbiovXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0YWNjb3JkaW9uQ3RybE9wdGlvbnM6IHtcblx0XHRcdFx0aWNvbnM6IHtcbiAgICAgIFx0XHRcdFx0aGVhZGVyOiBcInVpLWljb24tY2lyY2xlLWFycm93LWVcIixcblx0XHRcdCAgICAgIFx0YWN0aXZlSGVhZGVyOiBcInVpLWljb24tY2lyY2xlLWFycm93LXNcIlxuICAgIFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRkaWFsb2dDdHJsT3B0aW9uczoge1xuXHRcdFx0XHRidXR0b25zOiB7XG5cdFx0XHRcdFx0J0NhbmNlbCc6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0dGhpcy5jbG9zZSgpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0c2xpZGVyVmFsdWU6IFszMCwgNjBdLFxuXHRcdFx0aW1hZ2VzOiBbJ2ltYWdlMS5wbmcnLCAnaW1hZ2UyLnBuZycsICdpbWFnZTMucG5nJywgJ2ltYWdlNC5wbmcnXS5tYXAoKGkpID0+ICcvcGFnZXMvdGVzdC1jb250cm9scy9hc3NldHMvJyArIGkpXG5cdFx0fVxuXG5cdH0pXG59KVxuIl19
