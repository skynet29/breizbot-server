$$.configReady(function(config) {

    var formData = {
        gender: 'female',
         fruits: ['orange', 'apple'],
          name: 'toto'
    }

    var options = {
        "menus": [
            {"text": "\uf015", "action": "toto", color: 'red'},
            {"text": "\uf099", "color": "blue"}
            ],
        "triggerPos": {
            "left": 100,
            "top": 200
        }
    }

    var clients = [
        'Marc',
        'Quentin'
    ]


    var ctrl = $$.viewController('body', {
        template: "<div>\n<div class=\"bn-flex-row\">\n    <form bn-form=\"formData\" bn-event=\"submit: onSubmit\">\n        <p>Name: <input type=\"text\" name=\"name\"></p>\n        <p>Email: <input type=\"text\" name=\"email\"></p>\n        <p>Gender:\n            <ul bn-control=\"RadioGroupControl\" name=\"gender\" bn-event=\"input: onGenderChange\">\n                <li><input type=\"radio\" value=\"male\" id=\"male\"><label for=\"male\">Male</label> </li>\n                <li><input type=\"radio\" value=\"female\" id=\"female\"><label for=\"female\">Female</label> </li>\n            </ul>\n        </p>\n        <p>Fruits:\n            <ul bn-control=\"CheckGroupControl\" name=\"fruits\" bn-event=\"input: onFruitsChange\">\n                <li><input type=\"checkbox\" value=\"orange\">Orange </li>\n                <li><input type=\"checkbox\" value=\"bananas\">Bananas </li>\n                <li><input type=\"checkbox\" value=\"apple\">Apple </li>\n            </ul>\n        </p>\n        <p><button type=\"submit\" class=\"w3-btn w3-blue\">Submit</button></p>\n    </form>  \n    <div>\n        <pre bn-text=\"result\"></pre>\n    </div>  \n</div>\n\n<div>\n    <h2>Name</h2>\n    <p bn-text=\"name\"></p>\n    <h2>FullName</h2>\n    <p bn-text=\"fullName\"></p>\n</div>\n\n<div>\n    <h2>Clients</h2>\n    <ul bn-each=\"client of clients\">\n        <li bn-text=\"client\"></li>\n    </ul>\n    <form bn-event=\"submit: addClient, input.field: onFieldChange\">\n        <input class=\"field\" type=\"text\" name=\"name\" placeholder=\"Name\" required>\n        <input class=\"field\" type=\"number\" name=\"age\" placeholder=\"Age\" min=\"1\" required>\n        <button type=\"submit\" bn-prop=\"disabled: !canSubmit\">New Client</button>\n    </form>\n</div>\n\n\n\n<div style=\"width:300px; height: 300px; border: 1px solid black;\">\n    <div bn-control=\"CircularMenuControl\" bn-options=\"options\" data-radius=\"120\" data-iconPos=\"80\" data-innerRadius=\"40\" bn-event=\"menuSelected: onMenuSelected\"/>\n</div>\n</div>",
        data: {
            formData, options, 
            clients,
             canSubmit: false,
             name: 'Delomez',
             surname: 'Marc',
             fullName: function() {
                //console.log('fullName', this)
                return this.name + ' ' + this.surname
             }
         },

         events: {
            onSubmit: function(ev) {
                ev.preventDefault()
                var result = JSON.stringify($(this).getFormData(), null, 4)
                //$('body').processTemplate({result: result})
                ctrl.setData({result: result})
               
            },
            onMenuSelected: function(info) {
                console.log('menuSelected', info)
            },
            addClient: function(ev) {
                ev.preventDefault()
                var data = $(this).getFormData()

                console.log('addClient', data)
                ctrl.model.clients.push(data.name)
                ctrl.update('clients')
            },
            onFieldChange: function(ev) {
                console.log('onFieldChange')
                var isOk = this.reportValidity()
                ctrl.setData({canSubmit: isOk})
            },
            onGenderChange: function() {
                console.log('onGenderChange', $(this).getValue())
            },
            onFruitsChange: function() {
                console.log('onFruitsChange', $(this).getValue())
            }  
        }      
    }) 

    window.app = ctrl
})
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIiQkLmNvbmZpZ1JlYWR5KGZ1bmN0aW9uKGNvbmZpZykge1xuXG4gICAgdmFyIGZvcm1EYXRhID0ge1xuICAgICAgICBnZW5kZXI6ICdmZW1hbGUnLFxuICAgICAgICAgZnJ1aXRzOiBbJ29yYW5nZScsICdhcHBsZSddLFxuICAgICAgICAgIG5hbWU6ICd0b3RvJ1xuICAgIH1cblxuICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgICBcIm1lbnVzXCI6IFtcbiAgICAgICAgICAgIHtcInRleHRcIjogXCJcXHVmMDE1XCIsIFwiYWN0aW9uXCI6IFwidG90b1wiLCBjb2xvcjogJ3JlZCd9LFxuICAgICAgICAgICAge1widGV4dFwiOiBcIlxcdWYwOTlcIiwgXCJjb2xvclwiOiBcImJsdWVcIn1cbiAgICAgICAgICAgIF0sXG4gICAgICAgIFwidHJpZ2dlclBvc1wiOiB7XG4gICAgICAgICAgICBcImxlZnRcIjogMTAwLFxuICAgICAgICAgICAgXCJ0b3BcIjogMjAwXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgY2xpZW50cyA9IFtcbiAgICAgICAgJ01hcmMnLFxuICAgICAgICAnUXVlbnRpbidcbiAgICBdXG5cblxuICAgIHZhciBjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoJ2JvZHknLCB7XG4gICAgICAgIHRlbXBsYXRlOiBcIjxkaXY+XFxuPGRpdiBjbGFzcz1cXFwiYm4tZmxleC1yb3dcXFwiPlxcbiAgICA8Zm9ybSBibi1mb3JtPVxcXCJmb3JtRGF0YVxcXCIgYm4tZXZlbnQ9XFxcInN1Ym1pdDogb25TdWJtaXRcXFwiPlxcbiAgICAgICAgPHA+TmFtZTogPGlucHV0IHR5cGU9XFxcInRleHRcXFwiIG5hbWU9XFxcIm5hbWVcXFwiPjwvcD5cXG4gICAgICAgIDxwPkVtYWlsOiA8aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgbmFtZT1cXFwiZW1haWxcXFwiPjwvcD5cXG4gICAgICAgIDxwPkdlbmRlcjpcXG4gICAgICAgICAgICA8dWwgYm4tY29udHJvbD1cXFwiUmFkaW9Hcm91cENvbnRyb2xcXFwiIG5hbWU9XFxcImdlbmRlclxcXCIgYm4tZXZlbnQ9XFxcImlucHV0OiBvbkdlbmRlckNoYW5nZVxcXCI+XFxuICAgICAgICAgICAgICAgIDxsaT48aW5wdXQgdHlwZT1cXFwicmFkaW9cXFwiIHZhbHVlPVxcXCJtYWxlXFxcIiBpZD1cXFwibWFsZVxcXCI+PGxhYmVsIGZvcj1cXFwibWFsZVxcXCI+TWFsZTwvbGFiZWw+IDwvbGk+XFxuICAgICAgICAgICAgICAgIDxsaT48aW5wdXQgdHlwZT1cXFwicmFkaW9cXFwiIHZhbHVlPVxcXCJmZW1hbGVcXFwiIGlkPVxcXCJmZW1hbGVcXFwiPjxsYWJlbCBmb3I9XFxcImZlbWFsZVxcXCI+RmVtYWxlPC9sYWJlbD4gPC9saT5cXG4gICAgICAgICAgICA8L3VsPlxcbiAgICAgICAgPC9wPlxcbiAgICAgICAgPHA+RnJ1aXRzOlxcbiAgICAgICAgICAgIDx1bCBibi1jb250cm9sPVxcXCJDaGVja0dyb3VwQ29udHJvbFxcXCIgbmFtZT1cXFwiZnJ1aXRzXFxcIiBibi1ldmVudD1cXFwiaW5wdXQ6IG9uRnJ1aXRzQ2hhbmdlXFxcIj5cXG4gICAgICAgICAgICAgICAgPGxpPjxpbnB1dCB0eXBlPVxcXCJjaGVja2JveFxcXCIgdmFsdWU9XFxcIm9yYW5nZVxcXCI+T3JhbmdlIDwvbGk+XFxuICAgICAgICAgICAgICAgIDxsaT48aW5wdXQgdHlwZT1cXFwiY2hlY2tib3hcXFwiIHZhbHVlPVxcXCJiYW5hbmFzXFxcIj5CYW5hbmFzIDwvbGk+XFxuICAgICAgICAgICAgICAgIDxsaT48aW5wdXQgdHlwZT1cXFwiY2hlY2tib3hcXFwiIHZhbHVlPVxcXCJhcHBsZVxcXCI+QXBwbGUgPC9saT5cXG4gICAgICAgICAgICA8L3VsPlxcbiAgICAgICAgPC9wPlxcbiAgICAgICAgPHA+PGJ1dHRvbiB0eXBlPVxcXCJzdWJtaXRcXFwiIGNsYXNzPVxcXCJ3My1idG4gdzMtYmx1ZVxcXCI+U3VibWl0PC9idXR0b24+PC9wPlxcbiAgICA8L2Zvcm0+ICBcXG4gICAgPGRpdj5cXG4gICAgICAgIDxwcmUgYm4tdGV4dD1cXFwicmVzdWx0XFxcIj48L3ByZT5cXG4gICAgPC9kaXY+ICBcXG48L2Rpdj5cXG5cXG48ZGl2PlxcbiAgICA8aDI+TmFtZTwvaDI+XFxuICAgIDxwIGJuLXRleHQ9XFxcIm5hbWVcXFwiPjwvcD5cXG4gICAgPGgyPkZ1bGxOYW1lPC9oMj5cXG4gICAgPHAgYm4tdGV4dD1cXFwiZnVsbE5hbWVcXFwiPjwvcD5cXG48L2Rpdj5cXG5cXG48ZGl2PlxcbiAgICA8aDI+Q2xpZW50czwvaDI+XFxuICAgIDx1bCBibi1lYWNoPVxcXCJjbGllbnQgb2YgY2xpZW50c1xcXCI+XFxuICAgICAgICA8bGkgYm4tdGV4dD1cXFwiY2xpZW50XFxcIj48L2xpPlxcbiAgICA8L3VsPlxcbiAgICA8Zm9ybSBibi1ldmVudD1cXFwic3VibWl0OiBhZGRDbGllbnQsIGlucHV0LmZpZWxkOiBvbkZpZWxkQ2hhbmdlXFxcIj5cXG4gICAgICAgIDxpbnB1dCBjbGFzcz1cXFwiZmllbGRcXFwiIHR5cGU9XFxcInRleHRcXFwiIG5hbWU9XFxcIm5hbWVcXFwiIHBsYWNlaG9sZGVyPVxcXCJOYW1lXFxcIiByZXF1aXJlZD5cXG4gICAgICAgIDxpbnB1dCBjbGFzcz1cXFwiZmllbGRcXFwiIHR5cGU9XFxcIm51bWJlclxcXCIgbmFtZT1cXFwiYWdlXFxcIiBwbGFjZWhvbGRlcj1cXFwiQWdlXFxcIiBtaW49XFxcIjFcXFwiIHJlcXVpcmVkPlxcbiAgICAgICAgPGJ1dHRvbiB0eXBlPVxcXCJzdWJtaXRcXFwiIGJuLXByb3A9XFxcImRpc2FibGVkOiAhY2FuU3VibWl0XFxcIj5OZXcgQ2xpZW50PC9idXR0b24+XFxuICAgIDwvZm9ybT5cXG48L2Rpdj5cXG5cXG5cXG5cXG48ZGl2IHN0eWxlPVxcXCJ3aWR0aDozMDBweDsgaGVpZ2h0OiAzMDBweDsgYm9yZGVyOiAxcHggc29saWQgYmxhY2s7XFxcIj5cXG4gICAgPGRpdiBibi1jb250cm9sPVxcXCJDaXJjdWxhck1lbnVDb250cm9sXFxcIiBibi1vcHRpb25zPVxcXCJvcHRpb25zXFxcIiBkYXRhLXJhZGl1cz1cXFwiMTIwXFxcIiBkYXRhLWljb25Qb3M9XFxcIjgwXFxcIiBkYXRhLWlubmVyUmFkaXVzPVxcXCI0MFxcXCIgYm4tZXZlbnQ9XFxcIm1lbnVTZWxlY3RlZDogb25NZW51U2VsZWN0ZWRcXFwiLz5cXG48L2Rpdj5cXG48L2Rpdj5cIixcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgZm9ybURhdGEsIG9wdGlvbnMsIFxuICAgICAgICAgICAgY2xpZW50cyxcbiAgICAgICAgICAgICBjYW5TdWJtaXQ6IGZhbHNlLFxuICAgICAgICAgICAgIG5hbWU6ICdEZWxvbWV6JyxcbiAgICAgICAgICAgICBzdXJuYW1lOiAnTWFyYycsXG4gICAgICAgICAgICAgZnVsbE5hbWU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ2Z1bGxOYW1lJywgdGhpcylcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5uYW1lICsgJyAnICsgdGhpcy5zdXJuYW1lXG4gICAgICAgICAgICAgfVxuICAgICAgICAgfSxcblxuICAgICAgICAgZXZlbnRzOiB7XG4gICAgICAgICAgICBvblN1Ym1pdDogZnVuY3Rpb24oZXYpIHtcbiAgICAgICAgICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IEpTT04uc3RyaW5naWZ5KCQodGhpcykuZ2V0Rm9ybURhdGEoKSwgbnVsbCwgNClcbiAgICAgICAgICAgICAgICAvLyQoJ2JvZHknKS5wcm9jZXNzVGVtcGxhdGUoe3Jlc3VsdDogcmVzdWx0fSlcbiAgICAgICAgICAgICAgICBjdHJsLnNldERhdGEoe3Jlc3VsdDogcmVzdWx0fSlcbiAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uTWVudVNlbGVjdGVkOiBmdW5jdGlvbihpbmZvKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ21lbnVTZWxlY3RlZCcsIGluZm8pXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYWRkQ2xpZW50OiBmdW5jdGlvbihldikge1xuICAgICAgICAgICAgICAgIGV2LnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgICAgICAgICB2YXIgZGF0YSA9ICQodGhpcykuZ2V0Rm9ybURhdGEoKVxuXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2FkZENsaWVudCcsIGRhdGEpXG4gICAgICAgICAgICAgICAgY3RybC5tb2RlbC5jbGllbnRzLnB1c2goZGF0YS5uYW1lKVxuICAgICAgICAgICAgICAgIGN0cmwudXBkYXRlKCdjbGllbnRzJylcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbkZpZWxkQ2hhbmdlOiBmdW5jdGlvbihldikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdvbkZpZWxkQ2hhbmdlJylcbiAgICAgICAgICAgICAgICB2YXIgaXNPayA9IHRoaXMucmVwb3J0VmFsaWRpdHkoKVxuICAgICAgICAgICAgICAgIGN0cmwuc2V0RGF0YSh7Y2FuU3VibWl0OiBpc09rfSlcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbkdlbmRlckNoYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ29uR2VuZGVyQ2hhbmdlJywgJCh0aGlzKS5nZXRWYWx1ZSgpKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uRnJ1aXRzQ2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnb25GcnVpdHNDaGFuZ2UnLCAkKHRoaXMpLmdldFZhbHVlKCkpXG4gICAgICAgICAgICB9ICBcbiAgICAgICAgfSAgICAgIFxuICAgIH0pIFxuXG4gICAgd2luZG93LmFwcCA9IGN0cmxcbn0pIl19
