import { Button } from "@/shared/ui/button";

export const SamplePage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-10 bg-background text-foreground space-y-4">
      <h1 className="text-4xl font-bold tracking-tight">Health Core Dashboard</h1>
      <p className="text-muted-foreground text-lg text-center max-w-lg">
        This is a placeholder feature screen properly structured inside the Clean Architecture 'features' directory.
      </p>
      
      <div className="mt-8">
        <Button size="lg" onClick={() => alert("Button clicks work!")}>
          Click Me
        </Button>
      </div>
    </div>
  );
};
