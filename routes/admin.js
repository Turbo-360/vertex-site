// Full Documentation - https://www.turbo360.co/docs
const turbo = require('turbo360')({site_id: process.env.TURBO_APP_ID})
const vertex = require('vertex360')({site_id: process.env.TURBO_APP_ID})
const superagent = require('superagent')
const router = vertex.router()
const utils = require('../utils')
const controllers = require('../controllers')
const VERTEX_BUCKET = 'turbo360-vertex'

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
	if (req.body.app == null){
		res.json({
			confirmation: 'fail',
			message: 'Missing app parameter'
		})
		return
	}

	utils.HTTP.get('https://'+req.body.app+'.vertex360.co/api', null, {'Accept': 'application/json', 'turbo-vertex-client':'mothership'})
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


// fetch page html
router.post('/page', (req, res) => {
	if (req.user == null){
		res.redirect('/')
		return
	}

	const endpoint = req.body.endpoint
	if (endpoint == null){
		res.json({
			confirmation:'fail',
			message: 'missing endpoint parameter'
		})
		return
	}

	// const selectedPage = req.query.selected || '/' // default to home
	// const stagingUrl = 'https://'+req.params.slug+'.vertex360.co'
	const headers = {'Accept':'application/json', 'turbo-vertex-client':'admin'}
	utils.HTTP.get(endpoint, null, headers)
	.then(payload => {
		res.send(payload)
	})
	.catch(err => {
		res.json({
			confirmation: 'fail',
			message: err.message
		})
	})
})

router.post('/resetpage', (req, res) => {
	// if (req.user == null){
	// 	res.redirect('/')
	// 	return
	// }

	const appslug = req.body.appslug
	if (appslug == null){
		res.json({
			confirmation:'fail',
			message: 'missing appslug parameter'
		})
		return
	}

	const page = req.body.page
	if (page == null){
		res.json({
			confirmation:'fail',
			message: 'missing page parameter'
		})
		return
	}

	const endpoint = 'https://'+appslug+'.vertex360.co/api'
	utils.HTTP.post(endpoint, {task:'resetpage', page:page, appslug:appslug})
	.then(data => {
		res.json(data)
	})
	.catch(err => {
		res.json({
			confirmation: 'fail',
			message: err.message
		})
	})
})

// fetch page config
router.post('/config', (req, res) => {
	if (req.user == null){
		res.redirect('/')
		return
	}

	const endpoint = req.body.endpoint
	if (endpoint == null){
		res.json({
			confirmation:'fail',
			message: 'missing endpoint parameter'
		})
		return
	}

	utils.HTTP.get(endpoint, null, {'Accept':'application/json', 'turbo-vertex-client':'widget'})
	.then(payload => {
		const jsonPageConfig = JSON.parse(payload)
		res.send(jsonPageConfig)
	})
	.catch(err => {
		res.json({
			confirmation: 'fail',
			message: err.message
		})
	})
})

router.post('/search', (req, res) => {
	if (req.body.text == null){
		res.json({
			confirmation: 'fail',
			message: 'missing text parameter'
		})
		return
	}

	const resource = req.body.resource || 'profile'
	const controller = controllers[resource]
	if (controller == null){
		res.json({
			confirmation: 'fail',
			message: 'Invalid Resource: ' + resource
		})
		return
	}

	// controllers.profile.search(req.body.text)
	controller.search(req.body.text)
	.then(entities => {
		res.json({
			confirmation: 'success',
			results: entities
		})
	})
	.catch(err => {
		res.json({
			confirmation: 'fail',
			message: err.message
		})
	})
})

// fetch captions from youtube video based on ID:
router.get('/captions', (req, res) => {
	if (req.query.video == null){
		res.json({
			confirmation: 'fail',
			message: 'Missing video parameter.'
		})
		return
	}

	const roots = ['yt-api-1-3idc80', 'yt-api-2-asovo8', 'yt-api-3-gtktdh', 'yt-api-4-cqtuum']
	let root = null

	if (req.query.exclude == null){
		root = roots[Math.floor(Math.random()*roots.length)]
	}
	else {
		// if included, do not use specified option. comma separated string.
		var exclude = req.query.exclude

		// const ignore = exclude.split(',')
		// const options = roots.map(option => {
		// 	if (ignore.indexOf(option) != -1)
		// 		return option
		// })

		const ignore = exclude.split(',')
		const remainingOptions = []
		roots.forEach(option => {
			if (ignore.indexOf(option) == -1)
				remainingOptions.push(option)
		})

		if (remainingOptions.length == 0){
			res.json({
				confirmation: 'fail',
				message: 'No more YT API options'
			})
			return
		}

		root = remainingOptions[Math.floor(Math.random()*remainingOptions.length)]
	}


	// const endpoint = 'https://yt-api-puw95x.vertex360.co/api/captions'
	const endpoint = 'https://'+root+'.vertex360.co/api/captions'

	utils.HTTP.get(endpoint, {video:req.query.video})
	.then(data => {
		const parsed = JSON.parse(data)
		if (parsed.confirmation != 'success'){
			throw new Error(parsed.message)
			return
		}

		res.json({
			confirmation:'success',
			data: parsed.data
		})
	})
	.catch(err => {
		res.json({
			confirmation: 'fail',
			message: (root) ? root : err.message
			// message: err.message + '. ROOT: '+root+'. Endpoint: '+ endpoint
		})
	})
})


// test endpoint for text search:
router.get('/search', (req, res) => {
	if (req.query.text == null){
		res.json({
			confirmation: 'fail',
			message: 'missing text parameter'
		})
		return
	}

	controllers.profile.search(req.query.text)
	.then(profiles => {
		res.json({
			confirmation: 'success',
			results: profiles
		})
	})
	.catch(err => {
		res.json({
			confirmation: 'fail',
			message: err.message
		})
	})
})


// test endpoint for scraping links:
router.get('/scrape', (req, res) => {
	if (req.query.url == null){
		res.json({
			confirmation: 'fail',
			message: 'missing URL parameter'
		})
		return
	}

	const props = ['title', 'description', 'image', 'url', 'vtx:site', 'vtx:schema', 'vtx:id', 'vtx:slug']
	utils.Scraper.scrape({url:req.query.url, props:props})
	.then(data => {
		res.json({
			confirmation: 'success',
			data: data
		})
	})
	.catch(err => {
		res.json({
			confirmation: 'fail',
			data: err.message
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
		if (sites.length == 0){
			throw new Error('Site '+req.params.slug+' not found.')
			return
		}

		const site = sites[0]
		const reducers = {
			user: {currentUser: currentUser},
			page: {selected:'home'},
			app: {
				site_id: site.id,
				apiKey: site.api.key,
				summary: site
			}
		}

		res.render('admin/pages', {pageConfig: JSON.stringify(reducers)})
	})
	.catch(err => {
		res.json({
			confirmation: 'fail',
			message: err.message
		})
	})
})

module.exports = router
