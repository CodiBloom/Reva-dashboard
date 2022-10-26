const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const loadash = require("lodash");

const app = express();

app.set("view engine", "ejs");
app.set("views","./views");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//Initialize any variables needed for templating.
var username = "";
var items = [];
var attendance = "";

//Login page GET.
app.get("/", function(req, res){

  //Render the login page and end request.
  res.render("login");
  res.end();
});

//Homepage directly after login.
app.post("/home", function(req, res){

  //Set username var using username value from login form. Displays welcome message on initial visit of homepage.
  username = req.body.username;

  //TODO: Some DB call to retrieve items that the user is #1 in line for.

  //Manual const update for front-end templating purpose.
  //TODO: Some iteration (most likely a for loop) to populate the items array with all items returned from the above DB query.
  items = ["Life-Binder's Locket","Ring of Decaying Beauty"];

  //TODO: DB query to calculate user's attendance over the last 20 raids (10 weeks.)

  //Render the home.ejs template.
  res.render("home", {username: username, items: items});

  //Clear items array and username so it doesn't remain the same for multiple users.
  /*TODO: Find better method of handling passing item arrays to the user front-end. Perhaps cookie storage?
    Not sure how cookie storage would work out given the amount of data that would be handled here.*/
  items = ["empty"]
  username = ""
  res.end();
})

app.get("/home", function(req, res){

  //Set username to hide the welcome back message seen on initial login. Placeholder.
  //TODO: Find a better method to handle a situation where a user returns to the homepage after navigating to other pages post-login.
  //username = ""

  //Manual const update for front-end templating purpose.
  //TODO: Some iteration (most likely a for loop) to populate the items array with all items returned from the above DB query.
  items = ["Life-Binder's Locket","Ring of Decaying Beauty"];

  //TODO: DB query to calculate user's attendance over the last 20 raids (10 weeks.)

  res.render("home", {username: username, items: items});
  items = ["empty"]
  res.end();
})

app.get("/overview", function(req, res){
  res.render("overview");
  res.end();
})

app.get("/attendance", function(req, res){
  res.render("attendance");
  res.end();
})

app.get("/loot-list", function(req, res){
  res.render("loot-list");
  res.end();
})

app.listen(3000, function(){
  console.log("Server started on port 3000.");
});
