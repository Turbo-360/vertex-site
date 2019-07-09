// Full Documentation - https://www.turbo360.co/docs
const turbo = require('turbo360')({site_id: process.env.TURBO_APP_ID})
const vertex = require('vertex360')({site_id: process.env.TURBO_APP_ID})
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

	const data = {
		cdn: CDN,
		renderAnalytics: renderAnalytics(req)
	}

	controllers.comment.get({thread:thread})
	.then(comments => {
		const currentUser = sanitizedUser(req.user)
		data['comments'] = comments
		data['user'] = currentUser
		data['preloaded'] = JSON.stringify({
			thread: thread,
			comments: comments,
			user: currentUser
		})

		// TODO: fetch comments based on type and id query params
	  res.render('widget/comments', data)
	})
	.catch(err => {
		res.json({
			confirmation: 'fail',
			message: err.message
		})
	})

})

module.exports = router
