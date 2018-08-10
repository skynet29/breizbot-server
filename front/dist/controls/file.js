(function() {	

	$$.loadStyle('/controls/file.css')
})();
$$.registerControlEx('FileControl', {
	deps: ['FileService'], 
	options: {
		toolbar: true,
		imageOnly: false,
		maxUploadSize: 2*1024*2014 // 2 Mo		
	},
	events: 'fileClick',
	iface: 'getFiles()',

	
	lib: 'file',
init: function(elt, options, fileSrv) {

		var cutFiles = []
		var cutDir = '/'
		var copy = true

		function getSelFiles() {
			var selDiv = elt.find('.thumbnail.selected a')

			var selFile = []
			selDiv.each(function() {
				selFile.push(ctrl.model.rootDir + $(this).data('name'))
			})
			return selFile
		}


		var ctrl = window.fileCtrl = $$.viewController(elt, {
			template: "<div class=\"bn-flex-col\" style=\"height: 100%\">\n	<div class=\"bn-toolbar\">\n\n		<div class=\"subToolbar\" bn-show=\"showToolbar\">		\n\n			<div class=\"bn-btn w3-btn\" bn-event=\"click: onToggleSelMode\" >\n				<div class=\"bn-circle\"  bn-class=\"selected: selMode\">\n					<i class=\"fa fa-check\" ></i>\n				</div>\n\n\n				<span class=\"w3-text-white w3-tiny w3-center bn-xs-hide\" style=\"margin-top: 8px;\">Select Mode</span>\n				\n			</div>	\n\n\n			<div class=\"bn-btn w3-btn\" bn-event=\"click: onCancelSelection\" bn-prop=\"disabled: !canCancel\">\n				<div class=\"bn-circle\">\n					<i class=\"fa fa-times\" ></i>\n				</div>\n\n\n				<span class=\"w3-text-white w3-tiny w3-center bn-xs-hide\" style=\"margin-top: 8px;\">Cancel Selection</span>\n				\n			</div>	\n\n\n		</div>\n\n		<div class=\"subToolbar\" bn-show=\"showToolbar\">\n\n			<button class=\"bn-btn w3-btn\" bn-event=\"click: onDelete\" bn-prop=\"disabled: !fileSelected\" >\n				<div class=\"bn-circle\">\n					<i class=\"fa fa-trash\" ></i>\n				</div>\n\n\n				<span class=\"w3-text-white w3-tiny w3-center bn-xs-hide\" style=\"margin-top: 8px;\">Delete</span>\n				\n			</button>				\n\n			<button class=\"bn-btn w3-btn\" bn-event=\"click: onCut\" bn-prop=\"disabled: !fileSelected\" >\n				<div class=\"bn-circle\">\n					<i class=\"fa fa-cut\" ></i>\n				</div>\n\n\n				<span class=\"w3-text-white w3-tiny w3-center bn-xs-hide\" style=\"margin-top: 8px;\">Cut</span>\n				\n			</button>			\n\n			<button class=\"bn-btn w3-btn\" bn-event=\"click: onCopy\" bn-prop=\"disabled: !fileSelected\" >\n				<div class=\"bn-circle\">\n					<i class=\"fa fa-copy\" ></i>\n				</div>\n\n\n				<span class=\"w3-text-white w3-tiny w3-center bn-xs-hide\" style=\"margin-top: 8px;\">Copy</span>\n				\n			</button>	\n		\n\n			<button class=\"bn-btn w3-btn\" bn-event=\"click: onPaste\" bn-prop=\"disabled: !canPaste\" >\n				<div class=\"bn-circle\">\n					<i class=\"fa fa-paste\" ></i>\n				</div>\n\n\n				<span class=\"w3-text-white w3-tiny w3-center bn-xs-hide\" style=\"margin-top: 8px;\">Paste</span>\n				\n			</button>	\n\n\n		</div>\n\n		<div class=\"subToolbar\" bn-show=\"showToolbar\">\n\n			<button class=\"bn-btn w3-btn\" bn-event=\"click: onCreateFolder\">\n				<div class=\"bn-circle\">\n					<i class=\"fa fa-folder-open\" ></i>\n				</div>\n\n\n				<span class=\"w3-text-white w3-tiny w3-center bn-xs-hide\" style=\"margin-top: 8px;\">New Folder</span>\n				\n			</button>	\n\n			<button class=\"bn-btn w3-btn\" bn-event=\"click: onImportFile\">\n				<div class=\"bn-circle\">\n					<i class=\"fa fa-upload\" ></i>\n				</div>\n\n\n				<span class=\"w3-text-white w3-tiny w3-center bn-xs-hide\" style=\"margin-top: 8px;\">Import File</span>\n				\n			</button>							\n\n			\n\n		</div>\n\n		<div class=\"subToolbar\"  bn-show=\"backVisible\">\n\n			<button class=\"bn-btn w3-btn\" bn-event=\"click: onBackBtn\">\n				<div class=\"bn-circle\">\n					<i class=\"fa fa-arrow-left\" ></i>\n				</div>\n\n\n				<span class=\"w3-text-white w3-tiny w3-center bn-xs-hide\" style=\"margin-top: 8px;\">Top Folder</span>\n				\n			</button>				\n\n\n		</div>			\n\n	</div>\n\n	<div class=\"contentPanel\">\n		<div class=\"pathPanel\">\n			Path:&nbsp;<span bn-text=\"rootDir\"></span>\n		</div>\n\n\n		<div bn-each=\"f of files\" class=\"container\" bn-event=\"click.folder: onFolder, click.file: onFile\">\n			\n			<div class=\"thumbnail\">\n					<a bn-if=\"f.isImage\" href=\"#\" bn-attr=\"title: f.size\" class=\"file\" bn-data=\"name: f.name\">\n						<div>\n							<img bn-attr=\"src: f.imgUrl\">\n						</div>\n						\n						<span bn-text=\"f.name\"></span>\n					</a>			\n					<a bn-if=\"f.isDir\" href=\"#\" class=\"folder\" bn-data=\"name: f.name\">\n						<div>\n							<i class=\"fa fa-4x fa-folder-open w3-text-blue-grey\"></i>\n						</div>\n						\n						<span bn-text=\"f.name\"></span>\n					</a>\n					<a bn-if=\"f.isFile\" href=\"#\" bn-data=\"name: f.name\" class=\"file\" bn-attr=\"title: f.size\">\n						<div>\n							<i class=\"fa fa-4x fa-file w3-text-blue-grey\"></i>\n						</div>\n						\n						<span bn-text=\"f.name\"></span>\n					</a>			\n				\n			</div>\n		</div>\n	</div>\n</div>\n\n",
			data: {
				files: [],
				cutFiles: [],
				rootDir: '/',
				cutDir: '/',
				backVisible: function() {
					return this.rootDir != '/'
				},
				selMode: false,
				fileSelected: false,
				showToolbar: options.toolbar,
				canCancel: function() {
					return this.cutFiles.length != 0 || this.fileSelected
				},
				canPaste: function() {
					return this.cutFiles.length != 0 && this.rootDir != this.cutDir
				}
			},
			events: {
				onFolder: function(ev) {
					console.log('onFolder')
					if (ctrl.model.selMode) {
						console.log('this', $(this).closest('.thumbnail'))
						$(this).closest('.thumbnail').toggleClass('selected')

						ctrl.setData('fileSelected', getSelFiles().length != 0)
						return
					}

					var dirName = $(this).data('name')
					//console.log('onFolder', dirName)
					ev.preventDefault()
					loadData(ctrl.model.rootDir + dirName + '/')
				},
				onBackBtn: function() {
					var split = ctrl.model.rootDir.split('/')
					//console.log('onBackBtn', split)
					
					split.pop()
					split.pop()
					
					//console.log('rootDir', rootDir)
					loadData(split.join('/') + '/')

				},
				onFile: function(ev) {
					var name = $(this).data('name')
					//console.log('onPicture', name)
					ev.preventDefault()
					//var filePath = fileSrv.fileUrl(rootDir + name)
					//console.log('filePath', filePath)
					if (ctrl.model.selMode) {
						$(this).closest('.thumbnail').toggleClass('selected')
						ctrl.setData('fileSelected', getSelFiles().length != 0)
						return
					}
					elt.trigger('fileClick', {name, rootDir: ctrl.model.rootDir})
				},
				onToggleSelMode: function() {
					ctrl.setData('selMode', !ctrl.model.selMode)
					if (!ctrl.model.selMode) {
						elt.find('.thumbnail.selected').removeClass('selected')
						ctrl.setData('fileSelected', false)
					}
				},
				onDelete: function() {
					$$.showConfirm("Are you sure ?", "Delete files", function() {
						var selFile = getSelFiles()
						//console.log('onDelete', selFile)
						fileSrv.removeFiles(selFile)
						.then(function(resp) {
							console.log('resp', resp)
							loadData()
						})
						.catch(function(resp) {
							console.log('resp', resp)
							$$.showAlert(resp.responseText, 'Error')
						})					
					})

				},
				onCreateFolder: function() {
					var rootDir = ctrl.model.rootDir
					$$.showPrompt('Folder name:', 'New Folder', function(folderName) {
						fileSrv.mkdir(rootDir + folderName)
						.then(function(resp) {
							console.log('resp', resp)
							loadData()
						})
						.catch(function(resp) {
							console.log('resp', resp)
							$$.showAlert(resp.responseText, 'Error')
						})	
					})
				},
				onCut: function() {

					copy = false

					//console.log('onCut', cutFiles)
					
					ctrl.setData({
						selMode: false,
						fileSelected: false,
						cutFiles: getSelFiles(),
						cutDir: ctrl.model.rootDir
					})

					elt.find('.thumbnail.selected').removeClass('selected').addClass('cuted')

				},
				onCopy: function() {

					copy = true

					//console.log('onCopy', cutFiles)
					
					ctrl.setData({
						selMode: false,
						fileSelected: false,
						cutFiles: getSelFiles(),
						cutDir: ctrl.model.rootDir
					})

					elt.find('.thumbnail.selected').removeClass('selected').addClass('cuted')
				},

				onPaste: function() {
					//console.log('onPaste')
					var {rootDir, cutFiles} = ctrl.model
					var promise = (copy) ? fileSrv.copyFiles(cutFiles, rootDir) : fileSrv.moveFiles(cutFiles, rootDir)
					copy = false
					promise
					.then(function(resp) {
						console.log('resp', resp)
						ctrl.setData({cutFiles: []})
						loadData()
					})
					.catch(function(resp) {
						console.log('resp', resp)
						ctrl.setData({cutFiles: []})
						$$.showAlert(resp.responseText, 'Error')
					})	
				},
				onCancelSelection: function() {
					elt.find('.thumbnail').removeClass('selected cuted')
					ctrl.setData({
						fileSelected: false,
						cutFiles: []
					})				
				},
				onImportFile: function() {
					//console.log('onImportFile')
					var rootDir = ctrl.model.rootDir

					$$.openFileDialog(function(file) {
						//console.log('fileSize', file.size / 1024)
						if (file.size > options.maxUploadSize) {
							$$.showAlert('File too big', 'Error')
							return
						}
						$$.readFileAsDataURL(file, function(dataURL) {
							//console.log('dataURL', dataURL)
							fileSrv.uploadFile(dataURL, file.name, rootDir).then(function() {
								loadData()
							})
							.catch(function(resp) {
								console.log('resp', resp)
								$$.showAlert(resp.responseText, 'Error')							
							})
						})					
					})
				}
			} 
		})

		function loadData(rootDir) {
			if (rootDir == undefined) {
				rootDir = ctrl.model.rootDir
			}
			fileSrv.list(rootDir, options.imageOnly).then(function(files) {
				//console.log('files', files)
				ctrl.setData({
					rootDir,
					fileSelected: false,
					files: files
		/*				.filter(function(file) {
							return !file.isDir
						})*/
						.map(function(file, idx) {
							var name = file.title
							var isDir = file.folder
							var isImage = $$.isImage(name)
							return {
								name,
								size: 'Size : ' + Math.floor(file.size/1024) + ' Ko',
								imgUrl:  isDir ? '' : fileSrv.fileUrl(rootDir + name),
								isDir,
								isImage, 
								isFile: !isDir && !isImage
							}
						})
				})
			})		
		}

		loadData()

		this.getFiles = function() {
			return ctrl.model.files
		}
	}

});

(function() {

function getNodePath(node) {

	var path = node.getParentList(false, true).map((node) => node.key == 'root' ? '/' : node.title)
	return path.join('/')
}

$$.registerControlEx('FileTreeControl', {
	deps: ['FileService'],
	iface: 'refresh();getValue()',
	
	lib: 'file',
init: function(elt, options, fileSrv) {
		var ctrl = $$.viewController(elt, {
			template: "<div>\n	<div bn-control=\"TreeControl\" bn-options=\"treeOptions\" bn-iface=\"treeCtrl\" bn-event=\"contextMenuAction: onTreeAction\"></div>\n</div>",		
			data: {
				treeOptions: {
					source: [{title: 'Home', folder: true, lazy: true, key: 'root'}],

					lazyLoad: function(event, data) {
						
						//console.log('lazyLoad', data.node.key)
						var path = getNodePath(data.node)
						data.result = fileSrv.list(path, false, true)

					},
					contextMenu: {
						menu: {
							newFolder: {'name': 'New Folder'}
						}
					}
				}
			},
			events: {
				onTreeAction: function(node, action) {
					//console.log('onTreeAction', node.title, action)
					$$.showPrompt('Folder name', 'New Folder', function(folderName) {
						
						var path = getNodePath(node)
						//console.log('folderName', folderName, 'path', path)
						fileSrv.mkdir(path + '/' + folderName)
						.then(function(resp) {
							console.log('resp', resp)
							node.load(true)
						})
						.catch(function(resp) {
							console.log('resp', resp)
							$$.showAlert(resp.responseText, 'Error')
						})							
					})
				}
			}			
		})

		this.getValue = function() {
			return getNodePath(ctrl.scope.treeCtrl.getActiveNode())
		},

		this.refresh = function() {
			const root = ctrl.scope.treeCtrl.getRootNode().getFirstChild()
			if (root) {
				root.load(true)
			}
		}
		
	}

});


})();




//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRlcHMuanMiLCJmaWxlLmpzIiwiZmlsZXRyZWUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZmlsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpIHtcdFxuXG5cdCQkLmxvYWRTdHlsZSgnL2NvbnRyb2xzL2ZpbGUuY3NzJylcbn0pKCk7IiwiJCQucmVnaXN0ZXJDb250cm9sRXgoJ0ZpbGVDb250cm9sJywge1xuXHRkZXBzOiBbJ0ZpbGVTZXJ2aWNlJ10sIFxuXHRvcHRpb25zOiB7XG5cdFx0dG9vbGJhcjogdHJ1ZSxcblx0XHRpbWFnZU9ubHk6IGZhbHNlLFxuXHRcdG1heFVwbG9hZFNpemU6IDIqMTAyNCoyMDE0IC8vIDIgTW9cdFx0XG5cdH0sXG5cdGV2ZW50czogJ2ZpbGVDbGljaycsXG5cdGlmYWNlOiAnZ2V0RmlsZXMoKScsXG5cblx0XG5cdGxpYjogJ2ZpbGUnLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zLCBmaWxlU3J2KSB7XG5cblx0XHR2YXIgY3V0RmlsZXMgPSBbXVxuXHRcdHZhciBjdXREaXIgPSAnLydcblx0XHR2YXIgY29weSA9IHRydWVcblxuXHRcdGZ1bmN0aW9uIGdldFNlbEZpbGVzKCkge1xuXHRcdFx0dmFyIHNlbERpdiA9IGVsdC5maW5kKCcudGh1bWJuYWlsLnNlbGVjdGVkIGEnKVxuXG5cdFx0XHR2YXIgc2VsRmlsZSA9IFtdXG5cdFx0XHRzZWxEaXYuZWFjaChmdW5jdGlvbigpIHtcblx0XHRcdFx0c2VsRmlsZS5wdXNoKGN0cmwubW9kZWwucm9vdERpciArICQodGhpcykuZGF0YSgnbmFtZScpKVxuXHRcdFx0fSlcblx0XHRcdHJldHVybiBzZWxGaWxlXG5cdFx0fVxuXG5cblx0XHR2YXIgY3RybCA9IHdpbmRvdy5maWxlQ3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xuXHRcdFx0dGVtcGxhdGU6IFwiPGRpdiBjbGFzcz1cXFwiYm4tZmxleC1jb2xcXFwiIHN0eWxlPVxcXCJoZWlnaHQ6IDEwMCVcXFwiPlxcblx0PGRpdiBjbGFzcz1cXFwiYm4tdG9vbGJhclxcXCI+XFxuXFxuXHRcdDxkaXYgY2xhc3M9XFxcInN1YlRvb2xiYXJcXFwiIGJuLXNob3c9XFxcInNob3dUb29sYmFyXFxcIj5cdFx0XFxuXFxuXHRcdFx0PGRpdiBjbGFzcz1cXFwiYm4tYnRuIHczLWJ0blxcXCIgYm4tZXZlbnQ9XFxcImNsaWNrOiBvblRvZ2dsZVNlbE1vZGVcXFwiID5cXG5cdFx0XHRcdDxkaXYgY2xhc3M9XFxcImJuLWNpcmNsZVxcXCIgIGJuLWNsYXNzPVxcXCJzZWxlY3RlZDogc2VsTW9kZVxcXCI+XFxuXHRcdFx0XHRcdDxpIGNsYXNzPVxcXCJmYSBmYS1jaGVja1xcXCIgPjwvaT5cXG5cdFx0XHRcdDwvZGl2Plxcblxcblxcblx0XHRcdFx0PHNwYW4gY2xhc3M9XFxcInczLXRleHQtd2hpdGUgdzMtdGlueSB3My1jZW50ZXIgYm4teHMtaGlkZVxcXCIgc3R5bGU9XFxcIm1hcmdpbi10b3A6IDhweDtcXFwiPlNlbGVjdCBNb2RlPC9zcGFuPlxcblx0XHRcdFx0XFxuXHRcdFx0PC9kaXY+XHRcXG5cXG5cXG5cdFx0XHQ8ZGl2IGNsYXNzPVxcXCJibi1idG4gdzMtYnRuXFxcIiBibi1ldmVudD1cXFwiY2xpY2s6IG9uQ2FuY2VsU2VsZWN0aW9uXFxcIiBibi1wcm9wPVxcXCJkaXNhYmxlZDogIWNhbkNhbmNlbFxcXCI+XFxuXHRcdFx0XHQ8ZGl2IGNsYXNzPVxcXCJibi1jaXJjbGVcXFwiPlxcblx0XHRcdFx0XHQ8aSBjbGFzcz1cXFwiZmEgZmEtdGltZXNcXFwiID48L2k+XFxuXHRcdFx0XHQ8L2Rpdj5cXG5cXG5cXG5cdFx0XHRcdDxzcGFuIGNsYXNzPVxcXCJ3My10ZXh0LXdoaXRlIHczLXRpbnkgdzMtY2VudGVyIGJuLXhzLWhpZGVcXFwiIHN0eWxlPVxcXCJtYXJnaW4tdG9wOiA4cHg7XFxcIj5DYW5jZWwgU2VsZWN0aW9uPC9zcGFuPlxcblx0XHRcdFx0XFxuXHRcdFx0PC9kaXY+XHRcXG5cXG5cXG5cdFx0PC9kaXY+XFxuXFxuXHRcdDxkaXYgY2xhc3M9XFxcInN1YlRvb2xiYXJcXFwiIGJuLXNob3c9XFxcInNob3dUb29sYmFyXFxcIj5cXG5cXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJibi1idG4gdzMtYnRuXFxcIiBibi1ldmVudD1cXFwiY2xpY2s6IG9uRGVsZXRlXFxcIiBibi1wcm9wPVxcXCJkaXNhYmxlZDogIWZpbGVTZWxlY3RlZFxcXCIgPlxcblx0XHRcdFx0PGRpdiBjbGFzcz1cXFwiYm4tY2lyY2xlXFxcIj5cXG5cdFx0XHRcdFx0PGkgY2xhc3M9XFxcImZhIGZhLXRyYXNoXFxcIiA+PC9pPlxcblx0XHRcdFx0PC9kaXY+XFxuXFxuXFxuXHRcdFx0XHQ8c3BhbiBjbGFzcz1cXFwidzMtdGV4dC13aGl0ZSB3My10aW55IHczLWNlbnRlciBibi14cy1oaWRlXFxcIiBzdHlsZT1cXFwibWFyZ2luLXRvcDogOHB4O1xcXCI+RGVsZXRlPC9zcGFuPlxcblx0XHRcdFx0XFxuXHRcdFx0PC9idXR0b24+XHRcdFx0XHRcXG5cXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJibi1idG4gdzMtYnRuXFxcIiBibi1ldmVudD1cXFwiY2xpY2s6IG9uQ3V0XFxcIiBibi1wcm9wPVxcXCJkaXNhYmxlZDogIWZpbGVTZWxlY3RlZFxcXCIgPlxcblx0XHRcdFx0PGRpdiBjbGFzcz1cXFwiYm4tY2lyY2xlXFxcIj5cXG5cdFx0XHRcdFx0PGkgY2xhc3M9XFxcImZhIGZhLWN1dFxcXCIgPjwvaT5cXG5cdFx0XHRcdDwvZGl2Plxcblxcblxcblx0XHRcdFx0PHNwYW4gY2xhc3M9XFxcInczLXRleHQtd2hpdGUgdzMtdGlueSB3My1jZW50ZXIgYm4teHMtaGlkZVxcXCIgc3R5bGU9XFxcIm1hcmdpbi10b3A6IDhweDtcXFwiPkN1dDwvc3Bhbj5cXG5cdFx0XHRcdFxcblx0XHRcdDwvYnV0dG9uPlx0XHRcdFxcblxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImJuLWJ0biB3My1idG5cXFwiIGJuLWV2ZW50PVxcXCJjbGljazogb25Db3B5XFxcIiBibi1wcm9wPVxcXCJkaXNhYmxlZDogIWZpbGVTZWxlY3RlZFxcXCIgPlxcblx0XHRcdFx0PGRpdiBjbGFzcz1cXFwiYm4tY2lyY2xlXFxcIj5cXG5cdFx0XHRcdFx0PGkgY2xhc3M9XFxcImZhIGZhLWNvcHlcXFwiID48L2k+XFxuXHRcdFx0XHQ8L2Rpdj5cXG5cXG5cXG5cdFx0XHRcdDxzcGFuIGNsYXNzPVxcXCJ3My10ZXh0LXdoaXRlIHczLXRpbnkgdzMtY2VudGVyIGJuLXhzLWhpZGVcXFwiIHN0eWxlPVxcXCJtYXJnaW4tdG9wOiA4cHg7XFxcIj5Db3B5PC9zcGFuPlxcblx0XHRcdFx0XFxuXHRcdFx0PC9idXR0b24+XHRcXG5cdFx0XFxuXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiYm4tYnRuIHczLWJ0blxcXCIgYm4tZXZlbnQ9XFxcImNsaWNrOiBvblBhc3RlXFxcIiBibi1wcm9wPVxcXCJkaXNhYmxlZDogIWNhblBhc3RlXFxcIiA+XFxuXHRcdFx0XHQ8ZGl2IGNsYXNzPVxcXCJibi1jaXJjbGVcXFwiPlxcblx0XHRcdFx0XHQ8aSBjbGFzcz1cXFwiZmEgZmEtcGFzdGVcXFwiID48L2k+XFxuXHRcdFx0XHQ8L2Rpdj5cXG5cXG5cXG5cdFx0XHRcdDxzcGFuIGNsYXNzPVxcXCJ3My10ZXh0LXdoaXRlIHczLXRpbnkgdzMtY2VudGVyIGJuLXhzLWhpZGVcXFwiIHN0eWxlPVxcXCJtYXJnaW4tdG9wOiA4cHg7XFxcIj5QYXN0ZTwvc3Bhbj5cXG5cdFx0XHRcdFxcblx0XHRcdDwvYnV0dG9uPlx0XFxuXFxuXFxuXHRcdDwvZGl2Plxcblxcblx0XHQ8ZGl2IGNsYXNzPVxcXCJzdWJUb29sYmFyXFxcIiBibi1zaG93PVxcXCJzaG93VG9vbGJhclxcXCI+XFxuXFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiYm4tYnRuIHczLWJ0blxcXCIgYm4tZXZlbnQ9XFxcImNsaWNrOiBvbkNyZWF0ZUZvbGRlclxcXCI+XFxuXHRcdFx0XHQ8ZGl2IGNsYXNzPVxcXCJibi1jaXJjbGVcXFwiPlxcblx0XHRcdFx0XHQ8aSBjbGFzcz1cXFwiZmEgZmEtZm9sZGVyLW9wZW5cXFwiID48L2k+XFxuXHRcdFx0XHQ8L2Rpdj5cXG5cXG5cXG5cdFx0XHRcdDxzcGFuIGNsYXNzPVxcXCJ3My10ZXh0LXdoaXRlIHczLXRpbnkgdzMtY2VudGVyIGJuLXhzLWhpZGVcXFwiIHN0eWxlPVxcXCJtYXJnaW4tdG9wOiA4cHg7XFxcIj5OZXcgRm9sZGVyPC9zcGFuPlxcblx0XHRcdFx0XFxuXHRcdFx0PC9idXR0b24+XHRcXG5cXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJibi1idG4gdzMtYnRuXFxcIiBibi1ldmVudD1cXFwiY2xpY2s6IG9uSW1wb3J0RmlsZVxcXCI+XFxuXHRcdFx0XHQ8ZGl2IGNsYXNzPVxcXCJibi1jaXJjbGVcXFwiPlxcblx0XHRcdFx0XHQ8aSBjbGFzcz1cXFwiZmEgZmEtdXBsb2FkXFxcIiA+PC9pPlxcblx0XHRcdFx0PC9kaXY+XFxuXFxuXFxuXHRcdFx0XHQ8c3BhbiBjbGFzcz1cXFwidzMtdGV4dC13aGl0ZSB3My10aW55IHczLWNlbnRlciBibi14cy1oaWRlXFxcIiBzdHlsZT1cXFwibWFyZ2luLXRvcDogOHB4O1xcXCI+SW1wb3J0IEZpbGU8L3NwYW4+XFxuXHRcdFx0XHRcXG5cdFx0XHQ8L2J1dHRvbj5cdFx0XHRcdFx0XHRcdFxcblxcblx0XHRcdFxcblxcblx0XHQ8L2Rpdj5cXG5cXG5cdFx0PGRpdiBjbGFzcz1cXFwic3ViVG9vbGJhclxcXCIgIGJuLXNob3c9XFxcImJhY2tWaXNpYmxlXFxcIj5cXG5cXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJibi1idG4gdzMtYnRuXFxcIiBibi1ldmVudD1cXFwiY2xpY2s6IG9uQmFja0J0blxcXCI+XFxuXHRcdFx0XHQ8ZGl2IGNsYXNzPVxcXCJibi1jaXJjbGVcXFwiPlxcblx0XHRcdFx0XHQ8aSBjbGFzcz1cXFwiZmEgZmEtYXJyb3ctbGVmdFxcXCIgPjwvaT5cXG5cdFx0XHRcdDwvZGl2Plxcblxcblxcblx0XHRcdFx0PHNwYW4gY2xhc3M9XFxcInczLXRleHQtd2hpdGUgdzMtdGlueSB3My1jZW50ZXIgYm4teHMtaGlkZVxcXCIgc3R5bGU9XFxcIm1hcmdpbi10b3A6IDhweDtcXFwiPlRvcCBGb2xkZXI8L3NwYW4+XFxuXHRcdFx0XHRcXG5cdFx0XHQ8L2J1dHRvbj5cdFx0XHRcdFxcblxcblxcblx0XHQ8L2Rpdj5cdFx0XHRcXG5cXG5cdDwvZGl2Plxcblxcblx0PGRpdiBjbGFzcz1cXFwiY29udGVudFBhbmVsXFxcIj5cXG5cdFx0PGRpdiBjbGFzcz1cXFwicGF0aFBhbmVsXFxcIj5cXG5cdFx0XHRQYXRoOiZuYnNwOzxzcGFuIGJuLXRleHQ9XFxcInJvb3REaXJcXFwiPjwvc3Bhbj5cXG5cdFx0PC9kaXY+XFxuXFxuXFxuXHRcdDxkaXYgYm4tZWFjaD1cXFwiZiBvZiBmaWxlc1xcXCIgY2xhc3M9XFxcImNvbnRhaW5lclxcXCIgYm4tZXZlbnQ9XFxcImNsaWNrLmZvbGRlcjogb25Gb2xkZXIsIGNsaWNrLmZpbGU6IG9uRmlsZVxcXCI+XFxuXHRcdFx0XFxuXHRcdFx0PGRpdiBjbGFzcz1cXFwidGh1bWJuYWlsXFxcIj5cXG5cdFx0XHRcdFx0PGEgYm4taWY9XFxcImYuaXNJbWFnZVxcXCIgaHJlZj1cXFwiI1xcXCIgYm4tYXR0cj1cXFwidGl0bGU6IGYuc2l6ZVxcXCIgY2xhc3M9XFxcImZpbGVcXFwiIGJuLWRhdGE9XFxcIm5hbWU6IGYubmFtZVxcXCI+XFxuXHRcdFx0XHRcdFx0PGRpdj5cXG5cdFx0XHRcdFx0XHRcdDxpbWcgYm4tYXR0cj1cXFwic3JjOiBmLmltZ1VybFxcXCI+XFxuXHRcdFx0XHRcdFx0PC9kaXY+XFxuXHRcdFx0XHRcdFx0XFxuXHRcdFx0XHRcdFx0PHNwYW4gYm4tdGV4dD1cXFwiZi5uYW1lXFxcIj48L3NwYW4+XFxuXHRcdFx0XHRcdDwvYT5cdFx0XHRcXG5cdFx0XHRcdFx0PGEgYm4taWY9XFxcImYuaXNEaXJcXFwiIGhyZWY9XFxcIiNcXFwiIGNsYXNzPVxcXCJmb2xkZXJcXFwiIGJuLWRhdGE9XFxcIm5hbWU6IGYubmFtZVxcXCI+XFxuXHRcdFx0XHRcdFx0PGRpdj5cXG5cdFx0XHRcdFx0XHRcdDxpIGNsYXNzPVxcXCJmYSBmYS00eCBmYS1mb2xkZXItb3BlbiB3My10ZXh0LWJsdWUtZ3JleVxcXCI+PC9pPlxcblx0XHRcdFx0XHRcdDwvZGl2Plxcblx0XHRcdFx0XHRcdFxcblx0XHRcdFx0XHRcdDxzcGFuIGJuLXRleHQ9XFxcImYubmFtZVxcXCI+PC9zcGFuPlxcblx0XHRcdFx0XHQ8L2E+XFxuXHRcdFx0XHRcdDxhIGJuLWlmPVxcXCJmLmlzRmlsZVxcXCIgaHJlZj1cXFwiI1xcXCIgYm4tZGF0YT1cXFwibmFtZTogZi5uYW1lXFxcIiBjbGFzcz1cXFwiZmlsZVxcXCIgYm4tYXR0cj1cXFwidGl0bGU6IGYuc2l6ZVxcXCI+XFxuXHRcdFx0XHRcdFx0PGRpdj5cXG5cdFx0XHRcdFx0XHRcdDxpIGNsYXNzPVxcXCJmYSBmYS00eCBmYS1maWxlIHczLXRleHQtYmx1ZS1ncmV5XFxcIj48L2k+XFxuXHRcdFx0XHRcdFx0PC9kaXY+XFxuXHRcdFx0XHRcdFx0XFxuXHRcdFx0XHRcdFx0PHNwYW4gYm4tdGV4dD1cXFwiZi5uYW1lXFxcIj48L3NwYW4+XFxuXHRcdFx0XHRcdDwvYT5cdFx0XHRcXG5cdFx0XHRcdFxcblx0XHRcdDwvZGl2Plxcblx0XHQ8L2Rpdj5cXG5cdDwvZGl2PlxcbjwvZGl2PlxcblxcblwiLFxuXHRcdFx0ZGF0YToge1xuXHRcdFx0XHRmaWxlczogW10sXG5cdFx0XHRcdGN1dEZpbGVzOiBbXSxcblx0XHRcdFx0cm9vdERpcjogJy8nLFxuXHRcdFx0XHRjdXREaXI6ICcvJyxcblx0XHRcdFx0YmFja1Zpc2libGU6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLnJvb3REaXIgIT0gJy8nXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHNlbE1vZGU6IGZhbHNlLFxuXHRcdFx0XHRmaWxlU2VsZWN0ZWQ6IGZhbHNlLFxuXHRcdFx0XHRzaG93VG9vbGJhcjogb3B0aW9ucy50b29sYmFyLFxuXHRcdFx0XHRjYW5DYW5jZWw6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLmN1dEZpbGVzLmxlbmd0aCAhPSAwIHx8IHRoaXMuZmlsZVNlbGVjdGVkXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGNhblBhc3RlOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5jdXRGaWxlcy5sZW5ndGggIT0gMCAmJiB0aGlzLnJvb3REaXIgIT0gdGhpcy5jdXREaXJcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdGV2ZW50czoge1xuXHRcdFx0XHRvbkZvbGRlcjogZnVuY3Rpb24oZXYpIHtcblx0XHRcdFx0XHRjb25zb2xlLmxvZygnb25Gb2xkZXInKVxuXHRcdFx0XHRcdGlmIChjdHJsLm1vZGVsLnNlbE1vZGUpIHtcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCd0aGlzJywgJCh0aGlzKS5jbG9zZXN0KCcudGh1bWJuYWlsJykpXG5cdFx0XHRcdFx0XHQkKHRoaXMpLmNsb3Nlc3QoJy50aHVtYm5haWwnKS50b2dnbGVDbGFzcygnc2VsZWN0ZWQnKVxuXG5cdFx0XHRcdFx0XHRjdHJsLnNldERhdGEoJ2ZpbGVTZWxlY3RlZCcsIGdldFNlbEZpbGVzKCkubGVuZ3RoICE9IDApXG5cdFx0XHRcdFx0XHRyZXR1cm5cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHR2YXIgZGlyTmFtZSA9ICQodGhpcykuZGF0YSgnbmFtZScpXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb25Gb2xkZXInLCBkaXJOYW1lKVxuXHRcdFx0XHRcdGV2LnByZXZlbnREZWZhdWx0KClcblx0XHRcdFx0XHRsb2FkRGF0YShjdHJsLm1vZGVsLnJvb3REaXIgKyBkaXJOYW1lICsgJy8nKVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRvbkJhY2tCdG46IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHZhciBzcGxpdCA9IGN0cmwubW9kZWwucm9vdERpci5zcGxpdCgnLycpXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb25CYWNrQnRuJywgc3BsaXQpXG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0c3BsaXQucG9wKClcblx0XHRcdFx0XHRzcGxpdC5wb3AoKVxuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ3Jvb3REaXInLCByb290RGlyKVxuXHRcdFx0XHRcdGxvYWREYXRhKHNwbGl0LmpvaW4oJy8nKSArICcvJylcblxuXHRcdFx0XHR9LFxuXHRcdFx0XHRvbkZpbGU6IGZ1bmN0aW9uKGV2KSB7XG5cdFx0XHRcdFx0dmFyIG5hbWUgPSAkKHRoaXMpLmRhdGEoJ25hbWUnKVxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ29uUGljdHVyZScsIG5hbWUpXG5cdFx0XHRcdFx0ZXYucHJldmVudERlZmF1bHQoKVxuXHRcdFx0XHRcdC8vdmFyIGZpbGVQYXRoID0gZmlsZVNydi5maWxlVXJsKHJvb3REaXIgKyBuYW1lKVxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ2ZpbGVQYXRoJywgZmlsZVBhdGgpXG5cdFx0XHRcdFx0aWYgKGN0cmwubW9kZWwuc2VsTW9kZSkge1xuXHRcdFx0XHRcdFx0JCh0aGlzKS5jbG9zZXN0KCcudGh1bWJuYWlsJykudG9nZ2xlQ2xhc3MoJ3NlbGVjdGVkJylcblx0XHRcdFx0XHRcdGN0cmwuc2V0RGF0YSgnZmlsZVNlbGVjdGVkJywgZ2V0U2VsRmlsZXMoKS5sZW5ndGggIT0gMClcblx0XHRcdFx0XHRcdHJldHVyblxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHQudHJpZ2dlcignZmlsZUNsaWNrJywge25hbWUsIHJvb3REaXI6IGN0cmwubW9kZWwucm9vdERpcn0pXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9uVG9nZ2xlU2VsTW9kZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0Y3RybC5zZXREYXRhKCdzZWxNb2RlJywgIWN0cmwubW9kZWwuc2VsTW9kZSlcblx0XHRcdFx0XHRpZiAoIWN0cmwubW9kZWwuc2VsTW9kZSkge1xuXHRcdFx0XHRcdFx0ZWx0LmZpbmQoJy50aHVtYm5haWwuc2VsZWN0ZWQnKS5yZW1vdmVDbGFzcygnc2VsZWN0ZWQnKVxuXHRcdFx0XHRcdFx0Y3RybC5zZXREYXRhKCdmaWxlU2VsZWN0ZWQnLCBmYWxzZSlcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9uRGVsZXRlOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHQkJC5zaG93Q29uZmlybShcIkFyZSB5b3Ugc3VyZSA/XCIsIFwiRGVsZXRlIGZpbGVzXCIsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0dmFyIHNlbEZpbGUgPSBnZXRTZWxGaWxlcygpXG5cdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvbkRlbGV0ZScsIHNlbEZpbGUpXG5cdFx0XHRcdFx0XHRmaWxlU3J2LnJlbW92ZUZpbGVzKHNlbEZpbGUpXG5cdFx0XHRcdFx0XHQudGhlbihmdW5jdGlvbihyZXNwKSB7XG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdyZXNwJywgcmVzcClcblx0XHRcdFx0XHRcdFx0bG9hZERhdGEoKVxuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdC5jYXRjaChmdW5jdGlvbihyZXNwKSB7XG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdyZXNwJywgcmVzcClcblx0XHRcdFx0XHRcdFx0JCQuc2hvd0FsZXJ0KHJlc3AucmVzcG9uc2VUZXh0LCAnRXJyb3InKVxuXHRcdFx0XHRcdFx0fSlcdFx0XHRcdFx0XG5cdFx0XHRcdFx0fSlcblxuXHRcdFx0XHR9LFxuXHRcdFx0XHRvbkNyZWF0ZUZvbGRlcjogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0dmFyIHJvb3REaXIgPSBjdHJsLm1vZGVsLnJvb3REaXJcblx0XHRcdFx0XHQkJC5zaG93UHJvbXB0KCdGb2xkZXIgbmFtZTonLCAnTmV3IEZvbGRlcicsIGZ1bmN0aW9uKGZvbGRlck5hbWUpIHtcblx0XHRcdFx0XHRcdGZpbGVTcnYubWtkaXIocm9vdERpciArIGZvbGRlck5hbWUpXG5cdFx0XHRcdFx0XHQudGhlbihmdW5jdGlvbihyZXNwKSB7XG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdyZXNwJywgcmVzcClcblx0XHRcdFx0XHRcdFx0bG9hZERhdGEoKVxuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdC5jYXRjaChmdW5jdGlvbihyZXNwKSB7XG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdyZXNwJywgcmVzcClcblx0XHRcdFx0XHRcdFx0JCQuc2hvd0FsZXJ0KHJlc3AucmVzcG9uc2VUZXh0LCAnRXJyb3InKVxuXHRcdFx0XHRcdFx0fSlcdFxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9uQ3V0OiBmdW5jdGlvbigpIHtcblxuXHRcdFx0XHRcdGNvcHkgPSBmYWxzZVxuXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb25DdXQnLCBjdXRGaWxlcylcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRjdHJsLnNldERhdGEoe1xuXHRcdFx0XHRcdFx0c2VsTW9kZTogZmFsc2UsXG5cdFx0XHRcdFx0XHRmaWxlU2VsZWN0ZWQ6IGZhbHNlLFxuXHRcdFx0XHRcdFx0Y3V0RmlsZXM6IGdldFNlbEZpbGVzKCksXG5cdFx0XHRcdFx0XHRjdXREaXI6IGN0cmwubW9kZWwucm9vdERpclxuXHRcdFx0XHRcdH0pXG5cblx0XHRcdFx0XHRlbHQuZmluZCgnLnRodW1ibmFpbC5zZWxlY3RlZCcpLnJlbW92ZUNsYXNzKCdzZWxlY3RlZCcpLmFkZENsYXNzKCdjdXRlZCcpXG5cblx0XHRcdFx0fSxcblx0XHRcdFx0b25Db3B5OiBmdW5jdGlvbigpIHtcblxuXHRcdFx0XHRcdGNvcHkgPSB0cnVlXG5cblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvbkNvcHknLCBjdXRGaWxlcylcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRjdHJsLnNldERhdGEoe1xuXHRcdFx0XHRcdFx0c2VsTW9kZTogZmFsc2UsXG5cdFx0XHRcdFx0XHRmaWxlU2VsZWN0ZWQ6IGZhbHNlLFxuXHRcdFx0XHRcdFx0Y3V0RmlsZXM6IGdldFNlbEZpbGVzKCksXG5cdFx0XHRcdFx0XHRjdXREaXI6IGN0cmwubW9kZWwucm9vdERpclxuXHRcdFx0XHRcdH0pXG5cblx0XHRcdFx0XHRlbHQuZmluZCgnLnRodW1ibmFpbC5zZWxlY3RlZCcpLnJlbW92ZUNsYXNzKCdzZWxlY3RlZCcpLmFkZENsYXNzKCdjdXRlZCcpXG5cdFx0XHRcdH0sXG5cblx0XHRcdFx0b25QYXN0ZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb25QYXN0ZScpXG5cdFx0XHRcdFx0dmFyIHtyb290RGlyLCBjdXRGaWxlc30gPSBjdHJsLm1vZGVsXG5cdFx0XHRcdFx0dmFyIHByb21pc2UgPSAoY29weSkgPyBmaWxlU3J2LmNvcHlGaWxlcyhjdXRGaWxlcywgcm9vdERpcikgOiBmaWxlU3J2Lm1vdmVGaWxlcyhjdXRGaWxlcywgcm9vdERpcilcblx0XHRcdFx0XHRjb3B5ID0gZmFsc2Vcblx0XHRcdFx0XHRwcm9taXNlXG5cdFx0XHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzcCkge1xuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ3Jlc3AnLCByZXNwKVxuXHRcdFx0XHRcdFx0Y3RybC5zZXREYXRhKHtjdXRGaWxlczogW119KVxuXHRcdFx0XHRcdFx0bG9hZERhdGEoKVxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0LmNhdGNoKGZ1bmN0aW9uKHJlc3ApIHtcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdyZXNwJywgcmVzcClcblx0XHRcdFx0XHRcdGN0cmwuc2V0RGF0YSh7Y3V0RmlsZXM6IFtdfSlcblx0XHRcdFx0XHRcdCQkLnNob3dBbGVydChyZXNwLnJlc3BvbnNlVGV4dCwgJ0Vycm9yJylcblx0XHRcdFx0XHR9KVx0XG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9uQ2FuY2VsU2VsZWN0aW9uOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRlbHQuZmluZCgnLnRodW1ibmFpbCcpLnJlbW92ZUNsYXNzKCdzZWxlY3RlZCBjdXRlZCcpXG5cdFx0XHRcdFx0Y3RybC5zZXREYXRhKHtcblx0XHRcdFx0XHRcdGZpbGVTZWxlY3RlZDogZmFsc2UsXG5cdFx0XHRcdFx0XHRjdXRGaWxlczogW11cblx0XHRcdFx0XHR9KVx0XHRcdFx0XG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9uSW1wb3J0RmlsZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb25JbXBvcnRGaWxlJylcblx0XHRcdFx0XHR2YXIgcm9vdERpciA9IGN0cmwubW9kZWwucm9vdERpclxuXG5cdFx0XHRcdFx0JCQub3BlbkZpbGVEaWFsb2coZnVuY3Rpb24oZmlsZSkge1xuXHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnZmlsZVNpemUnLCBmaWxlLnNpemUgLyAxMDI0KVxuXHRcdFx0XHRcdFx0aWYgKGZpbGUuc2l6ZSA+IG9wdGlvbnMubWF4VXBsb2FkU2l6ZSkge1xuXHRcdFx0XHRcdFx0XHQkJC5zaG93QWxlcnQoJ0ZpbGUgdG9vIGJpZycsICdFcnJvcicpXG5cdFx0XHRcdFx0XHRcdHJldHVyblxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0JCQucmVhZEZpbGVBc0RhdGFVUkwoZmlsZSwgZnVuY3Rpb24oZGF0YVVSTCkge1xuXHRcdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdkYXRhVVJMJywgZGF0YVVSTClcblx0XHRcdFx0XHRcdFx0ZmlsZVNydi51cGxvYWRGaWxlKGRhdGFVUkwsIGZpbGUubmFtZSwgcm9vdERpcikudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdFx0XHRsb2FkRGF0YSgpXG5cdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdC5jYXRjaChmdW5jdGlvbihyZXNwKSB7XG5cdFx0XHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ3Jlc3AnLCByZXNwKVxuXHRcdFx0XHRcdFx0XHRcdCQkLnNob3dBbGVydChyZXNwLnJlc3BvbnNlVGV4dCwgJ0Vycm9yJylcdFx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0fSlcdFx0XHRcdFx0XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0fVxuXHRcdFx0fSBcblx0XHR9KVxuXG5cdFx0ZnVuY3Rpb24gbG9hZERhdGEocm9vdERpcikge1xuXHRcdFx0aWYgKHJvb3REaXIgPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdHJvb3REaXIgPSBjdHJsLm1vZGVsLnJvb3REaXJcblx0XHRcdH1cblx0XHRcdGZpbGVTcnYubGlzdChyb290RGlyLCBvcHRpb25zLmltYWdlT25seSkudGhlbihmdW5jdGlvbihmaWxlcykge1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdmaWxlcycsIGZpbGVzKVxuXHRcdFx0XHRjdHJsLnNldERhdGEoe1xuXHRcdFx0XHRcdHJvb3REaXIsXG5cdFx0XHRcdFx0ZmlsZVNlbGVjdGVkOiBmYWxzZSxcblx0XHRcdFx0XHRmaWxlczogZmlsZXNcblx0XHQvKlx0XHRcdFx0LmZpbHRlcihmdW5jdGlvbihmaWxlKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiAhZmlsZS5pc0RpclxuXHRcdFx0XHRcdFx0fSkqL1xuXHRcdFx0XHRcdFx0Lm1hcChmdW5jdGlvbihmaWxlLCBpZHgpIHtcblx0XHRcdFx0XHRcdFx0dmFyIG5hbWUgPSBmaWxlLnRpdGxlXG5cdFx0XHRcdFx0XHRcdHZhciBpc0RpciA9IGZpbGUuZm9sZGVyXG5cdFx0XHRcdFx0XHRcdHZhciBpc0ltYWdlID0gJCQuaXNJbWFnZShuYW1lKVxuXHRcdFx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0XHRcdG5hbWUsXG5cdFx0XHRcdFx0XHRcdFx0c2l6ZTogJ1NpemUgOiAnICsgTWF0aC5mbG9vcihmaWxlLnNpemUvMTAyNCkgKyAnIEtvJyxcblx0XHRcdFx0XHRcdFx0XHRpbWdVcmw6ICBpc0RpciA/ICcnIDogZmlsZVNydi5maWxlVXJsKHJvb3REaXIgKyBuYW1lKSxcblx0XHRcdFx0XHRcdFx0XHRpc0Rpcixcblx0XHRcdFx0XHRcdFx0XHRpc0ltYWdlLCBcblx0XHRcdFx0XHRcdFx0XHRpc0ZpbGU6ICFpc0RpciAmJiAhaXNJbWFnZVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHR9KVxuXHRcdFx0fSlcdFx0XG5cdFx0fVxuXG5cdFx0bG9hZERhdGEoKVxuXG5cdFx0dGhpcy5nZXRGaWxlcyA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIGN0cmwubW9kZWwuZmlsZXNcblx0XHR9XG5cdH1cblxufSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbmZ1bmN0aW9uIGdldE5vZGVQYXRoKG5vZGUpIHtcblxuXHR2YXIgcGF0aCA9IG5vZGUuZ2V0UGFyZW50TGlzdChmYWxzZSwgdHJ1ZSkubWFwKChub2RlKSA9PiBub2RlLmtleSA9PSAncm9vdCcgPyAnLycgOiBub2RlLnRpdGxlKVxuXHRyZXR1cm4gcGF0aC5qb2luKCcvJylcbn1cblxuJCQucmVnaXN0ZXJDb250cm9sRXgoJ0ZpbGVUcmVlQ29udHJvbCcsIHtcblx0ZGVwczogWydGaWxlU2VydmljZSddLFxuXHRpZmFjZTogJ3JlZnJlc2goKTtnZXRWYWx1ZSgpJyxcblx0XG5cdGxpYjogJ2ZpbGUnLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zLCBmaWxlU3J2KSB7XG5cdFx0dmFyIGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihlbHQsIHtcblx0XHRcdHRlbXBsYXRlOiBcIjxkaXY+XFxuXHQ8ZGl2IGJuLWNvbnRyb2w9XFxcIlRyZWVDb250cm9sXFxcIiBibi1vcHRpb25zPVxcXCJ0cmVlT3B0aW9uc1xcXCIgYm4taWZhY2U9XFxcInRyZWVDdHJsXFxcIiBibi1ldmVudD1cXFwiY29udGV4dE1lbnVBY3Rpb246IG9uVHJlZUFjdGlvblxcXCI+PC9kaXY+XFxuPC9kaXY+XCIsXHRcdFxuXHRcdFx0ZGF0YToge1xuXHRcdFx0XHR0cmVlT3B0aW9uczoge1xuXHRcdFx0XHRcdHNvdXJjZTogW3t0aXRsZTogJ0hvbWUnLCBmb2xkZXI6IHRydWUsIGxhenk6IHRydWUsIGtleTogJ3Jvb3QnfV0sXG5cblx0XHRcdFx0XHRsYXp5TG9hZDogZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnbGF6eUxvYWQnLCBkYXRhLm5vZGUua2V5KVxuXHRcdFx0XHRcdFx0dmFyIHBhdGggPSBnZXROb2RlUGF0aChkYXRhLm5vZGUpXG5cdFx0XHRcdFx0XHRkYXRhLnJlc3VsdCA9IGZpbGVTcnYubGlzdChwYXRoLCBmYWxzZSwgdHJ1ZSlcblxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0Y29udGV4dE1lbnU6IHtcblx0XHRcdFx0XHRcdG1lbnU6IHtcblx0XHRcdFx0XHRcdFx0bmV3Rm9sZGVyOiB7J25hbWUnOiAnTmV3IEZvbGRlcid9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0ZXZlbnRzOiB7XG5cdFx0XHRcdG9uVHJlZUFjdGlvbjogZnVuY3Rpb24obm9kZSwgYWN0aW9uKSB7XG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb25UcmVlQWN0aW9uJywgbm9kZS50aXRsZSwgYWN0aW9uKVxuXHRcdFx0XHRcdCQkLnNob3dQcm9tcHQoJ0ZvbGRlciBuYW1lJywgJ05ldyBGb2xkZXInLCBmdW5jdGlvbihmb2xkZXJOYW1lKSB7XG5cdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdHZhciBwYXRoID0gZ2V0Tm9kZVBhdGgobm9kZSlcblx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ2ZvbGRlck5hbWUnLCBmb2xkZXJOYW1lLCAncGF0aCcsIHBhdGgpXG5cdFx0XHRcdFx0XHRmaWxlU3J2Lm1rZGlyKHBhdGggKyAnLycgKyBmb2xkZXJOYW1lKVxuXHRcdFx0XHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzcCkge1xuXHRcdFx0XHRcdFx0XHRjb25zb2xlLmxvZygncmVzcCcsIHJlc3ApXG5cdFx0XHRcdFx0XHRcdG5vZGUubG9hZCh0cnVlKVxuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdC5jYXRjaChmdW5jdGlvbihyZXNwKSB7XG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdyZXNwJywgcmVzcClcblx0XHRcdFx0XHRcdFx0JCQuc2hvd0FsZXJ0KHJlc3AucmVzcG9uc2VUZXh0LCAnRXJyb3InKVxuXHRcdFx0XHRcdFx0fSlcdFx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdH1cblx0XHRcdH1cdFx0XHRcblx0XHR9KVxuXG5cdFx0dGhpcy5nZXRWYWx1ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIGdldE5vZGVQYXRoKGN0cmwuc2NvcGUudHJlZUN0cmwuZ2V0QWN0aXZlTm9kZSgpKVxuXHRcdH0sXG5cblx0XHR0aGlzLnJlZnJlc2ggPSBmdW5jdGlvbigpIHtcblx0XHRcdGNvbnN0IHJvb3QgPSBjdHJsLnNjb3BlLnRyZWVDdHJsLmdldFJvb3ROb2RlKCkuZ2V0Rmlyc3RDaGlsZCgpXG5cdFx0XHRpZiAocm9vdCkge1xuXHRcdFx0XHRyb290LmxvYWQodHJ1ZSlcblx0XHRcdH1cblx0XHR9XG5cdFx0XG5cdH1cblxufSk7XG5cblxufSkoKTtcblxuXG5cbiJdfQ==
