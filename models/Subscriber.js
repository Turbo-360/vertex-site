var mongoose = require('mongoose')

var Subscriber = new mongoose.Schema({
	site: {type:String, default:''}, // ID number of site
	email: {type:String, lowercase:true, trim:true, default:''},
	referrer: {type:String, lowercase:true, trim:true, default:''},
	dateString: {type:String, default:''},
	timestamp: {type:Date, default:Date.now}
})

Subscriber.methods.summary = function(){
	return {
		site: this.site,
		email: this.email,
		referrer: this.referrer,
		dateString: this.dateString,
		timestamp: this.timestamp,
		schema: 'subscriber',
		id: this._id.toString()
	}
}

module.exports = mongoose.model('Subscriber', Subscriber)
