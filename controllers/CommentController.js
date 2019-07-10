var Comment = require('../models/Comment')
var moment = require('moment')
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

			Comment.find(params, null, {limit:parseInt(limit), sort:{timestamp: sortOrder}}, function(err, comments){
				if (err){
					reject(err)
					return
				}

				if (isRaw){
					resolve(comments)
					return
				}

				resolve(utils.Resource.convertToJson(comments))
			})
		})
	},

	getById: function(id, isRaw){
		return new Promise(function(resolve, reject){
			Comment.findById(id, function(err, comment){
				if (err){
					reject(new Error('Comment '+id+' not found'))
					return
				}

				if (comment == null){
					reject(new Error('Comment '+id+' not found'))
					return
				}

				if (isRaw){
					resolve(comment)
					return
				}

				resolve(comment.summary())
			})
		})
	},

	post: (params) => {
		return new Promise((resolve, reject) => {
			if (params['dateString'] == null)
				params['dateString'] = moment().format("MMMM Do, YYYY") // human readable date:

			if (params.title)
				params['slug'] = utils.TextUtils.slugVersion(params.title)+'-'+utils.TextUtils.randomString(6).toLowerCase()

			// if coming from jQuery AJAX, profile is stringified. Parse it here first.
			if (params.profile != null){
				try {
					params['profile'] = JSON.parse(params.profile)
				}
				catch(err){}
			}

			if (params.image == null)
				params['image'] = process.env.IMAGE_PLACEHOLDER

			params['text'] = utils.TextUtils.convertToHtml(params.text)

      Comment.create(params)
			.then(comment => {
				resolve(comment.summary())
			})
			.catch(err => {
				console.log('ERROR: '+err)
				reject(err)
			})
		})
	},

	put: function(id, params, token){
		return new Promise(function(resolve, reject){
			Comment.findByIdAndUpdate(id, params, {new:true}, function(err, comment){
				if (err){
					reject(err)
					return
				}

				resolve(comment.summary())
			})
		})
	},

	delete: function(id){
		return new Promise(function(resolve, reject){
			Comment.findByIdAndRemove(id, function (err){
			    if (err) {
  					reject(err)
  					return
			    }

			    resolve()
			})
		})
	}

}
