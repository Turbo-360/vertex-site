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
		}),
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
	// query template by slug
	// TODO: this should be done internally through rest api
	const url = 'https://turbo-dashboard.herokuapp.com/api/site?slug=landing-template-90347a'
	superagent.get(url)
	.query(null)
	.set('Accept', 'application/json')
	.end((err, response) => {
		if (err){
			res.json({
				confirmation: 'fail',
				message: err.message
			})
			return
		}

		const body = response.body
		if (body.confirmation != 'success'){
			res.json({
				confirmation: 'fail',
				message: body.message
			})
			return
		}

		const data = body.results[0]
		res.render('template', data)
	})
})

module.exports = router
