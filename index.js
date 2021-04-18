
// configurar nodeJs

	const moment = require('moment')
	const express = require("express");
	const app = express()
	const server = require('http').Server(app);
	const io = require('socket.io')(server);
	const path = require("path");
	const body = require('body-parser')

	app.use(body.json());
	app.use(express.static(path.join(__dirname)))

// variables globales 

	let turnosMotociclistas = {}
	let usuarios = {}


// inicia turnosMotociclistas

	const hora = moment('8:00','HH:mm')
	const iniciarLista = () => {
	    for (let valor = 1; valor <= 25; valor++) {

	    	// cada turno tiene intervalo cada 30 mnts

			turnosMotociclistas[hora.format('HH:mm')] = { motos: 8 }
			hora.add('0:30', 'HH:mm')
		}
	}


// inicia sockets

	io.on('connection', function(socket){

		/* los sockets.on se activan al emitirse el socket desde el frontend y actualizan los sockets de los clientes conectados */

		socket.on('actualizarMoto', async(datos) => {
			await io.sockets.emit('actualizarMoto', datos);
		})

		socket.on('usuarios', async() => {
			await io.sockets.emit('usuarios', usuarios);
		})

	});



// llamadas api al backend

	app.get('/motos', async (req, res) => await res.send(turnosMotociclistas))


	.put('/', async (req, res) => {

		// procesa si el turno seleccionado ya se tomo devuelve 0 si esta libre 1

		try {

			const { id, nombre } = req.body
			let cantidadMotos = turnosMotociclistas[id]
			let turnoTomado = usuarios[nombre].turnosTomados[id];
			if (turnoTomado.turno == 0) {
				if (cantidadMotos.motos > 0) 
					cantidadMotos.motos -= 1
				turnoTomado.turno = 1
			} else {
				cantidadMotos.motos += 1
				turnoTomado.turno = 0
			}
			cantidadMotos = cantidadMotos.motos
			turnoTomado = turnoTomado.turno
			await res.send({ cantidadMotos, turnoTomado })

		} catch(err) {
			await res.status(201).json(); 
		}

	})


	.post('/', async (req, res) => {

		const { nombre } = req.body

		if (!usuarios[nombre]) {

			// si el usuario no existe

			let turnosTomados = {}; // se crea la lista que guarda que turnos toma el usuario

			let hora = moment('8:00','HH:mm')
		    for (let valor = 1; valor <= 25; valor++) {
				  turnosTomados[hora.format('HH:mm')] = { 'turno': 0 }
				  hora.add('0:30', 'HH:mm')
			}

			usuarios[nombre] = { nombre, turnosTomados, existe: '' }   // guardar usuario nuevo

			await io.sockets.emit('agregarUsuario', usuarios[nombre]); // se emite a los usuarios conectados que se agrego un nuevo usuario
			await res.send(usuarios[nombre])
			await res.status(201).json(); 

		} else {

			// si existe devuelve sus datos

			usuarios[nombre].existe = 'ya existe'
			await res.send(usuarios[nombre])

		}

	})


// inicia la app
iniciarLista()

server.listen(process.env.PORT || 3000, () => { /* Le decimos a nodejs que puerto le asignaran */
  console.log(`Example app listening at http://localhost:${3000}`)
})
