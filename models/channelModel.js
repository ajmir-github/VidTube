const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
  username:{
    type:String,
    required:true
  },
  password:{
    type:String,
    required:true
  },
  email:{
    type:String,
    required:true
  },
  fullName:{
    type:String,
    required:true,
    default:"Unknown"
  },
  description:{
    type:String,
    required:true,
    default:"Not given!"
  },
  channelName:{
    type:String,
    required:true
  },
  channelIcon:{
    type:String,
    default:"/default.png"
  },
  views:{
    type:Number,
    default:0
  },
  videos:[
    {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "videos"
    }
  ],
  date: {
    type: Date,
    default: Date.now
  }
});


module.exports = {
  channelModel: mongoose.model("channels", channelSchema)
}