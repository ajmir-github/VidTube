const express = require('express');
const router = express.Router();
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



router.get("/", async (req, res)=>{
  let query = {};

  // if search query given
  if(typeof req.query.search !== "undefined"){
    const searchPattern = { $regex: req.query.search, $options: 'gi' };
    query['$or'] = [
      { title:searchPattern },
      { description: searchPattern },
      { keywords: searchPattern }
    ];
  }

  // if department query given
  if(typeof req.query.department !=="undefined"){
    const departmentPattern = { $regex: req.query.department, $options: 'gi' };
    query = {
      keywords: departmentPattern
    };
  }

  const limitPosts = 9;
  // pagination
  let page = { current: (+req.query?.page || 1) };
  page.previousPage = page.current - 1;
  page.nextPage = page.current + 1;

  const videos = await videoModel
    .find(query, "-keywords")
    .limit(limitPosts)
    .skip(limitPosts * page.previousPage)
    .sort({date:-1})
    .populate("channel", "_id channelName channelIcon");

  
  page.hasPosts = (videos.length === limitPosts);

  res.render("mainPage", {
    pageName:"Home",
    videos,
    page,
    ...req.payload,
    departments
  });
});





// single video
router.get("/video/:id", async (req, res)=>{
  const video = await videoModel
    .findById(req.params.id)
    .populate("channel");

  res.render("singleVideo", {
    pageName:"name of video",
    video,
    ...req.payload,
    departments
  });

  // // increase the views of this video
  // video.views++;
  // await video.save();

  // increase the views of the channel
  const theChannel = await channelModel.findById(video.channel.id);
  theChannel.views++;
  await theChannel.save();
});


router.get("/channels", async (req, res)=>{
  let query = {};

  // if search query given
  if(typeof req.query.search !== "undefined"){
    const searchPattern = { $regex: req.query.search, $options: 'gi' };
    query['$or'] = [
      { channelName:searchPattern },
      { username: searchPattern },
    ];
  }


  const limitPosts = 9;
  // pagination
  let page = { current: (+req.query?.page || 1) };
  page.previousPage = page.current - 1;
  page.nextPage = page.current + 1;

  const channels = await channelModel
    .find(query, "-videos -password")
    .limit(limitPosts)
    .skip(limitPosts * page.previousPage)
    .sort({views:-1})



  page.hasPosts = (channels.length === limitPosts);

  res.render("channels", {
    pageName:"Channels",
    channels,
    page,
    ...req.payload,
    departments
  });
})




router.get("/channel/:id", async (req, res)=>{
  const limitPosts = 9;
  // pagination
  let page = { current: (+req.query?.page || 1) };
  page.previousPage = page.current - 1;
  page.nextPage = page.current + 1;

  const channel = await channelModel
    .findById(req.params.id)
      .populate({
        path: 'videos',
        // match:{ title:"asd" },
        select:"-__v",
        options: {
          limit: limitPosts,
          skip: limitPosts * page.previousPage,
          sort:{ date: -1 }
        }
      });

      
  page.hasPosts = (channel.videos.length === limitPosts);
  
  res.render("singleChannelPage", {
    pageName: req.params.id,
    channel,
    ...req.payload,
    departments,
    page
  });

  // increase the views of this channel
  channel.views++;
  await channel.save();
});


module.exports = router;