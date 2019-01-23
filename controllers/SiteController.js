var Site = require('../models/Site')
// var UpdateController = require('./UpdateController')
// var Promise = require('bluebird')
var uuidv4 = require('uuid/v4') // https://www.npmjs.com/package/uuid
var bcrypt = require('bcryptjs')
var utils = require('../utils')

module.exports = {
	get: function(params, isRaw){
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

			if (params['tags']){
				var array = []
				var parts = params.tags.split(',') // array of tags
				parts.forEach(function(tag, i){
					array.push({tags: tag})
				})

				params = {$or: array}
				delete params['tags']
			}

			Site.find(params, null, {limit:parseInt(limit), sort:{timestamp: sortOrder}}, function(err, sites){
				if (err){
					reject(err)
					return
				}

				if (isRaw){
					resolve(sites)
					return
				}

				resolve(utils.Resource.convertToJson(sites))
			})
		})
	},

	getById: function(id, isRaw){
		return new Promise(function(resolve, reject){
			Site.findById(id, function(err, site){
				if (err){
					reject(new Error('Site '+id+' not found'))
					return
				}

				if (site == null){
					reject(new Error('Site '+id+' not found'))
					return
				}

				if (isRaw){
					resolve(site)
					return
				}

				resolve(site.summary())
			})
		})
	},

	post: (params) => {
		return new Promise((resolve, reject) => {
			params['slug'] = utils.TextUtils.slugVersion(params.name)+'-'+utils.TextUtils.randomString(6).toLowerCase()
			const apiKey = uuidv4()
			params['api'] = {key:apiKey, secret:''} // generate random api key:
			params['authorized'] = [apiKey]

			// if coming from jQuery AJAX, profile is stringified. Parse it here first.
			if (params.profile != null){
				try {
					params['profile'] = JSON.parse(params.profile)
				}
				catch(err){}
			}

			// if coming from jQuery AJAX, profile is stringified. Parse it here first.
			// if (params.pages != null){
			// 	try {
			// 		params['pages'] = JSON.parse(params.pages)
			// 	}
			// 	catch(err){}
			// }

			if (params.image == null)
				params['image'] = process.env.IMAGE_PLACEHOLDER

			utils.AWS.createFolder(params.slug)
			.then(data => {
				return Site.create(params)
			})
			.then(site => {
				resolve(site.summary())
			})
			.catch(err => {
				console.log('ERROR: '+err)
				reject(err)
			})
		})
	},

	put: function(id, params, token){
		return new Promise(function(resolve, reject){
			// if (token == null){
			// 	reject({message: 'Unauthorized'})
			// 	return
			// }

			// utils.JWT.verify(token, process.env.TOKEN_SECRET)
			// .then(function(decode){
			// 	var userId = decode.id
			// 	console.log('USER ID: '+userId)
			// 	// TODO: check if user is authorized to change post

			// 	Post.findByIdAndUpdate(id, params, {new:true}, function(err, post){
			// 		if (err){
			// 			reject(err)
			// 			return
			// 		}

			// 		resolve(post.summary())
			// 	})
			// })
			// .catch(function(err){
			// 	reject(err)
			// 	return
			// })

			if (params['globalConfig'] != null){
				try {
					params['globalConfig'] = JSON.parse(params.globalConfig)
				}
				catch(err){
					console.log('PARSE ERROR: ' + err.message)
				}
			}

			Site.findByIdAndUpdate(id, params, {new:true}, function(err, site){
				if (err){
					reject(err)
					return
				}

				// don't create update for the following:
				if (params['functions'] != null){ // if this comes from functions deployment, do not update
					resolve(site.summary())
					return
				}

				if (params['featured'] != null){
					resolve(site.summary())
					return
				}

				if (params['api'] != null){
					resolve(site.summary())
					return
				}

				// Create corresponding update object for the Feed:
				// var summary = site.summary()
				// var update = {
				// 	site: {id:summary.id, slug:summary.slug, image:summary.image, name:summary.name},
				// 	description: 'App updated: ' + Object.keys(params).join(', '),
				// 	profile: summary.profile // TODO: this has to change, it can be a collaborator
				// }

				// UpdateController.post(update)

				resolve(site.summary())
			})
		})
	},

	delete: function(id){
		return new Promise(function(resolve, reject){
			Site.findByIdAndRemove(id, function (err){
			    if (err) {
					reject(err)
					return
			    }

			    resolve()
			})
		})
	}

}
