// server.js
const express = require('express');
const cors = require('cors');
const request = require('request');

const app = express();
app.use(cors());

// Rota para o proxy CORS
app.get('/proxy', (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).send("URL não fornecida.");
  }
  request(url).pipe(res);
});

// Porta do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy CORS rodando na porta ${PORT}`);
});
