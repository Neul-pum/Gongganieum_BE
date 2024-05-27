const express = require("express");
const app = express();
const port = 8080; // port 번호 설정
const bodyParser = require("body-parser");
const cors = require("cors");
var indexRouter = require("./routes/index");
var apiRouter = require("./routes/api");
var createError = require("http-errors");

// 서버 접속 기본 엔진 설정
const path = require("path");
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Swagger setting
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger_output.json");

// DB
var maria = require("./config/maria");
maria.connect();

// CORS Setup

// Add headers
app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader("Access-Control-Allow-Origin", ...allowlist);

  // Request methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );

  // Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true);

  // Pass to next layer of middleware
  next();
});

var allowlist = [
  "http://localhost:3000/*",
  "http://ec2-3-23-49-89.us-east-2.compute.amazonaws.com/**",
  "http://ec2-3-23-49-89.us-east-2.compute.amazonaws.com:8080/**",
];

var corsOptionsDelegate = function (req, res, callback) {
  var corsOptions;
  if (allowlist.indexOf(req.header("Origin")) !== -1) {
    corsOptions = { origin: true }; // reflect (enable) the requested origin
  } else {
    corsOptions = { origin: false };
    res(Error("허가되지 않은 주소입니다."));
  }
  callback(null, corsOptions); // error, options
};

// Use Swagger
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerFile));

//body-parser 모듈을 불러온다.
app.use(bodyParser.json()); //요청 본문을 json 형태로 파싱
app.use(bodyParser.urlencoded({ extended: false })); //

app.use(cors(corsOptionsDelegate));

app.use("/", indexRouter);
app.use("/api", apiRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

// app.set("port", process.env.PORT || 8080);
// app.set("host", process.env.HOST || "0.0.0.0");

// app.use(
//   cors({
//     origin(req, res) {
//       console.log("접속된 주소: " + req),
//         -1 == allowlist.indexOf(req) && req
//           ? res(Error("허가되지 않은 주소입니다."))
//           : res(null, !0);
//     },
//     credentials: !0,
//     optionsSuccessStatus: 200,
//   })
// );

// // app.get("/", function (req, res) {
// //   res.send("접속된 아이피: " + req.ip);
// // });

// app.listen(app.get("port"), app.get("host"), () =>
//   console.log(
//     "Server is running on : " + app.get("host") + ":" + app.get("port")
//   )
// );

module.exports = app;
