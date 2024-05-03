
const mongoose = require('mongoose')

let postSchema = mongoose.Schema({
    content: String,
    date: {
        type : Date,
        default: Date.now
    },
    userid: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        }
    ]
})

module.exports = mongoose.model('post', postSchema)