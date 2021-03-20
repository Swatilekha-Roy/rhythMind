require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
var querystring = require('querystring');
var request = require('request'); // "Request" library
var cookieParser = require('cookie-parser');
const ejs = require("ejs");
const passport = require('passport');
const axios=require("axios");
// require('./passport');
// const isLoggedIn = require('./Middleware/auth')
const cookieSession = require('cookie-session')
let port = process.env.PORT || 3000
const app = express();
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static("public"));
app.set('view engine', 'ejs');
var access_token;
var s1,
    s2,
    a1,
    a2,
    p1,
    p2;
var search_id={};
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieSession({
  name: 'spotify-auth-session',  
  keys: ['key1', 'key2']
}))
app.use(cookieParser());
var images=[];
var client_id = '948e691fc2cc42b99db55a783cc5be60'; // Your client id
var client_secret = '71109d1b8abd445c933650a38bd759db'; // Your secret
var redirect_uri = 'http://localhost:3000/auth/spotify/callback/'; // Your redirect uri
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};
var stateKey = 'spotify_auth_state';
app.get("/:name/:s1/:s2/:a1/:a2/:p1/:p2", (req, res) => {
  search_id={
    s1:req.params.s1,
    s2:req.params.s2,
    a1:req.params.a1,
    a2:req.params.a2,
    p1:req.params.p1,
    p2:req.params.p2
  };
  //console.log(req.user);
  //res.render("index.ejs",{currentUser:req.params.name,songs:search_id});
  res.redirect("/"+req.params.name);
});
app.get("/:name",(req,res)=>{
  //search_id={};
  console.log(images);
  res.render("index.ejs",{currentUser:req.params.name,songs:search_id,image:images});
})

app.get("/landscape/snow",(req,res)=>{
  res.render("snow");
})

app.get("/landscape/sea",(req,res)=>{
  res.render("sea");
})

app.get("/landscape/rain",(req,res)=>{
  res.render("rain");
})

app.get("/landscape/fireflies",(req,res)=>{
  res.render("fireflies");
})
app.get("/",(req,res)=>{
  res.render("index",{currentUser:"",songs:"",image:[]});
})
app.get("/:name/search/:emotion",function(req,res){
//  request.get("https://serpapi.com/playground?q=calm&tbm=isch&ijn=0",function(error,response,body){
//    console.log(body);
//  });
emotion=req.params.emotion;
search_img="";
if(emotion==="calm")
search_img="valleys";
else if(emotion=="sleepy")
search_img="energetic";
else if(emotion=="excited")
search_img="excited";
else if(emotion=="romantic")
search_img="love";
else if(emotion=="anxious")
search_img="calm";
else if(emotion=="depressed")
search_img="dogs";
else
search_img="sunflowers";


var option={
  url: "https://api.pexels.com/v1/search?query="+search_img+"&per_page=12",
  headers:{'Authorization': '563492ad6f91700001000001f3abc51728374a549bc6920d623170e3'},
  json:true
};
request.get(option ,function(error, response, body){
 var i;
 //console for images
 images=[];
  for(i=0;i<12;i++){
    images.push(body.photos[i].src.large);
    console.log(body.photos[i].src.large); //images for slideshow
  }
})
 
  var options = {  
    url:  'https://api.spotify.com/v1/search?q='+emotion+'k&type=playlist&limit=2',
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  };
  // use the access token to access the Spotify Web API
  request.get(options, function(error, response, body) {
    //console.log(body.playlists.items[0].id,body.playlists.items[1].id);
    p1=body.playlists.items[0].id;
    p2=body.playlists.items[1].id;
 //getting the tracks
 var options = {  
  url:  'https://api.spotify.com/v1/search?q='+emotion+'k&type=track&limit=2',
  headers: { 'Authorization': 'Bearer ' + access_token },
  json: true
};
request.get(options, function(error, response, body) {
 // console.log(body.tracks.items[0].id,body.tracks.items[1].id);
  s1=body.tracks.items[0].id;
  s2=body.tracks.items[1].id;
//getting the albums
var options = {  
  url:  'https://api.spotify.com/v1/search?q='+emotion+'k&type=album&limit=2',
  headers: { 'Authorization': 'Bearer ' + access_token },
  json: true
};
request.get(options, function(error, response, body) {
 // console.log(body.albums.items[0].id,body.albums.items[1].id);
  a1=body.albums.items[0].id;
  a2=body.albums.items[1].id;
  res.redirect("/"+req.params.name+"/"+s1+"/"+s2+"/"+a1+"/"+a2+"/"+p1+"/"+p2);
});

});
  });
 
    
})
app.get('/auth/error', (req, res) => res.send('Unknown Error'))
app.get('/auth/spotify', function(req, res) {
  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email';
  res.redirect('https://accounts.spotify.com/authorize?' +
      querystring.stringify({
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state
      }));
});

app.get('/auth/spotify/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        access_token = body.access_token;
        console.log(access_token);
          var refresh_token = body.refresh_token;

        var options = {  
          url: 'https://api.spotify.com/v1/me', //https://api.spotify.com/v1/search?q=anxiousk&type=playlist&limit=2
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
         // console.log(body);
          res.redirect("/"+body.display_name);
        // res.render("index",{currentUser:body.display_name,id:"7uIGRS1a1X4w4URdHPUdUx"})

        });

        // we can also pass the token to the browser to make requests from there
        /*res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));*/
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
  
});
app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});
/*app.get('/auth/spotify',passport.authenticate('spotify'));
app.get('/auth/spotify/callback/',passport.authenticate('spotify', { failureRedirect: '/auth/error' }),
function(req, res) {
  console.log(req.user.displayName);
 res.redirect("/"+req.user.displayName);
});*/
// app.get('search/:genre')
app.get('/user/spotify/logout', (req, res) => {
  req.session = null;
  req.logout(); 
  res.redirect('/');
})
app.listen(port, function() {
  console.log("Server started on port 3000.");
});
//
/*axios('https://accounts.spotify.com/api/token', {
      headers: {
        'Content-Type' : 'application/x-www-form-urlencoded',
        'Authorization' : 'Basic ' + ("948e691fc2cc42b99db55a783cc5be60"+ ':' + "71109d1b8abd445c933650a38bd759db" )      
      },
      data: 'grant_type=client_credentials',
      method: 'POST'
    })
    .then(tokenResponse => {      
      setToken(tokenResponse.data.access_token);
      axios('https://api.spotify.com/v1/browse/categories?locale=sv_US', {
        method: 'GET',
        headers: { 'Authorization' : 'Bearer ' + tokenResponse.data.access_token}
      })
      .then (genreResponse => {        
        console.log(genreResponse);
        //res.render("index.ejs",{currentUser:req.params.name,searchResult:genreResponse});
      });
      
    });
    //
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };*/
