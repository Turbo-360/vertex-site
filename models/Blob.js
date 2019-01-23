var mongoose = require('mongoose')

var Blob = new mongoose.Schema({
	site: {type:String, trim:true, default:''}, // ID of host site
	name: {type:String, trim:true, default:''},
	type: {type:String, trim:true, default:''}, // MIME type
	url: {type:String, trim:true, default:''},
	size: {type:Number, default:0},
	timestamp: {type:Date, default:Date.now}
})

Blob.methods.summary = function() {
	return {
		site: this.site,
		name: this.name,
		type: this.type,
		url: this.url,
		size: this.size,
		timestamp: this.timestamp,
		schema: 'blob',
		id: this._id.toString()
	}
}

module.exports = mongoose.model('Blob', Blob)
