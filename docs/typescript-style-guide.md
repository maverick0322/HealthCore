# Estándar de Código y Estilo para Frontend con React y TypeScript

Este documento define las reglas arquitectónicas, convenciones de codificación y estándares de calidad para el desarrollo frontend del proyecto HealthCore. El objetivo es garantizar un código limpio, modular, escalable y preparado para CI/CD.

---

## 1. Principios Generales

- **Consistencia**: El código debe verse como si hubiera sido escrito por una sola persona.
- **Legibilidad**: El código se escribe para ser leído por humanos, no solo para que la máquina lo ejecute.
- **Mantenibilidad**: Favorecer la claridad y la simplicidad sobre la complejidad innecesaria.
- **Tipado fuerte**: TypeScript en modo estricto para evitar errores en tiempo de compilación.
- **Componentización**: Crear componentes pequeños y reutilizables.
- **Arquitectura limpia**: Organizar por funcionalidades con separación clara de responsabilidades.
- **English First**: Absolutamente todo el código fuente (componentes, hooks, variables), comentarios internos y archivos deben escribirse en inglés.
- **Fail-Fast**: Validar entradas lo antes posible.

---

## 2. Propósito
Garantizar la consistencia, legibilidad, seguridad y mantenibilidad del código fuente entre todos los miembros del equipo, facilitando la integración continua y el cumplimiento del análisis estático (SonarQube).

---

## 3. Idioma
Todo el código fuente y documentación interna debe aplicar el principio **English First**.
* **Correcto**: `UserCard`, `useAuth`, `findByEmail`, `// Handles user login`
* **Incorrecto**: `TarjetaUsuario`, `useAuth`, `obtenerPorCorreo`, `// Maneja el login del usuario`

---

## 4. Estructura del proyecto (Clean Architecture por Features)

Para garantizar la separación de responsabilidades, los proyectos adoptarán una estructura por funcionalidades (features). El código se organiza estrictamente en las siguientes capas:

* **`app/`**: Configuración global (proveedores, layout principal).
* **`core/`**: Infraestructura compartida (rutas, utilidades, constantes globales).
* **`features/`**: Módulos funcionales autocontenidos. Cada feature incluye:
  * `components/` - Componentes específicos de la feature
  * `hooks/` - Custom hooks (ej. `useAuth`)
  * `services/` - Llamadas API (ej. `authService.ts`)
  * `store/` - Estado específico (Zustand)
  * `types/` - Tipos/interfaces específicos
  * `pages/` - Páginas completas (ej. `LoginPage.tsx`)
* **`shared/`**: Código compartido entre features:
  * `ui/` - Componentes reutilizables (shadcn/ui)
  * `hooks/` - Hooks globales
  * `utils/` - Utilidades globales
  * `types/` - Tipos globales

---

## 5. Reglas de nombramiento

### 5.1. Archivos
* **Componentes**: `PascalCase.tsx` (ej. `UserCard.tsx`)
* **Páginas**: `PascalCase` con sufijo `Page` (ej. `LoginPage.tsx`)
* **Hooks**: `camelCase.ts` con prefijo `use` (ej. `useAuth.ts`)
* **Servicios**: `camelCase.ts` con sufijo `service` (ej. `authService.ts`)
* **Stores**: `camelCase.ts` con sufijo `store` (ej. `authStore.ts`)
* **Utilidades**: `camelCase.ts` (ej. `formatDate.ts`)
* **Tipos**: `camelCase.ts` o `PascalCase.ts` si es interfaz principal (ej. `user.types.ts`)

### 5.2. Componentes y funciones
Usar `PascalCase` para componentes y `lowerCamelCase` para funciones y variables.
* **Correcto**:
  ```tsx
  export const UserCard: React.FC<UserCardProps> = ({ name, email }) => { ... }
  const handleSubmit = () => { ... }
  ```
* **Incorrecto**:
  ```tsx
  export const user_card = ({ name }) => { ... }
  const HandleSubmit = () => { ... }
  ```

### 5.3. Props interfaces
Usar sufijo `Props` con `PascalCase`.
* **Correcto**:
  ```tsx
  export interface UserCardProps { name: string; email: string; }
  ```
* **Incorrecto**:
  ```tsx
  export interface IUserCard { name: string; email: string; } // No usar prefijo I
  ```

### 5.4. Event handlers
Prefijo `handle` + nombre de la acción.
* **Correcto**: `handleClick`, `handleSubmit`
* **Incorrecto**: `onClick`, `submitForm`

### 5.5. Constantes
`UPPER_SNAKE_CASE` para constantes globales.
* **Correcto**: `API_BASE_URL`, `MAX_RETRY_COUNT`
* **Incorrecto**: `apiBaseUrl`, `maxRetryCount`

### 5.6. Funciones auxiliares
Verbos en `camelCase`.
* **Correcto**: `formatDate`, `validateEmail`, `calculateTotal`
* **Incorrecto**: `DateFormatter`, `EmailValidator`

---

## 6. Estilo de código

### 6.1. Indentación
**2 espacios** (no tabulaciones).

### 6.2. Puntos y coma
Usar punto y coma al final de cada sentencia.

### 6.3. Comillas
Usar comillas simples para strings (`'`).

### 6.4. Llaves
Estilo "Egyptian brackets" (la llave de apertura en la misma línea).
* **Correcto**:
  ```tsx
  if (isValid) {
      process();
  }
  ```
* **Incorrecto**:
  ```tsx
  if (isValid)
  {
      process();
  }
  ```

### 6.5. Largo de línea
Máximo **100 caracteres** (configurado en Prettier).

### 6.6. Uso de `async/await`
Preferir `async/await` sobre `.then().catch()`.
* **Correcto**:
  ```tsx
  const login = async (email: string, password: string) => {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
  };
  ```
* **Incorrecto**:
  ```tsx
  const login = (email, password) => {
      return api.post('/auth/login', { email, password })
          .then(res => res.data);
  };
  ```

---

## 7. TypeScript Estricto

El `tsconfig.json` debe tener habilitado el modo estricto:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### 7.1. Reglas adicionales
- **Prohibido** `any`. Usar `unknown` si el tipo es不确定.
- Usar `unknown` en lugar de `any` para errores en catch blocks.
- Usar tipos explícitos en funciones públicas.

---

## 8. Componentes

### 8.1. Estructura de un componente
```tsx
export interface ComponentNameProps {
  title: string;
  onAction?: () => void;
}

export const ComponentName: React.FC<ComponentNameProps> = ({
  title,
  onAction,
}) => {
  const handleAction = () => {
    onAction?.();
  };

  return (
    <div>
      <h1>{title}</h1>
      <button onClick={handleAction}>Action</button>
    </div>
  );
};
```

### 8.2. Reglas
- Definir `Props` interface antes del componente.
- Extraer lógica compleja en hooks personalizados.
- Evitar lógica en el JSX; usar variables intermedias.
- No mutar props.

### 8.3. Renderizado condicional
Usar operadores lógicos y ternarios, evitar anidamientos complejos.
* **Correcto**:
  ```tsx
  {isLoading && <Spinner />}
  {user ? <UserProfile user={user} /> : <LoginPrompt />}
  ```
* **Incorrecto**:
  ```tsx
  {isLoading ? (user ? <UserProfile user={user} /> : <Spinner />) : null}
  ```

### 8.4. Listas y keys
Usar `key` único y estable (preferir ID sobre índice).
* **Correcto**: `<ListItem key={item.id} item={item} />`
* **Incorrecto**: `<ListItem key={index} item={item} />`

---

## 9. Hooks

### 9.1. Reglas de Hooks
- Solo llamar hooks en el nivel superior (no en condicionales, bucles o funciones anidadas).
- Solo llamar hooks desde componentes funcionales u otros hooks.
- Usar `eslint-plugin-react-hooks` para verificar.

### 9.2. Hooks personalizados
- Nombrar con prefijo `use` (ej. `useLocalStorage`).
- Encapsular lógica de estado y efectos secundarios.
- Devolver un objeto con valores y funciones.

---

## 10. Manejo de Estado

### 10.1. Estado Local
- `useState` para estado simple.
- `useReducer` para lógica de estado compleja.

### 10.2. Estado Global (Zustand)
Stores modulares por feature.
* **Correcto**:
  ```tsx
  interface AuthState {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
  }

  export const useAuthStore = create<AuthState>()(
    persist(
      (set) => ({
        user: null,
        token: null,
        login: async (email, password) => { ... },
        logout: () => set({ user: null, token: null }),
      }),
      { name: 'auth-storage' }
    )
  );
  ```

### 10.3. Estado del Servidor (TanStack Query)
Definir hooks por feature.
* **Correcto**:
  ```tsx
  export const useUsers = () => {
    return useQuery({
      queryKey: ['users'],
      queryFn: () => api.get<User[]>('/users'),
    });
  };
  ```

---

## 11. Orden de Imports

Orden estricto con líneas en blanco entre grupos:
1. React y librerías externas (`react`, `react-dom`)
2. Librerías de terceros (`axios`, `@tanstack/react-query`, `zustand`, etc.)
3. Módulos internos (alias `@/...`)
4. Componentes
5. Hooks
6. Servicios
7. Utilidades
8. Tipos

---

## 12. Manejo de Errores

### 12.1. Try-Catch
Siempre usar `try/catch` en funciones asíncronas.
```tsx
try {
  const data = await api.get('/resource');
  setData(data);
} catch (error) {
  if (error instanceof ApiError) {
    setError(error.message);
  }
}
```

### 12.2. Error Boundaries
Usar `ErrorBoundary` para capturar errores en el árbol de componentes.

### 12.3. Logging
- **Prohibido** `console.log` en producción.
- Usar servicios externos para logs (Sentry).

---

## 13. Seguridad

### 13.1. XSS Prevention
- **Prohibido** `dangerouslySetInnerHTML`.
- Sanitizar toda entrada de usuario.
- Usar React's built-in escaping.

### 13.2. Validación
- Validar inputs en el cliente y servidor.
- Usar tipos estrictos de TypeScript.

### 13.3. Tokens y Credenciales
- Nunca hardcodear secrets.
- Usar variables de entorno (`VITE_*` en Vite).
- Implementar refresh tokens de forma segura.

---

## 14. Pruebas (Vitest + React Testing Library)

### 14.1. Estructura
Colocar archivos de test junto al componente: `Component.test.tsx`.

### 14.2. Patrón AAA
* **Correcto**:
  ```tsx
  it('should call onClick when button is clicked', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    await userEvent.click(screen.getByText('Click'));
    expect(onClick).toHaveBeenCalled();
  });
  ```

### 14.3. Mocks
- Mockear módulos externos con `vi.mock`.
- Usar Mock Service Worker (MSW) para APIs.

### 14.4. Cobertura
Mínimo **80%** de cobertura en líneas, funciones y ramas.

---

## 15. Rendimiento

### 15.1. Optimización de Renderizados
- `React.memo` para componentes con props frecuentes.
- `useMemo` para valores computados costosos.
- `useCallback` para funciones en componentes memoizados.

### 15.2. Code Splitting
- Usar `React.lazy` y `Suspense` por rutas.
- Usar `import()` dinámico para módulos pesados.

### 15.3. Imágenes
- Usar WebP cuando sea posible.
- `loading="lazy"` para imágenes fuera del viewport.

---

## 16. Calidad de Código

### 16.1. Pre-commit Hooks
Usar **Husky** + **lint-staged**.

### 16.2. Scripts obligatorios
```json
{
  "lint": "eslint src --ext .ts,.tsx",
  "typecheck": "tsc --noEmit",
  "test": "vitest",
  "test:coverage": "vitest --coverage"
}
```

### 16.3. Complejidad Ciclomática
Máximo **10** por función.

### 16.4. SonarQube
Quality Gate: cobertura ≥ 80%, duplicación ≤ 3%, sin vulnerabilidades críticas.

---

## 17. Declaración de uso de IA
Se declara que para la configuración, revisión de estándares de la industria (OWASP, SonarQube) y estructuración de este documento se utilizó asistencia de Inteligencia Artificial como herramienta de co-pilotaje y optimización de arquitectura.

---

## 18. Referencias
* [React Official Documentation](https://reactjs.org/docs/getting-started.html)
* [TypeScript Handbook](https://www.typescriptlang.org/docs/)
* [Airbnb React/JSX Style Guide](https://github.com/airbnb/javascript/tree/master/react)
* [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
* [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
