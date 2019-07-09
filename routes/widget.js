// Full Documentation - https://www.turbo360.co/docs
const turbo = require('turbo360')({site_id: process.env.TURBO_APP_ID})
const vertex = require('vertex360')({site_id: process.env.TURBO_APP_ID})
const router = vertex.router()
const controllers = require('../controllers')
const utils = require('../utils')
const CDN = (process.env.TURBO_ENV=='dev') ? null : process.env.CDN_ROOT

// const ignore = process.env.IGNORE.split(',')
// const renderAnalytics = (req) => {
// 	if (req.user == null)
// 		return (CDN!=null)
//
// 	const found = (ignore.indexOf(req.user.id) > -1)
// 	return !found
// }
//
// const hasVideo = (site) => {
// 	if (site.template.video == null)
// 		return false
//
// 	return (site.template.video.length==11) // youtube IDs are 11 characters;
// }


router.get('/comments', (req, res) => {
	const thread = req.query.thread
	if (thread == null){
		res.json({
			confirmation: 'fail',
			message: 'Missing thread parameter'
		})
		return
	}

	const type = req.query.type // post, site, etc
	if (type == null){
		res.json({
			confirmation: 'fail',
			message: 'Missing type parameter'
		})
		return
	}

	const data = {
		cdn: CDN
	}

	const ctr = controllers['type']
	if (ctr == null){
		res.json({
			confirmation: 'fail',
			message: 'Invalid resource'
		})
		return
	}

	ctr.getById(thread)
	then(entity => { // post, site, profile etc
		data[type] = entity
		return controllers.comment.get({thread:thread})
	})
	.then(comments => {
		data['comments'] = comments

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
