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
			template: "<div class=\"bn-flex-col\" style=\"height: 100%\">\n	<div class=\"bn-toolbar\">\n\n		<div class=\"subToolbar\" bn-show=\"showToolbar\">		\n\n			<button \n				bn-event=\"click: onToggleSelMode\" \n				title=\"Select mode\" \n				bn-class=\"selected: selMode\"\n				>\n					<i class=\"fa fa-check\"></i>\n			</button>\n\n			<button \n				bn-event=\"click: onCancelSelection\" \n				title=\"Cancel selection\"\n				bn-prop=\"disabled: !canCancel\"  \n				>\n					<i class=\"fa fa-times\"></i>\n			</button>\n\n		</div>\n\n		<div class=\"subToolbar\" bn-show=\"showToolbar\">\n\n			<button \n				bn-event=\"click: onDelete\" \n				bn-prop=\"disabled: !fileSelected\" \n				title=\"Delete selected files\"\n				>\n					<i class=\"fa fa-trash\" ></i>\n			</button>\n\n			<button \n				title=\"Cut\" \n				bn-event=\"click: onCut\" \n				bn-prop=\"disabled: !fileSelected\"\n				>\n					<i class=\"fa fa-cut\" ></i>\n			</button>\n\n			<button \n				title=\"Copy\" \n				bn-prop=\"disabled: !fileSelected\" \n				bn-event=\"click: onCopy\"\n				>\n					<i class=\"fa fa-copy\" ></i>\n			</button>\n\n			<button \n				title=\"Paste\" \n				bn-prop=\"disabled: !canPaste\" \n				bn-event=\"click: onPaste\"\n				>\n					<i class=\"fa fa-paste\" ></i>\n			</button>\n\n		</div>\n\n		<div class=\"subToolbar\" bn-show=\"showToolbar\">\n\n			<button \n				bn-event=\"click: onCreateFolder\" \n				title=\"New folder\"\n				>\n					<i class=\"fa fa-folder-open\" ></i>\n			</button>\n			\n			<button \n				title=\"Import file\" \n				bn-event=\"click: onImportFile\"\n				>\n					<i class=\"fa fa-upload\" ></i>\n			</button>\n\n		</div>\n\n		<div class=\"subToolbar\"  bn-show=\"backVisible\">\n\n			<button bn-event=\"click: onBackBtn\" title=\"Top folder\">\n				<i class=\"fa fa-arrow-left\"></i>\n			</button>	\n		</div>			\n\n	</div>\n\n	<div class=\"contentPanel\">\n		<div class=\"pathPanel\">\n			Path:&nbsp;<span bn-text=\"rootDir\"></span>\n		</div>\n\n\n		<div bn-each=\"f of files\" class=\"container\" bn-event=\"click.folder: onFolder, click.file: onFile\">\n			\n			<div class=\"thumbnail\">\n					<a bn-if=\"f.isImage\" href=\"#\" bn-attr=\"title: f.size\" class=\"file\" bn-data=\"name: f.name\">\n						<div>\n							<img bn-attr=\"src: f.imgUrl\">\n						</div>\n						\n						<span bn-text=\"f.name\"></span>\n					</a>			\n					<a bn-if=\"f.isDir\" href=\"#\" class=\"folder\" bn-data=\"name: f.name\">\n						<div>\n							<i class=\"fa fa-4x fa-folder-open w3-text-blue-grey\"></i>\n						</div>\n						\n						<span bn-text=\"f.name\"></span>\n					</a>\n					<a bn-if=\"f.isFile\" href=\"#\" bn-data=\"name: f.name\" class=\"file\" bn-attr=\"title: f.size\">\n						<div>\n							<i class=\"fa fa-4x fa-file w3-text-blue-grey\"></i>\n						</div>\n						\n						<span bn-text=\"f.name\"></span>\n					</a>			\n				\n			</div>\n		</div>\n	</div>\n</div>\n\n",
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




//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRlcHMuanMiLCJmaWxlLmpzIiwiZmlsZXRyZWUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZmlsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpIHtcdFxuXG5cdCQkLmxvYWRTdHlsZSgnL2NvbnRyb2xzL2ZpbGUuY3NzJylcbn0pKCk7IiwiJCQucmVnaXN0ZXJDb250cm9sRXgoJ0ZpbGVDb250cm9sJywge1xuXHRkZXBzOiBbJ0ZpbGVTZXJ2aWNlJ10sIFxuXHRvcHRpb25zOiB7XG5cdFx0dG9vbGJhcjogdHJ1ZSxcblx0XHRpbWFnZU9ubHk6IGZhbHNlLFxuXHRcdG1heFVwbG9hZFNpemU6IDIqMTAyNCoyMDE0IC8vIDIgTW9cdFx0XG5cdH0sXG5cdGV2ZW50czogJ2ZpbGVDbGljaycsXG5cdGlmYWNlOiAnZ2V0RmlsZXMoKScsXG5cblx0XG5cdGxpYjogJ2ZpbGUnLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zLCBmaWxlU3J2KSB7XG5cblx0XHR2YXIgY3V0RmlsZXMgPSBbXVxuXHRcdHZhciBjdXREaXIgPSAnLydcblx0XHR2YXIgY29weSA9IHRydWVcblxuXHRcdGZ1bmN0aW9uIGdldFNlbEZpbGVzKCkge1xuXHRcdFx0dmFyIHNlbERpdiA9IGVsdC5maW5kKCcudGh1bWJuYWlsLnNlbGVjdGVkIGEnKVxuXG5cdFx0XHR2YXIgc2VsRmlsZSA9IFtdXG5cdFx0XHRzZWxEaXYuZWFjaChmdW5jdGlvbigpIHtcblx0XHRcdFx0c2VsRmlsZS5wdXNoKGN0cmwubW9kZWwucm9vdERpciArICQodGhpcykuZGF0YSgnbmFtZScpKVxuXHRcdFx0fSlcblx0XHRcdHJldHVybiBzZWxGaWxlXG5cdFx0fVxuXG5cblx0XHR2YXIgY3RybCA9IHdpbmRvdy5maWxlQ3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xuXHRcdFx0dGVtcGxhdGU6IFwiPGRpdiBjbGFzcz1cXFwiYm4tZmxleC1jb2xcXFwiIHN0eWxlPVxcXCJoZWlnaHQ6IDEwMCVcXFwiPlxcblx0PGRpdiBjbGFzcz1cXFwiYm4tdG9vbGJhclxcXCI+XFxuXFxuXHRcdDxkaXYgY2xhc3M9XFxcInN1YlRvb2xiYXJcXFwiIGJuLXNob3c9XFxcInNob3dUb29sYmFyXFxcIj5cdFx0XFxuXFxuXHRcdFx0PGJ1dHRvbiBcXG5cdFx0XHRcdGJuLWV2ZW50PVxcXCJjbGljazogb25Ub2dnbGVTZWxNb2RlXFxcIiBcXG5cdFx0XHRcdHRpdGxlPVxcXCJTZWxlY3QgbW9kZVxcXCIgXFxuXHRcdFx0XHRibi1jbGFzcz1cXFwic2VsZWN0ZWQ6IHNlbE1vZGVcXFwiXFxuXHRcdFx0XHQ+XFxuXHRcdFx0XHRcdDxpIGNsYXNzPVxcXCJmYSBmYS1jaGVja1xcXCI+PC9pPlxcblx0XHRcdDwvYnV0dG9uPlxcblxcblx0XHRcdDxidXR0b24gXFxuXHRcdFx0XHRibi1ldmVudD1cXFwiY2xpY2s6IG9uQ2FuY2VsU2VsZWN0aW9uXFxcIiBcXG5cdFx0XHRcdHRpdGxlPVxcXCJDYW5jZWwgc2VsZWN0aW9uXFxcIlxcblx0XHRcdFx0Ym4tcHJvcD1cXFwiZGlzYWJsZWQ6ICFjYW5DYW5jZWxcXFwiICBcXG5cdFx0XHRcdD5cXG5cdFx0XHRcdFx0PGkgY2xhc3M9XFxcImZhIGZhLXRpbWVzXFxcIj48L2k+XFxuXHRcdFx0PC9idXR0b24+XFxuXFxuXHRcdDwvZGl2Plxcblxcblx0XHQ8ZGl2IGNsYXNzPVxcXCJzdWJUb29sYmFyXFxcIiBibi1zaG93PVxcXCJzaG93VG9vbGJhclxcXCI+XFxuXFxuXHRcdFx0PGJ1dHRvbiBcXG5cdFx0XHRcdGJuLWV2ZW50PVxcXCJjbGljazogb25EZWxldGVcXFwiIFxcblx0XHRcdFx0Ym4tcHJvcD1cXFwiZGlzYWJsZWQ6ICFmaWxlU2VsZWN0ZWRcXFwiIFxcblx0XHRcdFx0dGl0bGU9XFxcIkRlbGV0ZSBzZWxlY3RlZCBmaWxlc1xcXCJcXG5cdFx0XHRcdD5cXG5cdFx0XHRcdFx0PGkgY2xhc3M9XFxcImZhIGZhLXRyYXNoXFxcIiA+PC9pPlxcblx0XHRcdDwvYnV0dG9uPlxcblxcblx0XHRcdDxidXR0b24gXFxuXHRcdFx0XHR0aXRsZT1cXFwiQ3V0XFxcIiBcXG5cdFx0XHRcdGJuLWV2ZW50PVxcXCJjbGljazogb25DdXRcXFwiIFxcblx0XHRcdFx0Ym4tcHJvcD1cXFwiZGlzYWJsZWQ6ICFmaWxlU2VsZWN0ZWRcXFwiXFxuXHRcdFx0XHQ+XFxuXHRcdFx0XHRcdDxpIGNsYXNzPVxcXCJmYSBmYS1jdXRcXFwiID48L2k+XFxuXHRcdFx0PC9idXR0b24+XFxuXFxuXHRcdFx0PGJ1dHRvbiBcXG5cdFx0XHRcdHRpdGxlPVxcXCJDb3B5XFxcIiBcXG5cdFx0XHRcdGJuLXByb3A9XFxcImRpc2FibGVkOiAhZmlsZVNlbGVjdGVkXFxcIiBcXG5cdFx0XHRcdGJuLWV2ZW50PVxcXCJjbGljazogb25Db3B5XFxcIlxcblx0XHRcdFx0Plxcblx0XHRcdFx0XHQ8aSBjbGFzcz1cXFwiZmEgZmEtY29weVxcXCIgPjwvaT5cXG5cdFx0XHQ8L2J1dHRvbj5cXG5cXG5cdFx0XHQ8YnV0dG9uIFxcblx0XHRcdFx0dGl0bGU9XFxcIlBhc3RlXFxcIiBcXG5cdFx0XHRcdGJuLXByb3A9XFxcImRpc2FibGVkOiAhY2FuUGFzdGVcXFwiIFxcblx0XHRcdFx0Ym4tZXZlbnQ9XFxcImNsaWNrOiBvblBhc3RlXFxcIlxcblx0XHRcdFx0Plxcblx0XHRcdFx0XHQ8aSBjbGFzcz1cXFwiZmEgZmEtcGFzdGVcXFwiID48L2k+XFxuXHRcdFx0PC9idXR0b24+XFxuXFxuXHRcdDwvZGl2Plxcblxcblx0XHQ8ZGl2IGNsYXNzPVxcXCJzdWJUb29sYmFyXFxcIiBibi1zaG93PVxcXCJzaG93VG9vbGJhclxcXCI+XFxuXFxuXHRcdFx0PGJ1dHRvbiBcXG5cdFx0XHRcdGJuLWV2ZW50PVxcXCJjbGljazogb25DcmVhdGVGb2xkZXJcXFwiIFxcblx0XHRcdFx0dGl0bGU9XFxcIk5ldyBmb2xkZXJcXFwiXFxuXHRcdFx0XHQ+XFxuXHRcdFx0XHRcdDxpIGNsYXNzPVxcXCJmYSBmYS1mb2xkZXItb3BlblxcXCIgPjwvaT5cXG5cdFx0XHQ8L2J1dHRvbj5cXG5cdFx0XHRcXG5cdFx0XHQ8YnV0dG9uIFxcblx0XHRcdFx0dGl0bGU9XFxcIkltcG9ydCBmaWxlXFxcIiBcXG5cdFx0XHRcdGJuLWV2ZW50PVxcXCJjbGljazogb25JbXBvcnRGaWxlXFxcIlxcblx0XHRcdFx0Plxcblx0XHRcdFx0XHQ8aSBjbGFzcz1cXFwiZmEgZmEtdXBsb2FkXFxcIiA+PC9pPlxcblx0XHRcdDwvYnV0dG9uPlxcblxcblx0XHQ8L2Rpdj5cXG5cXG5cdFx0PGRpdiBjbGFzcz1cXFwic3ViVG9vbGJhclxcXCIgIGJuLXNob3c9XFxcImJhY2tWaXNpYmxlXFxcIj5cXG5cXG5cdFx0XHQ8YnV0dG9uIGJuLWV2ZW50PVxcXCJjbGljazogb25CYWNrQnRuXFxcIiB0aXRsZT1cXFwiVG9wIGZvbGRlclxcXCI+XFxuXHRcdFx0XHQ8aSBjbGFzcz1cXFwiZmEgZmEtYXJyb3ctbGVmdFxcXCI+PC9pPlxcblx0XHRcdDwvYnV0dG9uPlx0XFxuXHRcdDwvZGl2Plx0XHRcdFxcblxcblx0PC9kaXY+XFxuXFxuXHQ8ZGl2IGNsYXNzPVxcXCJjb250ZW50UGFuZWxcXFwiPlxcblx0XHQ8ZGl2IGNsYXNzPVxcXCJwYXRoUGFuZWxcXFwiPlxcblx0XHRcdFBhdGg6Jm5ic3A7PHNwYW4gYm4tdGV4dD1cXFwicm9vdERpclxcXCI+PC9zcGFuPlxcblx0XHQ8L2Rpdj5cXG5cXG5cXG5cdFx0PGRpdiBibi1lYWNoPVxcXCJmIG9mIGZpbGVzXFxcIiBjbGFzcz1cXFwiY29udGFpbmVyXFxcIiBibi1ldmVudD1cXFwiY2xpY2suZm9sZGVyOiBvbkZvbGRlciwgY2xpY2suZmlsZTogb25GaWxlXFxcIj5cXG5cdFx0XHRcXG5cdFx0XHQ8ZGl2IGNsYXNzPVxcXCJ0aHVtYm5haWxcXFwiPlxcblx0XHRcdFx0XHQ8YSBibi1pZj1cXFwiZi5pc0ltYWdlXFxcIiBocmVmPVxcXCIjXFxcIiBibi1hdHRyPVxcXCJ0aXRsZTogZi5zaXplXFxcIiBjbGFzcz1cXFwiZmlsZVxcXCIgYm4tZGF0YT1cXFwibmFtZTogZi5uYW1lXFxcIj5cXG5cdFx0XHRcdFx0XHQ8ZGl2Plxcblx0XHRcdFx0XHRcdFx0PGltZyBibi1hdHRyPVxcXCJzcmM6IGYuaW1nVXJsXFxcIj5cXG5cdFx0XHRcdFx0XHQ8L2Rpdj5cXG5cdFx0XHRcdFx0XHRcXG5cdFx0XHRcdFx0XHQ8c3BhbiBibi10ZXh0PVxcXCJmLm5hbWVcXFwiPjwvc3Bhbj5cXG5cdFx0XHRcdFx0PC9hPlx0XHRcdFxcblx0XHRcdFx0XHQ8YSBibi1pZj1cXFwiZi5pc0RpclxcXCIgaHJlZj1cXFwiI1xcXCIgY2xhc3M9XFxcImZvbGRlclxcXCIgYm4tZGF0YT1cXFwibmFtZTogZi5uYW1lXFxcIj5cXG5cdFx0XHRcdFx0XHQ8ZGl2Plxcblx0XHRcdFx0XHRcdFx0PGkgY2xhc3M9XFxcImZhIGZhLTR4IGZhLWZvbGRlci1vcGVuIHczLXRleHQtYmx1ZS1ncmV5XFxcIj48L2k+XFxuXHRcdFx0XHRcdFx0PC9kaXY+XFxuXHRcdFx0XHRcdFx0XFxuXHRcdFx0XHRcdFx0PHNwYW4gYm4tdGV4dD1cXFwiZi5uYW1lXFxcIj48L3NwYW4+XFxuXHRcdFx0XHRcdDwvYT5cXG5cdFx0XHRcdFx0PGEgYm4taWY9XFxcImYuaXNGaWxlXFxcIiBocmVmPVxcXCIjXFxcIiBibi1kYXRhPVxcXCJuYW1lOiBmLm5hbWVcXFwiIGNsYXNzPVxcXCJmaWxlXFxcIiBibi1hdHRyPVxcXCJ0aXRsZTogZi5zaXplXFxcIj5cXG5cdFx0XHRcdFx0XHQ8ZGl2Plxcblx0XHRcdFx0XHRcdFx0PGkgY2xhc3M9XFxcImZhIGZhLTR4IGZhLWZpbGUgdzMtdGV4dC1ibHVlLWdyZXlcXFwiPjwvaT5cXG5cdFx0XHRcdFx0XHQ8L2Rpdj5cXG5cdFx0XHRcdFx0XHRcXG5cdFx0XHRcdFx0XHQ8c3BhbiBibi10ZXh0PVxcXCJmLm5hbWVcXFwiPjwvc3Bhbj5cXG5cdFx0XHRcdFx0PC9hPlx0XHRcdFxcblx0XHRcdFx0XFxuXHRcdFx0PC9kaXY+XFxuXHRcdDwvZGl2Plxcblx0PC9kaXY+XFxuPC9kaXY+XFxuXFxuXCIsXG5cdFx0XHRkYXRhOiB7XG5cdFx0XHRcdGZpbGVzOiBbXSxcblx0XHRcdFx0Y3V0RmlsZXM6IFtdLFxuXHRcdFx0XHRyb290RGlyOiAnLycsXG5cdFx0XHRcdGN1dERpcjogJy8nLFxuXHRcdFx0XHRiYWNrVmlzaWJsZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMucm9vdERpciAhPSAnLydcblx0XHRcdFx0fSxcblx0XHRcdFx0c2VsTW9kZTogZmFsc2UsXG5cdFx0XHRcdGZpbGVTZWxlY3RlZDogZmFsc2UsXG5cdFx0XHRcdHNob3dUb29sYmFyOiBvcHRpb25zLnRvb2xiYXIsXG5cdFx0XHRcdGNhbkNhbmNlbDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuY3V0RmlsZXMubGVuZ3RoICE9IDAgfHwgdGhpcy5maWxlU2VsZWN0ZWRcblx0XHRcdFx0fSxcblx0XHRcdFx0Y2FuUGFzdGU6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLmN1dEZpbGVzLmxlbmd0aCAhPSAwICYmIHRoaXMucm9vdERpciAhPSB0aGlzLmN1dERpclxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0ZXZlbnRzOiB7XG5cdFx0XHRcdG9uRm9sZGVyOiBmdW5jdGlvbihldikge1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCdvbkZvbGRlcicpXG5cdFx0XHRcdFx0aWYgKGN0cmwubW9kZWwuc2VsTW9kZSkge1xuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ3RoaXMnLCAkKHRoaXMpLmNsb3Nlc3QoJy50aHVtYm5haWwnKSlcblx0XHRcdFx0XHRcdCQodGhpcykuY2xvc2VzdCgnLnRodW1ibmFpbCcpLnRvZ2dsZUNsYXNzKCdzZWxlY3RlZCcpXG5cblx0XHRcdFx0XHRcdGN0cmwuc2V0RGF0YSgnZmlsZVNlbGVjdGVkJywgZ2V0U2VsRmlsZXMoKS5sZW5ndGggIT0gMClcblx0XHRcdFx0XHRcdHJldHVyblxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHZhciBkaXJOYW1lID0gJCh0aGlzKS5kYXRhKCduYW1lJylcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvbkZvbGRlcicsIGRpck5hbWUpXG5cdFx0XHRcdFx0ZXYucHJldmVudERlZmF1bHQoKVxuXHRcdFx0XHRcdGxvYWREYXRhKGN0cmwubW9kZWwucm9vdERpciArIGRpck5hbWUgKyAnLycpXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9uQmFja0J0bjogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0dmFyIHNwbGl0ID0gY3RybC5tb2RlbC5yb290RGlyLnNwbGl0KCcvJylcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvbkJhY2tCdG4nLCBzcGxpdClcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRzcGxpdC5wb3AoKVxuXHRcdFx0XHRcdHNwbGl0LnBvcCgpXG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygncm9vdERpcicsIHJvb3REaXIpXG5cdFx0XHRcdFx0bG9hZERhdGEoc3BsaXQuam9pbignLycpICsgJy8nKVxuXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9uRmlsZTogZnVuY3Rpb24oZXYpIHtcblx0XHRcdFx0XHR2YXIgbmFtZSA9ICQodGhpcykuZGF0YSgnbmFtZScpXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb25QaWN0dXJlJywgbmFtZSlcblx0XHRcdFx0XHRldi5wcmV2ZW50RGVmYXVsdCgpXG5cdFx0XHRcdFx0Ly92YXIgZmlsZVBhdGggPSBmaWxlU3J2LmZpbGVVcmwocm9vdERpciArIG5hbWUpXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnZmlsZVBhdGgnLCBmaWxlUGF0aClcblx0XHRcdFx0XHRpZiAoY3RybC5tb2RlbC5zZWxNb2RlKSB7XG5cdFx0XHRcdFx0XHQkKHRoaXMpLmNsb3Nlc3QoJy50aHVtYm5haWwnKS50b2dnbGVDbGFzcygnc2VsZWN0ZWQnKVxuXHRcdFx0XHRcdFx0Y3RybC5zZXREYXRhKCdmaWxlU2VsZWN0ZWQnLCBnZXRTZWxGaWxlcygpLmxlbmd0aCAhPSAwKVxuXHRcdFx0XHRcdFx0cmV0dXJuXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsdC50cmlnZ2VyKCdmaWxlQ2xpY2snLCB7bmFtZSwgcm9vdERpcjogY3RybC5tb2RlbC5yb290RGlyfSlcblx0XHRcdFx0fSxcblx0XHRcdFx0b25Ub2dnbGVTZWxNb2RlOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRjdHJsLnNldERhdGEoJ3NlbE1vZGUnLCAhY3RybC5tb2RlbC5zZWxNb2RlKVxuXHRcdFx0XHRcdGlmICghY3RybC5tb2RlbC5zZWxNb2RlKSB7XG5cdFx0XHRcdFx0XHRlbHQuZmluZCgnLnRodW1ibmFpbC5zZWxlY3RlZCcpLnJlbW92ZUNsYXNzKCdzZWxlY3RlZCcpXG5cdFx0XHRcdFx0XHRjdHJsLnNldERhdGEoJ2ZpbGVTZWxlY3RlZCcsIGZhbHNlKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSxcblx0XHRcdFx0b25EZWxldGU6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdCQkLnNob3dDb25maXJtKFwiQXJlIHlvdSBzdXJlID9cIiwgXCJEZWxldGUgZmlsZXNcIiwgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHR2YXIgc2VsRmlsZSA9IGdldFNlbEZpbGVzKClcblx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ29uRGVsZXRlJywgc2VsRmlsZSlcblx0XHRcdFx0XHRcdGZpbGVTcnYucmVtb3ZlRmlsZXMoc2VsRmlsZSlcblx0XHRcdFx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlc3ApIHtcblx0XHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ3Jlc3AnLCByZXNwKVxuXHRcdFx0XHRcdFx0XHRsb2FkRGF0YSgpXG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0LmNhdGNoKGZ1bmN0aW9uKHJlc3ApIHtcblx0XHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ3Jlc3AnLCByZXNwKVxuXHRcdFx0XHRcdFx0XHQkJC5zaG93QWxlcnQocmVzcC5yZXNwb25zZVRleHQsICdFcnJvcicpXG5cdFx0XHRcdFx0XHR9KVx0XHRcdFx0XHRcblx0XHRcdFx0XHR9KVxuXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9uQ3JlYXRlRm9sZGVyOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHR2YXIgcm9vdERpciA9IGN0cmwubW9kZWwucm9vdERpclxuXHRcdFx0XHRcdCQkLnNob3dQcm9tcHQoJ0ZvbGRlciBuYW1lOicsICdOZXcgRm9sZGVyJywgZnVuY3Rpb24oZm9sZGVyTmFtZSkge1xuXHRcdFx0XHRcdFx0ZmlsZVNydi5ta2Rpcihyb290RGlyICsgZm9sZGVyTmFtZSlcblx0XHRcdFx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlc3ApIHtcblx0XHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ3Jlc3AnLCByZXNwKVxuXHRcdFx0XHRcdFx0XHRsb2FkRGF0YSgpXG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0LmNhdGNoKGZ1bmN0aW9uKHJlc3ApIHtcblx0XHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ3Jlc3AnLCByZXNwKVxuXHRcdFx0XHRcdFx0XHQkJC5zaG93QWxlcnQocmVzcC5yZXNwb25zZVRleHQsICdFcnJvcicpXG5cdFx0XHRcdFx0XHR9KVx0XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0fSxcblx0XHRcdFx0b25DdXQ6IGZ1bmN0aW9uKCkge1xuXG5cdFx0XHRcdFx0Y29weSA9IGZhbHNlXG5cblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvbkN1dCcsIGN1dEZpbGVzKVxuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdGN0cmwuc2V0RGF0YSh7XG5cdFx0XHRcdFx0XHRzZWxNb2RlOiBmYWxzZSxcblx0XHRcdFx0XHRcdGZpbGVTZWxlY3RlZDogZmFsc2UsXG5cdFx0XHRcdFx0XHRjdXRGaWxlczogZ2V0U2VsRmlsZXMoKSxcblx0XHRcdFx0XHRcdGN1dERpcjogY3RybC5tb2RlbC5yb290RGlyXG5cdFx0XHRcdFx0fSlcblxuXHRcdFx0XHRcdGVsdC5maW5kKCcudGh1bWJuYWlsLnNlbGVjdGVkJykucmVtb3ZlQ2xhc3MoJ3NlbGVjdGVkJykuYWRkQ2xhc3MoJ2N1dGVkJylcblxuXHRcdFx0XHR9LFxuXHRcdFx0XHRvbkNvcHk6IGZ1bmN0aW9uKCkge1xuXG5cdFx0XHRcdFx0Y29weSA9IHRydWVcblxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ29uQ29weScsIGN1dEZpbGVzKVxuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdGN0cmwuc2V0RGF0YSh7XG5cdFx0XHRcdFx0XHRzZWxNb2RlOiBmYWxzZSxcblx0XHRcdFx0XHRcdGZpbGVTZWxlY3RlZDogZmFsc2UsXG5cdFx0XHRcdFx0XHRjdXRGaWxlczogZ2V0U2VsRmlsZXMoKSxcblx0XHRcdFx0XHRcdGN1dERpcjogY3RybC5tb2RlbC5yb290RGlyXG5cdFx0XHRcdFx0fSlcblxuXHRcdFx0XHRcdGVsdC5maW5kKCcudGh1bWJuYWlsLnNlbGVjdGVkJykucmVtb3ZlQ2xhc3MoJ3NlbGVjdGVkJykuYWRkQ2xhc3MoJ2N1dGVkJylcblx0XHRcdFx0fSxcblxuXHRcdFx0XHRvblBhc3RlOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvblBhc3RlJylcblx0XHRcdFx0XHR2YXIge3Jvb3REaXIsIGN1dEZpbGVzfSA9IGN0cmwubW9kZWxcblx0XHRcdFx0XHR2YXIgcHJvbWlzZSA9IChjb3B5KSA/IGZpbGVTcnYuY29weUZpbGVzKGN1dEZpbGVzLCByb290RGlyKSA6IGZpbGVTcnYubW92ZUZpbGVzKGN1dEZpbGVzLCByb290RGlyKVxuXHRcdFx0XHRcdGNvcHkgPSBmYWxzZVxuXHRcdFx0XHRcdHByb21pc2Vcblx0XHRcdFx0XHQudGhlbihmdW5jdGlvbihyZXNwKSB7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZygncmVzcCcsIHJlc3ApXG5cdFx0XHRcdFx0XHRjdHJsLnNldERhdGEoe2N1dEZpbGVzOiBbXX0pXG5cdFx0XHRcdFx0XHRsb2FkRGF0YSgpXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQuY2F0Y2goZnVuY3Rpb24ocmVzcCkge1xuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ3Jlc3AnLCByZXNwKVxuXHRcdFx0XHRcdFx0Y3RybC5zZXREYXRhKHtjdXRGaWxlczogW119KVxuXHRcdFx0XHRcdFx0JCQuc2hvd0FsZXJ0KHJlc3AucmVzcG9uc2VUZXh0LCAnRXJyb3InKVxuXHRcdFx0XHRcdH0pXHRcblx0XHRcdFx0fSxcblx0XHRcdFx0b25DYW5jZWxTZWxlY3Rpb246IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGVsdC5maW5kKCcudGh1bWJuYWlsJykucmVtb3ZlQ2xhc3MoJ3NlbGVjdGVkIGN1dGVkJylcblx0XHRcdFx0XHRjdHJsLnNldERhdGEoe1xuXHRcdFx0XHRcdFx0ZmlsZVNlbGVjdGVkOiBmYWxzZSxcblx0XHRcdFx0XHRcdGN1dEZpbGVzOiBbXVxuXHRcdFx0XHRcdH0pXHRcdFx0XHRcblx0XHRcdFx0fSxcblx0XHRcdFx0b25JbXBvcnRGaWxlOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvbkltcG9ydEZpbGUnKVxuXHRcdFx0XHRcdHZhciByb290RGlyID0gY3RybC5tb2RlbC5yb290RGlyXG5cblx0XHRcdFx0XHQkJC5vcGVuRmlsZURpYWxvZyhmdW5jdGlvbihmaWxlKSB7XG5cdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdmaWxlU2l6ZScsIGZpbGUuc2l6ZSAvIDEwMjQpXG5cdFx0XHRcdFx0XHRpZiAoZmlsZS5zaXplID4gb3B0aW9ucy5tYXhVcGxvYWRTaXplKSB7XG5cdFx0XHRcdFx0XHRcdCQkLnNob3dBbGVydCgnRmlsZSB0b28gYmlnJywgJ0Vycm9yJylcblx0XHRcdFx0XHRcdFx0cmV0dXJuXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHQkJC5yZWFkRmlsZUFzRGF0YVVSTChmaWxlLCBmdW5jdGlvbihkYXRhVVJMKSB7XG5cdFx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ2RhdGFVUkwnLCBkYXRhVVJMKVxuXHRcdFx0XHRcdFx0XHRmaWxlU3J2LnVwbG9hZEZpbGUoZGF0YVVSTCwgZmlsZS5uYW1lLCByb290RGlyKS50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0XHRcdGxvYWREYXRhKClcblx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0LmNhdGNoKGZ1bmN0aW9uKHJlc3ApIHtcblx0XHRcdFx0XHRcdFx0XHRjb25zb2xlLmxvZygncmVzcCcsIHJlc3ApXG5cdFx0XHRcdFx0XHRcdFx0JCQuc2hvd0FsZXJ0KHJlc3AucmVzcG9uc2VUZXh0LCAnRXJyb3InKVx0XHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHR9KVx0XHRcdFx0XHRcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHR9XG5cdFx0XHR9IFxuXHRcdH0pXG5cblx0XHRmdW5jdGlvbiBsb2FkRGF0YShyb290RGlyKSB7XG5cdFx0XHRpZiAocm9vdERpciA9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0cm9vdERpciA9IGN0cmwubW9kZWwucm9vdERpclxuXHRcdFx0fVxuXHRcdFx0ZmlsZVNydi5saXN0KHJvb3REaXIsIG9wdGlvbnMuaW1hZ2VPbmx5KS50aGVuKGZ1bmN0aW9uKGZpbGVzKSB7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ2ZpbGVzJywgZmlsZXMpXG5cdFx0XHRcdGN0cmwuc2V0RGF0YSh7XG5cdFx0XHRcdFx0cm9vdERpcixcblx0XHRcdFx0XHRmaWxlU2VsZWN0ZWQ6IGZhbHNlLFxuXHRcdFx0XHRcdGZpbGVzOiBmaWxlc1xuXHRcdC8qXHRcdFx0XHQuZmlsdGVyKGZ1bmN0aW9uKGZpbGUpIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuICFmaWxlLmlzRGlyXG5cdFx0XHRcdFx0XHR9KSovXG5cdFx0XHRcdFx0XHQubWFwKGZ1bmN0aW9uKGZpbGUsIGlkeCkge1xuXHRcdFx0XHRcdFx0XHR2YXIgbmFtZSA9IGZpbGUudGl0bGVcblx0XHRcdFx0XHRcdFx0dmFyIGlzRGlyID0gZmlsZS5mb2xkZXJcblx0XHRcdFx0XHRcdFx0dmFyIGlzSW1hZ2UgPSAkJC5pc0ltYWdlKG5hbWUpXG5cdFx0XHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRcdFx0bmFtZSxcblx0XHRcdFx0XHRcdFx0XHRzaXplOiAnU2l6ZSA6ICcgKyBNYXRoLmZsb29yKGZpbGUuc2l6ZS8xMDI0KSArICcgS28nLFxuXHRcdFx0XHRcdFx0XHRcdGltZ1VybDogIGlzRGlyID8gJycgOiBmaWxlU3J2LmZpbGVVcmwocm9vdERpciArIG5hbWUpLFxuXHRcdFx0XHRcdFx0XHRcdGlzRGlyLFxuXHRcdFx0XHRcdFx0XHRcdGlzSW1hZ2UsIFxuXHRcdFx0XHRcdFx0XHRcdGlzRmlsZTogIWlzRGlyICYmICFpc0ltYWdlXG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdH0pXG5cdFx0XHR9KVx0XHRcblx0XHR9XG5cblx0XHRsb2FkRGF0YSgpXG5cblx0XHR0aGlzLmdldEZpbGVzID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gY3RybC5tb2RlbC5maWxlc1xuXHRcdH1cblx0fVxuXG59KTtcbiIsIihmdW5jdGlvbigpIHtcblxuZnVuY3Rpb24gZ2V0Tm9kZVBhdGgobm9kZSkge1xuXG5cdHZhciBwYXRoID0gbm9kZS5nZXRQYXJlbnRMaXN0KGZhbHNlLCB0cnVlKS5tYXAoKG5vZGUpID0+IG5vZGUua2V5ID09ICdyb290JyA/ICcvJyA6IG5vZGUudGl0bGUpXG5cdHJldHVybiBwYXRoLmpvaW4oJy8nKVxufVxuXG4kJC5yZWdpc3RlckNvbnRyb2xFeCgnRmlsZVRyZWVDb250cm9sJywge1xuXHRkZXBzOiBbJ0ZpbGVTZXJ2aWNlJ10sXG5cdGlmYWNlOiAncmVmcmVzaCgpO2dldFZhbHVlKCknLFxuXHRcblx0bGliOiAnZmlsZScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMsIGZpbGVTcnYpIHtcblx0XHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xuXHRcdFx0dGVtcGxhdGU6IFwiPGRpdj5cXG5cdDxkaXYgYm4tY29udHJvbD1cXFwiVHJlZUNvbnRyb2xcXFwiIGJuLW9wdGlvbnM9XFxcInRyZWVPcHRpb25zXFxcIiBibi1pZmFjZT1cXFwidHJlZUN0cmxcXFwiIGJuLWV2ZW50PVxcXCJjb250ZXh0TWVudUFjdGlvbjogb25UcmVlQWN0aW9uXFxcIj48L2Rpdj5cXG48L2Rpdj5cIixcdFx0XG5cdFx0XHRkYXRhOiB7XG5cdFx0XHRcdHRyZWVPcHRpb25zOiB7XG5cdFx0XHRcdFx0c291cmNlOiBbe3RpdGxlOiAnSG9tZScsIGZvbGRlcjogdHJ1ZSwgbGF6eTogdHJ1ZSwga2V5OiAncm9vdCd9XSxcblxuXHRcdFx0XHRcdGxhenlMb2FkOiBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuXHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdsYXp5TG9hZCcsIGRhdGEubm9kZS5rZXkpXG5cdFx0XHRcdFx0XHR2YXIgcGF0aCA9IGdldE5vZGVQYXRoKGRhdGEubm9kZSlcblx0XHRcdFx0XHRcdGRhdGEucmVzdWx0ID0gZmlsZVNydi5saXN0KHBhdGgsIGZhbHNlLCB0cnVlKVxuXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRjb250ZXh0TWVudToge1xuXHRcdFx0XHRcdFx0bWVudToge1xuXHRcdFx0XHRcdFx0XHRuZXdGb2xkZXI6IHsnbmFtZSc6ICdOZXcgRm9sZGVyJ31cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRldmVudHM6IHtcblx0XHRcdFx0b25UcmVlQWN0aW9uOiBmdW5jdGlvbihub2RlLCBhY3Rpb24pIHtcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvblRyZWVBY3Rpb24nLCBub2RlLnRpdGxlLCBhY3Rpb24pXG5cdFx0XHRcdFx0JCQuc2hvd1Byb21wdCgnRm9sZGVyIG5hbWUnLCAnTmV3IEZvbGRlcicsIGZ1bmN0aW9uKGZvbGRlck5hbWUpIHtcblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0dmFyIHBhdGggPSBnZXROb2RlUGF0aChub2RlKVxuXHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnZm9sZGVyTmFtZScsIGZvbGRlck5hbWUsICdwYXRoJywgcGF0aClcblx0XHRcdFx0XHRcdGZpbGVTcnYubWtkaXIocGF0aCArICcvJyArIGZvbGRlck5hbWUpXG5cdFx0XHRcdFx0XHQudGhlbihmdW5jdGlvbihyZXNwKSB7XG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdyZXNwJywgcmVzcClcblx0XHRcdFx0XHRcdFx0bm9kZS5sb2FkKHRydWUpXG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0LmNhdGNoKGZ1bmN0aW9uKHJlc3ApIHtcblx0XHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ3Jlc3AnLCByZXNwKVxuXHRcdFx0XHRcdFx0XHQkJC5zaG93QWxlcnQocmVzcC5yZXNwb25zZVRleHQsICdFcnJvcicpXG5cdFx0XHRcdFx0XHR9KVx0XHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0fVxuXHRcdFx0fVx0XHRcdFxuXHRcdH0pXG5cblx0XHR0aGlzLmdldFZhbHVlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gZ2V0Tm9kZVBhdGgoY3RybC5zY29wZS50cmVlQ3RybC5nZXRBY3RpdmVOb2RlKCkpXG5cdFx0fSxcblxuXHRcdHRoaXMucmVmcmVzaCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0Y29uc3Qgcm9vdCA9IGN0cmwuc2NvcGUudHJlZUN0cmwuZ2V0Um9vdE5vZGUoKS5nZXRGaXJzdENoaWxkKClcblx0XHRcdGlmIChyb290KSB7XG5cdFx0XHRcdHJvb3QubG9hZCh0cnVlKVxuXHRcdFx0fVxuXHRcdH1cblx0XHRcblx0fVxuXG59KTtcblxuXG59KSgpO1xuXG5cblxuIl19
