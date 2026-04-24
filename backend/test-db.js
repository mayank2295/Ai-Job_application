const { Client } = require('pg');

async function test() {
  const client = new Client({
    connectionString: 'postgresql://mayank:AQvdVx5uOTIDZJ9uJbSverOfR48FiISj@dpg-d7l64te8bjmc73djrpo0-a.oregon-postgres.render.com/database_zk92',
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    
    // Test the insert query with nulls
    const res = await client.query(`
      INSERT INTO applications
        (id, job_id, user_id, full_name, email, phone, position, experience_years,
         cover_letter, resume_filename, resume_path, ai_score, ai_skills, ai_missing_skills,
         ai_analysis, workflow_status, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      RETURNING *
    `, [
      'test-id', null, null, 'Test Name', 'test@test.com', null, 'Software Engineer', 0,
      null, null, null, null, '', '', '', 'triggered', new Date(), new Date()
    ]);
    console.log('Insert success:', res.rows[0]);
    
    // Clean up
    await client.query('DELETE FROM applications WHERE id = $1', ['test-id']);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

test();
