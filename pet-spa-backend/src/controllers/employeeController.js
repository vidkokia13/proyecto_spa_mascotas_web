/**
 * controllers/employeeController.js
 * ---------------------------------
 */
'use strict';

const employeeService = require('../services/employeeService');

function getCtx(req) {
  return {
    ip: req.ip,
    userAgent: req.headers['user-agent'] || null,
  };
}

async function create(req, res) {
  const employee = await employeeService.createEmployee(req.body, req.user, getCtx(req));
  res.status(201).json({ employee });
}

async function list(_req, res) {
  const employees = await employeeService.listEmployees();
  res.json({ employees });
}

async function getOne(req, res) {
  const employee = await employeeService.getEmployee(req.params.id);
  res.json({ employee });
}

async function update(req, res) {
  const employee = await employeeService.updateEmployee(
    req.params.id,
    req.body,
    req.user,
    getCtx(req),
  );
  res.json({ employee });
}

module.exports = { create, list, getOne, update };
