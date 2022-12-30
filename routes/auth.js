const express = require('express')
const User = require('../models/User')
const router = express.Router()
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fetchUser = require("../middleware/fetchUser");
const privateKey = "DhruwangIsABillionare"
const { Configuration, OpenAIApi } = require("openai");
require("dotenv").config();
const configuration = new Configuration({
    apiKey: process.env.CHATGPT_API_TOKEN
});


// create a user using: POST "api/auth/createuser" . No login required 
router.post('/createUser',
    body('email', 'enter a valid email').isEmail(),
    body('password', 'enter a valid password').isLength({ min: 5 }),
    async (req, res) => {
        let success = false
        // if there are errors return bad request and errors 
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log("errors")
            return res.status(400).json({ errors: errors.array() });
        }
        // check whether the user with this email exist already 
        const { name, email, password } = req.body
        let user = await User.findOne({ email: email })
        if (user) {
            return res.status(400).json({ error: "sorry user with same email already exist" })
        }

        const salt = await bcrypt.genSalt(10);
        const secPass = await bcrypt.hash(password, salt);

        user = await User.create({
            name: name,
            email: email,
            password: secPass,
        })
        const data = {
            user: {
                id: user.id
            }
        }
        // console.log(user)
        const token = jwt.sign(data, privateKey);
        success = true
        res.json({ success, token })
    })
// login a user using: POST "api/auth/login" .login required 
router.post('/login',
    body('email', 'enter a valid email').isEmail(),
    body('password', 'password should not be empty').exists(),
    async (req, res) => {
        let success = false
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body
        try {
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ error: "please enter valid credentials" })
            }
            const passwordCompare = await bcrypt.compare(password, user.password);
            if (!passwordCompare) {
                return res.status(400).json({ error: "please enter valid credentials" })
            }
            const data = {
                user: {
                    id: user.id
                }
            }
            const token = jwt.sign(data, privateKey);
            success = true;
            res.json({ success, token })
        } catch (error) {
            console.log(error.message)
            res.status(500).send("internal server error")
        }
    })
router.get('/getusername', fetchUser, async (req, res) => {
    try {
        const userId = req.user.id
        const user = await User.findById(userId)
        res.send({username:user.name,email:user.email})
    } catch (error) {
        res.status(500).send("internal server error")
    }

})
router.get('/favourites', fetchUser, async (req, res) => {
    try {
        const userId = req.user.id
        const user = await User.findById(userId)
        let temp = []
        for (var i = 0; i < user.movieId.length; i++) {
            temp[i] = [user.movieId[i], user.poster[i]];
        }
        res.send(temp)

    } catch (error) {
        console.log(error.message)
        res.status(500).send("internal server error")
    }

})
router.get('/favMovieId', fetchUser, async (req, res) => {
    try {
        const userId = req.user.id
        const user = await User.findById(userId)
        res.send(user.movieId)

    } catch (error) {
        console.log(error.message)
        res.status(500).send("internal server error")
    }

})


router.post('/addFav', fetchUser, async (req, res) => {
    try {
        const userId = req.user.id
        let user = await User.findById(userId)

        if (!user.movieId.includes(req.body.movieId)) {
            user.movieId.push(req.body.movieId)
            user.poster.push(req.body.poster)
            user.save()
        }

    } catch (error) {
        console.log(error.message)
        res.status(500).send("internal server error")
    }

})
router.delete('/removefav', fetchUser, async (req, res) => {
    try {
        const userId = req.user.id
        let user = await User.findById(userId)

        if (user.movieId.includes(req.body.movieId)) {
            user.movieId = user.movieId.filter(function (item) {
                return item !== req.body.movieId
            })
            user.poster = user.poster.filter(function (item) {
                return item !== req.body.poster
            })
            user.save()
            console.log(user.poster)
            res.sendStatus(200)
        }

    } catch (error) {
        console.log(error.message)
        res.status(500).send("internal server error")
    }

})
router.post('/aisearch', async (req, res) => {
    try {
        const openai = new OpenAIApi(configuration)

        const completion = openai.createCompletion({
            model: 'text-davinci-003',
            prompt: req.body.search,
            max_tokens: 100
        })

        completion.then((r) => {
            res.send(r.data.choices[0].text)
        })


    } catch (error) {
        console.log(error.message)
        res.status(500).send("internal server error")
    }

})


module.exports = router