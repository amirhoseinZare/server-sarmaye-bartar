const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const Routes = require("./http/routes/index");
const { UserModel } = require("./models/index")
const { minimumTradingDays, saveEquityAndBalance, saveDayBalance, readUsersFromCsv, test, revalidateUSers } = require("./core/cornJobs")
const path = require("path")
const { connectRedis, getRedisClient } = require("./core/redis")

// Aplication Class
class Application {
  constructor() {
    this.setUpRoutesAndMiddlewares();
    this.setUpServer();
    this.setUpDataBase();
  }

  setUpRoutesAndMiddlewares() {
    // cors middleware
    app.use(cors());
    app.use((req, res, next) => {
      res.header("Access-Control-Expose-Headers", "*");
      next();
    });

    // body parsing middleware
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());

    // set views
    app.set("view engine", "ejs");
    app.set("views", __dirname + "/views");

    // routes
    app.use("/api", Routes);

    app.use("/public", express.static(path.join(__dirname, "public")));
    app.use("/assets", express.static(path.join(__dirname, "public")));
    app.use(express.static(path.join(__dirname, "build")));
    app.use("/", (req, res) => {
      return res.sendFile(path.join(__dirname, "build", "index.html"));
    });

  }

  setUpServer() {
    // starting the server
    const port = process.env.PROJECT_PORT || 8000;
    var server = app.listen(port, (err) => {
      if (err) throw err;
      console.log("App is listening to port " + port);
    });
    // io.initIo()
    // io.getIo().on('connection', socket => {
    //   console.log('client connected')
    // });
  }

  setUpDataBase() {
    connectRedis()
    //production
    /* stage */     
    const dbURI = "mongodb://root:EMtjBpbXkC6jTQnXqeBfnL5H@tommy.iran.liara.ir:34627/sb-stage?authSource=admin"
    // const dbURI = "mongodb://root:EMtjBpbXkC6jTQnXqeBfnL5H@tommy.iran.liara.ir:34627/sb?authSource=admin"
    const dbAdress =
      process.env.DB_ADRESS ||  dbURI
    //test 
    // const dbAdress =
    //   process.env.DB_ADRESS || "mongodb://root:BlPAF36ZjrdreYvvSNU41UBG@tommy.iran.liara.ir:32902/sb?authSource=admin" ; //  add your db address here;

    if (!dbAdress) throw new Error("You didn't set the db address");

    mongoose
      .connect(dbAdress, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false 
      })
      .then(() => {
        console.log("Db connected ,");
      })
      .catch((err) => {
        console.log(err)
      });
  }
}

module.exports = Application;
