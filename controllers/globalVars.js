const { videoModel } = require("../models/videoModel");
const { channelModel } = require("../models/channelModel");

// Global vars
let departments = [];


// Update global vars
const updateDepartments = async()=>{
  try{
    const posts = await videoModel.find({}, "keywords -_id")
    // flat array => [].concat(...array)
    const words = [].concat(...posts.map(({keywords})=>
      keywords.split(",").map(a=>a.trim())
    ))
    // remove the duplicated words
    const uniqueKeywords = new Set(words);
    
    let keywords = [];
    uniqueKeywords.forEach(word=>{
      if(word !== ""){
        let times = 0
        try{
          const pattern = new RegExp(word, "ig");
          words.forEach(w =>{
            if (pattern.test(w)) times++
            // if (matchString(word, w)) times++
          });
        } catch(e){
          // if error with the regular Expression
        }
        keywords.push([word, times]);
      }
    })
    
    departments = keywords.sort((a, b)=>b[1]-a[1])
    const numberofDps = 10;
    if(departments.length > numberofDps){
      departments.length =  numberofDps;
    }
    departments = departments.map(d => d[0]);
  } catch(error){
    console.log({error})
  }
}
// initiate global vars
updateDepartments();



async function globalVars(req, res, next){
  req.payload = {
    departments,
    updateDepartments
  };
  next();
};

module.exports = { globalVars }