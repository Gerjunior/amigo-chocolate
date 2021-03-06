const Pessoa = require('../models/Pessoa');
const {
  generic,
  validationError,
  addFriendError,
  alreadyFriend,
  invalidNick,
  nickNotFound,
  missingInformations,
} = require('../../../shared/utils/error');

module.exports = {
  index(request, response) {
    const { page = 1 } = request.query;

    Pessoa.paginate(request.body, { page, limit: 10 }, (err, res) => {
      if (err) {
        return response.status(500).json({ ...generic, _message: err.message });
      }
      if (!res || res.length === 0) {
        return response.status(404).json(res);
      }

      return response.send(res);
    });
  },

  getOne(request, response) {
    const { Nick } = request.params;

    Pessoa.findOne({ apelido: Nick }, (err, res) => {
      if (err || !res) {
        return response.status(404).json({});
      }

      return response.json(res);
    });
  },

  create(request, response) {
    Pessoa.create(request.body, (err, res) => {
      if (err && err.name === 'MongoError') {
        return response.status(400).json({
          ...invalidNick,
          message: `Já existe um usuário com o apelido ${request.body.apelido}`,
        });
      }
      if (err && err.name === 'ValidationError') {
        return response.status(400).json({
          ...validationError,
          _message: err.message,
        });
      }

      return response.send(res);
    });
  },

  edit(request, response) {
    const { _id } = request.body;
    if (!_id) {
      return response.status(400).json({ ...missingInformations, _id: 'ID' });
    }

    delete request.body._id;
    delete request.body.__v;
    delete request.body.amigos;
    delete request.body.grupos;

    Pessoa.findByIdAndUpdate(_id, request.body, { new: true }, (err, res) => {
      if (err) {
        return response.status(400).json({
          ...generic,
          _message: err.message,
        });
      }
      if (!res) {
        return response.status(404).json({});
      }

      return response.send(res);
    });
  },

  delete(request, response) {
    const { Nick } = request.params;

    Pessoa.findOneAndDelete({ apelido: Nick }, async (err, res) => {
      if (err) {
        return response.status(400).json({
          ...missingInformations,
          apelido: 'apelido',
          _message: err.message,
        });
      }

      if (!res) {
        return response.status(404).json({});
      }

      await Pessoa.updateMany({}, { $pull: { amigos: { apelido: Nick } } });

      response.send();
    });
  },

  async addNewFriend(request, response) {
    const { MyNick, FriendNick } = request.params;

    const me = await Pessoa.findOne({ apelido: MyNick });
    const friend = await Pessoa.findOne({ apelido: FriendNick });

    if (!friend || !me) {
      return response.status(404).json({
        ...nickNotFound,
        FriendNick,
        MyNick,
      });
    }

    const isAlreadyFriend = await Pessoa.findOne({ apelido: MyNick, amigos: { $elemMatch: { apelido: FriendNick } } });

    if (!isAlreadyFriend || isAlreadyFriend.length === 0) {
      const Updated = await Pessoa.findOneAndUpdate({ apelido: MyNick }, { $push: { amigos: friend } }, { new: true });
      const FriendUpdated = await Pessoa.findOneAndUpdate({ apelido: FriendNick }, { $push: { amigos: me } }, { new: true });

      if (!Updated || !FriendUpdated) {
        return response.status(400).json({
          ...addFriendError,
          MyNick,
          FriendNick,
        });
      }

      return response.send(Updated);
    }
    return response.status(400).json({ ...alreadyFriend });
  },

  async removeFriend(request, response) {
    const { MyNick, FriendNick } = request.params;

    const MeUpdated = await Pessoa.findOneAndUpdate({ apelido: MyNick }, { $pull: { amigos: { apelido: FriendNick } } }, { new: true });
    const FriendUpdated = await Pessoa.findOneAndUpdate({ apelido: FriendNick }, { $pull: { amigos: { apelido: MyNick } } }, { new: true });

    if (!MeUpdated || !FriendUpdated) {
      return response.status(404).json({ ...nickNotFound, MyNick, FriendNick });
    }

    return response.send(MeUpdated);
  },
};
