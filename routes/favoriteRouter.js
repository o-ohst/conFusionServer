const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const Favorites = require("../models/favorite");
const cors = require("./cors");
const Dishes = require("../models/dishes");
const User = require("../models/user");
const favoriteRouter = express.Router();
var authenticate = require("../authenticate");
const favorite = require("../models/favorite");
favoriteRouter.use(bodyParser.json());

favoriteRouter
  .route("/")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id })
      .populate("user")
      .populate("dishes")
      .then(
        (f) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(f);
        },
        (err) => {
          next(err);
        }
      );
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id }, (err, favorite) => {
      if (err || favorite == null) {
        Favorites.create({ user: req.user._id, dishes: [] })
          .then(
            (favorite) => {
              req.body.forEach((v, i, a) => {
                favorite.dishes.push(v);
              });
              favorite.save().then((favorite) => {
                Favorites.findById(favorite._id)
                  .populate("user")
                  .populate("dishes")
                  .then((favorite) => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(favorite);
                  });
              });
            },
            (err) => next(err)
          )
          .catch((err) => next(err));
      } else {
        var changed = false;
        req.body.forEach((v, i, a) => {
          if (favorite.dishes.indexOf(v._id) == -1) {
            favorite.dishes.push(v);
            changed = true;
          }
        });
        if (changed) {
          favorite.save().then((favorite) => {
            Favorites.findById(favorite._id)
              .populate("user")
              .populate("dishes")
              .then((favorite) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(favorite);
              });
          });
        } else {
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/plain");
          res.send("Nothing was changed.");
        }
      }
    });
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.deleteOne({ user: req.user._id })
      .then(
        (favorite) => {
                Favorites.findById(favorite._id)
                .populate('user')
                .populate('dishes')
                .then((favorite) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
                })
            }
      )
      .catch((err) => next(err));
  });

favoriteRouter
  .route("/:dishId")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id })
      .then(
        (favorites) => {
          if (!favorites) {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.json({ exists: false, favorites: favorites });
          } else {
            if (favorites.dishes.indexOf(req.params.dishId) < 0) {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              return res.json({ exists: false, favorites: favorites });
            } else {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              return res.json({ exists: true, favorites: favorites });
            }
          }
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id }, (err, favorite) => {
      if (err || favorite == null) {
        Favorites.create({ user: req.user._id, dishes: [] })
          .then((favorite) => {
            Favorites.findById(favorite._id)
              .populate("user")
              .populate("dishes")
              .then((favorite) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(favorite);
              });
          })
          .catch((err) => {
            return next(err);
          });
                
      } else {
        var changed = false;
        req.body.forEach((v, i, a) => {
          if (favorite.dishes.indexOf(req.params.dishId) == -1) {
            favorite.dishes.push(req.params.dishId);
            changed = true;
          }
        });
        if (changed) {
          favorite.save().then(
            (favorite) => {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json(favorite);
            },
            (err) => {
              next(err);
            }
          );
        } else {
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/plain");
          res.send("Nothing was changed.");
        }
      }
    });
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id }, (err, favorite) => {
      const index = favorite.dishes.indexOf(req.params.dishId);
      console.log("index", index);
      if (index > -1) {
        favorite.dishes.splice(index, 1);
        favorite.save().then(
          (favorite) => {
            console.log("Favorite saved", favorite);
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(favorite);
          },
          (err) => next(err)
        );
      } else {
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/plain");
        res.send("Nothing was changed.");
      }
    });
  });

module.exports = favoriteRouter;
