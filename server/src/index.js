const express = require('express');
const cors = require('cors');
const knex = require('knex');
require('dotenv').config();
const db = knex({
    client: 'pg',
    connection: {
        host: process.env.DATABASE_HOST,
        user: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE,
        port: 60543,
    },
});
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
// CORS implemented so that we don't get errors when trying to access the server from a different server location
app.use(cors());

//SELECT *
// FROM lagoon_inventory li
// WHERE li.fips IN (
//     SELECT DISTINCT d.fips
//     FROM drought d
//     WHERE d.dsci BETWEEN '100' AND '200'
// );
app.get('/points', (req, res) => {

    const filters = {
        from: req.query.populationFrom || 0,
        to: req.query.populationTo || 99999,
    };

    db.select('*')
        .from('crystall_ball.lagoon_inventory')
        // .limit(1000)
        // .whereBetween('population', [filters.from, filters.to])
        .whereIn('fips', db.distinct('fips').from('crystall_ball.drought_polygons').whereBetween('DSCI', [filters.from, filters.to]))
        .then((data) => {
            res.json(data);
        })
        .catch((err) => {
            console.log(err);
        });
});


app.get('/polygons', (req, res) => {

    const filters = {
        from: req.query.dsciFrom || 0,
        to: req.query.dsciTo || 999999,
    };

    db.select('*')
        .from('crystall_ball.drought_polygons')
        .whereBetween('DSCI', [filters.from, filters.to])
        .then((data) => {
            res.json(data);
        })
        .catch((err) => {
            console.log(err);
        });
});
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}, http://localhost:${port}`));