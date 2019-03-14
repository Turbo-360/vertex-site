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

router.get('/cms/:slug', (req, res) => {
	if (req.user == null){
		res.redirect('/')
		return
	}

	controllers.site.get({slug:req.params.slug})
	.then(data => {
		if (data.length == 0){
			throw new Error('Site not found')
			return
		}

		site = data[0]
		const preloaded = {
			container: 'standard',
			app: {
				summary: site
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

router.get('/pages/:slug', (req, res) => {
	if (req.user == null){
		res.redirect('/')
		return
	}

	let site = null
	const page = 'home'

	controllers.site.get({slug:req.params.slug})
	.then(data => {
		if (data.length == 0){
			throw new Error('Site not found')
			return
		}

		site = data[0]
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
				user: {currentUser: req.user}
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

})

module.exports = router
