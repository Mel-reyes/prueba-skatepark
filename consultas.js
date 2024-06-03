import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    user: "melireyes",
    password: "1234",
    host: "localhost",
    database: "skatepark",
    port: 5432,
});

// consultar todos los usuarios
async function consultarUsuarios() {
    try {
        const result = await pool.query('SELECT * FROM skaters');
        return result.rows;
    } catch (e) {
        console.error('Error al consultar usuarios:', e);
        throw e;
    }
}

// ingresar un nuevo usuario
async function nuevoUsuario(email, nombre, password, anhos, especialidad, foto) {
    const query = `
        INSERT INTO skaters (email, nombre, password, anos_experiencia, especialidad, foto, estado)
        VALUES ($1, $2, $3, $4, $5, $6, false)
        RETURNING *
    `;
    const values = [email, nombre, password, anhos, especialidad, foto];

    try {
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch (e) {
        console.error('Error al crear un nuevo usuario:', e);
        throw e;
    }
}

// cambiar el estado de un usuario
async function setUsuarioStatus(id, estado) {
    const query = 'UPDATE skaters SET estado = $1 WHERE id = $2 RETURNING *';
    const values = [estado, id];

    try {
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch (e) {
        console.error('Error al actualizar el estado del usuario:', e);
        throw e;
    }
}

// solicitar email y password de usuario
 async function conseguirUsuario(email, password) {
    const query = 'SELECT * FROM skaters WHERE email = $1 AND password = $2';
    const values = [email, password];

    try {
        const result = await pool.query(query, values);
        return result.rows;
    } catch (e) {
        console.error('Error al conseguir usuario:', e);
        throw e;
    }
}

// editar datos de usuario
 async function setDatosUsuario(email, nombre, password, anhos, especialidad) {
    const query = `
        UPDATE skaters SET 
            nombre = $1,
            password = $2,
            anos_experiencia = $3,
            especialidad = $4
        WHERE email = $5
        RETURNING *
    `;
    const values = [nombre, password, anhos, especialidad, email];

    try {
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch (e) {
        console.error('Error al actualizar los datos del usuario:', e);
        throw e;
    }
}

// eliminar cuenta
async function eliminarCuenta(email) {
    const query = 'DELETE FROM skaters WHERE email = $1';
    const values = [email];

    try {
        const result = await pool.query(query, values);
        return result.rowCount;
    } catch (e) {
        console.error('Error al eliminar cuenta:', e);
        throw e;
    }
}

// Exportar las funciones
export {
    consultarUsuarios,
    nuevoUsuario,
    setUsuarioStatus,
    conseguirUsuario,
    setDatosUsuario,
    eliminarCuenta
};









