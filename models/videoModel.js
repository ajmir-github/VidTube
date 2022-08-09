const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title:{
    type:String,
    required:true
  },
  keywords:{
    type:String,
    required:true
  },
  description:{
    type:String,
    required:true
  },
  thumbnail:{
    type:String,
  },
  src:{
    type:String,
    required:true
  },
  channel:{
    type:mongoose.SchemaTypes.ObjectId,
    ref:"channels"
  },
  date: {
    type: Date,
    default: Date.now
  },
  views:{
    type:Number,
    default:0
  },
});

module.exports = {
  videoModel: mongoose.model("videos", videoSchema)
}