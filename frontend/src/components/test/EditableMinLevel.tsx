import React, { useState } from 'react';
import { Edit2, Check, X } from 'lucide-react';

interface EditableMinLevelProps {
  productId: number;
  currentMinLevel: number | null;
  onUpdate: (productId: number, newMinLevel: number) => Promise<boolean>;
}

export const EditableMinLevel: React.FC<EditableMinLevelProps> = ({
  productId,
  currentMinLevel,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(currentMinLevel?.toString() || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = () => {
    setIsEditing(true);
    setValue(currentMinLevel?.toString() || '');
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setValue(currentMinLevel?.toString() || '');
    setError(null);
  };

  const handleSave = async () => {
    const newValue = parseInt(value);
    
    if (isNaN(newValue) || newValue < 0) {
      setError('Please enter a valid positive number');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const success = await onUpdate(productId, newValue);
      
      if (success) {
        setIsEditing(false);
      } else {
        setError('Failed to update minimum level');
      }
    } catch (err) {
      setError('Error updating minimum level');
      console.error('Error updating min level:', err);
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
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-20 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary"
          autoFocus
          disabled={isLoading}
          min="0"
        />
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
          title="Save"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          onClick={handleCancel}
          disabled={isLoading}
          className="p-1 text-red-600 hover:text-red-700 disabled:opacity-50"
          title="Cancel"
        >
          <X className="h-4 w-4" />
        </button>
        {error && (
          <span className="text-xs text-red-600 ml-2">{error}</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-medium">
        {currentMinLevel ?? '-'}
      </span>
      <button
        onClick={handleEdit}
        className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
        title="Edit minimum level"
      >
        <Edit2 className="h-3 w-3" />
      </button>
    </div>
  );
};