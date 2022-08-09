const express = require('express');
const router = express.Router();
const {
  signCookie,
  signInUser,
  signUp,
  cookieAuth,
  onlySignOuts
} = require("../controllers/authController");




router.get("/sign_in", onlySignOuts, (req, res)=>{
  res.render("signIn", {
    pageName:"Sign in"
  });
});

router.post("/sign_in", signInUser, signCookie);

router.post("/sign_up", signUp);


router.get("/sign_out", (req, res)=>{
  res.clearCookie(process.env.COOKIE_NAME);
  res.redirect("/auth/sign_in")
})


module.exports = router;