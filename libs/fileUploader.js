const path = require('path');
const { v4 } = require("uuid");


exports.uploadFile = (req, inputName = "file", dir = "uploads")=> new Promise((resolve, reject)=>{
  const file = req.files[inputName];
  if(!file) reject({
    message:"No file with the given name uploaded!"
  });
  // undublicated names
  const fileName = v4() + path.extname(file.name);
  // ready for upload
  const filePath = path.join(
    path.resolve("./"),
    "public",
    dir,
    fileName
  );
  file.mv(filePath, (error)=> {
    if(error) reject({
      message: "Server failed to upload the file!"
    });
    resolve([fileName, filePath]);
  });
})