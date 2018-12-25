// Full Documentation - https://www.turbo360.co/docs
const turbo = require('turbo360')({site_id: process.env.TURBO_APP_ID})
const vertex = require('vertex360')({site_id: process.env.TURBO_APP_ID})
const superagent = require('superagent')
const router = vertex.router()
const controllers = require('../controllers')

const templates = {
	resume: [{id:'123', name:'my resume'}, {id:'234', name:'my resume 2'}],
	restaurant: [{id:'345', name:'restaurant site 1'}, {id:'456', name:'restaurant site 2'}, {id:'2226', name:'restaurant site 3'}],
	realtor: [{id:'567', name:'realtor site 1'}, {id:'678', name:'realtor site 2'}],
	fitness: [{id:'789', name:'fitness site 1'}, {id:'901', name:'fitness site 2'}],
	lessons: [{id:'987', name:'lessons site 1'}, {id:'876', name:'lessons site 2'}],
	landing: [{id:'abc', name:'landing page temp'}]
}

router.get('/', (req, res) => {
	const categories = Object.keys(templates)
	const data = {
		categories: categories,
		preloaded: JSON.stringify({
			selected: categories[0],
			templates: templates
		})
	}

	res.render('index', data)
})

router.get('/me', (req, res) => {
	if (req.user == null){
		res.redirect('/')
		return
	}

	const data = {
		user: req.user
	}

	res.render('account', data)
})

router.get('/template/:slug', (req, res) => {
	controllers.site.get({slug: req.params.slug}) // query template by slug
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
