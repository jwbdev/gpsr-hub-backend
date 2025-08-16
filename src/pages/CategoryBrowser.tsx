import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import CategoryTree, { Category } from '@/components/CategoryTree';
import { categoriesService } from '@/services/categories';
import { productsService } from '@/services/products';
import { Loader2, Package, FolderTree } from 'lucide-react';

export default function CategoryBrowser() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [productCount, setProductCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await categoriesService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProductCount = async (categoryId: string) => {
    try {
      const products = await productsService.getProducts(categoryId);
      setProductCount(products.length);
    } catch (error) {
      console.error('Error loading product count:', error);
      setProductCount(0);
    }
  };

  const handleSelectCategory = async (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (category) {
      setSelectedCategory(category);
      await loadProductCount(categoryId);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Category Browser</h1>
        <p className="text-muted-foreground">
          Browse through your categories using the interactive tree view
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Tree Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderTree className="h-5 w-5" />
              Category Tree
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <div className="text-center py-8">
                <FolderTree className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No categories available</p>
              </div>
            ) : (
              <CategoryTree 
                categories={categories} 
                onSelectCategory={handleSelectCategory}
              />
            )}
          </CardContent>
        </Card>

        {/* Category Details Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Category Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedCategory ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{selectedCategory.name}</h3>
                  {selectedCategory.description && (
                    <p className="text-muted-foreground mb-4">{selectedCategory.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Category ID</label>
                    <p className="text-sm font-mono">{selectedCategory.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Parent Category</label>
                    <p className="text-sm">
                      {selectedCategory.parent_id 
                        ? categories.find(cat => cat.id === selectedCategory.parent_id)?.name || 'Unknown'
                        : 'Root Category'
                      }
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Products in Category</label>
                  <div className="mt-1">
                    <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                      <Package className="h-3 w-3" />
                      {productCount} product{productCount !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                  <div>
                    <label className="font-medium">Created</label>
                    <p>{new Date(selectedCategory.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="font-medium">Updated</label>
                    <p>{new Date(selectedCategory.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FolderTree className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Select a category from the tree to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}