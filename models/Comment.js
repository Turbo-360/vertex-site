const mongoose = require('mongoose')

const CommentSchema = new mongoose.Schema({
	profile: {type:mongoose.Schema.Types.Mixed, default:{}},
	title: {type:String, trim:true, default:''},
	text: {type:String, trim:true, default:''},
	slug: {type:String, trim:true, default:''},
	dateString: {type:String, trim:true, default:''},
	url: {type:String, trim:true, default:''},
	attachment: {type:String, trim:true, default:''},
	image: {type:String, trim:true, default:''},
	thread: {type:String, trim:true, default:''}, // id number of post comment refers to
	isInitial: {type:String, trim:true, default:'yes'},
	// thread: {type:mongoose.Schema.Types.Mixed, default:{}},
	updated: {type:Date, default:Date.now},
	timestamp: {type:Date, default:Date.now},
})

CommentSchema.methods.summary = function() {
	var summary = {
		profile: this.profile,
		text: this.text,
		dateString: this.dateString,
		title: this.title,
		slug: this.slug,
		url: this.url,
		attachment: this.attachment,
		image: this.image,
		isInitial: this.isInitial,
		thread: this.thread,
		// thread: this.thread,
		updated: this.updated,
		timestamp: this.timestamp,
		schema: 'comment',
		id: this._id.toString()
	}

	return summary
}

module.exports = mongoose.model('Comment', CommentSchema)
