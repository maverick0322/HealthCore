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
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly initialName?: string;
  readonly onSuccess?: () => void;
}

export const CreateLocalFoodModal: React.FC<Readonly<CreateLocalFoodModalProps>> = ({ 
  isOpen, 
  onClose, 
  initialName = "",
  onSuccess 
}) => {
  const { t } = useTranslation('admin'); 
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

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const payload: CreateLocalFoodRequest = {
      name: name.trim(),
      brand: brand.trim() || 'Generic',
      nutrition: {
        calories: Number(calories),
        proteins: Number(proteins),
        carbohydrates: Number(carbs),
        fats: Number(fats)
      }
    };

    if (!payload.name || isNaN(payload.nutrition.calories)) {
      setError(t('catalog.validationError'));
      return;
    }

    try {
      setIsSubmitting(true);
      await adminService.createLocalFood(payload);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || t('catalog.saveError'));
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
            {t('catalog.createTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('catalog.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {error && <div className="text-sm font-medium text-destructive bg-destructive/10 p-2 rounded">{error}</div>}
          
          <div className="space-y-2">
            <Label htmlFor="foodName">{t('catalog.nameLabel')}</Label>
            <Input id="foodName" value={name} onChange={(e) => setName(e.target.value)} required placeholder={t('catalog.namePlaceholder')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand">{t('catalog.brandLabel')}</Label>
            <Input id="brand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder={t('catalog.brandPlaceholder')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="calories">{t('catalog.caloriesLabel')}</Label>
              <Input id="calories" type="number" step="0.1" min="0" value={calories} onChange={(e) => setCalories(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proteins">{t('catalog.proteinsLabel')}</Label>
              <Input id="proteins" type="number" step="0.1" min="0" value={proteins} onChange={(e) => setProteins(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carbs">{t('catalog.carbsLabel')}</Label>
              <Input id="carbs" type="number" step="0.1" min="0" value={carbs} onChange={(e) => setCarbs(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fats">{t('catalog.fatsLabel')}</Label>
              <Input id="fats" type="number" step="0.1" min="0" value={fats} onChange={(e) => setFats(e.target.value)} required />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              {t('catalog.cancelBtn')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? t('catalog.saving') : t('catalog.saveBtn')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
