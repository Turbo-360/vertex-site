const express = require('express')
const router = express.Router()
const vertex = require('vertex360')({site_id:'5c244564231ff10015a113ea'})
// const payPalClient = require('../utils/PayPalClient')
const controllers = require('../controllers')
// https://developer.paypal.com/docs/checkout/integrate/#6-verify-the-transaction

/*  
  This endpoint is for purchasing individual
  items listed on a specific site store section:
*/
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
    const credentials = {
      clientId: currentSite.paypal.clientId,
      clientSecret: currentSite.paypal.clientSecret,
      environment: process.env.ENVIRONMENT
    }

    return vertex.payPalClient.executeRequest(orderID, credentials)

    // let request = new checkoutNodeJssdk.orders.OrdersGetRequest(orderID)
    // return payPalClient.client(credentials).execute(request)
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

router.post('/launchtemplate', (req, res) => {
  const type = req.body.type // register or currentuser
  const item = req.body.item // template id string
  const user = req.body.user // if (type=='register'), user is stringified registration json
  const amount = req.body.amount
  const orderID = req.body.orderID


  const credentials = {
    clientId: process.env.PP_CLIENT_ID,
    clientSecret: process.env.PP_CLIENT_SECRET,
    environment: process.env.ENVIRONMENT
  }

  vertex.payPalClient.executeRequest(orderID, credentials)
  .then(data => {
    // Validate the transaction details are as expected
    // if (data.result.purchase_units[0].amount.value !== '3.00') {
    //   throw new Error('Incorrect Amount.')
    //   return
    // }
    // console.log('ORDER SUCCESSFULLY PROCESSED: ' + JSON.stringify(data))

    if (type == 'register'){ // create new user first
      return controllers.profile.post(JSON.parse(user))
    }
    if (item == 'currentuser') { // fetch current user
      return controllers.profile.getById(user)
    }
  })
  .then(user => {
		req.vertex_session.user = user.id // log user in
    res.json({
      confirmation: 'success',
      user: user
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
