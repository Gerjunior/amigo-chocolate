const express = require('express');
const mongoose = require('mongoose');
const routes = require('./shared/routes');

const app = express();

app.use(express.json());
app.use(routes);

// eslint-disable-next-line no-undef
mongoose.connect(process.env.connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Aplicação rodando na porta ${PORT}!`);
});
