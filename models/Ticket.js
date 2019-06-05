var mongoose = require('mongoose')

var Ticket = new mongoose.Schema({
	name: {type:String, trim:true, default:''},
  email: {type:String, trim:true, default:''},
  event: {type:mongoose.Schema.Types.Mixed, default:{}},
	timestamp: {type:Date, default:Date.now}
})

Ticket.methods.summary = function(){
	return {
		name: this.name,
    email: this.email,
    event: this.event,
		timestamp: this.timestamp,
		schema: 'ticket',
		id: this._id.toString()
	}
}

module.exports = mongoose.model('Ticket', Ticket)
