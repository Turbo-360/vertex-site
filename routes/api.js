const express = require('express')
const router = express.Router()
const controllers = require('../controllers')

const sanitizedUser = (req) => {
	if (req.user == null)
		return null

	const user = req.user
	const currentUser = {
		id: user.id,
		username: user.username,
		slug: user.slug,
		firstName: user.firstName,
		lastName: user.lastName,
		image: user.image
	}

	return currentUser
}

router.get('/:resource', (req, res, next) => {
	const resource = req.params.resource

	const controller = controllers[resource]
	if (controller == null){
		res.json({
			confirmation: 'fail',
			message: 'Invalid resource'
		})

		return
	}

	controller.get(req.query, false, null, req) // controller.get(params, isRaw, token, req)
	.then(results => {
		res.json({
			confirmation: 'success',
			user: sanitizedUser(req),
			results: results
		})

		return
	})
	.catch(err => {
		res.json({
			confirmation: 'fail',
			message: err.message
		})

		return
	})
})

router.get('/:resource/:id', (req, res, next) => {
	const resource = req.params.resource
	const id = req.params.id

	const controller = controllers[resource]
	if (controller == null){
		res.json({
			confirmation: 'fail',
			message: 'Invalid resource'
		})

		return
	}

	controller.getById(id, false, null, req) // controller.getById(entityId, isRaw, token, req)
	.then(result => {
		res.json({
			confirmation: 'success',
			user: sanitizedUser(req),
			result: result
		})

		return
	})
	.catch(err => {
		res.json({
			confirmation: 'fail',
			message: err.message
		})

		return
	})
})

router.post('/:resource', (req, res, next) => {
	const resource = req.params.resource.toLowerCase().trim()

	const controller = controllers[resource]
	if (controller == null){
		res.json({
			confirmation: 'fail',
			message: 'Invalid resource'
		})

		return
	}

	controller.post(req.body, null, req) // controller.post(params, token, req)
	.then(result => {
		res.json({
			confirmation: 'success',
			user: sanitizedUser(req),
			result: result
		})

		return
	})
	.catch(err => {
		res.json({
			confirmation: 'fail',
			message: err.message
		})

		return
	})
})

router.put('/:resource/:id', (req, res, next) => {
	const resource = req.params.resource
	const id = req.params.id

	//TODO: authenticate this request
	const controller = controllers[resource]
	if (controller == null){
		res.json({
			confirmation: 'fail',
			message: 'Invalid resource'
		})

		return
	}

	controller.put(id, req.body, null)
	.then(result => {
		res.json({
			confirmation: 'success',
			user: sanitizedUser(req),
			result: result
		})

		return
	})
	.catch(err => {
		res.json({
			confirmation: 'fail',
			message: err.message
		})

		return
	})
})

router.delete('/:resource/:id', (req, res, next) => {
	const resource = req.params.resource
	const id = req.params.id

	//TODO: authenticate this request. Also check for site?
	const controller = controllers[resource]
	if (controller == null){
		res.json({
			confirmation: 'fail',
			message: 'Invalid resource'
		})

		return
	}

	controller
//	.delete(id, req.session.token)
	.delete(id, null)
	.then(() => {
		res.json({
			confirmation: 'success',
			user: sanitizedUser(req),
			result: {id: id} // return the ID so client side can track which entity removed
		})
		return
	})
	.catch(err => {
		res.json({
			confirmation: 'fail',
			message: err.message
		})

		return
	})
})

module.exports = router
