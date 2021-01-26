
//	definir host del backend

	//const url = 'https://prueba-holanda-motos.herokuapp.com/'
	const socket = io.connect();

	//const url = 'https://prueba-holanda-motos.herokuapp.com/'
	//const socket = io.connect('https://prueba-holanda-motos.herokuapp.com', { 'forceNew': true });


//	variables globales

	const ul = document.querySelector('#turnos')
	const info = document.querySelector('#info')
	let usuario = {}


//	crear turnos y botones

const iniciarTurnosMotos = async () => {

	//ul.style.display = 'none'

	info.style.display = 'none'
	const horarios = await axios.get('/motos')

	Object.keys(horarios.data).forEach(hora => {

		// crea elemento de lista y boton

		const li = document.createElement("li");
		const btn = document.createElement("button");
		const texto = document.createTextNode(hora);
		const textoBtn = document.createTextNode(horarios.data[hora].motos);

		// agregar al elemento el texto y boton

		btn.id = hora // agrega hora como id
		btn.appendChild(textoBtn);
		li.appendChild(texto);
		li.appendChild(btn);
		ul.appendChild(li);

	})

	//	convierto a array todo los elementos button del html
	const btns = Array.from(document.querySelectorAll('button'));
	
	for (let i = 1; i < btns.length; i++) { // Empieza en 1 porque el 1er botón es del formIniciar

		// recorro el array de los botones y les agrego funcion

		const btn = btns[i];
		color(btn)

		btn.onclick = async function(){
 
		//	al dar click cambia el turno en el arreglo del usuario 
		//	restara uno a la cantidad de motociclistas de ese turno si el usuario toma el motociclista
		//	sumara uno a la cantidad de motociclistas de ese turno si el usuario ya habia tomado el motociclista
		
			const id = btn.id;

			await axios.put('/', { id, nombre: usuario.nombre }).then( async res => {

				const { turnoTomado, cantidadMotos } = res.data
				usuario.turnosTomados[id].turno = turnoTomado
				renderizarListaTurnos()
				btn.innerHTML = cantidadMotos
				await socket.emit('actualizarMoto', { id, cantidadMotos }) // Emite el socket al backend, llama al socket
				color(btn)

			})

		};
	}

}

//	pinta boton 

	function color(btn){
		if (btn.innerHTML == 0) {
			btn.style.background = 'red'
		} else {
			btn.style.background = 'lightgreen'
		}
	}


//	gif para la imagen

	async function buscarGif() {

		const img = document.querySelector('img')
		const gif = await axios.get('https://api.giphy.com/v1/gifs/search?q=moto&api_key=dIJrma20pSU6ymMwWnDbiaT7NFHeAGVa&limit=7')
		const nRamdon = Math.floor(Math.random(10) * 7)
		img.src = gif.data.data[nRamdon].images.preview_gif.url

	}


//	Emite el socket desde el backend, es llamado por el socket emitido

	socket.on('actualizarMoto', (datos) => {

		/* Busca el boton con hora como id  */

		const { id, cantidadMotos } = datos
		const btn = document.getElementById(id)
		btn.innerHTML = cantidadMotos

	});


//  renderizar lista usuarios

	socket.emit('usuarios'); // Emite el socket al backend
	socket.on('usuarios', (usuarios) => { // Emite el socket desde el backend, es llamado por el socket

		const ul = document.querySelector('#usuarios')
		ul.innerHTML = ''

		Object.keys(usuarios).forEach(usuario => {

			const li = document.createElement("li");
			const texto = document.createTextNode(usuario);
			li.appendChild(texto);
			ul.appendChild(li);

		})

	});


//	Agregar al usuario en tiempo real

	const formIniciar = document.querySelector('#formIniciar');
	const inputNombre = document.querySelector('#nombre');

	formIniciar.addEventListener('submit', async (e) => {

		e.preventDefault(); // este evento evita recargar página

		const request = await axios.post('/', { nombre: inputNombre.value }) // agregamos al backend el usuario

		/*	el request pide los datos de el usuario al backend
			si existe devuelve sus datos como la lista de turnos que ha tomado
		 	si no existe se crea uno nuevo	*/

		if (request.data.existe == 'ya existe') document.getElementById('msjBienvenido').innerHTML = 'Bienvenido de nuevo';
		else document.getElementById('msjBienvenido').innerHTML = 'Bienvenido usuario';

		usuario = { turnosTomados, nombre } = request.data
		info.style.display = 'block'
		document.querySelector('#nombreUsuario').innerHTML = nombre
		formIniciar.style.display = 'none'
		formIniciar.reset()
		renderizarListaTurnos()

	})


//  Emite el nuevo usuario

	socket.on('agregarUsuario', (usuario) => {
		const ul = document.querySelector('#usuarios')
		const li = document.createElement("li");
		const texto = document.createTextNode(usuario.nombre);
		li.appendChild(texto);
		ul.appendChild(li);
	})


//	Turnos de usuario

	const listaUsuario = document.querySelector('#turnosUsuario')
	function renderizarListaTurnos() {
		listaUsuario.innerHTML = ''
		Object.keys(usuario.turnosTomados).forEach(turno => {
			if (usuario.turnosTomados[turno].turno == 1) {
				const li = document.createElement("li");
				const texto = document.createTextNode(turno);
				li.appendChild(texto);
				listaUsuario.appendChild(li);
			}
		})
	}


/*	iniciar la app	*/

iniciarTurnosMotos()
buscarGif()