const express = require('express')
const router = express.Router()
const controllers = require('../controllers')
const utils = require('../utils')

const apiBaseUrl = (appSlug, resource, resourceId) => {
  let base = 'https://'+appSlug+'.vertex360.co/api'
  if (resourceId == null)
    return base+'/'+resource

  return base+'/'+resource+'/'+resourceId
}

const queryEndpoint = (endpoint) => {
  return new Promise((resolve, reject) => {
    utils.HTTP.get(endpoint)
    .then(data => {
      try {
        const parsed = JSON.parse(data)
        resolve(parsed)
      }
      catch(err) {
        reject(err)
      }
    })
    .catch(err => {
      reject(err)
    })
  })
}

router.get('/:app/:resource', (req, res, next) => {

  // template-test-55-4bkhc9
  const endpoint = apiBaseUrl(req.params.app, req.params.resource)
  queryEndpoint(endpoint)
  .then(data => {
    if (data.confirmation != 'success'){
      throw new Error(data.message)
      return
    }

    res.json(data)
  })
  .catch(err => {
    res.json({
      confirmation: 'fail',
      message: err.message
    })
  })
})

router.get('/:app/:resource/:id', (req, res, next) => {
  const endpoint = apiBaseUrl(req.params.app, req.params.resource, req.params.id)
  queryEndpoint(endpoint)
  .then(data => {
    if (data.confirmation != 'success'){
      throw new Error(data.message)
      return
    }

    res.json(data)
  })
  .catch(err => {
    res.json({
      confirmation: 'fail',
      message: err.message
    })
  })
})

router.post('/:app/:resource', (req, res, next) => {
  const endpoint = apiBaseUrl(req.params.app, req.params.resource)

})

router.put('/:app/:resource/:id', (req, res, next) => {
  const endpoint = apiBaseUrl(req.params.app, req.params.resource, req.params.id)

})

router.delete('/:app/:resource/:id', (req, res, next) => {
  const endpoint = apiBaseUrl(req.params.app, req.params.resource, req.params.id)

})

module.exports = router
