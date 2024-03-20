const express=require('express')
const router=express.Router()

const auth=require('../middleware/auth')
const register=require('../controller/partner')
const login=require('../controller/partner')
const logout=require('../controller/partner')
const upload=require('../controller/partner')
const home=require('../controller/partner')
const icon=require('../controller/partner')
const password=require('../controller/partner')
const email=require('../controller/partner')

//register a new user
router.post('/register',register)

// login an existing user
router.post('/login',login)

// logout a user
router.get('/logout',auth,logout)

// upload an image
router.post('/upload',upload)

// get user details by email
router.post('/home',auth,home)

// upload profile icon image
router.post('/icon',auth,icon)

// change password of an existing user
router.post('/password',auth,password)

// send email via nodemailer
router.post('/send-email',auth,email)

module.exports=router 