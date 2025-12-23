#!/usr/bin/env node

/**
 * Script de Verificación de Configuración para Upload de Imágenes
 * 
 * Este script verifica que todas las configuraciones necesarias estén presentes
 * para que la funcionalidad de carga de imágenes funcione correctamente.
 */

require('dotenv').config({ path: '.env.local' });

console.log('🔍 Verificando configuración de upload de imágenes...\n');

let hasErrors = false;
let hasWarnings = false;

// Verificar variables de entorno
console.log('📋 Variables de Entorno:');
console.log('========================\n');

// Cloudinary
console.log('☁️  Cloudinary:');
if (process.env.CLOUDINARY_CLOUD_NAME) {
    console.log('  ✅ CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
} else {
    console.log('  ❌ CLOUDINARY_CLOUD_NAME: NO CONFIGURADO');
    hasErrors = true;
}

if (process.env.CLOUDINARY_API_KEY) {
    console.log('  ✅ CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY.substring(0, 5) + '...');
} else {
    console.log('  ❌ CLOUDINARY_API_KEY: NO CONFIGURADO');
    hasErrors = true;
}

if (process.env.CLOUDINARY_API_SECRET) {
    console.log('  ✅ CLOUDINARY_API_SECRET: [OCULTO]');
} else {
    console.log('  ❌ CLOUDINARY_API_SECRET: NO CONFIGURADO');
    hasErrors = true;
}

console.log('');

// JWT
console.log('🔐 JWT:');
if (process.env.JWT_SECRET) {
    const secretLength = process.env.JWT_SECRET.length;
    if (secretLength >= 32) {
        console.log('  ✅ JWT_SECRET: Configurado (', secretLength, 'caracteres)');
    } else {
        console.log('  ⚠️  JWT_SECRET: Configurado pero muy corto (', secretLength, 'caracteres, mínimo 32)');
        hasWarnings = true;
    }
} else {
    console.log('  ❌ JWT_SECRET: NO CONFIGURADO');
    hasErrors = true;
}

console.log('');

// Database
console.log('🗄️  Base de Datos:');
if (process.env.DATABASE_URL || process.env.NEON_DATABASE_URL) {
    console.log('  ✅ DATABASE_URL: Configurado');
} else {
    console.log('  ❌ DATABASE_URL: NO CONFIGURADO');
    hasErrors = true;
}

console.log('');

// Node Environment
console.log('🌍 Entorno:');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'development (por defecto)');

console.log('');

// Verificar archivos de configuración
console.log('📁 Archivos de Configuración:');
console.log('============================\n');

const fs = require('fs');
const path = require('path');

// Verificar config/cloudinary.js
const cloudinaryConfigPath = path.join(__dirname, 'config', 'cloudinary.js');
if (fs.existsSync(cloudinaryConfigPath)) {
    console.log('  ✅ config/cloudinary.js existe');

    // Leer el archivo y verificar que use variables de entorno
    const content = fs.readFileSync(cloudinaryConfigPath, 'utf8');
    if (content.includes('process.env.CLOUDINARY')) {
        console.log('  ✅ config/cloudinary.js usa variables de entorno');
    } else {
        console.log('  ⚠️  config/cloudinary.js podría tener credenciales hardcodeadas');
        hasWarnings = true;
    }
} else {
    console.log('  ❌ config/cloudinary.js NO EXISTE');
    hasErrors = true;
}

// Verificar api/upload.js
const uploadApiPath = path.join(__dirname, 'api', 'upload.js');
if (fs.existsSync(uploadApiPath)) {
    console.log('  ✅ api/upload.js existe');
} else {
    console.log('  ❌ api/upload.js NO EXISTE');
    hasErrors = true;
}

// Verificar middleware/auth.js
const authMiddlewarePath = path.join(__dirname, 'middleware', 'auth.js');
if (fs.existsSync(authMiddlewarePath)) {
    console.log('  ✅ middleware/auth.js existe');
} else {
    console.log('  ❌ middleware/auth.js NO EXISTE');
    hasErrors = true;
}

console.log('');

// Verificar dependencias
console.log('📦 Dependencias:');
console.log('================\n');

try {
    const packageJson = require('./package.json');
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

    const requiredDeps = {
        'cloudinary': 'Cloudinary SDK',
        'multer': 'File upload middleware',
        'express': 'Web framework',
        'dotenv': 'Environment variables',
        'jsonwebtoken': 'JWT authentication'
    };

    for (const [dep, description] of Object.entries(requiredDeps)) {
        if (dependencies[dep]) {
            console.log(`  ✅ ${dep} (${description}): ${dependencies[dep]}`);
        } else {
            console.log(`  ❌ ${dep} (${description}): NO INSTALADO`);
            hasErrors = true;
        }
    }
} catch (error) {
    console.log('  ❌ Error leyendo package.json:', error.message);
    hasErrors = true;
}

console.log('');

// Resumen
console.log('📊 Resumen:');
console.log('===========\n');

if (!hasErrors && !hasWarnings) {
    console.log('✅ ¡Todo está configurado correctamente!');
    console.log('');
    console.log('Próximos pasos:');
    console.log('1. Asegúrate de que estas mismas variables estén en Vercel');
    console.log('2. Redeploy la aplicación en Vercel');
    console.log('3. Prueba subir imágenes desde otra PC');
    process.exit(0);
} else if (hasErrors) {
    console.log('❌ Se encontraron errores críticos que deben ser corregidos.');
    console.log('');
    console.log('Acciones requeridas:');
    console.log('1. Crea un archivo .env.local basado en .env.example');
    console.log('2. Configura todas las variables de entorno marcadas como ❌');
    console.log('3. Ejecuta este script nuevamente para verificar');
    process.exit(1);
} else if (hasWarnings) {
    console.log('⚠️  Se encontraron advertencias. La aplicación podría funcionar pero se recomienda revisar.');
    console.log('');
    console.log('Recomendaciones:');
    console.log('1. Revisa las advertencias marcadas con ⚠️');
    console.log('2. Considera hacer los ajustes sugeridos');
    process.exit(0);
}
