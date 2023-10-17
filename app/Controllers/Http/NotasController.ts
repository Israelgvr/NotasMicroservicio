import * as fs from 'fs'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import { prisma } from '@ioc:Adonis/Addons/Prisma'
import Logger from '@ioc:Adonis/Core/Logger'
import moment from 'moment'
import Excel from 'exceljs'

export default class NotasController {

////////*********** */
public async store({ request, response }: HttpContextContract) {
  try {
    const validationSchema = schema.create({
      notaExamen: schema.number(),
      notaTrabajos: schema.number(),
      notaParticipacion: schema.number(),
      notaAsistencia: schema.number(),
      notaOPI: schema.number(),
      estudianteId: schema.string(),
      libroId: schema.string(),
      filialId: schema.string(),
    });

    const payload = await request.validate({
      schema: validationSchema,
    });

    // Verificar si ya existe una nota para el libro
    const existingNota = await prisma.nota.findFirst({
      where: {
        libroId: payload.libroId,
      },
    });

    if (existingNota) {
      // Aquí puedes manejar la situación de que ya existe una nota para el libro,
      // ya sea actualizando el registro existente o devolviendo un mensaje de error.
      return response.badRequest({ message: 'Ya existe una nota para este libro' });
    }
    const notaTrabajosWeight = 0.5;
    const notaParticipacionWeight = 0.1;
    const notaAsistenciaWeight = 0.1;
    const notaOPIWeight = 0.3;
    
    const promedio = (payload.notaTrabajos * notaTrabajosWeight +
                     payload.notaParticipacion * notaParticipacionWeight +
                     payload.notaAsistencia * notaAsistenciaWeight +
                     payload.notaOPI * notaOPIWeight);
    const nuevaNota = await prisma.nota.create({
      data: {
        notaExamen: 0,
        notaTrabajos: payload.notaTrabajos,
        notaParticipacion: payload.notaParticipacion,
        notaAsistencia: payload.notaAsistencia,
        notaOPI: payload.notaOPI,  // Valor nulo
        notaParcial: promedio,  // Valor nulo
        notaRetest: 0,  // Valor nulo
        promedioFinal: 0,  // Valor nulo
        estudianteId: payload.estudianteId,
        libroId: payload.libroId,
        filialId: payload.filialId,
      },
    });
    

    Logger.info('Nueva nota creada con éxito', { notaId: nuevaNota.id });

    return response.status(201).json(nuevaNota);
  } catch (error) {
    Logger.error('Error al crear la nota', error);

    return response.badRequest({ message: 'Error al crear la nota' });
  }
}


/*public async store({ request, response }: HttpContextContract) {
  try {
    const validationSchema = schema.create({
      notaExamen: schema.number(),
      notaTrabajos: schema.number(),
      notaParticipacion: schema.number(),
      notaAsistencia: schema.number(),
      notaOPI: schema.number(),
      notaParcial: schema.number(),
      notaRetest: schema.number(),
      promedioFinal: schema.number(),
      estudianteId: schema.string(),
      libroId: schema.string(),
      filialId: schema.string(),
    });

    const payload = await request.validate({
      schema: validationSchema,
    });

    // Verificar si ya existe una nota para el libro
    const existingNota = await prisma.nota.findFirst({
      where: {
        libroId: payload.libroId,
      },
    });

    if (existingNota) {
      // Aquí puedes manejar la situación de que ya existe una nota para el libro,
      // ya sea actualizando el registro existente o devolviendo un mensaje de error.
      return response.badRequest({ message: 'Ya existe una nota para este libro' });
    }

    const nuevaNota = await prisma.nota.create({
      data: {
        notaExamen: payload.notaExamen,
        notaTrabajos: payload.notaTrabajos,
        notaParticipacion: payload.notaParticipacion,
        notaAsistencia: payload.notaAsistencia,
        notaOPI: payload.notaOPI,
        notaParcial: payload.notaParcial,
        notaRetest: payload.notaRetest,
        promedioFinal: payload.promedioFinal,
        estudianteId: payload.estudianteId,
        libroId: payload.libroId,
        filialId: payload.filialId,
      },
    });

    Logger.info('Nueva nota creada con éxito', { notaId: nuevaNota.id });

    return response.status(201).json(nuevaNota);
  } catch (error) {
    Logger.error('Error al crear la nota', error);

    return response.badRequest({ message: 'Error al crear la nota' });
  }
}*/

public  async options({ request, response }) {
  try {
    const updateNotaSchema = schema.create({
      notaExamen: schema.number.optional(),
      notaParcial: schema.number.optional(),
      notaRetest: schema.number.optional(),
      notaId: schema.string(),
    });

    // Validar las entradas
    const { notaExamen, notaRetest, notaId } = await request.validate({
      schema: updateNotaSchema,
    });

    if (notaExamen < 0 || notaRetest < 0) {
      return response.badRequest({ message: 'La nota mínima debe ser 0' });
    }

    // Comenzar una transacción
    await prisma.$transaction(async (prisma) => {
      // Obtener la nota existente utilizando el ID de la nota
      const existingNota = await prisma.nota.findUnique({
        where: { id: notaId },
      });

      if (!existingNota) {
        return response.badRequest({ message: 'No se encontró una nota con este ID' });
      }

      // Obtener la notaParcial existente
      const notaParcial = existingNota.notaParcial;

      // Calcular el promedio considerando los nuevos valores
      let promedioFinal = (notaExamen * 0.9) + (notaParcial * 0.1);

      // Si notaRetest es mayor a 75, actualiza el promedioFinal
      if (notaRetest > 75) {
        promedioFinal = notaRetest;
      }

      // Actualizar la nota con los nuevos valores
      const nuevaNota = await prisma.nota.update({
        where: { id: notaId }, // Usamos el ID de la nota
        data: {
          notaExamen: notaExamen,
          notaRetest: notaRetest,
          promedioFinal: promedioFinal,
          // Otras propiedades si es necesario            
        },
      });

      // Registra el éxito en la transacción
      Logger.info('Valores actualizados con éxito', { notaId: nuevaNota.id });

      return response.status(200).json({ message: 'Valores actualizados con éxito' });
    });
  } catch (error) {
    // Registra un error detallado
    Logger.error('Error al actualizar los valores', error);

    return response.badRequest({ message: 'Error al actualizar los valores' });
  }
} 






  public async showLibro({ params, response }: HttpContextContract) {
    try {
      const notas = await prisma.nota.findMany({
        where: {
          libroId: params.id, // Obtener el ID del libro desde los parámetros de la solicitud
        },
        include: {
          estudiante: true,
          libro: true,
          filial: true,
        },
      });

      return response.status(200).json(notas);
    } catch (error) {
      Logger.error('Error al buscar notas por ID de libro', error);

      return response.badRequest({ message: 'Error al buscar notas por ID de libro' });
    }
  }
  public async showFilialS({ params, response }: HttpContextContract) {
    try {
      const notas = await prisma.nota.findMany({
        where: {
          filialId: params.id, // Obtener el ID de la filial desde los parámetros de la solicitud
        },
        include: {
          estudiante: true,
          libro: true,
          filial: true,
        },
      });

      return response.status(200).json(notas);
    } catch (error) {
      Logger.error('Error al buscar notas por ID de filial T', error);

      return response.badRequest({ message: 'Error al buscar notas por ID de filial' });
    }
  }
  public async showFilialBIEN({ params, response }: HttpContextContract) {
    try {
      const { libroId } = params;
  
      // Buscar todas las notas que tengan el libroId especificado
      const notas = await prisma.nota.findMany({
        where: { libroId },
      });
  
      if (notas.length === 0) {
        return response.notFound({ message: 'No se encontraron notas para este libroId' });
      }
  
      return response.status(200).json(notas);
    } catch (error) {
      Logger.error('Error al filtrar las notas por libroId', error);
      return response.badRequest({ message: 'Error al filtrar las notas por libroId' });
    }
  }

  public async showFilial({ params, response }) {
    try {
      const estudianteId = params.estudianteId;
      const libroId = params.libroId;  // Obtén el estudianteId de los parámetros de la solicitud
  
      // Buscar todas las notas que coincidan con el estudianteId
      const notas = await prisma.nota.findMany({
        where: {
          estudianteId: estudianteId,
          libroId: libroId
        },
      });
  
      if (notas.length === 0) {
        return response.status(404).json({ message: 'No se encontraron notas para este estudianteId' });
      }
  
      return response.status(200).json(notas);
    } catch (error) {
      // Registra un error detallado
      Logger.error('Error al buscar notas por estudianteId', error);
  
      return response.badRequest({ message: 'Error al buscar notas por estudianteId' });
    }
  }
  
  
  public async showEstu({ request, response }: HttpContextContract) {
    try {
      const { nombre, matricula } = request.qs();

      if (!nombre && !matricula) {
        return response.badRequest({ message: 'Debes proporcionar al menos el nombre o la matrícula del estudiante.' });
      }

      const notas = await prisma.nota.findMany({
        where: {
          OR: [
            {
              estudiante: {
                nombre: nombre,
              },
            },
            {
              estudiante: {
                matricula: matricula,
              },
            },
          ],
        },
        include: {
          estudiante: true,
          libro: true,
          filial: true,
        },
      });

      return response.status(200).json(notas);
    } catch (error) {
      Logger.error('Error al buscar notas por nombre o matrícula del estudiante', error);

      return response.badRequest({ message: 'Error al buscar notas por nombre o matrícula del estudiante' });
    }
  }

      public async getNotas({ response }: HttpContextContract) {
        try {
          // Obtener todas las notas de la base de datos
          const notas = await prisma.nota.findMany();
      
          // Mapear las notas para agregar nombres de estudiante y libro
          const notasConNombres = await Promise.all(
            notas.map(async (nota) => {
              const estudiante = await prisma.persona.findUnique({
                where: { id: nota.estudianteId },
              });
      
              const libro = await prisma.libro.findUnique({
                where: { id: nota.libroId },
              });
      
              return {
                ...nota,
                nombreEstudiante: estudiante?.nombre, // Ajusta el campo de nombre según tu modelo Estudiante
                ApellidosP: estudiante?.apellidoPaterno, 
                ApellidosM: estudiante?.apellidoMaterno,

                nombreLibro: libro?.nombre, // Ajusta el campo de nombre según tu modelo Libro
              };
            })
          );
      
          return response.ok(notasConNombres);
        } catch (error) {
          Logger.error(error);
      
          return response.badRequest({ message: 'Error al obtener las notas' });
        }
      }

      public async getNotasPorLibroID({ params, response }: HttpContextContract) {
        try {
          const libroId = params.libroId;
      
          // Obtener todas las notas asociadas al ID del libro
          const notas = await prisma.nota.findMany({
            where: {
              libroId: libroId,
            },
          });
      
          // Mapear las notas para agregar nombres de estudiante y libro
          const notasConNombres = await Promise.all(
            notas.map(async (nota) => {
              const estudiante = await prisma.persona.findUnique({
                where: { id: nota.estudianteId },
              });
      
              const libro = await prisma.libro.findUnique({
                where: { id: nota.libroId },
              });
      
              return {
                ...nota,
                nombreEstudiante: estudiante?.nombre,
                ApellidosP: estudiante?.apellidoPaterno,
                ApellidosM: estudiante?.apellidoMaterno,
                nombreLibro: libro?.nombre,
              };
            })
          );
      
          return response.ok(notasConNombres);
        } catch (error) {
          Logger.error(error);
      
          return response.badRequest({ message: 'Error al obtener las notas' });
        }
      }

      public async getNotasP({ response }: HttpContextContract) {
        try {
          // Obtener todas las notas de la base de datos
          const notas = await prisma.nota.findMany();
      
          // Crear un objeto para almacenar los promedios de cada estudiante
          const promediosEstudiantes: { [estudianteId: number]: number[] } = {};
      
          // Calcular los promedios de notas para cada estudiante
          notas.forEach((nota) => {
            if (!promediosEstudiantes[nota.estudianteId]) {
              promediosEstudiantes[nota.estudianteId] = [];
            }
            promediosEstudiantes[nota.estudianteId].push(nota.nota);
          });
      
          // Calcular los promedios y asociarlos con los IDs de estudiantes
          const promedios = Object.keys(promediosEstudiantes).map((estudianteId) => {
            const notasEstudiante = promediosEstudiantes[parseInt(estudianteId, 10)];
            const promedio =
              notasEstudiante.reduce((sum, nota) => sum + nota, 0) / notasEstudiante.length;
            return { estudianteId: parseInt(estudianteId, 10), promedio };
          });
      
          // Ordenar los estudiantes según sus promedios de mayor a menor
          promedios.sort((a, b) => b.promedio - a.promedio);
      
          // Obtener los tres mejores promedios con los nombres y apellidos de los estudiantes
          const mejoresPromedios = promedios.slice(0, 3);
          const estudiantesPromedios = await Promise.all(
            mejoresPromedios.map(async (promedioInfo) => {
              const estudiante = await prisma.persona.findUnique({
                where: { id: promedioInfo.estudianteId },
              });
              return {
                nombreEstudiante: estudiante?.nombre,
                ApellidosP: estudiante?.apellidoPaterno,
                ApellidosM: estudiante?.apellidoMaterno,
                promedio: promedioInfo.promedio,
              };
            })
          );
      
          return response.ok(estudiantesPromedios);
        } catch (error) {
          Logger.error(error);
      
          return response.badRequest({ message: 'Error al obtener las notas' });
        }
      }

      ////TRES PROMEDIO alto 
      public async getNotasPRODIO({ response }: HttpContextContract) {
        try {
          // Obtener todas las notas de la base de datos
          const notas = await prisma.nota.findMany();
      
          // Mapear las notas para agregar nombres de estudiante y libro
          const notasConNombres = await Promise.all(
            notas.map(async (nota) => {
              const estudiante = await prisma.persona.findUnique({
                where: { id: nota.estudianteId },
              });
      
              const libro = await prisma.libro.findUnique({
                where: { id: nota.libroId },
              });
      
              return {
                ...nota,
                nombreEstudiante: estudiante?.nombre,
                ApellidosP: estudiante?.apellidoPaterno,
                ApellidosM: estudiante?.apellidoMaterno,
                nombreLibro: libro?.nombre,
              };
            })
          );
      
          // Ordenar las notas por promedioFinal de manera descendente
          notasConNombres.sort((a, b) => b.promedioFinal - a.promedioFinal);
      
          // Obtener los tres promedios más altos
          const tresPromediosAltos = notasConNombres.slice(0, 3);
      
          return response.ok(tresPromediosAltos);
        } catch (error) {
          Logger.error(error);
      
          return response.badRequest({ message: 'Error al obtener las notas' });
        }
      }
      ///TODOS LOS REPROBADOS 
      public async getNotasReprobadas({ response }: HttpContextContract) {
        try {
          // Obtener todas las notas de la base de datos
          const notas = await prisma.nota.findMany();
      
          // Mapear las notas para agregar nombres de estudiante y libro
          const notasReprobadas = await Promise.all(
            notas
              .filter(nota => nota.promedioFinal < 71) // Filtro para notas reprobadas con calificación menor a 71
              .map(async (nota) => {
                const estudiante = await prisma.persona.findUnique({
                  where: { id: nota.estudianteId },
                });
      
                const libro = await prisma.libro.findUnique({
                  where: { id: nota.libroId },
                });
      
                return {
                  ...nota,
                  nombreEstudiante: estudiante?.nombre,
                  ApellidosP: estudiante?.apellidoPaterno,
                  ApellidosM: estudiante?.apellidoMaterno,
                  nombreLibro: libro?.nombre,
                };
              })
          );
      
          return response.ok(notasReprobadas);
        } catch (error) {
          Logger.error(error);
      
          return response.badRequest({ message: 'Error al obtener las notas reprobadas' });
        }
      }
      /// CANTIDAD DE REPROBADOS 
      public async getCantidadReprobados({ response }: HttpContextContract) {
        try {
          // Obtener todas las notas de la base de datos
          const notas = await prisma.nota.findMany();
      
          // Contar la cantidad de notas aprobadas (con calificación mayor o igual a 71)
          const cantidadAprobados = notas.filter(nota => nota.promedioFinal >= 71).length;
      
          // Contar la cantidad de notas reprobadas (con calificación menor a 71)
          const cantidadReprobados = notas.filter(nota => nota.promedioFinal < 71).length;
      
          return response.ok({ cantidadAprobados, cantidadReprobados });
        } catch (error) {
          Logger.error(error);
      
          return response.badRequest({ message: 'Error al obtener la cantidad de aprobados y reprobados' });
        }
      }
      
      
      public async getCantidadReprobadosA({ response }: HttpContextContract) {
        try {
          // Obtener todas las notas de la base de datos
          const notas = await prisma.nota.findMany();
      
          // Contar la cantidad de notas reprobadas (con calificación menor a 71)
          const cantidadReprobados = notas.filter(nota => nota.promedioFinal < 71).length;
      
          return response.ok({ cantidadReprobados });
        } catch (error) {
          Logger.error(error);
      
          return response.badRequest({ message: 'Error al obtener la cantidad de reprobados' });
        }
      }


      //PROMEDIO FINALES 
      public async getPromediosParaGrafico({ response }: HttpContextContract) {
        try {
          // Obtener todas las notas de la base de datos
          const notas = await prisma.nota.findMany();
      
          // Obtener los promedios de todas las notas
          const promedios = notas.map(nota => nota.promedioFinal);
      
          return response.ok({ promedios });
        } catch (error) {
          Logger.error(error);
      
          return response.badRequest({ message: 'Error al obtener los promedios para el gráfico' });
        }
      }

      public async firmas({ response }) {
        // Consulta para obtener todas las firmas
        const firmas = await prisma.firma.findMany();
    
        return response.status(200).json(firmas)
      }
      
      
      
      
      
      
      
      
      
  }





 
 

 

