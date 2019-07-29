var mongoose = require('mongoose')

var Item = new mongoose.Schema({
	site: {type:String, trim:true, default:''}, // ID of host site
	name: {type:String, trim:true, default:''},
	timestamp: {type:Date, default:Date.now}
})

Item.methods.summary = function() {
	return {
		site: this.site,
		name: this.name,
		schema: 'item',
    timestamp: this.timestamp,
		id: this._id.toString()
	}
}

module.exports = mongoose.model('Item', Item)
