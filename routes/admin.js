// Full Documentation - https://www.turbo360.co/docs
const turbo = require('turbo360')({site_id: process.env.TURBO_APP_ID})
const vertex = require('vertex360')({site_id: process.env.TURBO_APP_ID})
const superagent = require('superagent')
const router = vertex.router()
const utils = require('../utils')
const controllers = require('../controllers')
var VERTEX_BUCKET = 'turbo360-vertex'

const createCollection = (collectionName, appSlug) => {
	console.log('createCollection: ' + collectionName + ', ' + appSlug)

	var params = {
		bucket: VERTEX_BUCKET,
		filename: collectionName+'.txt',
		filetype: 'text/plain',
		folder: 'stores/'+appSlug
	}

	utils.AWS.uploadUrl(params, VERTEX_BUCKET)
	.then(data => {
		// console.log('UPLOAD URL: ' + JSON.stringify(data))
		return utils.HTTP.put(data.upload, '', {'Content-Type':'text/plain'}) // create empty collection
	})
	.then(data => {
		console.log('Collection Created: ' + JSON.stringify(data))
	})
	.catch(err => {
		console.log('ERR - ' + err)
	})
}

const checkCollection = (appSlug, collectionName) => {
	const url = 'https://s3.amazonaws.com/turbo360-vertex/stores/'+appSlug+'/'+collectionName+'.txt'
	return utils.HTTP.get(url)
	.then(config => { // this is a string
		try {
			const pageConfig = JSON.parse(config)
		}
		catch(err) {
			throw err
			return
		}
		return
	})
	.catch(err => {
		if (err.status>=400 && err.status<=500){
			// console.log(err.status)
			// create new store file for collection, then upload to bucket.
			createCollection(collectionName, appSlug)
		}
	})
}

const getCurrentUser = (req) => {
	return {
		id: req.user.id,
		username: req.user.username,
		firstName: req.user.firstName,
		lastName: req.user.lastName,
		email: req.user.email,
		image: req.user.image,
		slug: req.user.slug
	}
}

// this endpoint checks to see if all the collections for a specified
// app has the requisite "seed" data on deployment. If not, it
// seeds the collection with an empty set:
router.post('/seed', (req, res) => {
	// const body = {
	// 	app: 'rocket-man-9gnjll'
	// }

	if (req.body.app == null){
		res.json({
			confirmation: 'fail',
			message: 'Missing app parameter'
		})
		return
	}

	utils.HTTP.get('https://'+req.body.app+'.vertex360.co/api')
	.then(response => {
			const parsed = JSON.parse(response)
			if (parsed.confirmation != 'success'){
				throw new Error(parsed.message)
				return
			}

			const resources = parsed.data
			resources.forEach(resource => {
				if (resource.collectionName) // older versions won't have this
					checkCollection(req.body.app, resource.collectionName.trim())
			})

			res.json(parsed)
	})
	.catch(err => {
		res.json({
			confirmation: 'fail',
			message: err.message
		})
	})
})

router.get('/:slug', (req, res) => {
	if (req.user == null){
		res.redirect('/')
		return
	}

	let site = null
	let currentUser = getCurrentUser(req)
	controllers.site.get({slug:req.params.slug})
	.then(data => {
		if (data.length == 0){
			throw new Error('Site not found')
			return
		}

		site = data[0]
		return controllers.profile.getById(req.user.id, true)
	})
	.then(user => {
		// this is why we fetch the raw profile
		currentUser['creditCard'] = user.creditCard
		currentUser['stripeId'] = user.stripeId

		let selected = 'settings'
		if (req.query)
			selected = req.query.selected || 'settings'

		const reducers = {
			user: {currentUser: currentUser},
			session: {selected: selected},
			app: {
				site_id: site.id,
				apiKey: site.api.key,
				summary: site
			}
		}

		// res.render('admin/page', {pageConfig: JSON.stringify(reducers)})
		res.render('admin/main', {pageConfig: JSON.stringify(reducers)})
	})
	.catch(err => {
		res.json({
			confirmation: 'fail',
			message: err.message
		})
	})
})

router.get('/pages/:slug', (req, res) => {
	if (req.user == null){
		res.redirect('/')
		return
	}

	let currentUser = getCurrentUser(req)
	controllers.site.get({slug:req.params.slug})
	.then(sites => {
		res.json({
			confirmation: 'success',
			data: 'page editor'
		})
	})
	.catch(err => {
		res.json({
			confirmation: 'fail',
			message: err.message
		})
	})
})

/*
router.get('/cms/:slug', (req, res) => {
	if (req.user == null){
		res.redirect('/')
		return
	}

	controllers.site.get({slug:req.params.slug})
	.then(data => {
		if (data.length == 0){
			throw new Error('Site ' + req.params.slug + ' not found')
			return
		}

		const preloaded = {
			container: 'standard',
			app: {
				summary: data[0]
			}
		}

		res.render('admin/cms', {data: JSON.stringify(preloaded)})
	})
	.catch(err => {
		res.json({
			confirmation: 'fail',
			message: err.message
		})
	})
})
*/

// this is no longer in use
/*
router.get('/:slug', (req, res) => {
	if (req.user == null){
		res.redirect('/')
		return
	}

	controllers.site.get({slug:req.params.slug})
	.then(sites => {
		if (sites.length == 0){
			throw new Error('Site not found')
			return
		}

		const site = sites[0]
		const data = {
			site: site
		}

		res.render('admin/overview', data)
	})
	.catch(err => {
		res.json({
			confirmation: 'fail',
			message: err.message
		})
	})
}) */

module.exports = router
