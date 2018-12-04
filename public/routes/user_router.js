require('dotenv').config();
const express = require('express');
    mongoose = require('mongoose');
    router = express.Router();
    rp = require('request-promise'); // "Request" library
    cors = require('cors');
    querystring = require('querystring');
    cookieParser = require('cookie-parser');
    Models = require('./../models/models.js');
    count = require('count-array-values');

var access_token, refresh_token, client_id;

router.use(function timeLog(req, res, next) {
    console.log('Time: ', Date.now());
    next();
});

//////////////////////////////////// ROUTES //////////////////////////////////////////////////////


// called when /user endpoint is hit
// get users saved albums and look at what genres they like
router.get('/', async (req, res) => {
    client_id = req.query.client_id;
    access_token = req.query.access_token;
    refresh_token = req.query.refresh_token;

    var initialize = {
        client_id: client_id,
        access_token: access_token, 
        refresh_token: refresh_token
    };

    var update = {
        access_token: access_token, 
        refresh_token: refresh_token
    };
    
    var newUser;
    
    // create new user in database or retrieve existing information 
    // Models.User.findOneAndUpdate({client_id: client_id}, update, (err, user) => {
    //     if (err) return handleError(err);

    //     if (user) {
    //         console.log("client id already exists - updating tokens!");
    //         newUser = user;
    //     }
    //     else {
    //         newUser = new Models.User(initialize);
    //         newUser.save((err) => {
    //             if (err) return handleError(err);
    //             console.log("created new user!");
    //         });
    //     }
    // });


    // var playSong = {
    //     url: 'https://api.spotify.com/v1/me/player/play',
    //     headers: {
    //       'Authorization': 'Bearer ' + access_token
    //     },
    //     json: true
    //   };

    // req.put(playSong, function(req, res){
    //   if (res){
    //     console.log('should be playing song');
    //   }
    // });


    // while (flag) {
    var offset = 0;
    var getSavedAlbums = {
        url: 'https://api.spotify.com/v1/me/albums',
        qs: {
            limit: 50,
            offset: offset
        },
        headers: {
            'Authorization': 'Bearer ' + access_token
        },
        json: true
    };
    
    rp.get(getSavedAlbums)
        .then((savedAlbums) => {
            requestList = [];
            for (var i = 0; i < savedAlbums.items.length; i++) {
                var getArtistGenre = {
                    url: 'https://api.spotify.com/v1/artists/' + savedAlbums.items[i].album.artists[0].id,
                    headers: {
                        'Authorization': 'Bearer ' + access_token
                    },
                    json: true
                };

                requestList.push(getArtistGenre);
            }

            console.log('in order 1');
            const promises = requestList.map((artistCall) => rp.get(artistCall));     
            return Promise.all(promises)
                .then((responses) => {
                    // console.log(responses);
                    genreList = [];
                    responses.forEach((response) => {
                        genreList = genreList.concat(response.genres);
                    });

                    return genreList;
                });
        
        })
        .then((list) => {
            return count(list,'genre');
        })
        .then((tuples) => {
            newUser.updateOne({savedGenres: tuples}, (err, raw) => {
                if (err) return handleError(err);
                console.log("saved genres to new user");
            });
        })
        .then(() => {
            res.sendFile("test.html", { "root": __dirname + '/../' });
        })
        .catch((err) => console.log(err));
});


// function getGenres(requestList){
//     const promises = requestList.map((artistCall) => rp.get(artistCall));      
//     return Promise.all(promises)
//         .then((responses) => {
//             genreList = [];
//             responses.forEach((response) => {
//                 response.genres.forEach((element) => {
//                     genreList.push(element);
//             });

//             return genreList;
//         });
//     });
// }


module.exports = router;