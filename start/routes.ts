/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/

import Route from '@ioc:Adonis/Core/Route'

Route.get('/', async () => {
  return { hello: 'world' }
})
Route.post('/todos', 'TodosController.store')
Route.post('/compras', 'TodosController.comprar')
Route.post('/pagos', 'TodosController.pagos')
Route.get('/estu', 'TodosController.index')
Route.get('/buscar', 'TodosController.searchStudent')
Route.get('/listarL', 'TodosController.listarlibros')
Route.get('/listarstock', 'TodosController.listarLibrosEnStockMenorA10')
Route.get('/buscarlibro', 'TodosController.buscarLibros')
Route.get('/TipoEstudiante', 'TodosController.TipoEst')

Route.post('/Ventas', 'TodosController.guardarVenta')

/////////////////////
Route.post('/Notas', 'NotasController.store')

Route.get('/AllNotas', 'NotasController.getNotas')

Route.get('/notas/:id', 'NotasController.showLibro')
Route.get('/notasfilial/:id', 'NotasController.showFilial')
Route.get('/notasestu/', 'NotasController.showEstu')
Route.any('/options', 'NotasController.options');
Route.get('/Idnotas/:libroId', 'NotasController.getNotasPorLibroID')
///PROMDEIO TRES 
Route.get('/promedio', 'NotasController.getNotasPRODIO')
/// TODOS LOS REPROBADOS 
Route.get('/reprobados', 'NotasController.getNotasReprobadas')

Route.get('/Cantidadreprobados', 'NotasController.getCantidadReprobados')
//
Route.get('/Promedios', 'NotasController.getPromediosParaGrafico')
///
Route.get('/Firmas', 'NotasController.firmas')

Route.post('/PreInscripcion', 'TodosController.register')
