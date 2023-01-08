const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const lodash = require("lodash");
const mongoose = require("mongoose");
const timestamp = require("console-stamp")(console, "[HH:MM:ss]");
const cookieParser = require("cookie-parser");

const app = express();

app.set("view engine", "ejs");
app.use(cookieParser())
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://revalootsystemuser:RV9Pr3xkUF9Sz5v@cluster0.xtvdkw9.mongodb.net/revaDB", { useNewUrlParser: true});

const itemSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  value: { type: Number, required: true },
  obtained: { type: Boolean, required: true, default: false }
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  rank: { type: String, required: true, default: "Trial" },
  attendanceBonus: Number,
  lootList: [itemSchema]
});

const attendanceSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  users: { type: [String], required: true}
});

const guildUserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  value: { type: Number, required: true }
})

const guildLootListSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  distributionOrder: [guildUserSchema],
});

const masterItemSchema = new mongoose.Schema({
  itemName: { type: String, required: true }
});

const User = mongoose.model("User", userSchema);
const Attendance = mongoose.model("Attendance", attendanceSchema);
const GuildLoot = mongoose.model("GuildLootList", guildLootListSchema);
const MasterItem = mongoose.model("MasterItem", masterItemSchema);

let userList = [];

app.get("/", function(req, res){
  res.render("login", { failedLogin: null });
});

app.post("/home", async function(req, res){
  const username = req.body.username;
  const password = req.body.password;
  let attendanceCount = 0;
  let itemsInFirstPlace = [];

  const queryResults = await new Promise((resolve, reject) => {
    Attendance.find(function(err, results){
      if(err) reject(err);

      if(!results[0]){
        console.log("No results.");
        resolve();
        return;
      } else {
        results.forEach(function(result){
          result.users.forEach(function(userResult){
            if(userResult == username){
              attendanceCount++;
            }
          });
        });
        resolve(results);
      }
    });
  });

  const lootListQueryResults = await new Promise((resolve, reject) => {
    GuildLoot.find(function(err, results){
      if (err) reject (err);

      if(!results[0]){
        console.log("No results");
        resolve();
        return;
      } else {
        results.forEach(function(result){
          if(!result.distributionOrder[0]){
            return;
          } else {
            if(result.distributionOrder[0].username == username){
              itemsInFirstPlace.push(result.itemName);
            }
          }
        });
        resolve(results);
      }
    });
  });

  if(itemsInFirstPlace == []){
    itemsInFirstPlace.push("empty");
  }

  if(username && password){
    User.findOne({ username: username, password: password }, function(err, results){
      if(err){
        res.send(err);
      }

      if(results){
        let loggedInOptions = {
          maxAge: 1000 * 60 * 15,
          httpOnly: true
        };
        let usernameOptions = {
          maxAge: 1000 * 60 * 60,
          httpOnly: true
        };

        attendanceCount = attendanceCount / 20 * 100;

        res.cookie("loggedIn", true, loggedInOptions);
        res.cookie("username", username, usernameOptions);
        res.render("home", { username: username, items: itemsInFirstPlace, attendanceCount: attendanceCount });
      } else {
        res.render("login", { failedLogin: "Incorrect username/password." });
      }
      res.end();
    })
  } else {
    res.render("login", { failedLogin: "Please enter your username and password." });
  }
});

app.get("/overview", function(req, res){
  const loggedIn = req.cookies.loggedIn;
  const username = req.cookies.username;

  if(loggedIn != undefined && username != undefined){
    res.render("overview");
  } else if(loggedIn == undefined && username != undefined){
    res.render("login", { failedLogin: "Session expired, log in again before attempting to access other pages."});
  } else if(loggedIn == undefined && username == undefined){
    res.render("login", { failedLogin: "You must log in before accessing the site." });
  }
});

app.get("/loot-list", async function(req, res){
  const loggedIn = req.cookies.loggedIn;
  const username = req.cookies.username;

  const queryResults = await new Promise((resolve, reject) => {
    GuildLoot.find(function(err, results){
      if (err) reject (err);

      if (!results[0]) {
        console.log("No results from loot list query.");
        resolve();
      } else {
        resolve(results);
      }
    });
  });

  console.log("Loot list query results: " + queryResults);

  if(loggedIn != undefined && username != undefined){
    res.render("loot-list", { queryResults: queryResults });
  } else if(loggedIn == undefined && username != undefined){
    res.render("login", { failedLogin: "Session expired, log in again before attempting to access other pages."});
  } else if(loggedIn == undefined && username == undefined){
    res.render("login", { failedLogin: "You must log in before accessing the site." });
  }
});

app.get("/attendance", async function(req, res){
  let dates = [];
  let users = [];
  const loggedIn = req.cookies.loggedIn;
  const username = req.cookies.username;

  const queryResults = await new Promise((resolve, reject) => {
    Attendance.find(function(err, results){
      if(err) reject(err);

      if(!results[0]){
        console.log("No results.");
        resolve();
        return;
      } else {
        results.forEach(function(result){
          dates.push(result.date);
          users.push(result.users);
        });
        resolve(results);
      }
    });
  });

  if(loggedIn != undefined && username != undefined){
    res.render("attendance", { dateList: dates, userList: users });
  } else if(loggedIn == undefined && username != undefined){
    res.render("login", { failedLogin: "Session expired, log in again before attempting to access other pages."});
  } else if(loggedIn == undefined && username == undefined){
    res.render("login", { failedLogin: "You must log in before accessing the site." });
  }
});

app.get("/home", async function(req, res){
  const loggedIn = req.cookies.loggedIn;
  const username = req.cookies.username;
  let attendanceCount = 0;
  let itemsInFirstPlace = [];

  const queryResults = await new Promise((resolve, reject) => {
    Attendance.find(function(err, results){
      if(err) reject(err);

      if(!results[0]){
        console.log("No results.");
        resolve();
        return;
      } else {
        results.forEach(function(result){
          result.users.forEach(function(userResult){
            if(userResult == username){
              attendanceCount++;
            }
          })
        });
        resolve(results);
      }
    });
  });

  attendanceCount = attendanceCount / 20 * 100;

  const lootListQueryResults = await new Promise((resolve, reject) => {
    GuildLoot.find(function(err, results){
      if (err) reject (err);

      if(!results[0]){
        console.log("No results");
        resolve();
        return;
      } else {
        results.forEach(function(result){
          if(!result.distributionOrder[0]){
            return;
          } else {
            if(result.distributionOrder[0].username == username){
              itemsInFirstPlace.push(result.itemName);
            }
          }
        });
        resolve(results);
      }
    });
  });

  if(itemsInFirstPlace == []){
    itemsInFirstPlace.push("empty");
  }

  if(loggedIn != undefined && username != undefined){
    res.render("home", { username: username, items: itemsInFirstPlace, attendanceCount: attendanceCount });
  } else if(loggedIn == undefined && username != undefined){
    res.render("login", { failedLogin: "Session expired, log in again before attempting to access other pages."});
  } else if(loggedIn == undefined && username == undefined){
    res.render("login", { failedLogin: "You must log in before accessing the site." });
  }
});

app.route("/officer")
  .get(async function(req, res){
    const loggedIn = req.cookies.loggedIn;
    const username = req.cookies.username;
    userList = [];

    const queryResults = await new Promise((resolve, reject) => {
      User.find(function(err, results){
        if (err) reject (err);

        if(!results[0]){
          console.log("No results.");
          resolve();
          return;
        } else {
          results.forEach(function(result){
            userList.push(result.username);
          });
          resolve(results);
        }
      });
    });

    User.findOne({ username: username }, function(err, result){
      if(result.rank == "Officer"){
        res.render("officer", { userList: userList });
      } else if(result.rank != "Officer"){
        res.send("This page is restricted to officers and admins.");
      } else {
        console.log(err);
      }
    });
  })
  .post(function(req, res){
    const attended = req.body.checkbox;
    console.log(attended);

    let date_ob = new Date();
    let date = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();
    let fullDate = year + "-" + month + "-" + date;

    Attendance.create({ date: fullDate, users: attended }, function(err){
      if(!err){
        console.log("Attendance successfully submitted.")
      } else {
        console.log(err);
      }
    });

    res.render("officer", { userList: userList });
  });

app.post("/updateLoot", async function(req, res){

  const guildLootDbCleanUp = await new Promise((resolve, reject) => {
    GuildLoot.deleteMany({}, function(err, result){
      if (err) {
        console.log(err);
        reject(err);
      } else {
        console.log("Result of guild list cleanup: " + result);
        resolve(result);
      }
    });
  });

  const userQueryResults = await new Promise((resolve, reject) => {
    User.find(function(err, userResults){
      if (err) reject (err);

      if(!userResults[0]){
        console.log("No results.");
        resolve();
        return;
      } else {
        resolve(userResults);
      }
    });
  });

  const masterItemQueryResults = await new Promise((resolve, reject) => {
    MasterItem.find(function(err, masterItemResults){
      if (err) reject (err);

      if(!masterItemResults[0]){
        console.log("No results.");
        resolve();
        return;
      } else {
        resolve(masterItemResults);
      }
    });
  });

  masterItemQueryResults.forEach(function(masterItem){
    let distributionOrder = [];

    userQueryResults.forEach(function(user){
      let lootList = user.lootList;

      if (lootList == null) {
        console.log("Loot list does not exist for " + user.username);
      } else {
        lootList.forEach(function(item){
          if (item.obtained == true) {
            console.log("Player has already received " + item.itemName + " -- skipping.");
          } else {
            if (masterItem.itemName == item.itemName) {
              let itemValue = item.value + user.attendanceBonus;
              let userToAdd = { username: user.username, value: itemValue };
              distributionOrder.push(userToAdd);
              console.log("Match found between " + masterItem.itemName + " and " + item.itemName + " -- returning.");
              return;
            } else {
              console.log("No match between " + masterItem.itemName + " and " + item.itemName + " -- continuing iteration.");
            }
          }
        });
      }

    });

    distributionOrder.sort((a,b) => (a.value < b.value ? 1 : -1));

    GuildLoot.create({ itemName: masterItem.itemName, distributionOrder: distributionOrder }, function(err, result){
      if (!err) {
        console.log("Result of create function: " + result);
      } else {
        console.log(err);
      }
    });

  });

  res.redirect(302, "officer");
});


app.post("/updateAttendance", async function(req, res){

  User.find(function(err, userResults){
    if(!err){
      Attendance.find(function(err, attendanceResults){
        if(!err){
          userResults.forEach(function(userResult){
            let days = 0;
            let username = userResult.username;
            attendanceResults.forEach(function(attendanceResult){
              let users = attendanceResult.users;
              users.forEach(function(user){
                if(user == username){
                  days++;
                }
              });
            });
            days = days * 0.1;
            User.updateOne({username: username}, {attendanceBonus: days}, function(err, result){
              if(!err){
                console.log(result);
              } else {
                console.log(err);
              }
            });
          });
        } else {
          console.log(err);
        }
      })
    } else {
      console.log(err);
    }
  });

  res.redirect(302, "officer");
});

app.listen(3000, function(){
  console.log("Server listening on port 3000.");
});
