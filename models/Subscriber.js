var mongoose = require('mongoose')

var Subscriber = new mongoose.Schema({
	sites: {type:Array, default:[]},
  email: {type:String, lowercase:true, trim:true, default:''},
  // event: {type:mongoose.Schema.Types.Mixed, default:{}},
	timestamp: {type:Date, default:Date.now}
})

Subscriber.methods.summary = function(){
	return {
		sites: this.sites,
    email: this.email,
    // event: this.event,
		timestamp: this.timestamp,
		schema: 'subscriber',
		id: this._id.toString()
	}
}

module.exports = mongoose.model('Subscriber', Subscriber)
