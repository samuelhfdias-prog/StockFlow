---
description: 'Gera uma funcionalidade completa (Vertical Slice) seguindo rigorosamente DDD e Clean Architecture'
agent: 'ddd-architect'
argument-hint: 'Descreva a funcionalidade ou regra de negócio'
---

Utilize as diretrizes do agente [DDD Architect](../agents/ddd-architect.agent.md) e as regras de linguagem do repositório para implementar a funcionalidade abaixo:

${input:feature}

Siga obrigatoriamente esta ordem de execução:

1. Analise a estrutura de pastas e o arquivo de dependências (`package.json`, `.csproj` ou `pom.xml`) para manter o padrão de nomenclatura e as tecnologias já utilizadas.
2. Antes de criar arquivos, apresente um mapa DDD com as classes planejadas em cada uma das quatro camadas: Domain, Application, Infrastructure e Presentation/API.
3. Construa primeiro a camada **Domain**: Entidade rica com invariantes, Value Objects necessários e interface do repositório. Ao concluir esta etapa, consulte `problems` e corrija os erros encontrados.
4. Construa a camada **Application**: DTOs de entrada/saída e UseCase/Service para orquestrar o domínio. Consulte `problems` e corrija os erros encontrados.
5. Construa a camada **Infrastructure**: implementação concreta do repositório usando apenas o ORM já instalado no projeto. Consulte `problems` e corrija os erros encontrados.
6. Construa a camada **Presentation/API**: Controller/Endpoint conectado ao UseCase via injeção de dependência. Consulte `problems` e corrija os erros encontrados.
7. Execute os testes e verificações disponíveis e consulte `problems` ao final para confirmar que não restaram erros de compilação ou tipagem.

Respeite as fronteiras invioláveis do DDD e da Clean Architecture: o Domain não pode depender de ORM, framework web, banco de dados ou serialização; as regras de negócio permanecem no domínio; e a Presentation delega a execução à Application. Adapte a solução à estrutura existente, sem introduzir dependências desnecessárias. Se faltar uma decisão de negócio que altere o comportamento, peça esclarecimento antes de implementá-la.
