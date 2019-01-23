var Blob = require('../models/Blob')
var Promise = require('bluebird')
var utils = require('../utils')

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

			Blob.find(params, null, {limit:parseInt(limit), sort:{timestamp: sortOrder}}, function(err, blobs){
				if (err){
					reject(err)
					return
				}

				resolve(utils.Resource.convertToJson(blobs))
			})
		})
	},

	getById: function(id, isRaw){
		return new Promise(function(resolve, reject){
			Blob.findById(id, function(err, blob){
				if (err){
					reject(new Error('Blob ' + id + ' not found'))
					return
				}

				if (blob == null){
					reject(new Error('Blob ' + id + ' not found'))
					return
				}

				if (isRaw){
					resolve(blob)
					return
				}

				resolve(blob.summary())
			})
		})
	},

	post: function(params){
		return new Promise(function(resolve, reject){
			Blob.create(params, function(err, blob){
				if (err){
					reject(err)
					return
				}

				resolve(blob.summary())
				return
			})
		})
	},

	put: function(id, params, token){
		return new Promise(function(resolve, reject){
			Blob.findByIdAndUpdate(id, params, {new:true}, function(err, blob){
				if (err){
					reject(err)
					return
				}

				resolve(blob.summary())
			})
		})
	},

	delete: function(id){
		return new Promise(function(resolve, reject){
			Blob.findByIdAndRemove(id, function (err){
			    if (err) {
					reject(err)
					return
			    }

			    resolve()
			})
		})
	}

}
