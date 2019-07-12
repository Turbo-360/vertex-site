// Full Documentation - https://www.turbo360.co/docs
const turbo = require('turbo360')({site_id: process.env.TURBO_APP_ID})
const vertex = require('vertex360')({site_id: process.env.TURBO_APP_ID})
const moment = require('moment')
const router = vertex.router()
const controllers = require('../controllers')
const utils = require('../utils')
const CDN = (process.env.TURBO_ENV=='dev') ? null : process.env.CDN_ROOT

const ignore = process.env.IGNORE.split(',')
const renderAnalytics = (req) => {
	if (req.user == null)
		return (CDN!=null)

	const found = (ignore.indexOf(req.user.id) > -1)
	return !found
}

const sanitizedUser = (user) => {
	if (user == null)
		return null

	var currentUser = {
		id: user.id,
		username: user.username,
		slug: user.slug,
		firstName: user.firstName,
		lastName: user.lastName,
		image: user.image,
		bio: user.bio,
		tags: user.tags.join(',')
	}

	return currentUser
}


router.get('/comments', (req, res) => {
	const thread = req.query.thread
	if (thread == null){
		res.json({
			confirmation: 'fail',
			message: 'Missing thread parameter'
		})
		return
	}

	const schema = req.query.schema
	if (schema == null){
		res.json({
			confirmation: 'fail',
			message: 'Missing schema parameter'
		})
		return
	}

	// this is the site slug NOT id:
	const site = req.query.site
	if (site == null){
		res.json({
			confirmation: 'fail',
			message: 'Missing site parameter'
		})
		return
	}

	const data = {
		cdn: CDN,
		renderAnalytics: renderAnalytics(req)
	}

	controllers.site.get({slug:site})
	.then(sites => {
		if (sites.length == 0){
			throw new Error('Site '+site+' not found')
			return
		}

		const currentUser = sanitizedUser(req.user)
		data['preloaded'] = JSON.stringify({
			user: currentUser,
			site: sites[0],
			thread: thread,
			schema: schema
		})

		res.render('widget/comments', data)
	})
	.catch(err => {
		res.json({
			confirmation: 'fail',
			message: err.message
		})
	})
})

router.get('/seed-comments', (req, res) => {
	const yt = req.query.yt // yt video ID
	if (yt==null){
		res.json({
			confirmation: 'fail',
			message: 'Missing yt parameter'
		})
		return
	}

	const entity = req.query.entity // blog post ID
	if (entity==null){
		res.json({
			confirmation: 'fail',
			message: 'Missing entity parameter'
		})
		return
	}

	// fetch YT comments
	const endpoint = 'https://storage.turbo360.co/demo-test-vxqkks/'+yt+'.json'
	utils.HTTP.get(endpoint, null, {'Accept':'application/json'})
	.then(response => { //comes in as a string
		console.log('RESPONSE == ' + response)
		const payload = JSON.parse(response)
		if (payload.confirmation != 'success'){
			throw new Error(payload.message)
			return
		}

		const comments = payload.data.comments
		const vertexComments = []
		comments.forEach(comment => {
			const nameParts = comment.author.split(' ')
			const timestamp = new Date(comment.timestamp)

			const formatted = {
				profile: {
					id: comment.id.toLowerCase(),
					firstName:'',
					lastName: '',
					username:nameParts[0].toLowerCase(),
					image: comment.authorThumb,
					slug:nameParts[0].toLowerCase()+'-'+comment.id.toLowerCase().substring(0, 6)
				},
				timestamp: timestamp,
				dateString: moment(timestamp).format("MMMM Do, YYYY"), // human readable date:
				text: comment.text,
				isInitial: 'no',
				thread: entity
			}

			vertexComments.push(formatted)
			controllers.comment.post(formatted)
		})

		res.json({
			confirmation: 'success',
			data: vertexComments
		})
	})
	.catch(err => {
		console.log('ERR: ' + err)
		res.json({
			confirmation: 'fail',
			message: err.message
		})
	})
})

module.exports = router
