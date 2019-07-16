// const et let c'est comme var

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer();
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');
const faker = require('faker');
const mongoose  = require('mongoose');
const config = require('./config');

// console.log(config);



mongoose.connect(`mongodb://${config.db.user}:${config.db.password}@ds151247.mlab.com:51247/expressmovie`);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error: cannot connect to my DB'));
db.once('open', () => {
    console.log('connected to the DB');
});


const movieSchema = mongoose.Schema({
    movietitle: String,
    movieyear: Number
});

const Movie = mongoose.model('Movie', movieSchema);



const PORT = 8888;

const secret = 'qsdjS12ozehdoIJ123DJOZJLDSCqsdeffdg123ER56SDFZedhWXojqshduzaohduihqsDAqsdq';

let frenchMovies = [];

app.set('views', './views');
app.set('view engine', 'ejs');

app.use(expressJwt({secret: secret}).unless({path: ['/', '/login', '/movies', '/movie-search', '/public/style.css', new RegExp('/movies.*/', 'i'), new RegExp('/movie-details.*/', 'i')]}));

app.use('/public', express.static('public'));
// app.use(bodyParser.urlencoded({ extended: false}));



app.get('/movies', (req, res) => {

    const title = "Films français des 30 dernières années";

    frenchMovies = [];
    Movie.find((err, movies) =>{
        if (err){
            console.error('could not retrieve movies from DB');
            res.sendStatus(500);
        }else{
            frenchMovies = movies;
            res.render('movies', {movie: frenchMovies, titleEJS: title});
        }
    });  
});



var urlencodedParser = bodyParser.urlencoded({ extended: false })

// app.post('/movies', urlencodedParser, (req, res) => {

//     console.log('le titre =>> ', req.body.movietitle);
//     console.log('l\'année =>>', req.body.movieyear);

//     const newMovie = {title: req.body.movietitle,
//                     year: req.body.movieyear
//                     };

//     frenchMovies = [...frenchMovies, newMovie];
//     // ou
//     // frenchMovies.push(newMovie);
//     console.log(frenchMovies);

//      console.log(frenchMovies);

// });


app.post('/movies', upload.fields([]), (req, res) =>{

    if (!req.body)
        return res.sendStatus(500);
    else
    {
        const formData = req.body;
        console.log('formData =>>', formData);

        const title = req.body.movietitle;
        const year = req.body.movieyear;
        const myMovie = new Movie({
            movietitle: title,
            movieyear: year
        });
        myMovie.save((err, savedMovie) => {
            if (err){
                console.error(err);
                return;
            }else{
                console.log('savedMovie -->', savedMovie);
                res.sendStatus(201);
            }
        });
    }
})


app.get('/movie-search', (req, res) => {
    res.render('movie-search');
});


app.get('/login', (req, res) => {

    titleLogin = 'Espace membre';
    res.render('login', {title: titleLogin})
});


const fakeUser = {email: 'elietordjman98@gmail.com',
                password: 'elie'
                }

app.post('/login', urlencodedParser, (req, res) => {
    console.log('login post ->', req.body);   
    if (!req.body)
        return res.sendStatus(500);
    else
    {
        if (fakeUser.email === req.body.email && fakeUser.password === req.body.password)
        {
            const myToken = jwt.sign({iss: 'http://expressmovies.fr', user: 'Sam', role: 'moderator'}, secret);
            res.json(myToken);
        }
        else
        {
            res.sendStatus(401);
        }
    }
});




app.get('/movies/add', (req, res) => {
    res.send('Prochainement, un formulaire d\'ajout içi');
});


// app.get('/movies/:id', (req, res) => {
//     const id = req.params.id;
//     // res.send(`Film numéro ${id}`);

//     //movieid va permette de stocker l'id du film pour le recup sur la page ejs 
//     res.render('movie-details', {movieid: id});
// });

app.get('/movie-details/:id', (req, res) => {
    const id = req.params.id;
    Movie.findById(id, (err, movie) =>{
        console.log('movie', movie);
        res.render('movie-details', {movie: movie});
    });
});

///en vrai c'est app.put
app.post('/movie-details/:id', urlencodedParser, (req, res) => {
    console.log('req.body -->', req.body);
    if (!req.body){
        return res.sendStatus(500);
    }else{
        const id = req.params.id;
        console.log('movietitle: ', req.body.movietitle, 'movieyear: ', req.body.movieyear);      
        Movie.findByIdAndUpdate(id, {$set: {movietitle: req.body.movietitle, movieyear: req.body.movieyear}}, {new: true}, (err, movie) => {
            if (err){
                console.log(err);
                res.send('The movie could not be updated');
            }else{
                res.redirect('/movies');
            }
        });
    }
});


app.delete('/movie-details/:id', (req, res) => {
    const id = req.params.id;
    Movie.findByIdAndRemove(id, (err, movie) => {
        res.sendStatus(202); ///202 signifie une suppresion
    });
});


//a la place de mettre function (req, res) on peut faire (req, res) =>
app.get('/', (req, res) => {
    //res.send permet d'envoyer directement un petit texte alors que la methode res.render localise une template ejs creer et la renvoie

    // res.send('Hello <b>World</b> !');
    res.render('index');
});

app.get('/member-only', (req, res) => {
    console.log('req.user ->', req.user);
    res.send(req.user);
});


app.listen(PORT, () => {
    // ou bien on peut faire:
    // console.log('listening on port ' + PORT );
    console.log(`listening on port ${PORT}`);
});