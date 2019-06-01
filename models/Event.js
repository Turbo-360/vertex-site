var mongoose = require('mongoose')

var Event = new mongoose.Schema({
	name: {type:String, trim:true, default:''},
  slug: {type:String, trim:true, default:''},
  image: {type:String, trim:true, default: process.env.IMAGE_PLACEHOLDER},
  description: {type:String, trim:true, default:''},
  dateString: {type:String, trim:true, default:''},
  date: {type:Date, default:Date.now},
	location: {type:mongoose.Schema.Types.Mixed, default:{venue:'', address:'', city:'', state:'', zip:'', lat:'', lng:''}},
	timestamp: {type:Date, default:Date.now}
})

Event.methods.summary = function() {
	return {
		name: this.name,
    slug: this.slug,
		image: this.image,
		description: this.description,
    dateString: this.dateString,
		date: this.date,
		location: this.location,
		timestamp: this.timestamp,
		schema: 'event',
		id: this._id.toString()
	}
}

module.exports = mongoose.model('Event', Event)
