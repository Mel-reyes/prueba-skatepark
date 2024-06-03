import express from 'express';
import dotenv from 'dotenv';
import exphbs from 'express-handlebars';
import expressFileUpload from 'express-fileupload';
import jwt from 'jsonwebtoken';
import path from 'path';
import { consultarUsuarios, nuevoUsuario, setUsuarioStatus, conseguirUsuario, setDatosUsuario, eliminarCuenta } from './consultas.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
dotenv.config();

const app = express();
const secretKey = 'yep';

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} and PID: ${process.pid}`);
});

// Configuraciones de paquetes
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(express.static('archivos'));

// Middleware 
app.use(expressFileUpload({
    limits: { fileSize: 5000000 },
    abortOnLimit: true,
    responseOnLimit: 'Sube otro archivo',
}));

// Definir __filename y __dirname para módulos ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


// Configurar el motor de plantillas Handlebars
const handlebars = exphbs.create({});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

// Establecer la ubicación de las vistas
app.set('views', [
    path.join(__dirname, 'views/layouts'),
    path.join(__dirname, 'views'),
]);


// Ruta raíz
app.get('/', (req, res) => {
    res.render('home');
});

// Ruta para registro
app.get('/registro', (req, res) => {
    res.render('registro');
});

// Ruta para login
app.get('/login', (req, res) => {
    res.render('login');
});

// Ruta para admin
app.get('/admin', async (req, res) => {
    try {
        const usuarios = await consultarUsuarios();
        res.render('admin', { usuarios });
    } catch (e) {
        res.status(500).json({ error: `Algo salió mal... ${e}`, code: 500 });
    }
});

// Ruta GET /usuarios
app.get('/usuarios', async (req, res) => {
    try {
        const respuesta = await consultarUsuarios();
        res.json(respuesta);
    } catch (e) {
        res.status(500).json({ error: `Algo salió mal... ${e}`, code: 500 });
    }
});

// Ruta POST /usuario
app.post('/usuario', async (req, res) => {
    const { email, nombre, password, anhos, especialidad, nombre_foto } = req.body;

    try {
        const respuesta = await nuevoUsuario(email, nombre, password, anhos, especialidad, nombre_foto);
        res.status(201).json(respuesta);
    } catch (e) {
        res.status(500).json({ error: `Algo salió mal... ${e}`, code: 500 });
    }
});

// Ruta POST /registrar
app.post('/registrar', async (req, res) => {
    const { email, nombre, password, password_2, anhos, especialidad } = req.body;
    const { foto } = req.files;

    if (password !== password_2) {
        return res.send('<script>alert("Las contraseñas no coinciden."); window.location.href = "/registro"; </script>');
    }

    try {
        const name = foto.name;
        await nuevoUsuario(email, nombre, password, anhos, especialidad, name);
        foto.mv(`${__dirname}/public/uploads/${name}`, (err) => {
            if (err) {
                throw err;
            }
            res.send('<script>alert("Se ha registrado con éxito."); window.location.href = "/login"; </script>');
        });
    } catch (e) {
        res.status(500).json({ error: `Algo salió mal... ${e}`, code: 500 });
    }
});

// Ruta PUT para cambiar estado de usuario
app.put('/usuarios', async (req, res) => {
    const { id, estado } = req.body;
    try {
        const usuario = await setUsuarioStatus(id, estado);
        res.status(200).json(usuario);
    } catch (e) {
        res.status(500).json({ error: `Algo salió mal... ${e}`, code: 500 });
    }
});

// Ruta POST para inicio de sesión
app.post('/verify', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(401).json({ error: 'Llene todos los campos', code: 401 });
    }

    try {
        const user = await conseguirUsuario(email, password);
        if (user.length === 0) {
            return res.status(404).json({ error: 'Usuario no registrado o contraseña incorrecta', code: 404 });
        }

        if (!user[0].estado) {
            return res.status(401).json({ error: 'El registro de este usuario no ha sido aprobado', code: 401 });
        }

        const token = jwt.sign({ exp: Math.floor(Date.now() / 1000) + 180, data: user }, secretKey);
        res.json({ token });
    } catch (e) {
        res.status(500).json({ error: `Algo salió mal... ${e}`, code: 500 });
    }
});

// Ruta para datos
app.get('/datos', (req, res) => {
    const { token } = req.query;
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: '401 Unauthorized', message: 'Usted no está autorizado para estar aquí', token_error: err.message });
        }

        const { email, nombre, password, anos_experiencia, especialidad } = decoded.data[0];
        res.render('datos', { email, nombre, password, anos_experiencia, especialidad });
    });
});

// Ruta PUT para cambiar datos de usuario
app.put('/datos_perfil', async (req, res) => {
    const { email, nombre, password, anhos, especialidad } = req.body;

    try {
        const usuario = await setDatosUsuario(email, nombre, password, anhos, especialidad);
        res.status(200).json(usuario);
    } catch (e) {
        res.status(500).json({ error: `Algo salió mal... ${e}`, code: 500 });
    }
});

// Ruta DELETE para eliminar cuenta
app.delete('/eliminar_cuenta/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const respuesta = await eliminarCuenta(email);
        res.status(200).json(respuesta);
    } catch (e) {
        res.status(500).json({ error: `Algo salió mal... ${e}`, code: 500 });
    }
});

export default app;
