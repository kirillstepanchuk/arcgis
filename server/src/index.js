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
app.use(cors());

app.get('/points', (req, res) => {

    const filters = {
        population: {
            from: req.query.populationFrom || 0,
            to: req.query.populationTo || 99999,
        },
        dsci: {
            from: req.query.dsciFrom || 0,
            to: req.query.dsciTo || 999999,
        }
    };

    db.select('*')
        .from('crystall_ball.lagoon_inventory')
        .whereIn('fips', db.distinct('fips').from('crystall_ball.drought_polygons').whereBetween('dsci', [filters.dsci.from, filters.dsci.to]))
        .andWhereBetween('population', [filters.population.from, filters.population.to])
        .then((data) => {
            res.json(data);
        })
        .catch((err) => {
            console.log(err);
        });
});


app.get('/polygons', (req, res) => {

    const filters = {
        population: {
            from: req.query.populationFrom || 0,
            to: req.query.populationTo || 99999,
        },
        dsci: {
            from: req.query.dsciFrom || 0,
            to: req.query.dsciTo || 999999,
        }
    };

    db.select('*')
        // .from('crystall_ball.drought_polygons')
        // .whereBetween('dsci', [filters.dsci.from, filters.dsci.to])
        .from('crystall_ball.drought_polygons')
        .whereIn('fips', db.distinct('fips').from('crystall_ball.lagoon_inventory').whereBetween('population', [filters.population.from, filters.population.to]))
        .andWhereBetween('dsci', [filters.dsci.from, filters.dsci.to])
        .then((data) => {
            res.json(data);
        })
        .catch((err) => {
            console.log(err);
        });
});

app.get('/min-max-dsci', (req, res) => {
    db('crystall_ball.drought_polygons').max('dsci').min('dsci')
        .then((data) => {
            res.json(data?.[0]);
        })
        .catch((err) => {
            console.log(err);
        });
})
app.get('/min-max-population', (req, res) => {
    db('crystall_ball.lagoon_inventory').max('population').min('population')
        .then((data) => {
            res.json(data?.[0]);
        })
        .catch((err) => {
            console.log(err);
        });
})

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server running on port ${port}, http://localhost:${port}`)
});