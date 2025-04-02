const express = require('express');
const app = express();
exports.app = app;
const crypto = require('node:crypto')
const movies = require('./movies.json');
const { validateMovie, validatePartialMovie } = require('./schema/movie');

const path = require('path');
app.use(express.static(path.join(__dirname, 'web')))

//métodos normales: GET/HEAD/POST
//métodos complejos: PUT/PATCH/DELETE

//CORS PRE-Flight
//OPTIONS


const port = process.env.PORT ?? 1234

app.disable('x-powered-by')//deshabilitar el header x-powered-By: Express

//middleware
app.use(express.json())

app.get('/', (req, res)=>{
    
    res.json({message: 'Hello world'})
})

const ACCEPTED_ORIGINS = [
    'http://localhost:8080',
    'http://localhost:1234',
    'http://localhost:3000',
    'http://movies.com',
    'https://movies-api-fbrp.onrender.com/'
]

app.get('/movies',(req,res)=>{

    const origin= req.header('origin')//obtenemos el origen del cliente que está haciendo la solicitud (por ejemplo, http://localhost:1234).
   if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    
       res.header('Access-Control-Allow-Origin', origin) //añade el header para que permita al cliente el ingreso
   }

    const {genre}= req.query //recuperamos el genero desde la query
    if (genre) {
        const filterMovies = movies.filter(movie=> movie.genre.some(g=>g.toLowerCase()=== genre.toLowerCase()))
        return res.json(filterMovies)
    }
    res.json(movies)
})


app.get('/movies/:id', (req, res)=>{ //path-tp-regex
    const {id} =req.params
    const movie = movies.find(movie=>movie.id===id)
    if (movie) return res.json(movie)

        res.status(404).json({message: 'Movie not found'})
})

app.post('/movies',(req,res)=>{

   const result = validateMovie(req.body)

   if (!result.success) {
    return res.status(400).json({error: JSON.parse(result.error.message)})
   }
    const newMovie={
        id: crypto.randomUUID(),
        ...result.data
    }

    //ESTO NO SERIA REST PORQUE ESTAMOS GUARDANDO EL ESTADO EN LA APLICACIÓN EN MEMORIA
    movies.push(newMovie)

    res.status(201).json(newMovie)
})

app.patch('/movies/:id', (req, res)=>{
    const result = validatePartialMovie(req.body)//está aplicando la función de movie al cuerpo ?
    
    if (!result.success) {
        res.status(400).json({error: JSON.parse(result.error.message)})
    }
    
    const {id} = req.params
    const movieIndex = movies.findIndex(movie=>movie.id === id)
    
    if (movieIndex === -1) {
       return res.status(404).json({message: 'Movie not found'})
    }

    const updateMovie = {
       ...movies[movieIndex],
       ...result.data
    }

    movies[movieIndex]=updateMovie

    return res.json(updateMovie)
    
    
})
app.options('/movies/:id',(req,res)=>{
    const origin= req.header('origin')
    if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
     
        res.header('Access-Control-Allow-Origin', origin)
        res.header('Access-Control-Allow-Methods', 'GET, POST,PUT, PATCH, DELETE')
    }
 res.send(200)
})


app.delete('/movies/:id',(req, res)=>{

    const origin= req.header('origin')
   if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    
       res.header('Access-Control-Allow-Origin', origin)
   }


    const {id}= req.params
    const movieIndex = movies.findIndex(movie=>movie.id===id)
//finIndex filtrará el primer elemento que coincida con la bsuqueda
    if (movieIndex === -1) {
        return res.status(404).json({message:'Movie not found'})
    }
 
    movies.splice(movieIndex, 1)

    return res.json({message:'Movie deleted'})
})


//inicia el servidor
app.listen(port, ()=>{
    console.log(`Server listen on port http://localhost:${port}`)
})