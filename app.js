const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000; // Trae el puerto del archivo.env

app.get('/', (req, res) => {
    res.send(`
           <h1>Curso Express.js v2</h1>
           <p>Esto es una aplicacion node.js con express.js</p>
           <p>Corre en el puerto: ${PORT}</p>
    `);
});

app.listen(PORT, () => {
    console.log(`Nuestra aplicacion esta funcionando en el puerto ${PORT}`);
});

