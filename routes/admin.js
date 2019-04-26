// Full Documentation - https://www.turbo360.co/docs
const turbo = require('turbo360')({site_id: process.env.TURBO_APP_ID})
const vertex = require('vertex360')({site_id: process.env.TURBO_APP_ID})
const superagent = require('superagent')
const router = vertex.router()
const utils = require('../utils')
const controllers = require('../controllers')

router.get('/test', (req, res) => {
	const url = 'https://s3.amazonaws.com/turbo360-vertex/pages/landing-test-50-vck340/home.txt'
	return utils.HTTP.get(url)
	.then(config => { // this is a string
		try {
			const pageConfig = JSON.parse(config)
			res.json(pageConfig)
		}
		catch(err) {
			throw err
			return
		}
		return
	})
	.catch(err => {
		res.json({
			confirmation: 'fail',
			message: err.message
		})
	})
})

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
			// container: 'standard',
			container: 'custom',
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

// this is no longer in use
/*
router.get('/pages/:slug', (req, res) => {
	if (req.user == null){
		res.redirect('/')
		return
	}

	let site = null
	let currentUser = null
	const page = 'home'

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
		currentUser = {
			id: req.user.id,
			username: req.user.username,
			firstName: req.user.firstName,
			lastName: req.user.lastName,
			email: req.user.email,
			image: req.user.image,
			slug: req.user.slug,
			creditCard: user.creditCard, // this is why we fetch the raw profile
			stripeId: user.stripeId // this is why we fetch the raw profile
		}

		const url = 'https://s3.amazonaws.com/turbo360-vertex/pages/'+req.params.slug+'/'+page+'.txt'
		return utils.HTTP.get(url)
	})
	.then(config => { // this is a string
		try {
			const pageReducer = {selected: page}
			pageReducer[page] = JSON.parse(config)

			const appReducer = {
				site_id: site.id,
				apiKey: site.api.key,
				summary: site
			}

			const reducers = {
				page: pageReducer,
				app: appReducer,
				user: {currentUser: currentUser}
			}

			res.render('admin/page', {pageConfig: JSON.stringify(reducers)})
		}
		catch(err) {
			throw err
			return
		}

		return
	})
	.catch(err => {
		res.json({
			confirmation: 'fail',
			message: err.message
		})
	})
}) */

module.exports = router
