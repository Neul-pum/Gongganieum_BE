// =================================================================================================
// Magazine 관련 API - Root Endpoint: /api/magazine
// =================================================================================================

var express = require("express");
var router = express.Router();
const maria = require("../../config/maria");

router.post("/upload_image", function (req, res) {
  /*
  #swagger.tags = ['Magazine']
  #swagger.summary = 'Magazine 이미지 업로드'
  #swagger.description = 'POST Test Api 입니다.'
*/

  var name = "";
  var age = 0;
  try {
    name = req.body.name;
    age = req.body.age;
  } catch (e) {
    console.log("ERR (get request) : " + e);
    res.status(400).json({
      error: "ERR_PARAMS : email or name is not valid",
    });
  }

  maria.query(
    `INSERT INTO Test(name,age) VALUES ("${name}", ${age})`,
    function (err) {
      if (!err) {
        console.log("(Save User) User is saved : " + name);
        res.status(200).json({
          message: "User is saved",
        });
      } else {
        console.log("ERR (Save User) : " + err);
        res.status(409).json({
          error: "body 형식이 틀리거나 데이터베이스에 문제가 발생했습니다.",
        });
      }
    }
  );
});

// 매거진 이미지 업로드
router.post("/upload_image", uploadImgToS3.single("file"), async (req, res) => {
  /*
  #swagger.tags = ['Magazine']
  #swagger.summary = 'Magazine 이미지 업로드'
  #swagger.description = 'POST Test Api 입니다.'
*/

  let imgUrl = null;
  if (req.file === undefined) {
    console.log("Request에 이미지 없음");
  } else {
    imgUrl = req.file.location;
    if (!imgUrl || !imgUrl.length > 0) {
      console.log("ERR: imgUrlsList ERROR");
      return;
    }
    console.log("AWS S3에 이미지 업로드 완료 \nAWS S3 imgUrl: ", imgUrl);
  }
  res.send({ message: "이미지 업로드 완료" });
});

module.exports = router;
