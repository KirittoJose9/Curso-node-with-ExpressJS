require('dotenv').config();
const express = require('express');

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const usersFilePath = path.join(__dirname, 'users.json');
const LoggMiddlewere = require('./middleweres/logger');
const errorHandler =  require('./middleweres/errorHandler');

const validator = require('validator'); // Valida Email.

const app = express();

app.use(bodyParser.json()); // Entienda envio de informacion en JSON.
app.use(bodyParser.urlencoded({ extended: true })) // Para formularios.
app.use(LoggMiddlewere); //Middlewere.
app.use(errorHandler); //Middlewere error

const PORT = process.env.PORT || 3000; // Trae el puerto del archivo.env

app.get('/', (req, res) => {
    res.send(`
           <h1>Curso Express.js v2</h1>
           <p>Esto es una aplicacion node.js con express.js</p>
           <p>Corre en el puerto: ${PORT}</p>
    `);
});

app.get('/users/:id', (req, res) => {
    const userId = req.params.id;
    res.send(`Mostrar informacion del usuario con ID: ${userId}`)
});

app.get('/search', (req, res) =>{
    const terms = req.query.termino || 'No especificado';
    const category = req.query.categoria || 'Todas';

    res.send(`
        <h2>Resultados de la busqueda:</h2>
        <p>Termino: ${terms}</p>
        <p>Categoria: ${category}</p>
    `);
});

app.post('/form', (req, res) => {
    const name = req.body.nombre || 'Anonimo';
    const email = req.body.email || 'No proporcionado';
    const tel = req.body.telefono || 'No proporcionado';

    res.json({
        message: 'Datos recibidos',
        data: {
            name,
            email,
            tel
        }
    });
});

app.post('/api/data', (req, res) => {
    const data = req.body;
    if (!data || Object.keys(data).length === 0)
        return res.status(400).json({ error: 'No se recibieron datos' });

    res.status(201).json({
        message: 'Datos JSON recibidos',
        data
    });
});

app.get('/users', (req, res) => {
    fs.readFile(usersFilePath, 'utf-8', (err, data) => {
        if (err)
            return res.status(500).json( {error: 'Error con conexion de datos.'} );

        const users = JSON.parse(data);
        res.json(users);
    });
});

app.post('/users', (req, res) => {
    const newUser = req.body;
    if (!newUser || Object.keys(newUser).length === 0)
        return res.status(400).json({ error: 'No se recibieron datos' });

    if (newUser.name.length < 3)
        return res.status(400).json({ error: 'EL nombre debe de tener al menos 3 caracteres.' });

    if (!validator.isEmail(newUser.email))
        return res.status(400).json({ error: 'Ingrese un mail valido.' });

    fs.readFile(usersFilePath, 'utf-8', (err, data) => {
        if(err)
            return res.status(500).json({ error: 'Error con conexion de datos.' });
    

        const users = JSON.parse(data);
        users.push(newUser);
        fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), (err) => {
            if (err)
                return res.status(500).json({ error: 'Error al guardar el usuario.' });
        });
    });

    res.status(201).json({
        message: 'Alta exitosa.',
        newUser
    });
});

app.put('/users/:id', (req, res) => {
    const updateUser = req.body;
    const userId = parseInt(req.params.id, 10);

    if (!updateUser || Object.keys(updateUser).length === 0)
        return res.status(400).json({ error: 'No se recibieron datos' });

    if (updateUser.name.length < 3)
        return res.status(400).json({ error: 'EL nombre debe de tener al menos 3 caracteres.' });

    if (!validator.isEmail(updateUser.email))
        return res.status(400).json({ error: 'Ingrese un mail valido.' });

    const newUserId = parseInt(updateUser.id, 10);

    fs.readFile(usersFilePath, 'utf-8', (err, data) => {
        if (err)
            return res.status(500).json({ error: 'Error con conexion de datos.' });

        let users = JSON.parse(data);
        const exist = users.some(user => (user.id === newUserId && user.id != userId));

        if (exist)
            return res.status(500).json({ error: 'El ID debe ser unico.' });

        users = users.map(user => (user.id === userId ? { ...user, ...updateUser } : user));

        fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), (err) => {
            if (err)
                return res.status(500).json({ error: 'Error al actualizar el usuario' });

            res.json(updateUser);
        });
    });
    
});

app.delete('/users/:id', (req, res) => {
    const userId = parseInt(req.params.id, 10);
    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        if (err)
            return res.status(500).json({error: 'Error con la conexion.'});

        let users = JSON.parse(data);
        existUser = users.filter(user => user.id === userId);
        if (!existUser.length)
            return res.status(500).json({error: 'No se encuentra el usuario que quiere borrar.'})

        users = users.filter(user => user.id !== userId);
        fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), err => {
            if (err)
                return res.status(500).json({error: 'Error al eliminar usuario.'});

            res.status(204).send();
        });
    });
});

app.get('/error', (req, res, next) => {
    next(new Error('Error Intencional'));
});

app.get('/db-users', async (req, res) => {
    try {
        const users = await prisma.user.findMany();
        res.json(users);
    } catch (error) {
        res.status(500).json({error: 'Error al comunicarse a la BD.'});
    }
});

app.listen(PORT, () => {
    console.log(`Servidor: http://localhost:${PORT}`);
});
