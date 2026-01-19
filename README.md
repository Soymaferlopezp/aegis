# Aegis — Financial Guardrails for AI Agents  
**Smart Contracts · Arc Testnet**

Repositorio base para el desarrollo y deploy de contratos inteligentes en **Arc Testnet**, usando **Hardhat + TypeScript**.

Este repo valida:
- pipeline de compilación
- conexión a Arc Testnet
- deploy on-chain
- smoke test reproducible
- registro automático de deployments
- Las transacciones en Arc Testnet utilizan USDC para fees y transfers.

---

## Requirements

```bash
node >= 20
npm >= 10
git
```

---

## Setup

```bash
git clone <repo-url>
cd aegis
npm install
```

---

## Environment Variables

Crear .env (no se comitea):

```bash
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
ARC_TESTNET_CHAIN_ID=5042002
ARC_EXPLORER_URL=https://testnet.arcscan.app
DEPLOYER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
```
---
Opcional (local-only):
.env.local
HELLO_ADDRESS=0xDeployedHelloAegisAddress
*HelloAegis.sol es solo un contrato de verificación del pipeline y será reemplazado por AegisVault.sol en Fase 1.*
---
## Compile & Test (local)

npm run build
npm test

## Arc Testnet Console
npm run arc:console

Dentro de la consola:
await ethers.provider.getBlockNumber()

## Deploy (Arc Testnet)
npm run arc:deploy:hello

Salida esperada:
* address del contrato
* tx hash
* links a Arcscan
* archivo generado en deployments/arcTestnet.json

---

## Smoke Test (on-chain)
npm run arc:smoke:hello

Ejecuta:
* ping()
* emite evento
* confirma tx en Arcscan

---
## Deployments Registry
deployments/arcTestnet.json

Ejemplo:
```bash
{
  "network": "arcTestnet",
  "updatedAt": "2026-01-11T02:10:43.123Z",
  "helloAegis": {
    "address": "0x...",
    "deployer": "0x...",
    "deployTx": "0x...",
    "explorer": "https://testnet.arcscan.app"
  }
}
```
---

## DNS / RPC Notes (Important)

Arc Testnet RPC puede fallar por:
* DNS del ISP
* redes corporativas
* cache intermitente

Workarounds probados:
* usar hotspot del celular
* usar DNS 8.8.8.8 / 1.1.1.1
* usar RPCs alternativos oficiales de Arc
El código no es el problema.

---

## Scope

IN:
* Hardhat + TS
* Arc Testnet
* deploy scripts
* smoke test
* placeholder contract

OUT:
* Vault logic
* frontend
* Circle / Gemini
* DB

---

# Aegis — Vault & Guardrails (Fase 1)

**Financial Guardrails for AI Agents — Arc Testnet**

Este repositorio implementa la **Fase 1 de Aegis**: un **Vault de USDC con guardrails on-chain** que garantizan que **ningún agente puede exceder límites financieros predefinidos**, incluso si el agente es malicioso o está mal configurado.

La lógica está diseñada para ser:
- **On-chain**
- **Reproducible**
- **Auditable**
- **Ejecutable en testnet (Arc)**

---

## Objetivo de la Fase 1

Construir un **Vault inteligente** que:
- Custodie **USDC (nativo de Arc)**.
- Permita a un **agent executor** gastar fondos **solo dentro de límites estrictos**.
- Garantice que **los límites no pueden ser violados por el agente**.
- Sea fácilmente verificable mediante tests y transacciones en explorador.

---

## Arquitectura (alto nivel)

```bash

┌──────────────────────────────────────────────┐
│                  OWNER                       │
│            (Admin / Human Wallet)            │
│                                              │
│  - Despliega el contrato                     │
│  - Configura guardrails                      │
│      • maxPerTx                              │
│      • dailyLimit                            │
│  - Define / cambia Agent Executor            │
│  - Puede retirar fondos (withdraw)           │
│                                              │
│  ❗ El owner NO es un agente                 │
└───────────────┬──────────────────────────────┘
                │
                │ admin actions
                ▼
┌──────────────────────────────────────────────┐
│            VaultGuardrails.sol               │
│                                              │
│  Custodia: USDC (Arc native, ERC-20 iface)   │
│                                              │
│  Guardrails ON-CHAIN (inamovibles p/ agente) │
│  ──────────────────────────────────────────  │
│  • maxPerTx      → límite por transacción    │
│  • dailyLimit    → límite diario acumulado   │
│  • spentToday    → tracking por día (UTC)    │
│                                              │
│  Reglas de Seguridad                         │
│  ──────────────────────────────────────────  │
│  • El agente NO puede retirar                │
│  • El agente NO puede cambiar límites        │
│  • El agente NO puede cambiar roles          │
│                                              │
│  Funciones clave                             │
│  ──────────────────────────────────────────  │
│  • deposit(amount)   ← usuarios / owner      │
│  • spend(to, amount) ← SOLO agent executor   │
│  • withdraw(to, amt) ← SOLO owner            │
│                                              │
└───────────────┬──────────────────────────────┘
                │
                │ spend() (siempre guardraileado)
                ▼
┌──────────────────────────────────────────────┐
│              AGENT EXECUTOR                  │
│          (Bot / AI / Script / Service)       │
│                                              │
│  - Ejecuta spend()                           │
│  - Solo puede gastar dentro de límites       │
│                                              │
│  ❌ No puede:                                │
│     • retirar fondos                         │
│     • cambiar guardrails                     │
│     • escalar privilegios                    │
│                                              │
└───────────────┬──────────────────────────────┘
                │
                │ transfer USDC
                ▼
┌──────────────────────────────────────────────┐
│                RECIPIENT                     │
│          (Merchant / Service / Wallet)       │
│                                              │
│  - Recibe USDC desde el Vault                │
│  - No interactúa con el contrato             │
│                                              │
└──────────────────────────────────────────────┘


Flujo típico:
1. Owner despliega el Vault y define guardrails.
2. Usuarios / Owner depositan USDC en el Vault.
3. Agent Executor intenta ejecutar spend().
4. El Vault valida:
   - amount <= maxPerTx
   - spentToday + amount <= dailyLimit
5. Si pasa, transfiere USDC al recipient.
6. Si falla, revierte (el agente NO puede forzar gasto).


Garantía clave del diseño:
👉 Un agente malicioso, bugueado o comprometido
👉 NO puede violar los límites financieros definidos on-chain.


```
---

## Modelo de roles

### Owner (Admin)
- Dirección humana controlada por el proyecto.
- Puede:
  - Cambiar `maxPerTx` y `dailyLimit`.
  - Cambiar el `agentExecutor`.
  - Retirar fondos (`withdraw`).
- **NO es un agente**.

### Agent Executor
- Dirección separada (idealmente otra wallet).
- Puede:
  - Ejecutar `spend()` **solo dentro de los límites**.
- NO puede:
  - Retirar fondos.
  - Cambiar límites.
  - Cambiar roles.

👉 Esto garantiza que **aunque el agente esté comprometido**, los fondos no pueden ser drenados fuera de los guardrails.

---

## Guardrails implementados

### 1) Límite por transacción (`maxPerTx`)
- Ningún `spend()` puede exceder este valor.
- Revert explícito si se intenta violar.

### 2) Límite diario (`dailyLimit`)
- Se trackea el gasto acumulado por día (UTC).
- Si el gasto acumulado + nuevo gasto excede el límite → revert.
- El contador se reinicia automáticamente al cambiar de día.

---

## Contrato principal

**Contrato:** `VaultGuardrails.sol`

Características:
- USDC vía interfaz ERC-20 opcional de Arc.
- Custom errors (más claros y baratos en gas).
- Eventos para auditoría.
- Lógica simple, explícita y testeable.

---

## Estructura del repositorio
```bash
aegis/
├── contracts/
│ ├── VaultGuardrails.sol
│ └── mocks/
│ └── MockUSDC.sol
│
├── scripts/
│ ├── deploy-vault.ts
│ ├── smoke-vault.ts # read-only
│ └── smoke-vault-spend.ts # approve + deposit + spend (idempotente)
│
├── test/
│ └── vault-guardrails.spec.ts
│
├── deployments/
│ └── arcTestnet.json
│
├── .env # NO se comitea
├── hardhat.config.ts
├── package.json
└── README.md
```
---

## Variables de entorno requeridas

`.env`:

```bash
# RPC y Explorer
ARC_TESTNET_RPC_PRIMARY=https://rpc.testnet.arc.network
ARC_EXPLORER_URL=https://testnet.arcscan.app

# Clave de deploy (owner)
DEPLOYER_PRIVATE_KEY=0xPRIVATE_KEY_OWNER

# USDC (Arc Testnet)
ARC_USDC_ADDRESS=0x3600000000000000000000000000000000000000

# Roles del Vault
VAULT_OWNER_ADDRESS=0xADDRESS_OWNER
VAULT_AGENT_EXECUTOR_ADDRESS=0xADDRESS_AGENT

# Guardrails (6 decimales)
VAULT_MAX_PER_TX=100000000      # 100 USDC
VAULT_DAILY_LIMIT=250000000     # 250 USDC

# Smoke spend (opcional)
OWNER_PRIVATE_KEY=0xPRIVATE_KEY_OWNER
AGENT_PRIVATE_KEY=0xPRIVATE_KEY_AGENT
SMOKE_RECIPIENT_ADDRESS=0xADDRESS_OWNER
SMOKE_DEPOSIT_AMOUNT=500000     # 0.5 USDC
SMOKE_SPEND_AMOUNT=100000       # 0.1 USDC
```
---
## Tests locales
```bash
npm run build
npm test
```
Cubre:
- Deploy correcto
- Deposit
- Restricción de agente
- maxPerTx
- dailyLimit
- Reset diario
- Permisos admin

---
## Deploy a Arc Testnet
```bash
npm run arc:deploy:vault
```
**El deploy:**
- Despliega el contrato.
- Registra la address y tx hash en deployments/arcTestnet.json.

---
## Smoke test (read-only)
```bash
npm run arc:smoke:vault
```

Valida:
- owner
- agent
- usdc
- límites
- gasto actual del día

---
## Smoke test on-chain con gasto real
```bash
npm run arc:smoke:vault:spend
```
Este script:
- Hace approve solo si es necesario.
- Deposita solo si el Vault necesita fondos.
- Ejecuta spend() desde el agent.

Imprime:

- tx hash + link de approve
- tx hash + link de deposit
- tx hash + link de spend
- Es idempotente: se puede correr múltiples veces sin romper nada.

---
## Deployments (Arc Testnet)

- **USDC (nativo / ERC-20 opcional)**
0x3600000000000000000000000000000000000000

- **VaultGuardrails**
0x3fFd55E53D7740a93b8B62e93ed11a2c0651098E

- **Deploy tx**
0x3afa084cad67ac4f908be79c0a232aab95e5b8f959e1c60244512d6170016fc1

Explorer:

- https://testnet.arcscan.app/address/0x3fFd55E53D7740a93b8B62e93ed11a2c0651098E

- https://testnet.arcscan.app/tx/0x3afa084cad67ac4f908be79c0a232aab95e5b8f959e1c60244512d6170016fc1

---
## Errores comunes y soluciones

❌ ERC20: transfer amount exceeds balance
- El owner no tiene suficiente USDC para depositar.
- Solución: reduce el monto o fondea la wallet.

❌ Unauthorized
- Estás llamando spend() con una wallet que no es el agent.
- O estás llamando withdraw() sin ser owner.

❌ No hay gas
- En Arc, el gas se paga con USDC nativo.
- Asegúrate de que owner y agent tengan USDC.

---
## Estado del proyecto
- Fase 1 completada.
- Contrato desplegado y probado en testnet.
- Guardrails imposibles de violar por el agente.

Listo para integrar con:
- agentes de IA
- wallets programables
- capa de ejecución (Fase 2).

## 📌 Próximos pasos (fuera de scope)
- Integración con ejecución de agentes (Fase 2).
- Políticas más avanzadas (ventanas dinámicas, listas blancas).
- Auditoría formal.

---

# Circle Programmable Wallets Integration

Este módulo implementa la **integración completa de Circle Programmable Wallets (Developer-Controlled)** para habilitar que un **agente de IA** ejecute transacciones on-chain en **Arc Testnet**, incluyendo:

- Creación de wallets controladas por Circle
- Obtención de address on-chain del agente
- Transferencia de USDC en Arc Testnet
- Ejecución de `spend()` contra un contrato `VaultGuardrails`
- Automatización vía GitHub Actions (sin frontend)

Todo el flujo es **real, verificable on-chain**, sin mocks.

---

## Objetivo (Fase 2.1)

- Integrar Circle Wallets (sandbox/testnet)
- Crear la wallet del agente (developer-controlled)
- Emitir al menos **1 transacción USDC** en Arc Testnet
- Ejecutar `spend(address,uint256)` desde el agente contra el Vault
- Obtener evidencia:
  - `circleTxId`
  - `txHash`
  - link a Arcscan

---

## Networks & Contracts

### Arc Testnet
- RPC: `https://rpc.testnet.arc.network`
- Explorer: `https://testnet.arcscan.app`

### USDC (Arc Testnet)
- Address: `0x3600000000000000000000000000000000000000`

### VaultGuardrails (ya deployado)
- Address:  
  `0x3fFd55E53D7740a93b8B62e93ed11a2c0651098E`

---

## Arquitectura de alto nivel
```bash
┌───────────────────────────┐
│        GitHub Actions     │
│  (CI / Automation Layer)  │
└─────────────┬─────────────┘
              │
              │  REST API (W3S)
              ▼
┌───────────────────────────┐
│        Circle W3S         │
│  Programmable Wallets     │
│  (Developer-Controlled)   │
└─────────────┬─────────────┘
              │
              │  Signed tx / Contract execution
              ▼
┌──────────────────────────┐
│        Arc Testnet       │
│        (EVM Chain)       │
│                          │
│  ┌─────────────────────┐ │
│  │  Agent Wallet (EOA) │◄┼── Circle-controlled signer
│  └─────────┬───────────┘ │
│            │             │
│            │ spend()     │
│            ▼             │
│  ┌─────────────────────┐ │
│  │  VaultGuardrails    │ │
│  │  - onlyAgent        │ │
│  │  - maxPerTx         │ │
│  │  - dailyLimit       │ │
│  └─────────────────────┘ │
│            │             │
│            ▼             │
│        USDC (Arc)        │
└──────────────────────────┘

```
---
## Estructura de carpetas
```bash
.
├── scripts/
│   ├── circle/
│   │   ├── 00_publicKey.ts              # Get entity public key (Circle)
│   │   ├── 01_createWalletSet.ts         # Create WalletSet
│   │   ├── 02_createWallets_arc.ts       # Create agent + receiver wallets
│   │   ├── 04_getBalances.ts             # Get balances (tokenId discovery)
│   │   ├── 05_transfer_usdc.ts           # USDC transfer (agent → receiver)
│   │   ├── 06_waitTx.ts                  # Poll tx → state + txHash
│   │   ├── 07_callSpend_vault.ts         # Call spend() on Vault
│   │   └── _shared.ts                    # Shared Circle helpers
│   │
│   └── vault/
│       ├── 00_readVaultState.ts          # Read owner / agentExecutor
│       └── 01_setAgentExecutor_circle.ts # setAgentExecutor(agent)
│
├── .github/
│   └── workflows/
│       ├── circle-spend-and-wait.yml     # spend() + wait (1 click)
│       ├── vault-read.yml                # Read Vault state
│       └── vault-set-agent-executor.yml  # Admin tx (owner)
│
├── deployments/
│   └── arcTestnet.json                   # Registry (Vault already deployed)
│
├── .env.example                          # Environment reference (no secrets)
└── README.circle-integration.md           # Circle integration documentation

```

---

## Variables de entorno

### `.env.example` (referencia)

```bash 
env
# Circle
CIRCLE_API_KEY=TEST_API_KEY:***
CIRCLE_ENTITY_SECRET_HEX=
CIRCLE_BASE_URL=https://api.circle.com/v1/w3s
CIRCLE_BLOCKCHAIN=ARC-TESTNET

# Wallets
CIRCLE_WALLET_SET_ID=
CIRCLE_WALLET_ID_AGENT=

# Vault
VAULT_ADDRESS=0x3fFd55E53D7740a93b8B62e93ed11a2c0651098E
CIRCLE_WALLET_ADDRESS_AGENT=

# Spend params (JSON ABI)
SPEND_ABI_PARAMS_JSON=["0xDESTINATION",100000]

# Arc
ARC_EXPLORER_TX=https://testnet.arcscan.app/tx/
⚠️ En GitHub Actions todas estas variables se cargan como Repository Secrets.
```
---

## Flujo ejecutado (paso a paso)
1️.- Configuración de Entity (Circle Console)

- Se obtiene el publicKey del entity
- Se cifra el Entity Secret
- Se setea el ciphertext en Circle Console
(Este paso se hace una sola vez)

2.- Creación de WalletSet y wallets
Scripts:
- 01_createWalletSet.ts
- 02_createWallets_arc.ts

Resultados:
- Wallet del agente creada
- Address on-chain obtenido

Agent address (Arc):
```bash
0x94f6256f780b4ba6589166dc51765e6d3675dd6c
```

3.- Transferencia USDC (evidencia mínima)

Scripts:
- 04_getBalances.ts
- 05_transfer_usdc.ts
- 06_waitTx.ts

Resultado:
- USDC transferido en Arc Testnet
- txHash verificable en Arcscan

4.- Habilitar agente en el Vault (puente Fase 1 → Fase 2)

El Vault usa:
```bash
modifier onlyAgent() {
  if (msg.sender != agentExecutor) revert Unauthorized();
}
```

Se ejecutó como owner:
```bash
setAgentExecutor(circleAgentAddress)
```

Tx administrativa (Arc):
```bash
0xe6d135880774ad28aa23309a79a7bbac934e3e30f883a88e86680b73880ba514
```

5.- Ejecución de spend() (flujo final automatizado)

Workflow:
```bash
.github/workflows/circle-spend-and-wait.yml
```

Este workflow:
1. Llama spend(address,uint256)
2. Captura automáticamente el circleTxId
3. Espera confirmación
4. Imprime txHash + Arcscan

Resultado final (spend on-chain):
* circleTxId: a8faa556-b5d1-578d-bccf-c15d861e5360
* txHash:
0x7ecf3e46301a586637d3ce0af27fe61967abbd9e607004a772c05f7c6f3333a8
* Arcscan:
https://testnet.arcscan.app/tx/0x7ecf3e46301a586637d3ce0af27fe61967abbd9e607004a772c05f7c6f3333a8

---

## Automatización (por qué GitHub Actions)

Debido a:
- restricciones regionales
- estabilidad
- necesidad de evidencia reproducible

Toda la integración se ejecuta vía GitHub Actions, evitando dependencias locales, VPNs o UI manual.

En producción, este flujo se reemplaza por:
- backend + webhooks
- polling automático
- persistencia de estados

--- 
## Troubleshooting real (casos encontrados)

blockchain not supported
- Usar ARC-TESTNET, no ARC

ESTIMATION_ERROR / Unauthorized
- El Vault no reconoce aún al agente
- Solución: setAgentExecutor(circleAgentAddress)

JSON parse error en SPEND_ABI_PARAMS_JSON
- Debe ser JSON válido:
```bash
["0xDESTINATION",100000]
```
---
## Estado final

- Wallet Circle creada
- Address del agente en Arc
- Transferencia USDC on-chain
- Vault conectado al agente
- spend() ejecutado y verificado
- Automatización completa (1 click)