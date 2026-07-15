const express = require('express');
const Database = require('better-sqlite3');
const app = express();

app.use(express.json());

const db = new Database('app.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    role TEXT DEFAULT 'user',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    body TEXT,
    author_id INTEGER,
    status TEXT DEFAULT 'draft',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER,
    author_id INTEGER,
    body TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// ============ USERS ============

app.get('/api/users', (req, res) => {
  try {
    const users = db.prepare('SELECT * FROM users').all();
    res.json({ success: true, data: users, count: users.length });
  } catch (err) {
    console.log('Error getting users: ' + err.message);
    res.status(500).json({ success: false, error: 'Something went wrong' });
  }
});

app.get('/api/users/:id', (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ' + req.params.id).get();
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (err) {
    console.log('Error getting user: ' + err.message);
    res.status(500).json({ success: false, error: 'Something went wrong' });
  }
});

app.post('/api/users', (req, res) => {
  try {
    const name = req.body.name;
    const email = req.body.email;
    const role = req.body.role;
    if (!name) {
      res.status(400).json({ success: false, error: 'Name is required' });
      return;
    }
    if (!email) {
      res.status(400).json({ success: false, error: 'Email is required' });
      return;
    }
    const result = db.prepare("INSERT INTO users (name, email, role) VALUES ('" + name + "', '" + email + "', '" + (role || 'user') + "')").run();
    const user = db.prepare('SELECT * FROM users WHERE id = ' + result.lastInsertRowid).get();
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    console.log('Error creating user: ' + err.message);
    res.status(500).json({ success: false, error: 'Something went wrong' });
  }
});

app.put('/api/users/:id', (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ' + req.params.id).get();
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    const name = req.body.name || user.name;
    const email = req.body.email || user.email;
    const role = req.body.role || user.role;
    db.prepare("UPDATE users SET name = '" + name + "', email = '" + email + "', role = '" + role + "' WHERE id = " + req.params.id).run();
    const updated = db.prepare('SELECT * FROM users WHERE id = ' + req.params.id).get();
    res.json({ success: true, data: updated });
  } catch (err) {
    console.log('Error updating user: ' + err.message);
    res.status(500).json({ success: false, error: 'Something went wrong' });
  }
});

app.delete('/api/users/:id', (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ' + req.params.id).get();
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    db.prepare('DELETE FROM users WHERE id = ' + req.params.id).run();
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    console.log('Error deleting user: ' + err.message);
    res.status(500).json({ success: false, error: 'Something went wrong' });
  }
});

// ============ POSTS ============

app.get('/api/posts', (req, res) => {
  try {
    let query = 'SELECT * FROM posts';
    if (req.query.status) {
      query += " WHERE status = '" + req.query.status + "'";
    }
    if (req.query.author_id) {
      if (req.query.status) {
        query += " AND author_id = " + req.query.author_id;
      } else {
        query += " WHERE author_id = " + req.query.author_id;
      }
    }
    const posts = db.prepare(query).all();
    res.json({ success: true, data: posts, count: posts.length });
  } catch (err) {
    console.log('Error getting posts: ' + err.message);
    res.status(500).json({ success: false, error: 'Something went wrong' });
  }
});

app.get('/api/posts/:id', (req, res) => {
  try {
    const post = db.prepare('SELECT * FROM posts WHERE id = ' + req.params.id).get();
    if (!post) {
      res.status(404).json({ success: false, error: 'Post not found' });
      return;
    }
    const comments = db.prepare('SELECT * FROM comments WHERE post_id = ' + req.params.id).all();
    post.comments = comments;
    res.json({ success: true, data: post });
  } catch (err) {
    console.log('Error getting post: ' + err.message);
    res.status(500).json({ success: false, error: 'Something went wrong' });
  }
});

app.post('/api/posts', (req, res) => {
  try {
    const title = req.body.title;
    const body = req.body.body;
    const author_id = req.body.author_id;
    const status = req.body.status;
    if (!title) {
      res.status(400).json({ success: false, error: 'Title is required' });
      return;
    }
    if (!body) {
      res.status(400).json({ success: false, error: 'Body is required' });
      return;
    }
    if (!author_id) {
      res.status(400).json({ success: false, error: 'Author ID is required' });
      return;
    }
    const author = db.prepare('SELECT * FROM users WHERE id = ' + author_id).get();
    if (!author) {
      res.status(400).json({ success: false, error: 'Author not found' });
      return;
    }
    const result = db.prepare("INSERT INTO posts (title, body, author_id, status) VALUES ('" + title + "', '" + body + "', " + author_id + ", '" + (status || 'draft') + "')").run();
    const post = db.prepare('SELECT * FROM posts WHERE id = ' + result.lastInsertRowid).get();
    res.status(201).json({ success: true, data: post });
  } catch (err) {
    console.log('Error creating post: ' + err.message);
    res.status(500).json({ success: false, error: 'Something went wrong' });
  }
});

app.put('/api/posts/:id', (req, res) => {
  try {
    const post = db.prepare('SELECT * FROM posts WHERE id = ' + req.params.id).get();
    if (!post) {
      res.status(404).json({ success: false, error: 'Post not found' });
      return;
    }
    const title = req.body.title || post.title;
    const body = req.body.body || post.body;
    const status = req.body.status || post.status;
    db.prepare("UPDATE posts SET title = '" + title + "', body = '" + body + "', status = '" + status + "', updated_at = CURRENT_TIMESTAMP WHERE id = " + req.params.id).run();
    const updated = db.prepare('SELECT * FROM posts WHERE id = ' + req.params.id).get();
    res.json({ success: true, data: updated });
  } catch (err) {
    console.log('Error updating post: ' + err.message);
    res.status(500).json({ success: false, error: 'Something went wrong' });
  }
});

app.delete('/api/posts/:id', (req, res) => {
  try {
    const post = db.prepare('SELECT * FROM posts WHERE id = ' + req.params.id).get();
    if (!post) {
      res.status(404).json({ success: false, error: 'Post not found' });
      return;
    }
    db.prepare('DELETE FROM comments WHERE post_id = ' + req.params.id).run();
    db.prepare('DELETE FROM posts WHERE id = ' + req.params.id).run();
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    console.log('Error deleting post: ' + err.message);
    res.status(500).json({ success: false, error: 'Something went wrong' });
  }
});

// ============ COMMENTS ============

app.get('/api/posts/:postId/comments', (req, res) => {
  try {
    const post = db.prepare('SELECT * FROM posts WHERE id = ' + req.params.postId).get();
    if (!post) {
      res.status(404).json({ success: false, error: 'Post not found' });
      return;
    }
    const comments = db.prepare('SELECT * FROM comments WHERE post_id = ' + req.params.postId).all();
    res.json({ success: true, data: comments, count: comments.length });
  } catch (err) {
    console.log('Error getting comments: ' + err.message);
    res.status(500).json({ success: false, error: 'Something went wrong' });
  }
});

app.post('/api/posts/:postId/comments', (req, res) => {
  try {
    const post = db.prepare('SELECT * FROM posts WHERE id = ' + req.params.postId).get();
    if (!post) {
      res.status(404).json({ success: false, error: 'Post not found' });
      return;
    }
    const body = req.body.body;
    const author_id = req.body.author_id;
    if (!body) {
      res.status(400).json({ success: false, error: 'Body is required' });
      return;
    }
    if (!author_id) {
      res.status(400).json({ success: false, error: 'Author ID is required' });
      return;
    }
    const result = db.prepare("INSERT INTO comments (post_id, author_id, body) VALUES (" + req.params.postId + ", " + author_id + ", '" + body + "')").run();
    const comment = db.prepare('SELECT * FROM comments WHERE id = ' + result.lastInsertRowid).get();
    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    console.log('Error creating comment: ' + err.message);
    res.status(500).json({ success: false, error: 'Something went wrong' });
  }
});

app.delete('/api/posts/:postId/comments/:id', (req, res) => {
  try {
    const comment = db.prepare('SELECT * FROM comments WHERE id = ' + req.params.id + ' AND post_id = ' + req.params.postId).get();
    if (!comment) {
      res.status(404).json({ success: false, error: 'Comment not found' });
      return;
    }
    db.prepare('DELETE FROM comments WHERE id = ' + req.params.id).run();
    res.json({ success: true, message: 'Comment deleted' });
  } catch (err) {
    console.log('Error deleting comment: ' + err.message);
    res.status(500).json({ success: false, error: 'Something went wrong' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server is running on port ' + PORT);
});
