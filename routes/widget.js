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
	const data = {
		cdn: CDN
	}

  res.json({
    confirmation: 'success',
    data: 'comments widget'
  })
})









module.exports = router
