// MySQL2 모듈 로드
const mysql = require('mysql2');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 80;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// MySQL 데이터베이스 연결 설정
const connection = mysql.createConnection({
  host: 'localhost',     // MySQL 호스트 이름
  user: 'newuser',          // MySQL 사용자 이름
  password: 'sleeptight',  // MySQL 비밀번호
  database: 'sleeptight_database'     // 사용할 데이터베이스 이름
});


// server 시작
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// users 관련 쿼리

// 특정 user_id 가져오기
// output: JSON Object
app.get('/users/:user_id', (req, res) => {
  const userId = req.params.user_id;

  if (!userId) {
    return res.status(400).json({ success: false, message: 'user_id는 필수입니다.' });
  }

  connection.query('SELECT * FROM users WHERE user_id = ?', [userId], (err, rows, fields) => {
    if (err) {
      console.error('데이터 조회 실패: ' + err.stack);
      res.status(500).json({ success: false, message: 'Failed to fetch user' });
      return;
    }
    
    // 조회된 데이터를 JSON object 형식으로 반환
    res.status(201).json(rows[0]);
  });
});

// (user_id, user_name) 삽입
// output: JSON Object
app.post("/users", (req, res) => {
  const { user_id, user_name } = req.body;

  if (!user_id || !user_name) {
    return res.status(400).json({ success: false, message: 'user_id와 user_name은 필수입니다.' });
  }

  // Check if user_id already exists
  const checkQuery = 'SELECT * FROM users WHERE user_id = ?';
  connection.query(checkQuery, [user_id], (err, result) => {
    if (err) {
      console.error('사용자 확인 실패: ' + err.stack);
      return res.status(500).json({ success: false, message: 'Failed to check user' });
    }

    if (result.length > 0) {
      // user_id already exists
      return res.status(409).json({ success: false, message: 'User already exists' });
    }

    // Insert new user
    const insertQuery = 'INSERT INTO users (user_id, user_name) VALUES (?, ?)';
    connection.query(insertQuery, [user_id, user_name], (err, result) => {
      if (err) {
        console.error('데이터 삽입 실패: ' + err.stack);
        return res.status(500).json({ success: false, message: 'Failed to insert user' });
      }

      res.status(201).json({ success: true, message: 'User inserted successfully', data: { user_id, user_name } });
    });
  });
});



// user_sleep_data 관련 쿼리

// 해당하는 SleepData response
// output: JSON Object
app.get('/sleepdata/:user_id', (req, res) => {
  const userId = req.params.user_id;
  const date = req.query.date; // 쿼리 파라미터로 받아온 date

  if (!userId || !date) {
    return res.status(400).json({ success: false, message: 'user_id와 date는 필수입니다.' });
  }

  connection.query('SELECT * FROM user_sleep_data WHERE user_id = ? AND date = ?', [userId, date], (err, rows, fields) => {
    if (err) {
      console.error('데이터 조회 실패: ' + err.stack);
      res.status(500).json({ success: false, message: 'Failed to fetch user' });
      return;
    }
    
    // 사용자 정보가 있는지 확인
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json(rows[0]);
  });
});



// 해당하는 모든 (user_id) response
// output : JSON object
app.get('/sleepdata/id/:user_id', (req, res) => {
  const userId = req.params.user_id;

  if (!userId) {
    return res.status(400).json({ success: false, message: 'user_id는 필수입니다.' });
  }

  connection.query('SELECT * FROM user_sleep_data WHERE user_id = ?', [userId], (err, rows, fields) => {
    if (err) {
      console.error('데이터 조회 실패: ' + err.stack);
      res.status(500).json({ success: false, message: 'Failed to fetch user' });
      return;
    }
    
    // 사용자 정보가 있는지 확인
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json(rows);
  });
});


// // request의 해당하는 (user_id, date) INSERT
app.post("/sleepdata", (req, res) => {
  const { user_id, date, sleeptime, pred_waketime, real_waketime } = req.body;

  if (!user_id || !date) {
    return res.status(400).json({ success: false, message: 'user_id와 date은 필수입니다.' });
  }

  // Step 1: Check if the user exists in the `users` table
  const checkUserQuery = 'SELECT * FROM users WHERE user_id = ?';
  connection.query(checkUserQuery, [user_id], (err, result) => {
    if (err) {
      console.error('사용자 확인 실패: ' + err.stack);
      return res.status(500).json({ success: false, message: 'Failed to check user' });
    }

    if (result.length === 0) {
      // 사용자 존재하지 않음, 오류
      console.error('사용자 존재하지 않음 실패: ' + err.stack);
      return res.status(500).json({ success: false, message: 'Failed to find user' }); 
    }

    // Step 2: Insert data into `user_sleep_data` table
    const insertSleepDataQuery = 'INSERT INTO user_sleep_data (user_id, date, sleeptime, pred_waketime, real_waketime) VALUES (?, ?, ?, ?, ?)';
    connection.query(insertSleepDataQuery, [user_id, date, sleeptime, pred_waketime, real_waketime], (err, result) => {
      if (err) {
        console.error('데이터 삽입 실패: ' + err.stack);
        return res.status(500).json({ success: false, message: 'Failed to insert sleep data' });
      }

      res.status(201).json({ success: true, message: 'Sleep data inserted successfully', data: { user_id, date, sleeptime, pred_waketime, real_waketime } });
    });
  });
});



// // request의 해당하는 (user_id, date) DELETE
app.post("/sleepdata/delete", (req, res) => {
  const { user_id, date, sleeptime, pred_waketime, real_waketime } = req.body;

  if (!user_id || !date) {
    return res.status(400).json({ success: false, message: 'user_id와 date은 필수입니다.' });
  }

  // Step 1: Check if the user exists in the `users` table
  const checkUserQuery = 'SELECT * FROM users WHERE user_id = ?';
  connection.query(checkUserQuery, [user_id], (err, result) => {
    if (err) {
      console.error('사용자 확인 실패: ' + err.stack);
      return res.status(500).json({ success: false, message: 'Failed to check user' });
    }

    if (result.length === 0) {
      // 사용자 존재하지 않음
      return res.status(405).json({ success: false, message: 'User not found' });
    }

    // Step 2: Delete data from `user_sleep_data` table
    const deleteSleepDataQuery = 'DELETE FROM user_sleep_data WHERE user_id = ? AND date = ?';
    connection.query(deleteSleepDataQuery, [user_id, date], (err, result) => {
      if (err) {
        console.error('데이터 삭제 실패: ' + err.stack);
        return res.status(500).json({ success: false, message: 'Failed to delete sleep data' });
      }

      if (result.affectedRows === 0) {
        return res.status(406).json({ success: false, message: 'No sleep data found for the given user_id and date' });
      }

      res.status(200).json({ success: true, message: 'Sleep data deleted successfully', data: { user_id, date } });
    });
  });
});



// // user_songs_data 관련 쿼리

// // 해당하는 SongsData response

app.get("/songsdata", (req, res) => {
  const { user_id, song } = req.query;

  if (!user_id || !song) {
    return res.status(400).json({ success: false, message: 'user_id와 song은 필수입니다.' });
  }

  connection.query('SELECT * FROM user_songs_data WHERE user_id = ? AND song = ?', [user_id, song], (err, rows, fields) => {
    if (err) {
      console.error('데이터 조회 실패: ' + err.stack);
      res.status(500).json({ success: false, message: 'Failed to fetch song data' });
      return;
    }
    
    // 조회된 데이터를 JSON 배열 형식으로 반환
    res.json(rows);
  });
});



// // 해당하는 모든 (user_id) response
app.get("/songsdata/id", (req, res) => {
  const userId = req.query.user_id;

  if (!userId) {
    return res.status(400).json({ success: false, message: 'user_id는 필수입니다.' });
  }

  connection.query('SELECT * FROM user_songs_data WHERE user_id = ?', [userId], (err, rows, fields) => {
    if (err) {
      console.error('데이터 조회 실패: ' + err.stack);
      res.status(500).json({ success: false, message: 'Failed to fetch songs data' });
      return;
    }

    // 조회된 데이터를 JSON 배열 형식으로 반환
    res.json(rows);
    console.log(rows);
  });
});

// // request의 해당하는 (user_id, song) INSERT
app.post("/songsdata", (req, res) => {
  const { user_id, song, play_num } = req.body;

  if (!user_id || !song || play_num === undefined) {
    return res.status(400).json({ success: false, message: 'user_id와 song, play_num은 필수입니다.' });
  }

  const query = 'INSERT INTO user_songs_data (user_id, song, play_num) VALUES (?, ?, ?)';
  connection.query(query, [user_id, song, play_num], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ success: false, message: '이미 존재하는 데이터입니다.' });
      } else {
        console.error('데이터 삽입 실패: ' + err.stack);
        res.status(500).json({ success: false, message: 'Failed to insert user_songs_data' });
      }
      return;
    }

    res.status(201).json({success: true, message: "User_songs_data inserted successfully", data: {user_id, song, play_num}})
  })
})

// // request의 해당하는 (user_id, song) DELETE
app.post("/songsdata/delete", (req, res) => {
  const { user_id, song } = req.body;

  if (!user_id || !song) {
    return res.status(400).json({ success: false, message: 'user_id와 song은 필수입니다.' });
  }

  const query = 'DELETE FROM user_songs_data WHERE user_id = ? AND song = ?';
  connection.query(query, [user_id, song], (err, result) => {
    if (err) {
      console.error('데이터 삭제 실패: ' + err.stack);
      res.status(500).json({ success: false, message: 'Failed to delete user_songs_data' });
      return;
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'No data found to delete' });
    }

    res.status(200).json({ success: true, message: 'User_songs_data deleted successfully' });
  });
})

// // request의 해당하는 (user_id, song) UPDATE
app.post("/songsdata/update", (req, res) => {
  const { user_id, song, play_num } = req.body;

  if (!user_id || !song || play_num === undefined) {
    return res.status(400).json({ success: false, message: 'user_id와 song, play_num은 필수입니다.' });
  }

  const query = 'UPDATE user_songs_data SET play_num = ? WHERE user_id = ? AND song = ?';
  connection.query(query, [play_num, user_id, song], (err, result) => {
    if (err) {
      console.error('데이터 업데이트 실패: ' + err.stack);
      res.status(500).json({ success: false, message: 'Failed to update user_songs_data' });
      return;
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'No data found to update' });
    }

    res.status(200).json({ success: true, message: 'User_songs_data updated successfully' });
  });
});