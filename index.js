// Imports
const express = require("express");
const dotenv = require("dotenv");
const { database } = require("./libs");
const path = require('path');
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const { cookieAuth } = require("./controllers/authController");
const { globalVars } = require("./controllers/globalVars");

// Global Varaibles
dotenv.config(".env");
const { DB_URL, PORT } = process.env;

// Database setup
database(DB_URL);

// Server setup
const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json()); // for axios json request
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(fileUpload());
app.set("view engine", "ejs");

// Global Meddlewares
app.use(globalVars);
app.use(cookieAuth);

// Router
app.use(require("./router/mainPageRoutes"))
app.use("/profile", require("./router/profilePageRoutes"))
app.use("/auth", require("./router/authRoutes"))

// Activate server
app.listen(PORT, ()=> {
  console.log(`--- Server is listening on port: ${PORT}`)
});