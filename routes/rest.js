const express = require('express')
const router = express.Router()
const controllers = require('../controllers')
const utils = require('../utils')

const baseUrl = (appSlug) => {
  const base = 'https://'+appSlug+'.vertex360.co'
  return base
}

const apiBaseUrl = (appSlug, resource, resourceId) => {
  let base = 'https://'+appSlug+'.vertex360.co/api'
  if (resourceId == null)
    return base+'/'+resource

  return base+'/'+resource+'/'+resourceId
}

const queryEndpoint = (endpoint, params, method) => {
  console.log('PARAMS: ' + JSON.stringify(params))
  return new Promise((resolve, reject) => {
    if (method == null)
      method = 'get'

    //console.log('queryEndpoint: ' + method.toUpperCase()+' - '+endpoint)
    const reqHeaders = {'Accept': 'application/json', 'turbo-vertex-client':'mothership'}

    let request = null
    if (method == 'get')
      request = utils.HTTP.get(endpoint, params, reqHeaders)
    else if (method == 'post')
      request = utils.HTTP.post(endpoint, params, reqHeaders)
    else if (method == 'put')
      request = utils.HTTP.put(endpoint, params, reqHeaders)
    else if (method == 'delete')
      request = utils.HTTP.delete(endpoint, params, reqHeaders)
    else // default to GET method
      request = utils.HTTP.get(endpoint, params, reqHeaders)

    request.then(data => {
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

router.get('/:app', (req, res, next) => {
  utils.HTTP.get(baseUrl(req.params.app), null, {'Accept': 'text/html'})
  .then(data => {
    return queryEndpoint('https://'+req.params.app+'.vertex360.co/api', null, null)
  })
  // queryEndpoint('https://'+req.params.app+'.vertex360.co/api', null, null)
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

router.get('/:app/:resource', (req, res, next) => {

  // template-test-55-4bkhc9
  const endpoint = apiBaseUrl(req.params.app, req.params.resource)
  queryEndpoint(endpoint, null, null)
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

  queryEndpoint(endpoint, null, null)
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
  // console.log('REST POST: ' + JSON.stringify(req.body))
  // console.log('endpoint: ' + endpoint)

  // utils.HTTP.get(baseUrl(req.params.app), null, {'Accept': 'text/html'})
  queryEndpoint(endpoint, {limit:1}, 'get')
  .then(data => {
    // const endpoint = apiBaseUrl(req.params.app, req.params.resource)
    return queryEndpoint(endpoint, req.body, 'post')
  })
  .then(data => {
    console.log('DATA: ' + JSON.stringify(data))
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

router.put('/:app/:resource/:id', (req, res, next) => {
  const endpoint = apiBaseUrl(req.params.app, req.params.resource, req.params.id)
  // queryEndpoint(endpoint, req.body, 'put')

  queryEndpoint(endpoint, null, 'get')
  .then(data => {
    // const endpoint = apiBaseUrl(req.params.app, req.params.resource, req.params.id)
    return queryEndpoint(endpoint, req.body, 'put')
  })
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

router.delete('/:app/:resource/:id', (req, res, next) => {
  const endpoint = apiBaseUrl(req.params.app, req.params.resource, req.params.id)

  // utils.HTTP.get(baseUrl(req.params.app), null, {'Accept': 'text/html'})
  queryEndpoint(endpoint, null, 'get')
  .then(data => {
    // const endpoint = apiBaseUrl(req.params.app, req.params.resource, req.params.id)
    return queryEndpoint(endpoint, null, 'delete')
  })
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

module.exports = router
