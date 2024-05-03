
const express = require('express')
const app = express()
const path = require('path')
const cookieParser = require('cookie-parser')
const userModel = require('./model/user')
const postModel = require('./model/post')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')


app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cookieParser())


app.get('/', (req,res)=>{
    res.render('index')
})


app.post('/createPost', async (req,res)=>{
    let {content,userid} = req.body
    if(content===''){
        res.redirect('/profile')
    }    
    else{
        let email = jwt.verify(req.cookies.token,'secret')
        let user = await userModel.findOne({email})
        let post = await postModel.create({ content, userid: user._id })
        user.posts.push(post._id)
        await user.save()
        res.redirect('/feed')
    }
})


app.get('/feed',isLoggedIn, async (req,res)=>{
    let posts = await postModel.find()
    let email = jwt.verify(req.cookies.token,'secret')
    let user = await userModel.findOne({email})
    res.render('feed',{Posts:posts, User: user})
})


app.get('/like/:postid',isLoggedIn, async (req,res)=>{
    let postid = req.params.postid
    let post = await postModel.findOne({_id:postid})
    if(post.likes.indexOf(req.userid)===-1){
        post.likes.push(req.userid)
        await post.save()
        res.redirect('/feed')
    }
    else{
        post.likes.splice(post.likes.indexOf(req.userid),1)
        await post.save()
        res.redirect('/feed')
    }
})  


app.get('/edit/:postid', async (req,res)=>{
    let post = await postModel.findOne({_id: req.params.postid})
    res.render('edit',{Post:post})   
})


app.get('/delete/:postid', isLoggedIn, async (req,res)=>{
    let deletedPost = await postModel.findOneAndDelete({_id: req.params.postid})
    res.redirect('/feed')
})


app.post('/update/:postid', async (req,res)=>{
    let updatedPost = await postModel.findOneAndUpdate({_id: req.params.postid},{content:req.body.content})
    // res.send(updatedPost)
    res.redirect('/feed')
    // res.send(req.params.postid)
})


app.post('/register', (req,res)=>{
    let {username,name,email,password,age} = req.body
    if(email==='' || password===''){
        res.redirect('/')
    }
    else{
      bcrypt.genSalt(10, (err,salt)=>{
        bcrypt.hash(password,salt, async (err,hash)=>{
            let created_user = await userModel.create({ username,name,email,password:hash,age })
            let token = jwt.sign(email,'secret')
            res.cookie('token',token)
            res.redirect('/profile')
        })
    })
    } 
})


app.get('/profile', isLoggedIn, (req,res)=>{
    res.render('profile')
})


app.get('/login', (req,res)=>{
    res.render('login')
})


app.post('/login', async (req,res)=>{
    let {email,password} = req.body
    let user = await userModel.findOne({email})
    if(user){
        bcrypt.compare(password,user.password,(err,result)=>{
            if(result===true){
                res.cookie('token',jwt.sign(email,'secret'))
                res.redirect('/profile')
            }
            else{
                res.redirect('/login')
            }
        })
    }
    else{
        res.redirect('/login')
    }
})


app.get('/logout', (req,res)=>{
    res.clearCookie('token')
    res.redirect('/login')
})


async function isLoggedIn(req,res,next){
       if(req.cookies.token){
        let email = jwt.verify(req.cookies.token,'secret')
        let user = await userModel.findOne({email})
        req.userid = user._id
        if(email===user.email){
            next()
         }
         else{
            res.redirect('/login')
         }
        }
        else{
            res.redirect('/login')
        }
}


app.listen(3000)

