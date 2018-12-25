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
		// const data = {
		// 	pageConfig: JSON.stringify({
		// 		page: {
		// 			// pageName: req.params.page,
		// 			pageName: page,
		// 			config: config
		// 		},
		// 		app: {site_id:site.id, apiKey:site.api.key}
		// 	})
		// }
		//
		// res.render('admin', data)
		return
	})
	.catch(err => {
		res.json({
			confirmation: 'fail',
			message: err.message
		})
	})

})

router.get('/:slug', (req, res) => {
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
			const pageConfig = JSON.parse(config)
			const data = {
				pageConfig: JSON.stringify({
					page: {
						// pageName: req.params.page,
						pageName: page,
						config: pageConfig
					},
					app: {site_id:site.id, apiKey:site.api.key}
				})
			}

			res.render('admin', data)
		}
		catch(err) {
			throw err
			return
		}


		// const data = {
		// 	pageConfig: JSON.stringify({
		// 		page: {
		// 			// pageName: req.params.page,
		// 			pageName: page,
		// 			config: config
		// 		},
		// 		app: {site_id:site.id, apiKey:site.api.key}
		// 	})
		// }
		//
		// res.render('admin', data)
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
