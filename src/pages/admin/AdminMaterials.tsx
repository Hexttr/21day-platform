import React from 'react';
import { PracticalMaterialsAdmin } from '@/components/PracticalMaterialsAdmin';

export default function AdminMaterials() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-serif font-bold text-foreground">Практические материалы</h1>
          <p className="text-muted-foreground">Управление видео-материалами</p>
        </div>
        
        <PracticalMaterialsAdmin />
      </div>
    </div>
  );
}