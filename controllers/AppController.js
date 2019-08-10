var App = require('../models/App')
var utils = require('../utils')


const slugVersion = (text, numRandomChars) => {
	let slug = text.toString().toLowerCase()
			.replace(/\s+/g, '-')           // Replace spaces with -
			.replace(/[^\w\-]+/g, '')       // Remove all non-word chars
			.replace(/\-\-+/g, '-')         // Replace multiple - with single -
			.replace(/^-+/, '')             // Trim - from start of text
			.replace(/-+$/, '');            // Trim - from end of text

	if (numRandomChars == null)
		return slug.toLowerCase()

	if (numRandomChars <= 0)
		return slug.toLowerCase()

	const possible = 'abcdefghijklmnopqrstuvwxyz0123456789'
	let randomString = ''
	for (var i=0; i <numRandomChars; i++)
		randomString += possible.charAt(Math.floor(Math.random() * possible.length))

	return slug.toLowerCase()+'-'+randomString
}

module.exports = {
	get: function(params){
		return new Promise(function(resolve, reject){
			if (params == null)
				params = {}

			var sortOrder = (params.sort == 'asc') ? 1 : -1
			delete params['sort']

			/* Query by filters passed into parameter string: */
			var limit = params.limit
			if (limit == null)
				limit = '0'

			delete params['limit']

			App.find(params, null, {limit:parseInt(limit), sort:{timestamp: sortOrder}}, function(err, apps){
				if (err){
					reject(err)
					return
				}

				resolve(utils.Resource.convertToJson(apps))
			})
		})
	},

	getById: function(id, isRaw){
		return new Promise(function(resolve, reject){
			App.findById(id, function(err, app){
				if (err){
					reject(new Error('App ' + id + ' not found'))
					return
				}

				if (app == null){
					reject(new Error('App ' + id + ' not found'))
					return
				}

				if (isRaw){
					resolve(app)
					return
				}

				resolve(app.summary())
			})
		})
	},

	post: function(params){
		return new Promise(function(resolve, reject){
			if (params.name != null)
				params['slug'] = slugVersion(params.name, 6)

			App.create(params, function(err, app){
				if (err){
					reject(err)
					return
				}

				resolve(app.summary())
				return
			})
		})
	},

	put: function(id, params, token){
		return new Promise(function(resolve, reject){
			App.findByIdAndUpdate(id, params, {new:true}, function(err, app){
				if (err){
					reject(err)
					return
				}

				resolve(app.summary())
			})
		})
	},

	delete: function(id){
		return new Promise(function(resolve, reject){
			App.findByIdAndRemove(id, function(err){
		    if (err) {
					reject(err)
					return
		    }

		    resolve()
			})
		})
	}

}
