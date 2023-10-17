import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { prisma } from '@ioc:Adonis/Addons/Prisma'
const { DateTime } = require('luxon');


export default class TodosController {
  public async register({ request, response }: HttpContextContract) {
    try {
      // Obtén los datos del cuerpo de la solicitud
      const data = request.only([
        'nombre',
        'apellidoPaterno',
        'apellidoMaterno',
        'cedula',
        'expedicion',
        'email',
        'celular',
        'telefono',
      ]);

      // Crea un nuevo registro en la base de datos utilizando Prisma
      const user = await prisma.preInscripcion.create({
        data: {
          nombre: data.nombre,
          apellidoPaterno: data.apellidoPaterno,
          apellidoMaterno: data.apellidoMaterno,
          cedula: data.cedula,
          expedicion: data.expedicion,
          email: data.email,
          celular: data.celular,
          telefono: data.telefono,
        },
      });

      // Responde con el registro creado y un código de estado 201 (Created)
      return response.status(201).json(user);
    } catch (error) {
      // En caso de error, responde con un código de estado 500 (Internal Server Error)
      return response.status(500).json({ message: 'Internal server error' });
    }
  }

  public async TipoEst({ response }) {
    try {
      const datos = await prisma.tiposEstudiante.findMany()
      return response.status(200).json(datos)
    } catch (error) {
      console.error(error)
      return response.status(500).json({ message: 'Error al obtener los datos' })
    }
  }
  public async store({ request, response }: HttpContextContract) {
    const data = request.only([
      'nombre',
      'codigo',
      'categoria',
      'proveedor',
      'stock',
      'precio',
      'fecha',
      
    ]) 
    const fecha = new Date(data.fecha).toISOString()
    try {
      const libro = await prisma.biblioteca.create({
        data: {
          nombre: data.nombre,
          codigo: data.codigo,
          categoria: data.categoria,
          proveedor: data.proveedor,
          stock: data.stock,
          precio: data.precio,
          fecha: fecha,
          
        },
      })

      return response.created({
        message: 'Registro creado exitosamente',
        payload: {
          data: libro,
        },
      })
    } catch (error) {
      console.error(error) // Log the error message and stack trace
      return response.badRequest({
        message: 'Error al crear el registro',
      })
    }
  }
  public async comprar({ request, response }) {
    try {
      const data = request.only([
        'nombre',
        'apellidoPaterno',
        'apellidoMaterno',
        'email',
        'cedula',
        'cedulaComplemento', 
        'celular',
        'nombreL',
        'codigoL',
        'categoriaL',
        'precioL',
        'cantidadL',
        'total',
      ]);

      data.fechaCompra = new Date(); // Fecha actual

      const nuevaCompra = await prisma.compras.create({
        data,
      });

      return response.status(201).json(nuevaCompra);
    } catch (error) {
      console.error(error);
      return response.status(500).json({ message: 'Error al crear la compra' });
    }
  }
   public async comprarAB({ request, response }) {
    try {

      const formData = request.only([
        'nombre',
        'apellidoPaterno',
        'apellidoMaterno',
        'email',
        'cedula',
        'cedulaComplemento',
        'celular',
      ]);

      const libroData = request.only([
        'nombreL',
        'codigoL',
        'categoriaL',
        'precioL',
        'cantidadL',
        'total',
        'fechaCompra',
      ]);

      const libro = await prisma.biblioteca.findUnique({
        where: { id: libroData.codigoL }, // Use the correct field name
      });
      if (!libro) {
        return response.notFound({
          message: 'Libro no encontrado',
        });
      }
      if (libro.stock < libroData.cantidadL) {
        return response.badRequest({
          message: 'No hay suficiente stock disponible para este libro',
        });
      }

      const total = libroData.precioL * libroData.cantidadL;

      const compra = await prisma.compras.create({
        data: {
          ...formData,
          nombreL: libroData.nombreL,
          codigoL: libroData.codigoL,
          categoriaL: libroData.categoriaL,
          precioL: libroData.precioL,
          cantidadL: libroData.cantidadL,
          total,
          fechaCompra: new Date().toISOString(),
        },
      });

      await prisma.biblioteca.update({
        where: { id: libro.id },
        data: { stock: libro.stock - libroData.cantidadL },
      });

      return response.created({
        message: 'Compra realizada exitosamente',
        payload: {
          data: compra,
        },
      });
    } catch (error) {
      console.error(error);
      return response.internalServerError({
        message: 'Error al realizar la compra',
      });
    }
  }
  
  public async  listarlibros({ response }: HttpContextContract) {
    try {
      const libros = await prisma.biblioteca.findMany();
      
      return response.ok({
        message: 'Lista de libros obtenida exitosamente',
        payload: {
          data: libros,
        },
      });
    } catch (error) {
      console.error(error);
      return response.badRequest({
        message: 'Error al obtener la lista de libros',
      });
    }
  }
  public async StockMenorA10({ response }: HttpContextContract) {
    try {
      const libros = await prisma.biblioteca.findMany({
        where: {
          stock: {
            lt: 10, // "lt" significa "menor que"
          },
        },
      });
  
      return response.ok({
        message: 'Lista de libros en stock menor a 10 obtenida exitosamente',
        payload: {
          data: libros,
        },
      });
    } catch (error) {
      console.error(error);
      return response.badRequest({
        message: 'Error al obtener la lista de libros en stock menor a 10',
      });
    }
  }
  
  public async buscarLibros({ request, response }: HttpContextContract) {
    try {
      const { nombre, categoria } = request.qs();
  
      const libros = await prisma.biblioteca.findMany({
        where: {
          nombre: { contains: nombre || '' },
          categoria: { equals: categoria || '' },
        },
      });
  
      return response.ok({
        message: 'Lista de libros obtenida exitosamente',
        payload: {
          data: libros,
        },
      });
    } catch (error) {
      console.error(error);
      return response.badRequest({
        message: 'Error al obtener la lista de libros',
      });
    }
  }
  
  

  public async comprarA({ request, response }: HttpContextContract) {
    try {
      const EstudianteId = request.input('EstudianteId');
      const libroId = request.input('libroId');
      const book = await prisma.biblioteca.findUnique({
        where: { id: libroId },
      });
      if (!book) {
        return response.notFound({
          message: 'Libro no encontrado',
        });
      }
      if (book.stock <= 0) {
        return response.badRequest({
          message: 'No hay stock disponible para este libro',
        });
      }
      const purchase = await prisma.compras.create({
        data: {
          EstudianteId,
          libroId,
          precio: book.precio,
          fechaCompra: new Date().toISOString(),
        },
      });
      await prisma.biblioteca.update({
        where: { id: libroId },
        data: { stock: book.stock - 1 },
      });

      return response.created({
        message: 'Compra realizada exitosamente',
        payload: {
          data: purchase,
        },
      });
    } catch (error) {
      console.error(error);
      return response.internalServerError({
        message: 'Error al realizar la compra',
      });
    }
  }
  public async comprara({ request, response }) {
    try {
     

      const formData = request.only([
        'nombre',
        'apellidoPaterno',
        'apellidoMaterno',
        'email',
        'cedula',
        'cedulaComplemento',
      ]);

      const libroData = request.only([
        'nombres',
        'codigo',
        'categoria',
        'precio',
        'cantidad',
        'total',
      ]);

      const libro = await prisma.biblioteca.findUnique({
        where: { id: libroData.id }, // Use the appropriate field name here
      });

      if (!libro) {
        return response.notFound({
          message: 'Libro no encontrado',
        });
      }
      if (libro.stock < libroData.cantidad) {
        return response.badRequest({
          message: 'No hay suficiente stock disponible para este libro',
        });
      }

      const transaction = await prisma.$transaction([
        prisma.compras.create({
          data: {
            ...formData,
            libroId: libro.id,
            fechaCompra: new Date().toISOString(),
          },
        }),
        prisma.biblioteca.update({
          where: { id: libro.id },
          data: { stock: libro.stock - libroData.cantidad },
        }),
      ]);

      return response.created({
        message: 'Compra realizada exitosamente',
        payload: {
          data: transaction[0],
        },
      });
    } catch (error) {
      console.error(error);
      return response.internalServerError({
        message: 'Error al realizar la compra',
      });
    }
  }
  public async guardarVenta({ request, response }) {
    try {
      const {
        
        codigo,
        cantidad
        
      } = request.only([
       
        'codigo',
        'cantidad',
        
      ]);

      // Calcula el total de la venta
     /// const total = precio * cantidad;

      // Crea la venta en la base de datos utilizando Prisma
      const venta = await prisma.ventas.create({
        data: {
         
          codigo,
          cantidad,
          
          createdAt: DateTime.now().toJSDate(),
        },
      });

      const libroVendido = await prisma.biblioteca.findFirst({
        where: {
          codigo: codigo, // Reemplaza 'codigo' con el campo que identifica el libro vendido
        },
      });

      if (libroVendido) {
        const nuevoStock = libroVendido.stock - cantidad;
        
        if (nuevoStock <= 0) {
          throw new Error('No hay libros disponibles en stock');
        }

        await prisma.biblioteca.update({
          where: {
            id: libroVendido.id,
          },
          data: {
            stock: nuevoStock,
          },
        });
      } else {
        throw new Error('Libro no encontrado');
      }

      return response.status(201).json({ message: 'Venta creada exitosamente', data: venta });
    } catch (error) {
      return response.status(500).json({ message: 'Ocurrió un error al crear la venta', error: error.message });
    }
  }
 

  public async index({ response }: HttpContextContract) {
    try {
      // Fetch all records from the 'estudiante' table along with their related personas
      const estudiantes = await prisma.estudiante.findMany({
        include: {
          persona: true,
        },
      });
  
      const cantidadEstudiantes = estudiantes.length; // Agregar esta línea
  
      return response.ok({
        message: 'Estudiantes listados correctamente',
        payload: {
          data: estudiantes,
          total: cantidadEstudiantes, // Agregar esta línea
        },
      });
    } catch (error) {
      console.error(error);
      return response.internalServerError({
        message: 'Error al listar estudiantes',
      });
    }
  }
  public async searchStudent({ request, response }: HttpContextContract) {
    try {
      const { matricula, nombre } = request.qs();
  
      // Fetch records from the 'estudiante' table based on matrícula and/or nombre
      let estudiantes;
      if (matricula && nombre) {
        estudiantes = await prisma.estudiante.findMany({
          include: {
            persona: true,
          },
          where: {
            matricula: matricula,
            persona: {
              nombre: nombre,
            },
          },
        });
      } else if (matricula) {
        estudiantes = await prisma.estudiante.findMany({
          include: {
            persona: true,
          },
          where: {
            matricula: matricula,
          },
        });
      } else if (nombre) {
        estudiantes = await prisma.estudiante.findMany({
          include: {
            persona: true,
          },
          where: {
            persona: {
              nombre: nombre,
            },
          },
        });
      } else {
        return response.badRequest({
          message: 'Por favor proporciona al menos la matrícula o el nombre del estudiante.',
        });
      }
  
      if (estudiantes.length === 0) {
        return response.notFound({
          message: 'No se encontraron estudiantes con los criterios proporcionados.',
        });
      }
  
      return response.ok({
        message: 'Estudiantes encontrados correctamente',
        payload: {
          data: estudiantes,
        },
      });
    } catch (error) {
      console.error(error);
      return response.internalServerError({
        message: 'Error al buscar estudiantes',
      });
    }
  }
  

  public async pagos({ request, response }: HttpContextContract) {
    try {
      const data = request.only([
        'EstudianteId',
        'fechaLimite',
        'fechaPago',
        'estadoPago',
        'descuento',
        'Monto',
        'Plataforma',
      ]);
      const pago = await prisma.pagosMens.create({ data });
      return response.created({
        message: 'Pago mensual creado exitosamente',
        payload: {
          data: pago,
        }, 
      });
    } catch (error) {
      console.error(error);
      return response.internalServerError({
        message: 'Error al crear el pago mensual',
      });
    }
  }
}
