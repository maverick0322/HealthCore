import { useTranslation } from "react-i18next";
import { Coffee, Utensils, Apple, Loader2, Plus, AlertCircle, ImageOff } from "lucide-react";
import { Card } from "@/shared/ui/card";
// Eliminamos formatLocalTime para usar nuestra propia función segura contra Timezone offsets

interface DetailedMealTimelineProps {
  logs: any[];
  isLoading: boolean;
  error: string | null;
}

export const DetailedMealTimeline = ({ logs, isLoading, error }: DetailedMealTimelineProps) => {
  const { t } = useTranslation("patient");

  // --- FUNCIÓN DE ZONA HORARIA SEGURA ---
  const formatSafeLocalTime = (isoString: string) => {
    if (!isoString) return '--:--';
    // Si la cadena no termina en Z, se la agregamos para forzar UTC
    const safeIso = isoString.endsWith('Z') ? isoString : `${isoString}Z`;
    const date = new Date(safeIso);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getMealIcon = (type: string) => {
    switch (type) {
      case 'BREAKFAST': return <Coffee className="text-emerald-700" size={16} />;
      case 'SNACK': return <Apple className="text-emerald-700" size={16} />;
      default: return <Utensils className="text-emerald-700" size={16} />;
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-4 text-sm text-destructive mt-4">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      );
    }

    if (logs.length === 0) {
      return (
        <p className="text-center py-12 text-muted-foreground text-sm border border-dashed rounded-lg mt-4 bg-muted/10">
          No hay registros para este día.
        </p>
      );
    }

    return (
      <div className="relative border-l-2 border-muted/60 ml-4 md:ml-6 space-y-8 pb-4 mt-6">
        {logs.map((log) => {
          const foodsDescription = log.items?.map((item: any) => item.foodName).join(', ');
          
          // La URL pre-firmada ya viaja en photoKey gracias a nuestro tracking-service
          const imageUrl = log.photoKey;

          return (
            <div key={log.id} className="relative pl-8 md:pl-10">
              {/* Ícono circular en la línea de tiempo */}
              <div className="absolute -left-[17px] top-4 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-background bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 shadow-sm z-10 transition-transform hover:scale-110">
                {getMealIcon(log.mealType)}
              </div>

              <Card className="overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-all duration-300 group">
                <div className="flex flex-col sm:flex-row h-full">
                  
                  {/* --- SECCIÓN DE LA IMAGEN CON ESTILO --- */}
                  <div className="relative h-48 sm:h-auto sm:w-40 sm:min-h-[160px] bg-muted shrink-0 flex items-center justify-center overflow-hidden border-b sm:border-b-0 sm:border-r border-border/50">
                    {imageUrl ? (
                      <>
                        <img 
                          src={imageUrl} 
                          alt={`Foto de ${log.mealType}`}
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center', 'bg-slate-100', 'dark:bg-slate-800');
                            e.currentTarget.parentElement!.innerHTML = '<svg class="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>';
                          }}
                        />
                        {/* Gradiente sutil para darle profundidad a la foto */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </>
                    ) : (
                      // Fallback si el usuario no subió foto
                      <div className="flex flex-col items-center gap-2 text-muted-foreground/40">
                        <ImageOff size={28} />
                        <span className="text-[10px] uppercase font-semibold tracking-wider">Sin foto</span>
                      </div>
                    )}
                  </div>

                  {/* --- SECCIÓN DE TEXTO Y MACROS --- */}
                  <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between bg-card">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg text-foreground tracking-tight">
                          {String(t(`tracking.mealType.${log.mealType}`, { defaultValue: log.mealType }))}
                        </h3>
                        <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-1 rounded-md">
                          {formatSafeLocalTime(log.consumedAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                        {foodsDescription}
                      </p>
                    </div>

                    <div className="grid grid-cols-4 gap-2 sm:gap-4 mt-5 pt-4 border-t border-border/40">
                      <div className="text-center flex flex-col items-center">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Calorías</p>
                        <p className="font-black text-sm text-primary">{Math.round(log.totalCalories)}</p>
                      </div>
                      <div className="text-center flex flex-col items-center">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Proteína</p>
                        <p className="font-bold text-sm text-foreground">{Math.round(log.totalProteins)}g</p>
                      </div>
                      <div className="text-center flex flex-col items-center">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Carbo</p>
                        <p className="font-bold text-sm text-foreground">{Math.round(log.totalCarbs)}g</p>
                      </div>
                      <div className="text-center flex flex-col items-center">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Grasas</p>
                        <p className="font-bold text-sm text-foreground">{Math.round(log.totalFats)}g</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          );
        })}

        {/* Botón Añadir */}
        <div className="relative pl-8 md:pl-10 opacity-60 hover:opacity-100 transition-opacity mt-4">
          <div className="absolute -left-[17px] top-4 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-background bg-muted text-muted-foreground ring-1 ring-border border-dashed z-10">
            <Plus size={16} />
          </div>
          <Card className="border-dashed border-border shadow-none bg-muted/10 p-4 sm:p-5 flex justify-between items-center cursor-pointer hover:bg-muted/30 transition-colors">
            <div>
              <h3 className="font-bold text-base text-muted-foreground">Registrar nuevo alimento</h3>
              <p className="text-sm text-muted-foreground mt-0.5">Añade otra comida a tu historial de hoy</p>
            </div>
            <div className="h-8 w-8 rounded-full border border-border flex items-center justify-center bg-background text-muted-foreground hover:text-foreground transition-colors">
              <Plus size={16} />
            </div>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-6 animate-in slide-in-from-bottom-4 duration-700 fade-in">
      {renderContent()}
    </div>
  );
};