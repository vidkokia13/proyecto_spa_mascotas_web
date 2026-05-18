# Pet Spa — Backend (Módulo de Autenticación y Usuarios)

Backend del sistema **Pet Spa** (spa de mascotas + tienda de accesorios). Este repositorio contiene únicamente el primer módulo: **Autenticación, Gestión de Usuarios y RBAC**, diseñado para integrarse después con los módulos de citas, grooming, inventario y caja.

## 🛠 Stack

- **Node.js** (LTS 20+)
- **Express** 4
- **PostgreSQL** (BD: `pet_spa`) accedida con `pg` y SQL parametrizado
- **bcrypt** para hash de contraseñas
- **jsonwebtoken** para JWT
- **nodemailer** + Mailtrap para correos
- **winston** como logger
- **Joi** para validación de payloads
- **helmet**, **cors**, **express-rate-limit** para seguridad

> Se eligió `pg` con SQL parametrizado en lugar de un ORM porque la BD ya está diseñada profesionalmente en PostgreSQL y queremos control total sobre las queries (mejor rendimiento, transparencia y aprovechamiento de UUID/triggers existentes). Es trivial migrar a Prisma más adelante si se desea.

## 📁 Estructura del proyecto

```
pet-spa-backend/
├── src/
│   ├── config/
│   │   ├── db.js              # Pool de conexiones PostgreSQL
│   │   ├── env.js             # Carga y valida variables de entorno
│   │   ├── logger.js          # Logger winston centralizado
│   │   └── mail.js            # Transporter de nodemailer (Mailtrap)
│   ├── routes/
│   │   ├── index.js           # Agrupa todas las rutas bajo /api
│   │   ├── authRoutes.js      # /api/auth/*
│   │   └── employeeRoutes.js  # /api/empleados/*
│   ├── controllers/
│   │   ├── authController.js
│   │   └── employeeController.js
│   ├── services/
│   │   ├── authService.js     # Lógica de registro/login
│   │   ├── employeeService.js # Lógica de gestión de empleados
│   │   ├── auditService.js    # Inserción en audit_log
│   │   └── mailService.js     # Envío de correos (activación, etc.)
│   ├── repositories/
│   │   ├── userRepository.js
│   │   ├── clientRepository.js
│   │   ├── workerRepository.js
│   │   ├── roleRepository.js
│   │   └── auditRepository.js
│   ├── middlewares/
│   │   ├── authRequired.js    # Verifica JWT y adjunta req.user
│   │   ├── requireRole.js     # RBAC por rol
│   │   ├── validate.js        # Valida body/params con Joi
│   │   └── errorHandler.js    # Manejo centralizado de errores
│   ├── utils/
│   │   ├── password.js        # hash / compare con bcrypt
│   │   ├── jwt.js             # sign / verify
│   │   ├── AppError.js        # Clase de error operacional
│   │   └── asyncHandler.js    # Wrapper try/catch async
│   ├── validators/
│   │   ├── authValidators.js
│   │   └── employeeValidators.js
│   ├── app.js                 # Configura Express (middlewares, rutas, errores)
│   └── server.js              # Punto de entrada — levanta el servidor
├── sql/
│   ├── 01_audit_log.sql       # Crea tabla audit_log si no existe
│   └── 02_seed_roles.sql      # Inserta roles base
├── .env.example               # Plantilla de variables de entorno
├── .gitignore
├── package.json
└── README.md
```

### Responsabilidades por capa

| Capa | Responsabilidad |
|---|---|
| **routes** | Define rutas HTTP, aplica middlewares de auth/validación, delega al controller. |
| **controllers** | Lee `req`, llama al service, formatea la respuesta HTTP. **Sin lógica de negocio.** |
| **services** | Reglas de negocio: orquesta repositorios, transacciones, llamadas a mail/audit. |
| **repositories** | Acceso a datos: SQL parametrizado puro contra PostgreSQL. |
| **middlewares** | Auth, RBAC, validación, manejo de errores. |
| **utils** | Helpers reutilizables sin estado (hash, JWT, errores). |
| **config** | Conexiones, variables de entorno, logger, mailer. |

## 🚀 Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar plantilla de entorno y completar
cp .env.example .env
# editar .env con tus credenciales

# 3. Ejecutar scripts SQL auxiliares (audit_log y roles)
psql -U postgres -d pet_spa -f sql/01_audit_log.sql
psql -U postgres -d pet_spa -f sql/02_seed_roles.sql

# 4. Levantar en desarrollo
npm run dev

# 5. Levantar en producción
npm start
```

## 🔐 Endpoints

### Autenticación (públicos)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/register` | Auto-registro de cliente |
| POST | `/api/auth/login` | Login con email + password |
| GET | `/api/auth/me` | Datos del usuario autenticado *(requiere JWT)* |

### Empleados (admin / jefe)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/empleados` | Crear empleado (trabajador, admin o jefe) |
| GET | `/api/empleados` | Listar empleados |
| GET | `/api/empleados/:id` | Detalle de empleado |
| PATCH | `/api/empleados/:id` | Actualizar estado / turno / especialidad |

## 🔌 Puntos de integración futura

- **Citas / Grooming**: usarán `id_cliente` (de `clientes`) y `id_trabajador` (de `trabajadores`). El JWT ya incluye ambos cuando aplican, así que las rutas de citas podrán autorizar al cliente que reserva o al trabajador asignado sin queries extra.
- **Caja / Transacciones**: cada movimiento puede usar `id_usuario` del JWT como "registrado por", y `audit_log` ya queda lista para registrar cualquier acción sensible. El servicio `auditService.log()` es reutilizable desde cualquier módulo.
- **Inventario**: las rutas de admin/jefe se protegerán con el mismo `requireRole(['admin','jefe'])`.

## 🛡 Seguridad implementada

- Contraseñas hasheadas con **bcrypt** (cost 12).
- **Política de password**: mín. 8 caracteres con mayúsculas, minúsculas, números y símbolos.
- **JWT** firmado con secreto en `.env`, expiración configurable.
- **SQL parametrizado** en todas las queries — sin concatenación.
- **helmet** + **CORS** restrictivo + **rate limiting** en `/api/auth/*`.
- **audit_log** para crear/modificar usuarios y empleados.
- Errores genéricos en login (no revelan si el email existe).
- Estructura preparada para extender a bloqueo tras N intentos y 2FA (campos ya existen en `usuarios`).
