const express = require('express');
const router = express.Router();
const { videoModel } = require("../models/videoModel");
const { channelModel } = require("../models/channelModel");


// if the website is empty
let commingSoonPage = true;
async function isDatabaseEmpty() {
  const hasNoChannels = (await channelModel.find().limit(1)).length === 0;
  const hasNoVideos = (await videoModel.find().limit(1)).length === 0;
  commingSoonPage =  hasNoChannels || hasNoVideos;
}


router.get("/", async (req, res)=>{
  // replace the home page to a comming soon
  if(commingSoonPage){
    await isDatabaseEmpty();
    if(commingSoonPage){
      return res.render("commingSoon", {
        SEO:{
          title:"VidTube",
          author:"Ajmir Raziqi",
          keywords: "Short videos, Songs, Educational Videos",
          description:"I have created this website so you could make a video that could impact others, and upload it here. Please do not hesitate to do so!"
        },
      });
    }
  }
  // Vars
  let query = {};
  let SEO = {
    title:"VidTube",
    author:"Ajmir Raziqi",
    keywords: req.payload.departments.slice(0, 6).join(", "),
    description:"I have created this website so you could make a video that could impact others, and upload it here. Please do not hesitate to do so!"
  };
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
    // this department must be at the begining to give it a push
    SEO.keywords = (
      [...new Set([
        req.query.department,
        ...SEO.keywords.split(", ")
      ])]
    ).join(", ")
  }

  const limitPosts = 15;
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
    SEO,
    videos,
    page,
    ...req.payload,
  });
});





// single video
router.get("/video/:id", async (req, res)=>{
  // if searched redirect to the main page
  if(typeof req.query.search !== "undefined")
    return res.redirect(`/?search=${req.query.search}`);

  // videos from database
  const video = await videoModel
    .findById(req.params.id)
    .populate("channel");


  // related videos Query
  let relatedVideosQuery = {};
  // prepare the keywords
  let keywords = video.keywords
    .split(",")
    .map(s=> ({
      keywords:{
        $regex:s.trim(),
        $options: 'gi'
      }
    }));
  // create a query, excluding the video itself
  if(keywords.length > 0)
    relatedVideosQuery = {
      ["$and"]:[
        {
          _id: { ["$ne"]: video._id },
          ["$or"]:keywords
        },
      ]
    }
  // exec the query
  const videos = await videoModel
    .find(relatedVideosQuery)
    .limit(8)
    .sort({date:-1})
    .populate("channel", "_id channelName channelIcon");

  res.render("singleVideo", {
    SEO:{
      title:`VidTube: ${video.title}`,
      author:video.channel.fullName,
      keywords:video.keywords,
      description:video.description,
    },
    video,
    videos,
    ...req.payload,
  });

  // increase the views of the channel
  const theChannel = await channelModel.findById(video.channel.id);
  theChannel.views++;
  await theChannel.save();
  // increase the views of the video
  video.views++;
  await video.save();
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


  const limitPosts = 15;
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
    SEO:{
      title:"VidTube: Channels",
      author:"Ajmir Raziqi",
      keywords: req.payload.departments.slice(0, 6).join(", "),
      description:"I have created this website so you could make a video that could impact others, and upload it here. Please do not hesitate to do so!"
    },
    channels,
    page,
    ...req.payload,
  });
})




router.get("/channel/:id", async (req, res)=>{
  const limitPosts = 15;
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
    SEO:{
      title:`VidTube: ${channel.channelName}`,
      author:channel.fullName,
      description:channel.description,
    },
    channel,
    ...req.payload,
    page
  });

  // increase the views of this channel 2x
  channel.views += 5;
  await channel.save();
});


module.exports = router;