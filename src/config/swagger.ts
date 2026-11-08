export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'StockFlow B2B API',
    version: '1.0.0',
    description: 'API de gestão de estoque e pedidos comerciais atacadistas.',
  },
  paths: {
    '/clientes': {
      get: {
        tags: ['Clientes'],
        summary: 'Listar clientes',
        description: 'Lista clientes cadastrados com filtros opcionais. Requer um Bearer token válido.',
        operationId: 'listarClientes',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'ativo',
            in: 'query',
            required: false,
            description: 'Filtra pelo status ativo ou inativo.',
            schema: { type: 'boolean' },
          },
          {
            name: 'razaoSocial',
            in: 'query',
            required: false,
            description: 'Busca parcial, sem diferenciar maiúsculas de minúsculas conforme a collation do MySQL.',
            schema: { type: 'string', minLength: 1 },
          },
        ],
        responses: {
          '200': {
            description: 'Lista de clientes.',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/ClienteCriado' },
                },
              },
            },
          },
          '400': {
            description: 'Filtros de consulta inválidos.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Erro' },
              },
            },
          },
          '401': {
            description: 'Token ausente, inválido ou expirado.',
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
      post: {
        tags: ['Clientes'],
        summary: 'Cadastrar cliente',
        description: 'Cadastra um cliente atacadista. Requer um Bearer token válido.',
        operationId: 'criarCliente',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CriarClienteRequest' },
              example: {
                razaoSocial: 'Distribuidora Exemplo Ltda.',
                cnpj: '12.345.678/0001-90',
                email: 'compras@example.com',
                telefone: '(11) 99999-9999',
                limiteCredito: 15000,
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Cliente criado com limite de crédito inicial.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ClienteCriado' },
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
            description: 'Token ausente, inválido ou expirado.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Erro' },
              },
            },
          },
          '409': {
            description: 'Já existe um cliente com o CNPJ ou e-mail informado.',
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
    '/clientes/{id}': {
      get: {
        tags: ['Clientes'],
        summary: 'Consultar cliente por ID',
        description: 'Retorna os dados cadastrais do cliente e o resumo dos pedidos vinculados. Requer um Bearer token válido.',
        operationId: 'buscarClientePorId',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID inteiro positivo do cliente.',
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          '200': {
            description: 'Dados do cliente e resumo dos pedidos.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ClienteDetalhado' },
              },
            },
          },
          '400': {
            description: 'ID inválido.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Erro' },
              },
            },
          },
          '401': {
            description: 'Token ausente, inválido ou expirado.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Erro' },
              },
            },
          },
          '404': {
            description: 'Cliente não encontrado.',
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
      put: {
        tags: ['Clientes'],
        summary: 'Atualizar cliente',
        description: 'Atualiza os campos informados do cadastro, incluindo status e limite de crédito. Requer um Bearer token válido.',
        operationId: 'atualizarCliente',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID inteiro positivo do cliente.',
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AtualizarClienteRequest' },
              example: {
                razaoSocial: 'Distribuidora Exemplo Ltda.',
                limiteCredito: 20000,
                ativo: true,
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Cadastro do cliente atualizado.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ClienteCriado' },
              },
            },
          },
          '400': {
            description: 'ID ou payload inválido.',
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
            description: 'Token ausente, inválido ou expirado.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Erro' },
              },
            },
          },
          '404': {
            description: 'Cliente não encontrado.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Erro' },
              },
            },
          },
          '409': {
            description: 'CNPJ ou e-mail já pertence a outro cliente.',
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
      delete: {
        tags: ['Clientes'],
        summary: 'Excluir cliente',
        description: 'Remove fisicamente apenas clientes sem pedidos vinculados. Clientes com histórico transacional devem ser inativados. Requer um Bearer token válido.',
        operationId: 'removerCliente',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID inteiro positivo do cliente.',
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          '204': {
            description: 'Cliente excluído.',
          },
          '400': {
            description: 'ID inválido.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Erro' },
              },
            },
          },
          '401': {
            description: 'Token ausente, inválido ou expirado.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Erro' },
              },
            },
          },
          '404': {
            description: 'Cliente não encontrado.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Erro' },
              },
            },
          },
          '409': {
            description: 'Cliente com pedidos não pode ser excluído; inative o cadastro.',
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
      CriarClienteRequest: {
        type: 'object',
        additionalProperties: false,
        required: ['razaoSocial', 'cnpj', 'email', 'telefone', 'limiteCredito'],
        properties: {
          razaoSocial: { type: 'string', minLength: 1, example: 'Distribuidora Exemplo Ltda.' },
          cnpj: {
            type: 'string',
            pattern: '^(?:\\d{14}|\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2})$',
            example: '12.345.678/0001-90',
          },
          email: { type: 'string', format: 'email', example: 'compras@example.com' },
          telefone: { type: 'string', example: '(11) 99999-9999' },
          limiteCredito: { type: 'number', exclusiveMinimum: 0, example: 15000 },
        },
      },
      AtualizarClienteRequest: {
        type: 'object',
        additionalProperties: false,
        minProperties: 1,
        properties: {
          razaoSocial: { type: 'string', minLength: 1, example: 'Distribuidora Exemplo Ltda.' },
          cnpj: {
            type: 'string',
            pattern: '^(?:\\d{14}|\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2})$',
            example: '12.345.678/0001-90',
          },
          email: { type: 'string', format: 'email', example: 'compras@example.com' },
          telefone: { type: 'string', example: '(11) 99999-9999' },
          limiteCredito: { type: 'number', exclusiveMinimum: 0, example: 20000 },
          ativo: { type: 'boolean', example: true },
        },
      },
      ClienteCriado: {
        type: 'object',
        required: ['id', 'razaoSocial', 'cnpj', 'email', 'telefone', 'limiteCredito', 'ativo'],
        properties: {
          id: { type: 'integer', example: 1 },
          razaoSocial: { type: 'string', example: 'Distribuidora Exemplo Ltda.' },
          cnpj: { type: 'string', example: '12345678000190' },
          email: { type: 'string', format: 'email', example: 'compras@example.com' },
          telefone: { type: 'string', example: '(11) 99999-9999' },
          limiteCredito: { type: 'number', example: 15000 },
          ativo: { type: 'boolean', example: true },
        },
      },
      ClienteDetalhado: {
        allOf: [
          { $ref: '#/components/schemas/ClienteCriado' },
          {
            type: 'object',
            required: ['pedidos'],
            properties: {
              pedidos: {
                type: 'array',
                items: { $ref: '#/components/schemas/ResumoPedidoCliente' },
              },
            },
          },
        ],
      },
      ResumoPedidoCliente: {
        type: 'object',
        required: ['id', 'status', 'valorLiquido', 'criadoEm'],
        properties: {
          id: { type: 'integer', example: 10 },
          status: { type: 'string', example: 'APROVADO' },
          valorLiquido: { type: 'number', example: 2500.5 },
          criadoEm: { type: 'string', format: 'date-time' },
        },
      },
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
