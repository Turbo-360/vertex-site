// Full Documentation - https://www.turbo360.co/docs
// const turbo = require('turbo360')({site_id: process.env.TURBO_APP_ID})
// const vertex = require('vertex360')({site_id: process.env.TURBO_APP_ID})
// const router = vertex.router()

const express = require('express')
const router = express.Router()
const checkoutNodeJssdk = require('@paypal/checkout-server-sdk')
const payPalClient = require('../utils/PayPalClient')
const controllers = require('../controllers')

// https://developer.paypal.com/docs/checkout/integrate/#6-verify-the-transaction
router.post('/order', (req, res) => {
  const itemID = req.body.item
  const siteID = req.body.site
  const orderID = req.body.orderID

  let selectedItem = null
  let currentSite = null
  controllers.site.getById(siteID, null, 'admin')
  .then(site => {
    if (site.paypal.clientId.length == 0){
      throw new Error('Missing PayPal Client ID')
      return
    }

    if (site.paypal.clientSecret.length == 0){
      throw new Error('Missing PayPal Client Secret')
      return
    }

    currentSite = site
    return controllers.item.getById(itemID)
  })
  .then(item => {
    selectedItem = item
    let request = new checkoutNodeJssdk.orders.OrdersGetRequest(orderID)
    const credentials = {
      clientId: currentSite.paypal.clientId,
      clientSecret: currentSite.paypal.clientSecret
    }

    return payPalClient.client(credentials).execute(request)
  })
  .then(data => {
    // Validate the transaction details are as expected
    // if (data.result.purchase_units[0].amount.value !== '3.00') {
    //   throw new Error('Incorrect Amount.')
    //   return
    // }

    // console.log('ORDER SUCCESSFULLY PROCESSED: ' + JSON.stringify(data))
    res.json({
      confirmation: 'success',
      data: data.result
    })
  })
  .catch(err => {
    res.json({
      confirmation: 'fail',
      message: err.message
    })
  })
})

module.exports = router
