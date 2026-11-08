export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'StockFlow B2B API',
    version: '1.0.0',
    description: 'API de gestão de estoque e pedidos comerciais atacadistas.',
  },
  paths: {
    '/auth/login': {
      post: {
        tags: ['Autenticação'],
        summary: 'Autenticar usuário',
        description: 'Valida as credenciais e retorna um token JWT com validade de 8 horas.',
        operationId: 'loginUsuario',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
              example: {
                email: 'samuel@example.com',
                senha: 'senha123',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Autenticação concluída.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' },
              },
            },
          },
          '400': {
            description: 'Payload inválido.',
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    { $ref: '#/components/schemas/ErroValidacao' },
                    { $ref: '#/components/schemas/Erro' },
                  ],
                },
              },
            },
          },
          '401': {
            description: 'E-mail ou senha inválidos.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Erro' },
              },
            },
          },
          '500': {
            description: 'Erro interno do servidor.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Erro' },
              },
            },
          },
        },
      },
    },
    '/auth/registrar': {
      post: {
        tags: ['Autenticação'],
        summary: 'Registrar usuário',
        description: 'Cria um usuário OPERADOR. O cadastro público não permite atribuir o cargo ADMIN.',
        operationId: 'registrarUsuario',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegistrarUsuarioRequest' },
              example: {
                nome: 'Samuel Dias',
                email: 'samuel@example.com',
                senha: 'senha123',
                cargo: 'OPERADOR',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Usuário registrado; a resposta não contém o hash da senha.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UsuarioRegistrado' },
              },
            },
          },
          '400': {
            description: 'Payload inválido ou campos não permitidos.',
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    { $ref: '#/components/schemas/ErroValidacao' },
                    { $ref: '#/components/schemas/Erro' },
                  ],
                },
              },
            },
          },
          '403': {
            description: 'O cadastro público não pode criar usuários ADMIN.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Erro' },
              },
            },
          },
          '409': {
            description: 'Já existe um usuário com este e-mail.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Erro' },
              },
            },
          },
          '500': {
            description: 'Erro interno do servidor.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Erro' },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      LoginRequest: {
        type: 'object',
        additionalProperties: false,
        required: ['email', 'senha'],
        properties: {
          email: { type: 'string', format: 'email', example: 'samuel@example.com' },
          senha: { type: 'string', minLength: 1, format: 'password', example: 'senha123' },
        },
      },
      LoginResponse: {
        type: 'object',
        required: ['token', 'usuario'],
        properties: {
          token: { type: 'string', description: 'JWT com validade de 8 horas.' },
          usuario: { $ref: '#/components/schemas/UsuarioAutenticado' },
        },
      },
      UsuarioAutenticado: {
        type: 'object',
        required: ['id', 'nome', 'email', 'cargo'],
        properties: {
          id: { type: 'integer', example: 1 },
          nome: { type: 'string', example: 'Samuel Dias' },
          email: { type: 'string', format: 'email', example: 'samuel@example.com' },
          cargo: { type: 'string', enum: ['ADMIN', 'OPERADOR'] },
        },
      },
      RegistrarUsuarioRequest: {
        type: 'object',
        additionalProperties: false,
        required: ['nome', 'email', 'senha'],
        properties: {
          nome: { type: 'string', minLength: 1, example: 'Samuel Dias' },
          email: { type: 'string', format: 'email', example: 'samuel@example.com' },
          senha: { type: 'string', minLength: 6, format: 'password', example: 'senha123' },
          cargo: { type: 'string', enum: ['ADMIN', 'OPERADOR'], example: 'OPERADOR' },
        },
      },
      UsuarioRegistrado: {
        type: 'object',
        required: ['id', 'nome', 'email', 'cargo', 'criadoEm'],
        properties: {
          id: { type: 'integer', example: 1 },
          nome: { type: 'string', example: 'Samuel Dias' },
          email: { type: 'string', format: 'email', example: 'samuel@example.com' },
          cargo: { type: 'string', enum: ['OPERADOR'] },
          criadoEm: { type: 'string', format: 'date-time' },
        },
      },
      Erro: {
        type: 'object',
        required: ['message'],
        properties: {
          message: { type: 'string' },
        },
      },
      ErroValidacao: {
        allOf: [
          { $ref: '#/components/schemas/Erro' },
          {
            type: 'object',
            required: ['errors'],
            properties: {
              errors: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['path', 'message'],
                  properties: {
                    path: { type: 'string' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        ],
      },
    },
  },
};
