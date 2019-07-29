var Item = require('../models/Item')
// var Promise = require('bluebird')
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

			Item.find(params, null, {limit:parseInt(limit), sort:{timestamp: sortOrder}}, function(err, items){
				if (err){
					reject(err)
					return
				}

				resolve(utils.Resource.convertToJson(items))
			})
		})
	},

	getById: function(id, isRaw){
		return new Promise(function(resolve, reject){
			Item.findById(id, function(err, item){
				if (err){
					reject(new Error('Item ' + id + ' not found'))
					return
				}

				if (item == null){
					reject(new Error('Item ' + id + ' not found'))
					return
				}

				if (isRaw){
					resolve(item)
					return
				}

				resolve(item.summary())
			})
		})
	},

	post: function(params){
		return new Promise(function(resolve, reject){
			Item.create(params, function(err, item){
				if (err){
					reject(err)
					return
				}

				resolve(item.summary())
				return
			})
		})
	},

	put: function(id, params, token){
		return new Promise(function(resolve, reject){
			Item.findByIdAndUpdate(id, params, {new:true}, function(err, item){
				if (err){
					reject(err)
					return
				}

				resolve(item.summary())
			})
		})
	},

	delete: function(id){
		return new Promise(function(resolve, reject){
			Item.findByIdAndRemove(id, function (err){
			    if (err) {
  					reject(err)
  					return
			    }

			    resolve()
			})
		})
	}

}
