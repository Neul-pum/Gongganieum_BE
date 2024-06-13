// var openAI = require("openai");
// const openai = new openAI.OpenAI();
var express = require("express");
var router = express.Router();
// var cors = require('cors');
const maria = require("../config/maria");

// Res: Popups(_id: int, name: str, type: str, date: str, address: str, keyword: str, building: str)
router.get("/popup/infos", (req, res) => {
  /*
  #swagger.tags = ['GET Requests']
  #swagger.summary = 'GET Request Api'
  #swagger.description = "전체 팝업 리스트의 정보(카테고리, 팝업명, 진행 기간, 진행 장소, 관련 키워드)를 가져오는 GET request 입니다."
*/

  maria.query(`SELECT * FROM Popups`, function (err, result) {
    if (!err) {
      console.log("All Popup's info are sent");
      res.send(result);
    } else {
      console.log("ERR : " + err);
      res.status(404).json({
        error: "Error",
      });
    }
  });
});

// /building/infos?id={건물id}

// Res: Buildings(_id: int, name: str, address: str, coord: str, popups: PopupList[], img: str, isours: bool, tag: str, cate: str)
router.get("/building/infos", (req, res) => {
  /*
  #swagger.tags = ['GET Requests']
  #swagger.summary = 'GET Request Api'
  #swagger.description = "전체 건물 리스트의 정보(건물 이름, 주소, 좌표, 현재 팝업 진행 여부, 진행된 팝업 정보 리스트)를 가져오는 GET request 입니다."
*/

  const id = req.query?.id ?? null;

  maria.query(
    `SELECT * FROM Buildings ${id ? `where _id=${id}` : ""}`,
    function (err, result) {
      if (!err) {
        id
          ? console.log(`ID: ${id} Building's info are sent`)
          : console.log("All Building's info are sent");
        res.send(result);
      } else {
        console.log("ERR : " + err);
        res.status(404).json({
          error: "Error",
        });
      }
    }
  );
});

// Res: Buildings(_id: int, name: str, address: str, coord: str, popups: PopupList[], img: str, isours: bool, tag: str, cate: str)
router.get("/building/search", (req, res) => {
  /*
  #swagger.tags = ['GET Requests']
  #swagger.summary = 'GET Request Api'
  #swagger.description = "전체 건물 리스트의 정보(건물 이름, 주소, 좌표, 현재 팝업 진행 여부, 진행된 팝업 정보 리스트)를 가져오는 GET request 입니다."
*/

  let q = req.query?.q ?? null; // -> where
  const as = req.query?.as ?? "address"; // address(default), building, (popup) -> where
  const cate = req.query?.cate ?? null; // str -> where
  const isours = req.query?.isours ?? null; // true, false -> where
  const order = req.query?.order ?? "new"; // new(default), popular, (likes)

  let query = "";
  let whereQuery = [];

  // Where 절 생성
  whereQuery.push(
    `b.${as === "building" ? "name" : "address"} LIKE '${"%" + q + "%"}'` // 1. as 필터로 q 검색 => b.address LIKE '%강남%'
  );

  if (cate) whereQuery.push(`b.cate = '${cate}'`); // 2. cate 필터 적용 => b.cate = 패션

  if (isours !== null) whereQuery.push(`b.isours = ${isours}`); // 3. isours 필터 적용 => b.isours = false

  console.log("빌딩 검색 조건: ", whereQuery);
  console.log("정렬 조건: ", order);

  // order 적용해서 전체 SQl Query문 생성
  switch (order) {
    case "new":
      console.log("new");
      query = `
        SELECT 
            b.name,
            b.address
        FROM 
            Buildings b

        ${whereQuery.length > 0 ? `WHERE ${whereQuery.join(" AND ")}` : ""}
        GROUP BY 
            b._id`;
      break;
    case "popular":
      console.log("popular");
      query = `
      SELECT 
          b.*, 
          JSON_LENGTH(b.popups) AS popups_count
      FROM 
          Buildings b
      ${whereQuery.length > 0 ? `WHERE ${whereQuery.join(" AND ")}` : ""}
      ORDER BY 
          popups_count DESC;`;
      break;
  }

  maria.query(query, function (err, result) {
    if (!err) {
      console.log(
        `Return Building with Building Search Condition: ${
          q ? `q: ${q}` : ""
        }, ${as ? `as: ${as}` : ""}, ${cate ? `cate: ${cate}` : ""}, ${
          isours ? `isours: ${isours}` : ""
        }, ${order ? `order: ${order}` : ""}`
      );
      res.send(result);
    } else {
      console.log("ERR : " + err);
      res.status(404).json({
        error: "Error",
      });
    }
  });
});

// ============================================================
// USER API : User 관련 API (GET, POST)
// ============================================================

// User Api - 유저 생성 (회원가입)
router.post("/user/register", function (req, res) {
  /*
  #swagger.tags = ['Test']
  #swagger.summary = 'POST Test Api'
  #swagger.description = 'POST Test Api 입니다.'
*/
  let uuid = null,
    name = null,
    nickname = null,
    email = null,
    description = null,
    img = null;

  try {
    uuid = req.body.uuid;
    name = req.body.name;
    nickname = req.body.nickname;
    email = req.body.email;
    description = req.body?.description ?? "";
    img = req.body?.img ?? null;
  } catch (e) {
    console.log("ERR ('/user/register') : " + e);
    res.status(400).json({
      error: "ERR_PARAMS : uuid, name, nickname, email은 필수 입력 값입니다.",
    });
  }

  maria.query(
    `
    INSERT INTO Users(name, nickname, email, description, img) VALUES ('${name}', '${nickname}', '${email}', '${description}', '${img}');
    SELECT _id from Users WHERE email = '${email}';
    `,
    function (err, result) {
      if (!err) {
        console.log(
          "(User Register) User is saved! name : " +
            name +
            ", user id: " +
            String(result)
        );
        res.status(201).send(result);
      } else {
        console.log(
          "ERR (User Register) user name : " +
            name +
            ", user id: " +
            String(result) +
            "/ Error content: " +
            err
        );
        res.status(409).json({
          error: "body 형식이 틀리거나 데이터베이스에 문제가 발생했습니다.",
        });
      }
    }
  );
});

// User Api - 특정 id의 유저 정보 리턴
router.post("/user/info", function (req, res) {
  /*
  #swagger.tags = ['Test']
  #swagger.summary = 'POST Test Api'
  #swagger.description = 'POST Test Api 입니다.'
*/

  const id = req.query?.id ?? 1; // id 안적으면 Test 유저(_id = 1) 정보 리턴

  maria.query(
    `
    SELECT * from Users WHERE _id = ${id};
    `,
    function (err, result) {
      if (!err) {
        console.log(
          "(Search User Info) 유저 정보 리턴, user id: " + String(id)
        );
        res.send(result);
      } else {
        console.log(
          "ERR (Search User Info) 해당 아이디의 유저가 없습니다! user id: " +
            String(id)
        );
        res.status(404).json({
          error: `해당 아이디의 유저가 없습니다! user id: "+ ${String(id)}`,
        });
      }
    }
  );
});

// User Api - 특정 id의 유저 삭제 (탈퇴)
router.post("/user/remove", function (req, res) {
  /*
  #swagger.tags = ['Test']
  #swagger.summary = 'POST Test Api'
  #swagger.description = 'POST Test Api 입니다.'
*/

  const id = req.query?.id; // id 안적으면 Test 유저(_id = 1) 정보 리턴

  if (id === 1) {
    console.log(
      "ERR ('/user/remove') : Test 계정(id = 1) 정보는 삭제할 수 없습니다."
    );
    res.status(400).json({
      error: "ERR_PARAMS : Test 계정(id = 1) 정보는 삭제할 수 없습니다.",
    });
  }

  maria.query(
    `
    DELETE from Users WHERE _id = ${id};
    `,
    function (err, result) {
      if (!err) {
        // 성공
        console.log("(Delete User) 유저 삭제 성공, user id: " + String(id));
        res.status(204).json({
          message: `유저 정보가 정상적으로 삭제되었습니다! (유저 탈퇴 성공) user id: "+ ${String(
            id
          )}`,
        });
      } else {
        console.log(
          "ERR (Delete User) 해당 아이디의 유저가 없습니다! user id: " +
            String(id)
        );
        res.status(404).json({
          error: `해당 아이디의 유저가 없습니다! user id: "+ ${String(id)}`,
        });
      }
    }
  );
});

// User Like Api - Authorize된 유저가 찜한 빌딩 id 리스트 리턴
router.post("/user/building/likes", function (req, res) {
  /*
  #swagger.tags = ['Test']
  #swagger.summary = 'POST Test Api'
  #swagger.description = 'POST Test Api 입니다.'
*/

  const id = req.query?.id; // id 안적으면 Test 유저(_id = 1) 정보 리턴

  if (id === 1) {
    console.log(
      "ERR ('/user/remove') : Test 계정(id = 1) 정보는 삭제할 수 없습니다."
    );
    res.status(400).json({
      error: "ERR_PARAMS : Test 계정(id = 1) 정보는 삭제할 수 없습니다.",
    });
  }

  maria.query(
    `
    DELETE from Users WHERE _id = ${id};
    `,
    function (err, result) {
      if (!err) {
        // 성공
        console.log("(Delete User) 유저 삭제 성공, user id: " + String(id));
        res.status(204).json({
          message: `유저 정보가 정상적으로 삭제되었습니다! (유저 탈퇴 성공) user id: "+ ${String(
            id
          )}`,
        });
      } else {
        console.log(
          "ERR (Delete User) 해당 아이디의 유저가 없습니다! user id: " +
            String(id)
        );
        res.status(404).json({
          error: `해당 아이디의 유저가 없습니다! user id: "+ ${String(id)}`,
        });
      }
    }
  );
});

// ============================================================
// TEST API : 테스트 용 API (GET, POST)
// ============================================================

// POST Test Api
router.post("/save/user/test", function (req, res) {
  /*
  #swagger.tags = ['Test']
  #swagger.summary = 'POST Test Api'
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

// GET Test Api
router.get("/get/test", (req, res) => {
  /*
  #swagger.tags = ['Test']
  #swagger.summary = 'GET Test Api'
  #swagger.description = 'GET Test Api 입니다.'
*/

  res.status(201).send({ test: "hi" });
});

module.exports = router;

// 빌딩 아이디에 해당하는 빌딩의 좋아요 숫자 출력

// SELECT buildingId, COUNT(userId) AS likes_count
// FROM BuildingLikes
// WHERE buildingId = 101
// GROUP BY buildingId;

// 해당 유저가 누른 빌딩 좋아요 id 리스트 -> 빌딩 id 리스트 반환됨

// SELECT buildingId
// FROM BuildingLikes
// WHERE userId = @userId;
