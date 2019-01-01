// Full Documentation - https://www.turbo360.co/docs
const turbo = require('turbo360')({site_id: process.env.TURBO_APP_ID})
const vertex = require('vertex360')({site_id: process.env.TURBO_APP_ID})
const superagent = require('superagent')
const router = vertex.router()
const controllers = require('../controllers')

const templates = {}
const categories = ['landing', 'resume', 'restaurant', 'fitness', 'realtor', 'lessons']

router.get('/', (req, res) => {
	const selected = categories[0]
	const data = {
		categories: categories
	}

	controllers.site.get({'template.status':'live', 'template.category':selected})
	.then(sites => {
		templates[selected] = sites
		data['preloaded'] = JSON.stringify({
			user: req.user,
			selected: selected,
			templates: templates
		})

		res.render('index', data)
	})
	.catch(err => {
		res.json({
			confirmation: 'fail',
			message: err.message
		})
	})
})

router.get('/me', (req, res) => {
	if (req.user == null){
		res.redirect('/')
		return
	}

	controllers.site.get({'profile.id':req.user.id})
	.then(sites => {
		const data = {
			user: req.user,
			sites: sites
		}

		res.render('account', data)
	})
	.catch(err => {
		res.json({
			confirmation: 'fail',
			message: err.message
		})
	})
})

router.get('/landing', (req, res) => {
	const data = {
		categories: categories
	}
	
	res.render('landing', data)
})

router.get('/template/:slug', (req, res) => {
	// TODO: check if template is live
	controllers.site.get({slug:req.params.slug}) // query template by slug
	.then(results => {
		if (results.length == 0){
			throw new Error('Template not found')
			return
		}

		const data = {
			template: results[0],
			user: req.user,
		}

		data['preloaded'] = JSON.stringify(data)
		res.render('template', data)
	})
	.catch(err => {
		res.json({
			confirmation: 'fail',
			message: err.message
		})
	})
})

module.exports = router
