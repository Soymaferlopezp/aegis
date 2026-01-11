# Aegis — Financial Guardrails for AI Agents  
**Smart Contracts · Arc Testnet**

Repositorio base para el desarrollo y deploy de contratos inteligentes en **Arc Testnet**, usando **Hardhat + TypeScript**.

Este repo valida:
- pipeline de compilación
- conexión a Arc Testnet
- deploy on-chain
- smoke test reproducible
- registro automático de deployments

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
