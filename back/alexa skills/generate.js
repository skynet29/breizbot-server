var fs = require('fs')

var alexaApp = require('../controllers/alexa')


var content = alexaApp.schemas.askcli('jarvis')

fs.writeFileSync('testSkill/models/fr-FR.json', content)

