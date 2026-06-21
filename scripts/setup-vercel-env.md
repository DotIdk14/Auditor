# Configuración de Vercel Environment Variables

## 1. Variables requeridas para el usuario supervisor

En el dashboard de Vercel (`https://vercel.com/.../settings/environment-variables`),
agrega o actualiza estas variables:

| Variable | Valor | Propósito |
|----------|-------|-----------|
| `ALLOWED_EMAILS` | `ianidk1@gmail.com` (o separado por comas si hay más) | Permite el login por email |
| `SUPERVISOR_PASSWORD` | `THe100cia` | Contraseña compartida para supervisores |

## 2. Verificar otras variables existentes

Asegúrate de que estas también estén configuradas:

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `JWT_SECRET` | ✅ | HMAC-SHA256 secret |
| `ASSEMBLYAI_API_KEY` | ✅ | Para transcripción de audio |
| `OPENROUTER_API_KEY` | ✅ | Para análisis cognitivo |
| `SUPABASE_URL` | ✅ | URL del proyecto Supabase |
| `SUPABASE_ANON_KEY` | ✅ | Anon key de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Para login (bypass RLS) |

## 3. Redeploy

Después de actualizar las variables, haz un redeploy:
```
Vercel Dashboard → Deployments → ... → Redeploy
```

## 4. Probar login

URL: `https://tu-app.vercel.app/login`
- Email: `ianidk1@gmail.com`
- Password: `THe100cia`
