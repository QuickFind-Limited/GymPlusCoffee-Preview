import React, { useState } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EditableMinLevelProps {
  productId: number;
  currentMinLevel: number | null;
  onUpdate?: (newMinLevel: number) => void;
}

export const EditableMinLevel: React.FC<EditableMinLevelProps> = ({
  productId,
  currentMinLevel,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(currentMinLevel?.toString() || '');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleEdit = () => {
    setIsEditing(true);
    setValue(currentMinLevel?.toString() || '');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setValue(currentMinLevel?.toString() || '');
  };

  const handleSave = async () => {
    const newValue = parseInt(value);
    
    if (isNaN(newValue) || newValue < 0) {
      toast({
        title: "Invalid value",
        description: "Please enter a valid positive number",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('update-stock-levels', {
        body: {
          productId,
          newMinLevel: newValue
        }
      });

      if (error) throw error;

      if (data?.success) {
        setIsEditing(false);
        onUpdate?.(newValue);
        toast({
          title: "Success",
          description: `Minimum level updated to ${newValue}`,
        });
      } else {
        throw new Error(data?.error || 'Failed to update minimum level');
      }
    } catch (err) {
      console.error('Error updating min level:', err);
      toast({
        title: "Error",
        description: "Failed to update minimum level",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center justify-center gap-1">
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-16 px-1 py-0.5 text-sm text-center border rounded focus:outline-none focus:ring-1 focus:ring-primary"
          autoFocus
          disabled={isLoading}
          min="0"
        />
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="p-0.5 text-green-600 hover:text-green-700 disabled:opacity-50"
          title="Save"
        >
          <Check className="h-3 w-3" />
        </button>
        <button
          onClick={handleCancel}
          disabled={isLoading}
          className="p-0.5 text-red-600 hover:text-red-700 disabled:opacity-50"
          title="Cancel"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-1">
      <span className="text-sm">
        {currentMinLevel ?? '-'}
      </span>
      <button
        onClick={handleEdit}
        className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100"
        title="Edit minimum level"
      >
        <Edit2 className="h-3 w-3" />
      </button>
    </div>
  );
};