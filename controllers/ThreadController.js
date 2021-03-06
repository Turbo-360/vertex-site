var Thread = require('../models/Thread')
var cheerio = require('cheerio')
var moment = require('moment')
var utils = require('../utils')
var SiteController = require('./SiteController')

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

// const scrapePreview = (text, limit) => {
//   $ = cheerio.load(text)
//   let plainText = ''
//   $('p').each((i, element) => {
//     plainText += element.children[0].data
//   })
//
//   if (plainText.length >= limit)
//     return plainText.substring(0, limit)+'...'
//
//   return plainText
// }

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

			Thread.find(params, null, {limit:parseInt(limit), sort:{timestamp: sortOrder}}, function(err, threads){
				if (err){
					reject(err)
					return
				}

				resolve(utils.Resource.convertToJson(threads))
			})
		})
	},

	getById: function(id, isRaw){
		return new Promise(function(resolve, reject){
			Thread.findById(id, function(err, thread){
				if (err){
					reject(new Error('Thread ' + id + ' not found'))
					return
				}

				if (thread == null){
					reject(new Error('Thread ' + id + ' not found'))
					return
				}

				if (isRaw){
					resolve(thread)
					return
				}

				resolve(thread.summary())
			})
		})
	},

	post: function(params){
		return new Promise(function(resolve, reject){
			// var date = new Date(params.date)
			// params['dateString'] = moment(date).format('MMMM Do, YYYY @ hh:mm a')
			// if (params.name != null)
			// 	params['slug'] = slugVersion(params.name, 6)
      //
			// if (params.description != null)
			// 	params['preview'] = scrapePreview(params.description, 200)

			// from AJAX call, this comes in stringified
			// if (params.site != null){
			// 	try {
			// 		params['site'] = JSON.parse(params.site)
			// 	}
			// 	catch(err){
			//
			// 	}
			// }


			// from AJAX call, this comes in stringified
			if (params.subject != null){
				try {
					params['subject'] = JSON.parse(params.subject)
				}
				catch(err){

				}
			}

			if (params.profile != null){
				try {
					params['profile'] = JSON.parse(params.profile)
				}
				catch(err){

				}
			}

			if (params.slug.length == 0)
				params['slug'] = slugVersion(params.subject.title, 6)

			if (params.site.length == 0){
				params['site'] = {} // this is the default value
				Thread.create(params, (err, thread) => {
					if (err){
						reject(err)
						return
					}

					resolve(thread.summary())
					return
				})

				return
			}

			// 'site' param comes in as a string but should be
			// parsed into an object before inserting to db:
			SiteController.getById(params.site, false, null)
			.then(site => {
				// console.log('SITE == ' + JSON.stringify(site))
				params['site'] = {
					id: site.id,
					name: site.name,
					slug: site.slug,
					image: site.image
				}

				Thread.create(params, (err, thread) => {
					if (err){
						reject(err)
						return
					}

					resolve(thread.summary())
					return
				})
			})
			.catch(err => {
				// console.log('ERR: ' + err)
				reject(err)
			})
		})
	},

	put: function(id, params, token){
		return new Promise(function(resolve, reject){
			Thread.findByIdAndUpdate(id, params, {new:true}, function(err, thread){
				if (err){
					reject(err)
					return
				}

				resolve(thread.summary())
			})
		})
	},

	delete: function(id){
		return new Promise(function(resolve, reject){
			Thread.findByIdAndRemove(id, function (err){
			  if (err) {
					reject(err)
					return
			  }

			  resolve()
			})
		})
	}

}
