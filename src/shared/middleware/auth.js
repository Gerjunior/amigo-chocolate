/* eslint-disable no-undef */
const jwt = require('jsonwebtoken');
const Pessoa = require('../../modules/pessoa/models/Pessoa');

const auth = async (req, res, next) => {
  try {
    authKey = req.header('Authorization');

    if (!authKey) {
      throw new Error();
    }

    const token = authKey.replace('Bearer ', '');
    const data = jwt.verify(token, process.env.JWT_KEY);

    const user = await Pessoa.findOne({ _id: data._id });

    if (!user) {
      throw new Error();
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).send({ error: 'Você não está autorizado a acessar este recurso ou o seu token expirou.' });
  }
};
module.exports = auth;
