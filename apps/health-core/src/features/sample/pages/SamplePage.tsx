import { useState } from "react";
import axios from "axios";
import { Button } from "@/shared/ui/button";

export const SamplePage = () => {
  const [foodData, setFoodData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const [barcode, setBarcode] = useState("7501045403915");

  const testArchitecture = async () => {
    if (!barcode.trim()) return;
    setLoading(true);
    setFoodData(null);

    try {
      const response = await axios.get(`http://localhost/api/v1/tracking/test-grpc/${barcode}`);
      setFoodData(response.data);
    } catch (error) {
      console.error("Error conectando al backend", error);
      setFoodData({ error: "No se pudo conectar al API Gateway. Revisa que NGINX, Java y Python estén corriendo." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-10 bg-background text-foreground space-y-4">
      <h1 className="text-4xl font-bold tracking-tight">HealthCore OS</h1>
      <p className="text-muted-foreground text-lg text-center max-w-lg">
        Prueba oficial de Arquitectura Distribuida (React 19 ➔ NGINX ➔ Java ➔ gRPC ➔ Python).
      </p>
      
      <div className="mt-8 flex flex-col items-center w-full max-w-md space-y-4">
        
        <input 
          type="text" 
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="Ingresa el código de barras (ej. 7501045403915)"
          className="w-full px-4 py-2 text-black bg-white dark:bg-slate-800 dark:text-white rounded-md border border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <Button size="lg" onClick={testArchitecture} disabled={loading} className="w-full">
          {loading ? "Buscando en la base mundial..." : "Buscar Producto"}
        </Button>
      </div>

      {foodData && (
        <div className="mt-8 p-6 bg-slate-900 text-green-400 rounded-xl shadow-lg max-w-2xl w-full text-left overflow-auto">
          <pre className="text-sm font-mono whitespace-pre-wrap">
            {JSON.stringify(foodData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};