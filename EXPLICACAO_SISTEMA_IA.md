# Sistema de Atualização Automática com Inteligência Artificial: Arquitetura e Implementação

## Resumo Executivo

O sistema de atualização automática implementado na plataforma Doação Inteligente JF utiliza um modelo de linguagem grande (LLM) para realizar buscas diárias na internet, identificar mudanças nas necessidades de pontos de doação e propor atualizações ao administrador do sistema. Este documento descreve a arquitetura técnica, o fluxo de processamento, e os mecanismos de validação implementados.

---

## 1. Visão Geral da Arquitetura

O sistema opera em três camadas principais:

| Camada | Componente | Função |
|--------|-----------|--------|
| **Orquestração** | Cron Job (`cron.ts`) | Agenda execução diária às 9h BRT |
| **Processamento** | Motor de IA (`autoUpdate.ts`) | Busca, análise e geração de sugestões |
| **Persistência** | Banco de Dados (MySQL/TiDB) | Armazena logs, sugestões e histórico |

### 1.1 Fluxo de Execução

```
[9h BRT] → [Cron Job] → [runAutoUpdate()] → [fetchUpdatesFromLLM()] → [invokeLLM()]
                              ↓
                        [saveAsSugestoes()]
                              ↓
                        [updateLogs + sugestoes]
                              ↓
                        [notifyOwner()]
```

---

## 2. Componente 1: Agendamento (Cron Job)

### 2.1 Mecanismo de Agendamento

O arquivo `cron.ts` implementa um agendador baseado em `setTimeout` que calcula o tempo até a próxima execução às 9h BRT:

```typescript
// Pseudocódigo do algoritmo
function scheduleNextRun() {
  const now = new Date();
  const nextRun = new Date();
  nextRun.setHours(9, 0, 0, 0); // 9h BRT
  
  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1); // Próximo dia
  }
  
  const delay = nextRun.getTime() - now.getTime();
  setTimeout(runAutoUpdate, delay);
}
```

**Características:**
- Execução única diária em horário fixo (9h BRT)
- Auto-reagendamento para o dia seguinte
- Tolerância a reinicializações do servidor

### 2.2 Tratamento de Falhas

Caso o servidor seja reiniciado durante a execução:
1. O cron recalcula o tempo até a próxima execução
2. Se já passou das 9h, agenda para o dia seguinte
3. Implementa auto-recovery para jobs travados (timeout > 10 minutos)

---

## 3. Componente 2: Motor de IA (fetchUpdatesFromLLM)

### 3.1 Arquitetura do Prompt

O sistema utiliza **prompt engineering** com dois componentes principais:

#### 3.1.1 System Prompt (Instruções Contextuais)

O system prompt estabelece o papel e o escopo do modelo:

> "Você é um assistente especializado em monitorar campanhas de doação e pontos de arrecadação em Juiz de Fora, MG, Brasil."

**Instruções específicas incluem:**

1. **Fontes de informação autorizadas:**
   - Prefeitura de Juiz de Fora (pjf.mg.gov.br)
   - Defesa Civil de Juiz de Fora
   - Notícias locais (Tribuna de Minas, G1 Zona da Mata)
   - Redes sociais (Instagram, Threads)
   - Posts de igrejas, escolas, ONGs

2. **Diretrizes de busca:**
   - Procurar por posts recentes com palavras-chave: "doação", "arrecadação", "enchente", "abrigo"
   - Identificar itens específicos necessários (ex: fraldas, ração, cadeira de rodas)
   - Verificar mudanças de endereço ou encerramento de pontos

3. **Restrição de confiabilidade:**
   - "Retorne APENAS informações que você tenha confiança razoável de serem verdadeiras"
   - "Não invente dados"
   - "Se não houver informações novas, retorne listas vazias"

#### 3.1.2 User Prompt (Tarefa Específica)

O user prompt fornece o contexto da execução:

```
Pesquise as últimas informações sobre pontos de doação em Juiz de Fora.

Pontos cadastrados:
1. Instituto Jesus
2. Ginásio Poliesportivo Maestro Silvério Faustino
...

Forneça:
1. Atualizações de necessidades para pontos existentes
2. Novos pontos de doação ou abrigos
3. Resumo breve das informações
```

### 3.2 Formato de Resposta Estruturado (JSON Schema)

O sistema utiliza **JSON Schema** para garantir respostas estruturadas e validáveis:

```typescript
{
  "type": "object",
  "properties": {
    "atualizacoes": {
      "type": "array",
      "items": {
        "properties": {
          "pontoNome": { "type": "string" },
          "categoria": { "enum": ["Alimentos", "Roupas", "Produtos de Higiene", ...] },
          "item": { "type": "string" },
          "status": { "enum": ["URGENTE", "PRECISA", "OK"] },
          "observacao": { "type": "string" }
        }
      }
    },
    "novosPontos": {
      "type": "array",
      "items": {
        "properties": {
          "nome": { "type": "string" },
          "tipo": { "enum": ["Ponto de arrecadação", "Abrigo"] },
          "bairro": { "type": "string" },
          "cidade": { "type": "string" },
          "endereco": { "type": "string" },
          "horario": { "type": "string" },
          "descricao": { "type": "string" }
        }
      }
    },
    "resumo": { "type": "string" }
  }
}
```

**Benefícios:**
- Validação automática de tipos
- Rejeição de respostas malformadas
- Parsing determinístico em JSON

### 3.3 Mecanismo de Timeout

O sistema implementa um timeout de **90 segundos** usando `Promise.race()`:

```typescript
const TIMEOUT_MS = 90 * 1000;

const timeoutPromise = new Promise<never>((_, reject) => {
  setTimeout(() => reject(new Error('Timeout: 90 segundos')), TIMEOUT_MS);
});

const response = await Promise.race([llmPromise, timeoutPromise]);
```

**Justificativa:**
- Previne travamento indefinido do sistema
- Garante que o job conclua em tempo determinístico
- Permite retry automático no dia seguinte

---

## 4. Componente 3: Processamento de Respostas (saveAsSugestoes)

### 4.1 Pipeline de Validação

Após receber a resposta do LLM, o sistema executa uma série de validações:

#### 4.1.1 Validação de Categoria e Status

```typescript
// Apenas categorias válidas são aceitas
if (!CATEGORIAS_VALIDAS.includes(update.categoria)) continue;
if (!STATUS_VALIDOS.includes(update.status)) continue;
```

**Categorias válidas:** Alimentos, Roupas, Produtos de Higiene, Material de Limpeza, Colchões e Cobertores, Água, Medicamentos, Outros

**Status válidos:** URGENTE, PRECISA, OK

#### 4.1.2 Validação de Correspondência com Pontos Existentes

```typescript
const ponto = pontosByName.get(update.pontoNome.toLowerCase().trim());
if (!ponto) continue; // Ignora se ponto não existe
```

A busca é **case-insensitive** e remove espaços em branco para aumentar a taxa de correspondência.

#### 4.1.3 Detecção de Duplicatas

```typescript
const existingNec = existingNecs.find(
  (n) =>
    n.categoria === update.categoria &&
    n.item.toLowerCase().trim() === update.item.toLowerCase().trim()
);
```

Se uma necessidade com a mesma categoria e item já existe, o sistema:
- **Se o status mudou:** Cria uma sugestão de atualização
- **Se o status é igual:** Ignora (sem mudanças)

### 4.2 Tipos de Sugestões Geradas

O sistema gera três tipos de sugestões:

| Tipo | Condição | Ação Esperada |
|------|----------|---------------|
| `novo_ponto` | Ponto não existe no banco | Admin aprova criação de novo ponto |
| `nova_necessidade` | Necessidade não existe para o ponto | Admin aprova adição de necessidade |
| `atualizar_necessidade` | Necessidade existe mas status mudou | Admin aprova mudança de status |

**Exemplo de fluxo:**

```
LLM retorna: "Instituto Jesus precisa de URGENTE (água)"
Banco tem: "Instituto Jesus precisa de PRECISA (água)"

Resultado: Sugestão de "atualizar_necessidade" com novo status URGENTE
```

---

## 5. Armazenamento e Rastreamento

### 5.1 Tabela updateLogs

Cada execução gera um registro em `updateLogs`:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT | Identificador único |
| `status` | ENUM | running, success, error |
| `startedAt` | DATETIME | Timestamp de início |
| `finishedAt` | DATETIME | Timestamp de conclusão |
| `resumo` | TEXT | Resumo da execução |
| `erro` | TEXT | Mensagem de erro (se houver) |

**Estados possíveis:**
- `running`: Execução em andamento
- `success`: Execução concluída com sucesso
- `error`: Falha durante execução

### 5.2 Tabela sugestoes

Cada sugestão é armazenada com metadados completos:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT | Identificador único |
| `tipo` | ENUM | novo_ponto, nova_necessidade, atualizar_necessidade |
| `status` | ENUM | pendente, aprovada, rejeitada |
| `pontoId` | INT | Referência ao ponto (NULL para novo_ponto) |
| `necessidadeId` | INT | Referência à necessidade (NULL para novo_ponto) |
| `updateLogId` | INT | Referência ao log de execução |
| `createdAt` | DATETIME | Timestamp de criação |
| `reviewedAt` | DATETIME | Timestamp de aprovação/rejeição |
| `reviewedBy` | VARCHAR | Nome do revisor |

---

## 6. Ciclo de Aprovação

### 6.1 Fluxo de Aprovação

```
[Sugestão Pendente]
        ↓
[Admin Revisa]
        ↓
    ┌───┴────┐
    ↓        ↓
[Aprova]  [Rejeita]
    ↓        ↓
[Aplica]  [Descarta]
    ↓        ↓
[Banco]   [Histórico]
```

### 6.2 Operações de Aprovação

#### 6.2.1 Aprovação de novo_ponto

```typescript
await db.insert(pontos).values({
  nome: sugestao.pontoNome,
  tipo: sugestao.pontoTipo,
  bairro: sugestao.pontoBairro,
  cidade: sugestao.pontoCidade,
  endereco: sugestao.pontoEndereco,
  descricao: sugestao.pontoDescricao,
  ativo: true,
  lastAutoUpdate: new Date()
});
```

#### 6.2.2 Aprovação de nova_necessidade

```typescript
await db.insert(necessidades).values({
  pontoId: sugestao.pontoId,
  categoria: sugestao.necessidadeCategoria,
  item: sugestao.necessidadeItem,
  status: sugestao.necessidadeStatus,
  updatedBy: "Aprovação automática"
});

// Atualizar timestamp do ponto
await db.update(pontos)
  .set({ lastAutoUpdate: new Date() })
  .where(eq(pontos.id, sugestao.pontoId));
```

#### 6.2.3 Aprovação de atualizar_necessidade

```typescript
await db.update(necessidades)
  .set({
    status: sugestao.necessidadeStatus,
    updatedBy: "Aprovação automática"
  })
  .where(eq(necessidades.id, sugestao.necessidadeId));
```

---

## 7. Notificações e Alertas

### 7.1 Notificação ao Proprietário

Quando sugestões são geradas, o sistema notifica o proprietário:

```typescript
await notifyOwner({
  title: `${totalSugestoes} sugestões de atualização aguardando aprovação`,
  content: `A busca automática encontrou ${totalSugestoes} atualizações...`
});
```

**Casos de notificação:**
- ✅ Sugestões geradas com sucesso
- ✅ Erros durante execução (com mensagem de erro)
- ❌ Nenhuma sugestão gerada (sem notificação)

---

## 8. Mecanismos de Resiliência

### 8.1 Auto-Recovery para Jobs Travados

```typescript
const staleThreshold = new Date(Date.now() - 10 * 60 * 1000); // 10 minutos

await db.update(updateLogs)
  .set({
    status: "error",
    erro: "Atualização expirou (timeout de 10 minutos)",
    finishedAt: new Date()
  })
  .where(and(
    eq(updateLogs.status, "running"),
    sql`${updateLogs.startedAt} < ${staleThreshold}`
  ));
```

**Comportamento:**
- Se um job fica em "running" por mais de 10 minutos, é marcado como erro
- Permite que o próximo job execute normalmente
- Registra a falha para auditoria

### 8.2 Prevenção de Execuções Concorrentes

```typescript
const [currentRunning] = await db
  .select()
  .from(updateLogs)
  .where(and(
    eq(updateLogs.status, "running"),
    sql`${updateLogs.startedAt} > ${recentThreshold}`
  ))
  .limit(1);

if (currentRunning) {
  console.log("[AutoUpdate] Já existe uma atualização em andamento. Ignorando.");
  return;
}
```

Garante que apenas uma execução ocorre por vez.

---

## 9. Tratamento de Erros

### 9.1 Erros Esperados

| Erro | Causa | Tratamento |
|------|-------|-----------|
| Timeout de 90s | LLM não responde | Registra erro, agenda retry amanhã |
| JSON inválido | Resposta malformada | Rejeita, registra erro |
| Banco indisponível | Falha de conexão | Registra erro, agenda retry |
| Categoria inválida | LLM retorna categoria não permitida | Ignora sugestão |

### 9.2 Logging e Auditoria

Todos os eventos são registrados:

```typescript
console.log(`[AutoUpdate] Concluído: ${totalSugestoes} sugestões pendentes`);
console.error("[AutoUpdate] Erro:", error);
console.warn("[AutoUpdate] Falha ao notificar owner:", e);
```

---

## 10. Limitações e Considerações

### 10.1 Limitações Atuais

1. **Dependência de qualidade do LLM:** Alucinações ou imprecisões do modelo podem gerar sugestões incorretas
2. **Fontes limitadas:** Busca limitada a fontes públicas acessíveis via LLM
3. **Latência:** Timeout de 90s pode ser insuficiente em períodos de alta carga
4. **Cobertura geográfica:** Otimizado para Juiz de Fora, requer adaptação para outras cidades

### 10.2 Mitigações Implementadas

- ✅ Validação de schema JSON
- ✅ Verificação de correspondência com pontos existentes
- ✅ Detecção de duplicatas
- ✅ Aprovação manual antes de publicação
- ✅ Histórico completo de sugestões para auditoria

---

## 11. Métricas de Desempenho

### 11.1 Indicadores Monitorados

| Métrica | Descrição | Alvo |
|---------|-----------|------|
| Taxa de sucesso | % de execuções que completam sem erro | > 95% |
| Tempo de execução | Tempo total de execução | < 60s |
| Taxa de aprovação | % de sugestões aprovadas pelo admin | > 70% |
| Sugestões por execução | Média de sugestões geradas | 5-15 |

---

## 12. Conclusão

O sistema de atualização automática implementa uma abordagem **human-in-the-loop** que combina a capacidade de busca e análise do LLM com a validação humana. Esta arquitetura garante:

1. **Escalabilidade:** Execução automática diária sem intervenção manual
2. **Confiabilidade:** Múltiplas camadas de validação e tratamento de erros
3. **Auditoria:** Histórico completo de todas as sugestões e aprovações
4. **Segurança:** Aprovação manual antes de publicação de dados

A implementação segue boas práticas de engenharia de software, incluindo logging robusto, tratamento de exceções, e mecanismos de auto-recovery.

---

## Referências

- OpenAI. (2024). "JSON Schema in API responses." [https://platform.openai.com/docs/guides/structured-outputs](https://platform.openai.com/docs/guides/structured-outputs)
- Drizzle ORM. (2024). "Database ORM for TypeScript." [https://orm.drizzle.team/](https://orm.drizzle.team/)
- Manus Platform. (2024). "LLM Integration Guide." [https://docs.manus.im/](https://docs.manus.im/)

