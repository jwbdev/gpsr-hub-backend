import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { productsService, Product } from '@/services/products';
import { categoriesService, Category } from '@/services/categories';
import { accessRequestsService } from '@/services/accessRequests';
import { RequestAccessButton } from '@/components/RequestAccessButton';
import { Plus, Package, Eye, Edit, Trash2 } from 'lucide-react';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [requestStates, setRequestStates] = useState<{[key: string]: {hasRequested: boolean, hasAccess: boolean}}>({});
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedCategory !== undefined) {
      loadProducts();
    }
  }, [selectedCategory]);

  const loadData = async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        productsService.getProducts(),
        categoriesService.getCategories()
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
      
      // Check request and access states for non-owned products
      const states: {[key: string]: {hasRequested: boolean, hasAccess: boolean}} = {};
      
      for (const product of productsData) {
        if (user?.id !== product.user_id) {
          const [hasRequested, hasAccess] = await Promise.all([
            accessRequestsService.hasRequestedAccess('product', product.id),
            accessRequestsService.hasSharedAccess('product', product.id)
          ]);
          states[product.id] = { hasRequested, hasAccess };
        }
      }
      
      setRequestStates(states);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await productsService.getProducts(selectedCategory || undefined);
      setProducts(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await productsService.deleteProduct(id);
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      loadProducts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  const getModerationStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return 'Uncategorized';
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Unknown';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <Link to="/products/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      <div className="flex gap-4 mb-6">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>            
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No products yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first product to get started
            </p>
            <Link to="/products/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">
                    {product.gpsr_identification_details || 'Untitled Product'}
                  </span>
                  <Badge className={getModerationStatusColor(product.gpsr_moderation_status || 'PENDING')}>
                    {product.gpsr_moderation_status || 'PENDING'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>Category:</strong> {getCategoryName(product.category_id)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Created by:</strong> {product.owner_name || 'Unknown User'}
                  </p>
                  {product.gpsr_warning_text && (
                    <p className="text-sm line-clamp-2">
                      <strong>Warning:</strong> {product.gpsr_warning_text}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    <strong>Compliance:</strong> {product.gpsr_statement_of_compliance ? 'Yes' : 'No'}
                  </p>
                </div>
                
                <div className="flex justify-between">
                  <div className="flex space-x-2">
                    <Link to={`/products/${product.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    {user?.id === product.user_id && (
                      <Link to={`/products/${product.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                  {user?.id === product.user_id ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : (
                    <RequestAccessButton
                      resourceType="product"
                      resourceId={product.id}
                      resourceName={product.gpsr_identification_details || 'Untitled Product'}
                      ownerUserId={product.user_id}
                      ownerName={product.owner_name || 'Unknown User'}
                      hasRequested={requestStates[product.id]?.hasRequested || false}
                      hasAccess={requestStates[product.id]?.hasAccess || false}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}