const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_tqKzs9DpBGI1@ep-shy-haze-a8f6vy4t-pooler.eastus2.azure.neon.tech/neondb?sslmode=require"
});

// Create table if not exists
pool.query(`
CREATE TABLE IF NOT EXISTS values_table (
    id SERIAL PRIMARY KEY,
    asset_id BIGINT NOT NULL UNIQUE,
    creater TEXT NOT NULL,
    price BIGINT NOT NULL,
    tag TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`);

app.post('/api/store', async (req, res) => {
    const { asset_id, creater, price, tag } = req.body;
    try {
        await pool.query(
            'INSERT INTO values_table (asset_id, creater, price, tag) VALUES ($1, $2, $3, $4)',
            [asset_id, creater, price, tag]
        );
        res.status(201).json({ message: 'Value stored' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/api/values', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM values_table');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

app.delete('/api/delete-by-asset/:asset_id', async (req, res) => {
    const { asset_id } = req.params;
    try {
        const result = await pool.query('DELETE FROM values_table WHERE asset_id = $1', [asset_id]);
        if (result.rowCount === 0) {
            res.status(404).json({ message: 'No record found with that asset_id' });
        } else {
            res.json({ message: 'Record deleted successfully' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
