const mongoose = require('mongoose')

const CommentSchema = new mongoose.Schema({
	profile: {type:mongoose.Schema.Types.Mixed, default:{}},
	site: {type:mongoose.Schema.Types.Mixed, default:{}},
	context: {type:mongoose.Schema.Types.Mixed, default:{}},
	title: {type:String, trim:true, default:''},
	text: {type:String, trim:true, default:''},
	slug: {type:String, trim:true, default:''},
	url: {type:String, trim:true, default:''},
	domain: {type:String, trim:true, default:''}, // www.nypost.com
	attachment: {type:String, trim:true, default:''},
	image: {type:String, trim:true, default:''},
	thread: {type:String, trim:true, default:''}, // id number of post comment refers to
	isInitial: {type:String, trim:true, default:'yes'},
	votes: {type:mongoose.Schema.Types.Mixed, default:{up:[], down:[], score:0}},
	numReplies: {type:Number, default:0},
	updated: {type:Date, default:Date.now},
	dateString: {type:String, trim:true, default:''},
	timestamp: {type:Date, default:Date.now},
})

CommentSchema.methods.summary = function() {
	var summary = {
		profile: this.profile,
		site: this.site,
		context: this.context,
		text: this.text,
		title: this.title,
		slug: this.slug,
		url: this.url,
		domain: this.domain,
		attachment: this.attachment,
		image: this.image,
		isInitial: this.isInitial,
		thread: this.thread,
		votes: {up:this.votes.up.length, down:this.votes.down.length, score:this.votes.score},
		numReplies: this.numReplies,
		updated: this.updated,
		dateString: this.dateString,
		timestamp: this.timestamp,
		schema: 'comment',
		id: this._id.toString()
	}

	return summary
}

module.exports = mongoose.model('Comment', CommentSchema)
