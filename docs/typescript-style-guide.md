# Estándar de Código y Estilo para Frontend con React, TypeScript y shadcn/ui (usando npm)

Este documento define las reglas y buenas prácticas para el desarrollo de aplicaciones frontend con React y TypeScript, utilizando **Vite** como bundler, **Tailwind CSS** + **shadcn/ui** para estilos y componentes, **TanStack Query** para gestión de estado del servidor, **Zustand** para estado global, **React Router** para enrutamiento, **Axios** para peticiones HTTP, **Vitest** para pruebas y **npm** como gestor de paquetes. Se sigue una **arquitectura limpia basada en funcionalidades (Clean Architecture)**. El objetivo es garantizar un código consistente, mantenible, accesible, seguro y de alta calidad.

---

## 1. Introducción

### 1.1 Propósito
Establecer un conjunto de normas obligatorias para todos los desarrolladores del equipo que trabajen en el frontend, facilitando la colaboración, revisión de código y el mantenimiento de las aplicaciones desarrolladas con el stack definido.

### 1.2 Alcance
Aplica a todo el código fuente, pruebas, configuración y documentación técnica de los proyectos frontend que utilicen:
- **React 18+** (con Hooks)
- **TypeScript 5+** (tipado estricto)
- **Vite** como bundler
- **Tailwind CSS** + **shadcn/ui** para estilos y componentes
- **TanStack Query** (React Query) para estado del servidor
- **Zustand** para estado global
- **React Router** v6+ para enrutamiento
- **Axios** para peticiones HTTP
- **Vitest** + **React Testing Library** para pruebas
- **ESLint** y **Prettier** para formato y linting
- **SonarQube** para análisis estático de código
- **npm** como gestor de paquetes

### 1.3 Referencias
Este estándar se basa en:
- [React Official Documentation](https://reactjs.org/docs/getting-started.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [React Router Documentation](https://reactrouter.com/en/main)
- [Axios Documentation](https://axios-http.com/)
- [Vitest Documentation](https://vitest.dev/)
- [Airbnb React/JSX Style Guide](https://github.com/airbnb/javascript/tree/master/react)
- [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)

---

## 2. Principios Generales

- **Consistencia**: El código debe parecer escrito por una sola persona.
- **Legibilidad**: El código se escribe para humanos, no solo para máquinas.
- **Mantenibilidad**: Favorecer la simplicidad y la claridad.
- **Tipado fuerte**: Usar TypeScript en modo estricto para evitar errores en tiempo de compilación.
- **Componentización**: Crear componentes pequeños y reutilizables.
- **Accesibilidad**: Seguir prácticas de accesibilidad (WCAG 2.1 AA).
- **Rendimiento**: Optimizar renderizados, evitar fugas de memoria.
- **Seguridad por defecto**: Prevenir XSS, CSRF, y otras vulnerabilidades.
- **Arquitectura limpia**: Organizar el código por funcionalidades (features) con separación clara de responsabilidades.

---

## 3. Estructura del Proyecto (Clean Architecture por Features)

### 3.1 Organización de Carpetas

```
proyecto/
├── public/                      # Archivos estáticos (index.html, favicon, etc.)
├── src/
│   ├── main.tsx                 # Punto de entrada
│   ├── App.tsx                  # Componente raíz
│   ├── app/                      # Configuración de la aplicación (proveedores, layout global)
│   │   ├── providers.tsx         # Proveedores: QueryClient, Router, Theme, etc.
│   │   └── layout.tsx            # Layout principal (header, footer, etc.)
│   ├── assets/                    # Imágenes, fuentes, estilos globales
│   ├── core/                       # Lógica de infraestructura y utilidades compartidas
│   │   ├── routes/                  # Definición de rutas (React Router)
│   │   │   ├── index.tsx
│   │   │   └── types.ts
│   │   ├── utils/                    # Utilidades globales (formateo, validación, etc.)
│   │   └── constants/                 # Constantes globales
│   ├── features/                    # Módulos funcionales (cada feature contiene todo lo relacionado)
│   │   ├── auth/                      # Feature de autenticación
│   │   │   ├── components/             # Componentes específicos de auth
│   │   │   ├── hooks/                  # Custom hooks de auth (ej: useAuth, useLogin)
│   │   │   ├── services/               # Llamadas API relacionadas con auth (usando Axios)
│   │   │   ├── store/                   # Estado específico de auth (Zustand)
│   │   │   ├── types/                   # Tipos/interfaces específicos
│   │   │   ├── utils/                   # Utilidades de auth
│   │   │   └── pages/                    # Páginas completas de la feature
│   │   │       ├── LoginPage.tsx
│   │   │       └── RegisterPage.tsx
│   │   ├── users/                      # Feature de usuarios
│   │   └── ...
│   ├── shared/                       # Código compartido entre features
│   │   ├── ui/                         # Componentes de UI reutilizables (basados en shadcn/ui)
│   │   │   ├── button/                  # Componente Button (shadcn/ui)
│   │   │   ├── dialog/                  # Componente Dialog
│   │   │   └── ...
│   │   ├── hooks/                       # Hooks globales (compartidos entre features)
│   │   ├── utils/                        # Utilidades globales (si no están en core)
│   │   └── types/                         # Tipos globales (interfaces compartidas)
│   ├── store/                          # Estado global (Zustand) - fuera de features si es global
│   │   ├── appStore.ts                   # Ejemplo de store global
│   │   └── ...
│   └── test/                            # Configuración de pruebas (setup, mocks)
├── .eslintrc.cjs
├── .prettierrc
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── package.json
└── index.html
```

**Justificación**: La estructura por features (dominios) aplica los principios de Clean Architecture: cada feature es un módulo independiente con su propia lógica de presentación (pages/components), negocio (hooks/services), estado (store) y tipos. El código compartido se coloca en `shared/ui` (componentes shadcn/ui personalizados), `shared/hooks`, etc. La capa `core` contiene infraestructura como rutas y utilidades globales. Esto facilita la escalabilidad, el aislamiento y el mantenimiento.

### 3.2 Nombres de Archivos
- **Componentes**: `PascalCase.tsx` (ej: `UserProfile.tsx`)
- **Páginas**: `PascalCase.tsx` con sufijo `Page` (ej: `LoginPage.tsx`)
- **Hooks**: `camelCase.ts` con prefijo `use` (ej: `useAuth.ts`)
- **Servicios**: `camelCase.ts` con sufijo `service` (ej: `authService.ts`)
- **Stores (Zustand)**: `camelCase.ts` con sufijo `store` (ej: `authStore.ts`)
- **Utilidades**: `camelCase.ts` (ej: `formatDate.ts`)
- **Tipos**: `camelCase.ts` o `PascalCase.ts` si son interfaces principales (ej: `user.types.ts`)

### 3.3 Alias de Importación
Configurar en `vite.config.ts` y `tsconfig.json` alias para rutas absolutas:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@app/*": ["./src/app/*"],
      "@assets/*": ["./src/assets/*"],
      "@core/*": ["./src/core/*"],
      "@features/*": ["./src/features/*"],
      "@shared/*": ["./src/shared/*"]
    }
  }
}
```
Usar estos alias en las importaciones para evitar rutas relativas largas.

---

## 4. Estilo de Código TypeScript/React

### 4.1 Formato con Prettier
Usar Prettier con la siguiente configuración (`.prettierrc`):
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "auto"
}
```

### 4.2 Linting con ESLint
Extender configuraciones recomendadas:
- `eslint:recommended`
- `plugin:@typescript-eslint/recommended`
- `plugin:react/recommended`
- `plugin:react-hooks/recommended`
- `plugin:jsx-a11y/recommended`
- `plugin:import/recommended`
- `plugin:import/typescript`
- `prettier` (para evitar conflictos)

Reglas adicionales:
- Prohibir `any` explícito (usar `unknown` si es necesario).
- Exigir return types en funciones (opcional pero recomendado).
- Prohibir `console.log` en producción (advertencia).
- Ordenar imports (con plugin `import`).

### 4.3 TypeScript Estricto
`tsconfig.json` debe tener:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "jsx": "react-jsx"
  }
}
```

### 4.4 Nombres y Convenciones
- **Componentes**: `UpperCamelCase` (ej: `UserCard`).
- **Props interfaces**: `ComponentNameProps` (ej: `UserCardProps`).
- **Event handlers**: prefijo `handle` + nombre (ej: `handleClick`, `handleSubmit`).
- **Funciones auxiliares**: verbos en `camelCase` (ej: `formatDate`).
- **Constantes globales**: `UPPER_SNAKE_CASE` (ej: `API_BASE_URL`).
- **Enums**: `PascalCase` para el enum y `UPPER_SNAKE_CASE` para sus miembros.

### 4.5 Orden de Importaciones
1. React y librerías externas (react, react-dom)
2. Otras librerías de terceros (axios, @tanstack/react-query, zustand, etc.)
3. Módulos internos (alias `@/...`)
4. Componentes
5. Hooks
6. Servicios
7. Utilidades
8. Tipos
9. Estilos (si los hubiera)

Separar grupos con línea en blanco.

### 4.6 Estructura de un Componente
```tsx
import React from 'react';

export interface UserCardProps {
  name: string;
  email: string;
  onEdit?: (id: string) => void;
}

export const UserCard: React.FC<UserCardProps> = ({ name, email, onEdit }) => {
  const handleEdit = () => {
    onEdit?.(id);
  };

  return (
    <div className="border rounded-lg p-4 shadow-sm">
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="text-gray-600">{email}</p>
      {onEdit && (
        <button
          onClick={handleEdit}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Editar
        </button>
      )}
    </div>
  );
};
```

**Reglas**:
- Usar `export interface` antes del componente.
- Usar `React.FC` o tipar explícitamente `{ name, email }: UserCardProps`.
- Extraer lógica en hooks personalizados si es compleja.
- Evitar lógica en el JSX; usar variables intermedias.

---

## 5. Componentes y Hooks

### 5.1 Componentes Funcionales
- Siempre usar funciones, no clases (a menos que se necesiten características específicas de clase, como Error Boundaries).
- Usar `const Component: React.FC<Props> = ({ prop }) => { ... }`.

### 5.2 Props
- Definir interfaces explícitas.
- Usar props opcionales con `?` y valores por defecto con operador `=` en la desestructuración.
- No mutar props.

### 5.3 Hooks Personalizados
- Nombrar con prefijo `use` (ej: `useLocalStorage`).
- Encapsular lógica de estado y efectos secundarios.
- Devolver un objeto con valores y funciones.

### 5.4 Reglas de Hooks
- Solo llamar hooks en el nivel superior (no en condicionales, bucles o funciones anidadas).
- Solo llamar hooks desde componentes funcionales u otros hooks.
- Usar `eslint-plugin-react-hooks` para verificar.

### 5.5 Renderizado Condicional
- Usar operadores lógicos `&&` y ternarios, pero evitar anidamientos complejos.
- Extraer lógica condicional a variables.

### 5.6 Listas y Keys
- Usar `key` único y estable (preferir ID, no índice a menos que sea estático y sin reordenamiento).
- Extraer elementos de lista a componente si es complejo.

---

## 6. Manejo de Estado

### 6.1 Estado Local
- Usar `useState` para estado simple.
- Usar `useReducer` para lógica de estado compleja (múltiples sub-valores o transiciones).

### 6.2 Estado Global con Zustand
- Crear stores modulares, preferiblemente por feature o dominio.
- Usar `create` de Zustand con typescript.
- Evitar stores gigantes; dividir en stores más pequeños.

**Ejemplo de store (authStore.ts)**:
```tsx
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/shared/services/api';
import { User } from '@/features/auth/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/login', { email, password });
          set({ user: response.data.user, token: response.data.token });
        } finally {
          set({ isLoading: false });
        }
      },
      logout: () => set({ user: null, token: null }),
    }),
    { name: 'auth-storage' } // persistencia opcional
  )
);
```

### 6.3 Estado del Servidor con TanStack Query
- Usar `useQuery` y `useMutation` para operaciones asíncronas.
- Definir hooks personalizados en cada feature que encapsulen las consultas.
- Configurar `QueryClient` con opciones globales (staleTime, retry, etc.) en `app/providers.tsx`.

**Ejemplo de hook (useUsers.ts)**:
```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/services/api';
import { User } from '../types';

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get<User[]>('/users');
      return data;
    },
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newUser: Omit<User, 'id'>) => api.post('/users', newUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
```

---

## 7. Estilos con Tailwind CSS y shadcn/ui

### 7.1 Enfoque Principal
- **Tailwind CSS** es el framework de estilos utilitario base.
- **shadcn/ui** proporciona componentes accesibles y personalizables, construidos sobre Radix UI y Tailwind. Se instalan como componentes propios (código en `shared/ui`), no como dependencia.

### 7.2 Configuración de Tailwind
- Personalizar `tailwind.config.js` con la paleta de colores, fuentes, etc., de la aplicación.
- Asegurar que las clases de shadcn/ui estén correctamente integradas.

### 7.3 Uso de shadcn/ui
- Los componentes de shadcn/ui se añaden mediante el CLI y se colocan en `src/shared/ui/`.
- Estos componentes pueden ser modificados para adaptarse al diseño del proyecto.
- No se deben modificar los componentes base de shadcn/ui sin justificación; en su lugar, extender mediante props o clases adicionales.

**Ejemplo de uso**:
```tsx
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/shared/ui/dialog';

export const MyComponent = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Abrir</Button>
      </DialogTrigger>
      <DialogContent>
        <h2>Contenido</h2>
      </DialogContent>
    </Dialog>
  );
};
```

### 7.4 Buenas Prácticas con Tailwind
- Mantener las clases ordenadas (usar el plugin Prettier para Tailwind).
- Evitar clases en línea demasiado largas; si un componente tiene muchas clases, considerar si necesita ser dividido.
- Para variantes (hover, focus, responsive), usar los modificadores de Tailwind.
- Para estilos reutilizables, extraer a componentes o usar `@apply` en archivos CSS, pero priorizar la composición con clases.

---

## 8. Consumo de APIs con Axios

### 8.1 Configuración del Cliente HTTP
- Crear una instancia de Axios en `src/shared/services/api.ts` con configuración base.
- Añadir interceptores para manejo de tokens, logging, y errores globales.

**Ejemplo**:
```tsx
import axios from 'axios';
import { useAuthStore } from '@/features/auth/store/authStore';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Manejo global de errores (ej: 401 redirigir a login)
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 8.2 Tipado de Respuestas
- Definir tipos para request y response.
- Usar genéricos en funciones.

### 8.3 Servicios por Feature
- Dentro de cada feature, crear archivos de servicio que utilicen la instancia `api` para realizar llamadas específicas.
- Estos servicios son consumidos por los hooks de TanStack Query o directamente por Zustand.

---

## 9. Enrutamiento con React Router

### 9.1 Definición de Rutas
- Crear un archivo de rutas en `src/core/routes/index.tsx` que defina todas las rutas de la aplicación, usando lazy loading para división de código.

**Ejemplo**:
```tsx
import { createBrowserRouter } from 'react-router-dom';
import { lazy } from 'react';
import App from '@/app/layout';

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const UsersPage = lazy(() => import('@/features/users/pages/UsersPage'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'users', element: <UsersPage /> },
    ],
  },
]);
```

### 9.2 Protección de Rutas
- Usar loaders o componentes wrapper para verificar autenticación y permisos.

**Ejemplo de loader protegido**:
```tsx
import { redirect } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';

export const protectedLoader = () => {
  const token = useAuthStore.getState().token;
  if (!token) {
    return redirect('/login');
  }
  return null;
};
```

### 9.3 Integración con Zustand y React Query
- En loaders y actions, se puede acceder a stores y queryClient si es necesario.

---

## 10. Manejo de Errores y Logging

### 10.1 Límites de Error (Error Boundaries)
- Usar componentes de clase para capturar errores en el árbol de componentes.
- Definir un `ErrorBoundary` genérico en `shared/ui/error-boundary.tsx` y usarlo en rutas o secciones críticas.

### 10.2 Captura de Errores en Promesas
- Usar `try/catch` en funciones asíncronas.
- Enviar errores a un servicio de monitoreo (Sentry, LogRocket).

### 10.3 Logging en Cliente
- Evitar `console.log` en producción (remover con ESLint).
- Usar un servicio externo para logs de errores (Sentry).
- Incluir información de usuario, URL, etc.

---

## 11. Pruebas con Vitest y React Testing Library

### 11.1 Configuración
- Usar Vitest por su integración nativa con Vite.
- Configurar en `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/*.test.{ts,tsx}', '**/types.ts', '**/index.ts'],
    },
  },
});
```

### 11.2 Estructura de Pruebas
- Colocar archivos de test junto al componente: `Component.test.tsx` o en carpeta `__tests__`.
- Usar `describe` para agrupar.

**Ejemplo**:
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders label correctly', () => {
    render(<Button label="Click me" />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Button label="Click" onClick={onClick} />);
    await userEvent.click(screen.getByText('Click'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

### 11.3 Mocks
- Mockear módulos externos (axios, react-query, etc.) con `vi.mock`.
- Usar Mock Service Worker (MSW) para simular APIs en pruebas de integración.

### 11.4 Cobertura
- Mantener cobertura mínima del 80% en líneas, funciones, ramas.
- Usar `vitest --coverage` y reportar a SonarQube.

### 11.5 Pruebas de Accesibilidad
- Usar `jest-axe` (adaptado a Vitest) para verificar reglas de accesibilidad automáticamente.

---

## 12. Rendimiento

### 12.1 Optimización de Renderizados
- Usar `React.memo` para componentes que renderizan con las mismas props frecuentemente.
- Usar `useMemo` para valores computados costosos.
- Usar `useCallback` para funciones pasadas a componentes hijos memoizados.
- Evitar renderizados innecesarios con Context (separar contextos por dominio).

### 12.2 Carga de Código (Code Splitting)
- Usar `React.lazy` y `Suspense` para división por rutas (ya aplicado en enrutamiento).
- Usar `import()` dinámico para módulos pesados.

### 12.3 Virtualización de Listas (Opcional)
- Para listas extremadamente largas (más de 1000 elementos) o con alto costo de renderizado, considerar usar `react-window` o `react-virtualized`.
- Evaluar la necesidad real; en la mayoría de las UI no es necesario.

### 12.4 Imágenes
- Optimizar imágenes (webp, lazy loading con `loading="lazy"`).
- Usar `srcset` para diferentes resoluciones.

### 12.5 Monitoreo de Rendimiento
- Usar Lighthouse, Web Vitals.
- Integrar con herramientas como Sentry para rendimiento.

---

## 13. Herramientas de Calidad y Análisis Estático

### 13.1 Pre-commit Hooks
- Usar **Husky** + **lint-staged** para ejecutar linters y formateadores antes de commit.

**Ejemplo `package.json`**:
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{css,json,md}": ["prettier --write"]
  }
}
```

### 13.2 ESLint y Prettier
- Configurar scripts en `package.json`:
  ```json
  {
    "lint": "eslint src --ext .ts,.tsx",
    "format": "prettier --write \"src/**/*.{ts,tsx,css,json,md}\""
  }
  ```

### 13.3 TypeScript
- Ejecutar `tsc --noEmit` en CI para verificar tipos.

### 13.4 SonarQube
- Analizar código TypeScript/React con SonarQube.
- Quality Gate: cobertura ≥ 80%, duplicación ≤ 3%, sin vulnerabilidades críticas, complejidad por función ≤ 10.
- Reglas personalizadas: exigir tipos explícitos en props, prohibir `any`, etc.

### 13.5 Complejidad Ciclomática
- Límite: 10 por función.
- Refactorizar funciones largas en varias más pequeñas.

---

## 14. Gestión de Dependencias y Construcción

### 14.1 Gestor de Paquetes
- Usar **npm**.
- El archivo `package-lock.json` debe estar versionado.

### 14.2 Scripts Comunes en package.json
```json
{
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "test": "vitest",
  "test:coverage": "vitest --coverage",
  "lint": "eslint src --ext .ts,.tsx",
  "format": "prettier --write \"src/**/*.{ts,tsx,css,json,md}\"",
  "typecheck": "tsc --noEmit"
}
```

### 14.3 Variables de Entorno
- Usar archivos `.env` (`.env.development`, `.env.production`).
- Prefijar con `VITE_` (Vite).
- Validar en tiempo de compilación con esquemas Zod si es necesario.

### 14.4 Docker
- Usar multi-stage build para producción.
- Servir con servidor estático (nginx).

---

## 15. Integración Continua y Despliegue

- Ejecutar en cada PR:
  1. `npm run lint`
  2. `npm run typecheck`
  3. `npm run test:coverage`
  4. Análisis SonarQube
- El merge solo si pasa el Quality Gate y las pruebas.

---

## Apéndice A: Resumen de Reglas Clave

| Categoría               | Regla                                                                 |
|-------------------------|-----------------------------------------------------------------------|
| Indentación             | 2 espacios, sin tabs                                                  |
| Longitud línea          | 100 caracteres (Prettier)                                             |
| TypeScript              | Modo estricto, no `any`                                               |
| Nombres componentes     | `PascalCase.tsx`                                                      |
| Nombres hooks           | `camelCase` con prefijo `use`                                         |
| Props interface         | `ComponentNameProps`                                                  |
| Imports                 | Orden: externos, internos; con grupos separados                       |
| Estilos                 | Tailwind CSS + shadcn/ui (componentes en shared/ui)                   |
| Estado global           | Zustand (stores modulares)                                            |
| Estado servidor         | TanStack Query (hooks por feature)                                    |
| Enrutamiento            | React Router con lazy loading                                         |
| Peticiones HTTP         | Axios con instancia configurada                                       |
| Pruebas                 | Vitest + RTL, cobertura ≥80%                                          |
| Seguridad               | Evitar dangerouslySetInnerHTML, sanitizar, validar entrada             |
| Rendimiento             | memo, useMemo, useCallback, lazy loading                              |
| Virtualización          | Solo si hay listas muy largas (opcional)                              |
| Complejidad ciclomática | ≤ 10 por función                                                      |
| Herramientas            | ESLint, Prettier, Husky, lint-staged, SonarQube                       |
| Gestor de paquetes      | npm (package-lock.json versionado)                                    |

---
