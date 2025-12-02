#!/usr/bin/env node

/**
 * Script de verificação de ambiente
 * Verifica se todas as dependências estão instaladas corretamente
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);

const checks = {
  passed: [],
  failed: [],
  warnings: []
};

console.log('🔍 Verificando ambiente do sistema MQTT ESP32 Monitor...\n');

// Check Node.js version
async function checkNode() {
  try {
    const { stdout } = await execAsync('node --version');
    const version = stdout.trim();
    const major = parseInt(version.split('.')[0].replace('v', ''));
    
    if (major >= 18) {
      checks.passed.push(`✅ Node.js ${version} (OK)`);
    } else {
      checks.failed.push(`❌ Node.js ${version} (necessário v18 ou superior)`);
    }
  } catch (err) {
    checks.failed.push('❌ Node.js não encontrado');
  }
}

// Check npm
async function checkNpm() {
  try {
    const { stdout } = await execAsync('npm --version');
    checks.passed.push(`✅ npm ${stdout.trim()} (OK)`);
  } catch (err) {
    checks.failed.push('❌ npm não encontrado');
  }
}

// Check if node_modules exists
function checkNodeModules() {
  if (fs.existsSync('./node_modules')) {
    checks.passed.push('✅ node_modules instalado');
  } else {
    checks.warnings.push('⚠️  node_modules não encontrado - execute: npm install');
  }
}

// Check Mosquitto
async function checkMosquitto() {
  try {
    await execAsync('mosquitto -h');
    checks.passed.push('✅ Mosquitto instalado');
  } catch (err) {
    checks.warnings.push('⚠️  Mosquitto não encontrado (opcional para desenvolvimento)');
  }
}

// Check mosquitto_pub (cliente)
async function checkMosquittoClients() {
  try {
    await execAsync('mosquitto_pub --help');
    checks.passed.push('✅ Mosquitto clients instalados');
  } catch (err) {
    checks.warnings.push('⚠️  mosquitto_pub não encontrado (necessário para testes)');
  }
}

// Check required files
function checkRequiredFiles() {
  const requiredFiles = [
    'package.json',
    'vite.config.ts',
    'tailwind.config.js',
    'postcss.config.js',
    'index.html',
    'main.tsx',
    'App.tsx',
    'styles/globals.css'
  ];
  
  requiredFiles.forEach(file => {
    if (fs.existsSync(`./${file}`)) {
      checks.passed.push(`✅ ${file} existe`);
    } else {
      checks.failed.push(`❌ ${file} não encontrado`);
    }
  });
}

// Check package.json dependencies
function checkDependencies() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
    const deps = Object.keys(packageJson.dependencies || {});
    const devDeps = Object.keys(packageJson.devDependencies || {});
    
    checks.passed.push(`✅ ${deps.length} dependências principais`);
    checks.passed.push(`✅ ${devDeps.length} dependências de desenvolvimento`);
    
    // Check critical dependencies
    const critical = ['react', 'react-dom', 'mqtt', 'tailwindcss', 'vite'];
    critical.forEach(dep => {
      if (deps.includes(dep) || devDeps.includes(dep)) {
        checks.passed.push(`✅ ${dep} configurado`);
      } else {
        checks.failed.push(`❌ ${dep} não encontrado no package.json`);
      }
    });
  } catch (err) {
    checks.failed.push('❌ Erro ao ler package.json');
  }
}

// Run all checks
async function runChecks() {
  await checkNode();
  await checkNpm();
  checkNodeModules();
  await checkMosquitto();
  await checkMosquittoClients();
  checkRequiredFiles();
  checkDependencies();
  
  // Print results
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESULTADO DA VERIFICAÇÃO\n');
  
  if (checks.passed.length > 0) {
    console.log('✅ PASSOU:\n');
    checks.passed.forEach(msg => console.log(`   ${msg}`));
    console.log('');
  }
  
  if (checks.warnings.length > 0) {
    console.log('⚠️  AVISOS:\n');
    checks.warnings.forEach(msg => console.log(`   ${msg}`));
    console.log('');
  }
  
  if (checks.failed.length > 0) {
    console.log('❌ FALHOU:\n');
    checks.failed.forEach(msg => console.log(`   ${msg}`));
    console.log('');
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Summary
  if (checks.failed.length === 0) {
    console.log('🎉 AMBIENTE OK! O sistema está pronto para rodar.\n');
    console.log('📝 Próximos passos:');
    console.log('   1. npm install (se node_modules não estiver instalado)');
    console.log('   2. npm run dev');
    console.log('   3. Acesse http://localhost:3000\n');
  } else {
    console.log('❌ Corrija os erros acima antes de continuar.\n');
    process.exit(1);
  }
}

runChecks().catch(err => {
  console.error('Erro ao executar verificações:', err);
  process.exit(1);
});
