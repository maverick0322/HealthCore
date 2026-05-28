import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, PlusCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { adminService } from '@/features/admin/services/adminService';
import type { CreateLocalFoodRequest } from '@/features/admin/types/admin.types';

interface CreateLocalFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialName?: string;
  onSuccess?: () => void;
}

export const CreateLocalFoodModal: React.FC<CreateLocalFoodModalProps> = ({ 
  isOpen, 
  onClose, 
  initialName = "",
  onSuccess 
}) => {
  const { t } = useTranslation('admin'); // O 'nutritionist' si prefieres
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados del formulario
  const [name, setName] = useState(initialName);
  const [brand, setBrand] = useState('');
  const [calories, setCalories] = useState('');
  const [proteins, setProteins] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');

  // Sincronizar initialName cuando cambia
  React.useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setBrand('');
      setCalories('');
      setProteins('');
      setCarbs('');
      setFats('');
      setError(null);
    }
  }, [isOpen, initialName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload: CreateLocalFoodRequest = {
      name: name.trim(),
      brand: brand.trim() || 'Genérico',
      nutrition: {
        calories: Number(calories),
        proteins: Number(proteins),
        carbohydrates: Number(carbs),
        fats: Number(fats)
      }
    };

    // Validaciones básicas de front
    if (!payload.name || isNaN(payload.nutrition.calories)) {
      setError("Por favor completa los campos obligatorios.");
      return;
    }

    try {
      setIsSubmitting(true);
      await adminService.createLocalFood(payload);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Error al guardar el alimento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle className="text-primary" size={20} />
            Crear Alimento Local
          </DialogTitle>
          <DialogDescription>
            Añade un alimento a la base de datos local. Estará disponible inmediatamente para tus planes nutricionales. (Basado en 100g/ml)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {error && <div className="text-sm font-medium text-destructive bg-destructive/10 p-2 rounded">{error}</div>}
          
          <div className="space-y-2">
            <Label htmlFor="foodName">Nombre del alimento *</Label>
            <Input id="foodName" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ej. Tamal Ranchero" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand">Marca (Opcional)</Label>
            <Input id="brand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Ej. Casero, Bimbo..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="calories">Kcal / 100g *</Label>
              <Input id="calories" type="number" step="0.1" min="0" value={calories} onChange={(e) => setCalories(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proteins">Proteínas (g) *</Label>
              <Input id="proteins" type="number" step="0.1" min="0" value={proteins} onChange={(e) => setProteins(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carbs">Carbohidratos (g) *</Label>
              <Input id="carbs" type="number" step="0.1" min="0" value={carbs} onChange={(e) => setCarbs(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fats">Grasas (g) *</Label>
              <Input id="fats" type="number" step="0.1" min="0" value={fats} onChange={(e) => setFats(e.target.value)} required />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Alimento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};