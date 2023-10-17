import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { prisma } from '@ioc:Adonis/Addons/Prisma';

export default class UserController {
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
}
