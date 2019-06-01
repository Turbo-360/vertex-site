var mongoose = require('mongoose')

var Event = new mongoose.Schema({
	name: {type:String, trim:true, default:''},
  slug: {type:String, trim:true, default:''},
  image: {type:String, trim:true, default: process.env.IMAGE_PLACEHOLDER},
  description: {type:String, trim:true, default:''},
  dateString: {type:String, trim:true, default:''},
  date: {type:Date, default:Date.now},
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
		timestamp: this.timestamp,
		schema: 'event',
		id: this._id.toString()
	}
}

module.exports = mongoose.model('Event', Event)
