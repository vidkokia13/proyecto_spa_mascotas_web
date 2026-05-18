# Pet Spa — Referencia de SQL e integración con módulos futuros

Este documento muestra las queries SQL parametrizadas que el módulo de
auth ejecuta (todas viven en `src/repositories/`) y cómo se conectarán
los siguientes módulos.

## 1. Registrar usuario + cliente (transacción)

Implementado en `services/authService.js → registerCliente`.

```sql
-- 1) Insertar el usuario (rol = cliente)
INSERT INTO usuarios (id_rol, nombre, email, password_hash, estado)
VALUES ($1, $2, $3, $4, $5)
RETURNING id_usuario, id_rol, nombre, email, estado;

-- 2) Insertar el cliente vinculado
INSERT INTO clientes (
  id_usuario, telefono, direccion, ci,
  canal_notificacion, horarios_preferidos
)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id_cliente, id_usuario;

-- 3) Auditoría
INSERT INTO audit_log (id_usuario, accion, detalle, ip_address, user_agent)
VALUES ($1, 'USER_REGISTER', $2, $3, $4);
```

Las tres se ejecutan dentro de un mismo `BEGIN...COMMIT` mediante
`db.withTransaction(...)`, así que si una falla se hace `ROLLBACK` y
no quedan filas huérfanas.

## 2. Registrar usuario + trabajador (transacción)

Implementado en `services/employeeService.js → createEmployee`.

```sql
-- 1) Buscar el id del rol solicitado (trabajador | admin | jefe)
SELECT id_rol, nombre FROM roles WHERE nombre = $1 LIMIT 1;

-- 2) Insertar el usuario interno
INSERT INTO usuarios (id_rol, nombre, email, password_hash, estado)
VALUES ($1, $2, $3, $4, 'activo')
RETURNING id_usuario, id_rol, nombre, email, estado;

-- 3) Insertar el trabajador
INSERT INTO trabajadores (
  id_usuario, sueldo_mensual, activo, turno,
  telefono, especialidad, capacidad_simultanea
)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING id_trabajador, id_usuario;

-- 4) Auditoría
INSERT INTO audit_log (id_usuario, accion, detalle, ip_address, user_agent)
VALUES ($1, 'EMPLOYEE_CREATE', $2, $3, $4);
```

## 3. Buscar usuario por email (login)

```sql
SELECT u.id_usuario,
       u.id_rol,
       r.nombre AS rol,
       u.nombre,
       u.email,
       u.password_hash,
       u.estado,
       u.two_factor_enabled,
       u.ultimo_acceso
  FROM usuarios u
  JOIN roles r ON r.id_rol = u.id_rol
 WHERE LOWER(u.email) = LOWER($1)
 LIMIT 1;
```

Ya viene con el JOIN al rol, así no hace falta una segunda query
para incluirlo en el JWT.

## 4. Cargar perfil completo (id_cliente / id_trabajador) para el JWT

```sql
SELECT u.id_usuario,
       u.id_rol,
       r.nombre AS rol,
       u.nombre,
       u.email,
       u.estado,
       c.id_cliente,
       t.id_trabajador
  FROM usuarios u
  JOIN roles r ON r.id_rol = u.id_rol
  LEFT JOIN clientes     c ON c.id_usuario = u.id_usuario
  LEFT JOIN trabajadores t ON t.id_usuario = u.id_usuario
 WHERE u.id_usuario = $1
 LIMIT 1;
```

Este es el truco que permite que **el módulo de citas/grooming/caja**
no tenga que volver a la BD para saber si el usuario logueado es un
cliente o un trabajador: ya lo recibió en el JWT.

## 5. Actualizar último acceso

```sql
UPDATE usuarios
   SET ultimo_acceso     = NOW(),
       ip_ultimo_acceso  = $2,
       user_agent        = $3
 WHERE id_usuario = $1;
```

Se ejecuta tras un login exitoso desde `authService.login`. No
bloquea la respuesta: si falla, se loguea un warning pero el usuario
recibe el token igual.

## 6. Listado de empleados

```sql
SELECT u.id_usuario,
       u.nombre,
       u.email,
       u.estado,
       r.nombre AS rol,
       t.id_trabajador,
       t.turno,
       t.especialidad,
       t.activo,
       t.telefono,
       t.sueldo_mensual,
       t.capacidad_simultanea
  FROM trabajadores t
  JOIN usuarios u ON u.id_usuario = t.id_usuario
  JOIN roles    r ON r.id_rol = u.id_rol
 ORDER BY u.nombre ASC;
```

---

## 7. Ejemplos de uso de la API

### 7.1. Auto-registro de cliente

```http
POST /api/auth/register
Content-Type: application/json

{
  "nombre": "Ana Pérez",
  "email": "ana@example.com",
  "password": "Pet$pa2024",
  "telefono": "+591 70011223",
  "ci": "1234567",
  "direccion": "Av. Siempre Viva 123",
  "canalNotificacion": "email"
}
```

**201 Created**
```json
{
  "message": "Cuenta creada. Revisá tu correo para activarla.",
  "user": {
    "id_usuario": "0d7c...uuid",
    "id_cliente": "8a2f...uuid",
    "nombre": "Ana Pérez",
    "email": "ana@example.com",
    "estado": "activo",
    "rol": "cliente"
  }
}
```

### 7.2. Login

```http
POST /api/auth/login
Content-Type: application/json

{ "email": "ana@example.com", "password": "Pet$pa2024" }
```

**200 OK**
```json
{
  "token": "eyJhbGciOi...",
  "user": {
    "id_usuario": "0d7c...",
    "nombre": "Ana Pérez",
    "email": "ana@example.com",
    "rol": "cliente",
    "id_cliente": "8a2f...",
    "id_trabajador": null
  }
}
```

### 7.3. Crear empleado (admin/jefe)

```http
POST /api/empleados
Authorization: Bearer <token-admin-o-jefe>
Content-Type: application/json

{
  "nombre": "Luis Vargas",
  "email": "luis@petspa.com",
  "password": "Trabaj0!Seguro",
  "rol": "trabajador",
  "turno": "mañana",
  "especialidad": "grooming canino",
  "telefono": "+591 71112233",
  "sueldoMensual": 3500.00,
  "capacidadSimultanea": 2
}
```

### 7.4. Inactivar empleado

```http
PATCH /api/empleados/<id_usuario>
Authorization: Bearer <token-admin-o-jefe>
Content-Type: application/json

{ "estado": "inactivo", "activo": false }
```

---

## 8. Cómo se conectarán los módulos siguientes

### Módulo de citas / grooming
- Las rutas que reserva un cliente usarán `req.user.id_cliente` (lo entrega el JWT).
- Las rutas que ejecuta un trabajador usarán `req.user.id_trabajador`.
- La protección por rol será, por ejemplo:
  ```js
  router.post('/citas', authRequired, requireRole('cliente'), ...);
  router.patch('/grooming/:id/finalizar',
    authRequired, requireRole('trabajador', 'admin', 'jefe'), ...);
  ```

### Módulo de caja / transacciones
- Cada movimiento de caja registrará `id_usuario` (de `req.user`) como
  "registrado por".
- `services/auditService.log()` ya está pensado para reusarse:
  ```js
  await auditService.log({
    idUsuario: req.user.id_usuario,
    accion: 'CASH_OPEN',
    detalle: `Apertura de caja con saldo=${saldo}`,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });
  ```

### Módulo de inventario / pedidos
- Mismas protecciones RBAC. La capa de servicios sigue el mismo patrón:
  controller → service (transacción) → repository (SQL parametrizado).
