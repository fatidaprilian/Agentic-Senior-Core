export async function createNote(db, body) {
  return db.query(`INSERT INTO notes (text) VALUES ('${body.text}')`);
}
