const express = require('express');
const router = express.Router();
const {
  onlySignIns
} = require("../controllers/authController");
const { videoModel } = require("../models/videoModel");
const {
  fileUploader:{ uploadFile },
  imageProcessor:{ resizeImage },
  fsSimple:{ deleteFile }
} = require("../libs");
const path = require("path");


router.get("/",  onlySignIns, (req, res)=>{
  res.render("profilePage", {
    pageName: "Profile",
    ...req.payload
  });
})



router.post("/upload_video",  onlySignIns, async (req, res)=>{
  try{
    
    // upload the video
    const [
      uploadedVideofileName
    ] = await uploadFile(req, "video", "vid");
    

    // upload and resize the image
    const [
      uploadedImageFileName, uploadedImageFilePath
    ] = await uploadFile(req, "thumbnail", "img");
  


    await resizeImage(
      uploadedImageFilePath,
      uploadedImageFilePath,
      { h:480, w:640 },
      50
    );


    const theChannel = req.payload?.auth?.theChannel;
    // save the video
    const newVideo = new videoModel({
      ...req.body,
      channel: theChannel._id,
      src:uploadedVideofileName,
      thumbnail:uploadedImageFileName
    });
    const createdVideo = await newVideo.save();
    // add the video to the channel
    theChannel.videos.push(createdVideo._id);
    await theChannel.save();

    

    res.status(201).json({
      message:"Video has been successfully posted!",
      link:`/video/${newVideo._id}`
    });

  } catch ({message}){
    console.log({message})
    res.status(400).json({
      message
    })
  }

  // update the departments
  req.payload.updateDepartments();
});

// channel thumbnial as icon
router.post("/upload_thumbnail", onlySignIns, async (req, res)=>{
  // upload and resize the image
  const [
    uploadedImageFileName,
    uploadedImageFilePath
  ] = await uploadFile(req, "thumbnail", "img");
  
  await resizeImage(
    uploadedImageFilePath,
    uploadedImageFilePath,
    { h:240, w:240 }
  );

  const channel = req.payload.auth.theChannel;
  channel.channelIcon = uploadedImageFileName;
  await channel.save();

  res.render("NoticePage", {
    pageName:"Success!",
    notice:{
      message:"You thumbnail has uploaded!"
    },
    ...req.payload
  });
});


// edit a video
router.get("/video_edit/:id", onlySignIns, async (req, res)=>{
  try{
    const video = await videoModel.findById(req.params.id);
    // if not found
    if(video === null) throw {
      status:404,
      message:"No video is found!"
    }

    // if not the coorespondent user
    const videoID = (video.channel?._id || "").toString();
    const channelID = (req.payload?.auth?.theChannel?._id || "").toString();
    if(videoID !== channelID) throw {
      status:401,
      message:"You are not allowed to edit this video!"
    };
  
    res.render("editVideo", {
      pageName: "Edit a video",
      video,
      ...req.payload
    });
  } catch({message}){
    // render an error message
    res.render("noticePage", {
      pageName:"Error!",
      error:{ message },
      link:{
        message:"view the video!",
        href:"/video" + req.params?.id
      },
      ...req.payload
    });
  }

});

router.post("/video_edit/:id", onlySignIns, async (req, res)=>{
  try{
    const video = await videoModel.findById(req.params.id);
    // if not found
    if(video === null) throw {
      status:404,
      message:"No video is found!"
    }
    
    // if not the coorespondent user
    const videoID = (video.channel?._id || "").toString();
    const channelID = (req.payload?.auth?.theChannel?._id || "").toString();
    if(videoID !== channelID) throw {
      status:401,
      message:"You are not allowed to edit this video!"
    };

    // inject the new data
    Object
      .entries(req.body)
      .forEach(([key, val])=> video[key] = val );
    await video.save();

    res.render("noticePage", {
      pageName:"Notice!",
      notice:{
        message:"The video is successfully edited!"
      },
      link:{
        message:"watch the video",
        href:"/video/" + video._id 
      },
      ...req.payload
    });

  } catch({message}){
    res.render("NoticePage", {
      pageName:"Error!",
      error:{ message },
      ...req.payload
    });
  }
  // update the departments
  req.payload.updateDepartments();
})


router.post("/video_uploadThumbnail/:id", onlySignIns, async(req, res)=>{
  try{
    const video = await videoModel.findById(req.params.id);
    // if not found
    if(video === null) throw {
      status:404,
      message:"No video is found!"
    }
    
    // if not the coorespondent user
    const videoID = (video.channel?._id || "").toString();
    const channelID = (req.payload?.auth?.theChannel?._id || "").toString();
    if(videoID !== channelID) throw {
      status:401,
      message:"You are not allowed to edit this video!"
    };

    // upload the file 
    const [uploadedImageFileName, uploadedImageFilePath ] = await uploadFile(req, "thumbnail", "img");
    // resize the image
    await resizeImage(
      uploadedImageFilePath,
      uploadedImageFilePath,
      { h:480, w:640 },
      50
    );
    
    // inject the new data
    video.thumbnail = uploadedImageFileName;
    await video.save();

    res.render("noticePage", {
      pageName:"Notice!",
      notice:{
        message:"The video is successfully edited!"
      },
      link:{
        message:"watch the video",
        href:"/video/" + video._id 
      },
      ...req.payload
    });

  } catch({message}){
    res.render("NoticePage", {
      pageName:"Error!",
      error:{ message },
      ...req.payload
    });
  }
});

router.post("/video_delete/:id", onlySignIns, async(req, res)=>{
  try {
    const video = await videoModel.findById(req.params.id);
    // if not found
    if(video === null) throw {
      status:404,
      message:"No video is found!"
    }
    
    const videoID = (video.channel?._id || "").toString();
    const channelID = (req.payload?.auth?.theChannel?._id || "").toString();
    // if not the coorespondent user
    if(videoID !== channelID) throw {
      status:401,
      message:"You are not allowed to delete this post!"
    };

    // delete
    await deleteFile( // delete the thumbnail image
      path.join(
        path.resolve("./"),
        "public",
        "img",
        video.thumbnail
      )
    );
    
    await deleteFile( // delete the video
      path.join(
        path.resolve("./"),
        "public",
        "vid",
        video.src
      )
    );


    await video.remove();

    res.render("NoticePage", {
      pageName:"Success!",
      notice:{
        message:"The video is deleted!"
      },
      link:{
        message:"go to your profile page!",
        href:"/profile"
      },
      ...req.payload
    });

  } catch ({message}) {
    res.render("NoticePage", {
      pageName:"Error!",
      error:{ message },
      ...req.payload
    });
  }
  // update the departments
  req.payload.updateDepartments();
});







module.exports = router;