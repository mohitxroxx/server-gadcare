const Saveuser = require('./user')
const ref = require('./ref')
const nodemailer = require('nodemailer')
const express = require("express")
const jwt = require("jsonwebtoken")
const axios = require('axios')
const auth = require("../middleware/auth")
const cookieParser = require('cookie-parser')
const dotenv = require('dotenv')
const bcrypt = require("bcrypt")
const user = require("../models/user")
const cloudinary = require("../config/cloudinary")
const upload = require("../middleware/multer")
const path = require('path');
const logoPath = path.join(__dirname, '../../client/src/assets/logo.jpg');
const mailIconPath = path.join(__dirname, '../../client/src/assets/mail.png');
const logoCid = 'companyLogo';
const mailIconCid = 'mailIcon';
dotenv.config()
const app = express()
app.use(cookieParser())

const { SMTP_EMAIL, SMTP_PASS, TOKEN_KEY } = process.env

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

let transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: SMTP_EMAIL,
    pass: SMTP_PASS,
  },
})

app.post("/register", async (req, res) => {
  try {
    const { country, service, email, f_name, m_name, l_name, category, name, pic1, pic2, link, contact, city, state, zip, recaptchaToken } = req.body;

    if (!country || !service || !email || !f_name || !l_name || !category || !contact || !city || !state || !zip || !recaptchaToken)
      return res.status(400).json({ error: 'Enter all the mandatory fields correctly' });

    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`
    );

    if (!response.data.success) {
      return res.status(400).json({ error: "reCAPTCHA verification failed" });
    }

    const emailCheck = await user.findOne({ email });
    if (emailCheck) {
      return res.status(400).json({ error: 'Email already used' });
    }
    const refcode = await ref.gencode();
    const otpreq = { ...req, body: { email, refcode } };
    otp(otpreq, res)
      .then(() => {
        const newUser = {
          country, service, email, password: refcode, f_name, m_name, l_name, category, name, link, pic1, pic2, contact, city, state, zip, refcount: 0, refid: refcode
        };
        Saveuser.registerUser(newUser)
          .then(() => {
            res.status(200).json({ msg: 'Successfully registered. Check your email for further process', status: true, refcount: newUser.refcount, refcode: newUser.refid });
          })
          .catch((error) => {
            console.error(error);
            res.status(400).json({ error: 'Error registering the user' });
          });
      })
      .catch((error) => {
        console.error(error);
        res.status(400).json({ error: 'Error sending the OTP' });
      });

  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: 'Error registering the user' });
  }
});

async function otp(req, res) {
  const { email, refcode } = req.body;
  // const refcode = await ref.gencode()
  // console.log(email)
  // console.log(refcode)
  const mailOptions = {
    from: SMTP_EMAIL,
    to: email,
    subject: "GadCare Login Credentials",
    html: `<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f9f9f9;">
    <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.1); max-width: 600px; margin: 0 auto;">
        <tr>
            <td>
                <h3 style="color: #0066cc; font-size: 26px; text-align: center; margin-bottom: 20px;">Welcome to GadCare</h3>
                <hr style="border: 1px solid #ccc; margin: 20px 0;">
                <h4 style="font-size: 22px; color: #333; text-align: center;">Your Partner ID has been activated</h4>
                <p style="font-size: 18px; color: #333; margin: 20px 0; text-align: center;">You're all set! Now you can easily manage your Partner dashboard by logging in with your account details provided below. You can also download your channel partner agreement after logging in.</p>
                <p style="font-size: 18px; color: #333; text-align: center;"><strong>Partner ID:</strong> ${refcode}</p>
                <p style="font-size: 18px; color: #333; text-align: center;"><strong>User ID:</strong> ${email}</p>
                <p style="font-size: 18px; color: #333; text-align: center;"><strong>Password:</strong> ${refcode}</p>
                <p style="font-size: 18px; color: #0066cc; text-align: center;"><a href="https://www.gadcare.com" style="color: #0066cc;">Login here</a></p>
            </td>
        </tr>
        <tr>
            <td align="center">
                <div style="margin-top: 30px;">
                    <img src="cid:mailIcon" alt="Mail Icon" style="max-width: 20px; margin-right: 5px;">
                    <span style="font-size: 18px; color: #333;">partner@gadcare.com</span>
                </div>
                <div style="margin-top: 20px;">
                    <h5 style="font-size: 20px; margin: 5px 0; color: #333;">Best Regards,</h5>
                    <h5 style="font-size: 20px; margin: 5px 0; color: #333;">GadCare Team</h5>
                </div>
            </td>
        </tr>
        <tr>
            <td align="center">
                <div style="margin-top: 10px;">
                  <img src="cid:companyLogo" alt="Company Logo" style="max-width: 200px;">
                </div>
            </td>
        </tr>
    </table>
</body>`,
attachments: [
  {
      filename: 'logo.jpg',
      path: logoPath,
      cid: logoCid
  },
  {
    filename: 'mail.png',
    path: mailIconPath,
    cid: mailIconCid
}
]
  }
  transporter
    .sendMail(mailOptions)
    .then(() => {
      console.log("Mail sent to the user")
    })
    .catch((err) => {
      console.log(err);
      return 0;
    })
}

app.post('/send-email', async (req, res) => {
  try {
    const { email, senderEmail, subject, type, description } = req.body;

    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: SMTP_EMAIL,
        pass: SMTP_PASS,
      }
    });

    // Send mail with defined transport object
    let info = await transporter.sendMail({
      from: email,
      to: SMTP_EMAIL,
      subject: subject,
      text: `Email: ${senderEmail}\n\nType: ${type}\n\nDescription: ${description}`
    });

    return res.status(200).json({msg:'Email sent successfully'});
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).send('Error sending email');
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body
    if (!email || !password)
      return res.status(400).send('Enter all the fields correctly')
    const chk = await user.findOne({ email })
    if (!chk)
      return res.status(404).send('User does not exists')
      const isPasswordValid = await bcrypt.compare(password, chk.password);
      if (!isPasswordValid)
        return res.status(401).json({ error: "Invalid password" });
    const expiresIn = rememberMe ? '7d' : '2h';
    const token = jwt.sign({ id: chk.id, email: chk.email }, TOKEN_KEY, { expiresIn })
    res.cookie('jwt', token, {
      secure: true,
      maxAge: expiresIn === '7d' ? 7 * 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000,
      httpOnly: true
    })
    res.status(200).json({ msg: 'Login successful', status: true, token: token })
  } catch (error) {
    console.error(error)
    res.status(500).json({ msg: 'Failed to login an error occured', status: false })
  }
})

app.post("/icon", upload.single('img'), async (req, res) => {
  try {
    const { email } = req.body;
    const img = req.file.path;
    const cloudinaryResponse = await cloudinary.uploader.upload(img);
    const iconUrl = cloudinaryResponse.url;
    const updatedUser = await user.findOneAndUpdate({ email: email }, { icon: iconUrl }, { new: true });
    res.status(200).json({ msg: 'Icon updated', iconUrl: iconUrl });
  } catch (error) {
    console.error(error);
    res.status(400).json({ err: "Failed to update the icon" });
  }
});

app.get("/logout", async (req, res) => {
  try {
    res.clearCookie('jwt')
    // res.clearCookie('refid')
    res.status(200).send("User Logged out and session ended")
  } catch (ex) {
    next(ex)
  }
})

app.post("/upload", async (req, res) =>
  upload.single('image')(req, res, function (err) {
    if (err) {
      console.log(err)
      return res.status(200).send("Error occured while uploading")
    }
    cloudinary.uploader.upload(req.file.path, function (err, result) {
      if (err) {
        console.log(err)
        return res.status(500).send("Error occured with cloudinary")
      }
      return res.status(200).json({ msg: "Uploaded successfully", imageUrl: result.url })
    })
  })
)

app.post('/home',async(req,res)=>{
  try {
    const {email}=req.body;
    const currentUser=await user.findOne({email:email})
    res.status(200).json(currentUser)
  } catch (error) {
    res.status(500).json("internal server error occured while fetching data")
  }
})
app.post('/password',async(req,res)=>{
  try {
    const {email,newPassword}=req.body;
    const currentUser=await user.findOne({email:email})
    if(!currentUser)
    return res.status(200).json("No record found for this email")
  const hashed=await bcrypt.hash(newPassword, 10)
    currentUser.password=hashed;
    await currentUser.save()
    res.status(200).json("Password changed successfully")
  } catch (error) {
    res.status(500).json("internal server error occured while updating password")
  }
})
app.get('/earnings',auth,async(req,res)=>{
  try {
    const token=req.cookies.jwt
    const decoded = jwt.verify(token, TOKEN_KEY)
    console.log(decoded)
    const email=decoded.email
    const currentUser=await user.findOne({email})
    // console.log(currentUser)
    currentUser.earnings.sort((a,b)=>b.dateOfPurchase-a.dateOfPurchase)
    console.log(currentUser.earnings)
    res.status(200).json(currentUser.earnings)
  } catch (error) {
    console.error(error)
    res.status(500).json("internal server error occured while fetching data")
  }
})
app.get('/icon',async(req,res)=>{
  try {
    const token=req.cookies.jwt
    const decoded = jwt.verify(token, TOKEN_KEY)
    console.log(decoded)
    const email=decoded.email
    const currentUser=await user.findOne({email})
    // console.log(currentUser.earnings)
    return res.status(200).json({url:currentUser.icon})
  } catch (error) {
    res.status(500).json("internal server error occured while fetching data")
  }
})
// app.patch('/icon/:refid',async(req,res)=>{
//   try {
//     const refid=req.params.refid
//     const currentUser=await user.findOne({refid})
//     // console.log(currentUser.earnings)
//     return res.status(200).json({url:currentUser.icon})
//   } catch (error) {
//     res.status(500).json("internal server error occured while fetching data")
//   }
// })
module.exports = app;