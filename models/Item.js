var mongoose = require('mongoose')

var Item = new mongoose.Schema({
	site: {type:mongoose.Schema.Types.Mixed, default:{}},
	name: {type:String, trim:true, default:''},
	type: {type:String, trim:true, default:'physical'}, // physical or digital. if pysical, require mailing address
  price: {type:Number, default:0},
  description: {type:String, trim:true, default: ''},
  image: {type:String, trim:true, default: process.env.IMAGE_PLACEHOLDER},
	images: {type:Array, default:[]},
	timestamp: {type:Date, default:Date.now}
})

Item.methods.summary = function() {
	return {
		site: this.site,
		name: this.name,
		type: this.type,
    price: this.price,
    description: this.description,
		image: (this.image.length == 0) ? process.env.IMAGE_PLACEHOLDER : this.image,
		images: this.images,
		schema: 'item',
    timestamp: this.timestamp,
		id: this._id.toString()
	}
}

module.exports = mongoose.model('Item', Item)
