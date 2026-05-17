export const OnboardingUnavailableState = () => (
  <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 text-foreground">
    <div className="max-w-sm space-y-3 text-center">
      <h1 className="text-lg font-semibold">No pudimos verificar tu perfil</h1>
      <p className="text-sm text-muted-foreground">
        El servicio clinico no esta disponible en este momento. Intenta recargar la pagina en unos segundos.
      </p>
    </div>
  </div>
);
