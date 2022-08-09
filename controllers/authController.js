const { channelModel } = require("../models/channelModel");
const {
  secureToken,
  encrypt,
  enums
} = require("../libs");


// -------------------- Meddlewares
exports.signInUser = async (req, res, next)=>{
  try {
    const { username, password } = req.body;
    // validate the inputs
    const foundUsername = await channelModel.findOne({username});
    // if not found
    if (!foundUsername) throw {
      message: "Username not found!",
      status:400
    }

    const passwordMatched = await encrypt.match(password, foundUsername.password);
    // if not matched
    if(!passwordMatched) throw {
      message:"Password not matched!",
      status:400
    };
    // save the user in the payload
    req.payload = { user: foundUsername };
    next();

  } catch ({message, status}) {
    // Error
    res.render("signIn", {
      pageName:"Sign in",
      error:{
        message
      },
      ...req.payload
    });

  }
};



exports.cookieAuth = async(req, res, next)=>{
  try{
    const cookie = req.cookies[process.env.COOKIE_NAME];
    // if no cookie
    if(!cookie) throw {
      message:"You are not an authenticated user! Please sign in first!"
    };
    // Decode the Cookie
    const { _id } = await secureToken.verfy(cookie);
    const theChannel = await channelModel.findById(_id);
    // if not found
    if(!theChannel) throw {
      message:"There is no such authenticated user! Please sign in again!"
    };
    req.payload = {
      ...req.payload,
      auth:{
        signedIn:true,
        theChannel
      }
    };
  } catch ({message}){
    res.clearCookie(process.env.COOKIE_NAME);
    req.payload = {
      ...req.payload,
      auth:{
        signedIn:false,
        error: message
      }
    };
  }
  next();
};


exports.onlySignOuts = (req, res, next)=>{
  if(req.payload?.auth?.signedIn){
    // if has authenticated cookie
    res.redirect("/profile");
  } else {
    next();
  }
}

exports.onlySignIns = (req, res, next)=>{
  if(req.payload?.auth?.signedIn){
    // if has authenticated cookie
    next();
  } else {
    res.render("signIn", {
      pageName: "Sign In",
      error:true,
      errorStatus: enums.STATUS_CODE.NOT_AUTHORIZED,
      errorMessage:req.payload.auth.error,
      notice:false
    });
  }
}



// -------------------- Standalones
exports.signCookie = async(req, res)=>{
  try {
    // create a cookie
    const token = await secureToken.sign({
      _id:req.payload.user._id.toString()
    });
    res.cookie(process.env.COOKIE_NAME ,token);
    res.redirect("/profile");
    // needs an error message back
  } catch({message, status}){
    // Error
    res.render("signIn", {
      pageName:"Sign in",
      error:{ message: (message || "Server failed to response!") },
    });
  }
}


exports.signUp = async (req, res)=>{
  // *** make sure not to create dublicated usernames
  // Make the input ready
  const inputs = {...req.body};
  if(typeof req.body.password !== "undefined")
    inputs.password = await encrypt.hash(req.body.password);
  // create a channel in the database
  const newChannel = new channelModel(inputs);
  const createdChannel = await newChannel.save();
  // *** response
  res.render("signIn", {
    pageName:"Sign in",
    notice:{
      message:"Your channel has created! Now you can sign in!"
    }
  });
};
