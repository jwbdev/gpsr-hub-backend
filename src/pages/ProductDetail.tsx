import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { productsService, Product } from '@/services/products';
import { categoriesService, Category } from '@/services/categories';
import { Edit, ArrowLeft, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    if (!id) return;
    
    try {
      const productData = await productsService.getProduct(id);
      setProduct(productData);
      
      if (productData.category_id) {
        const categories = await categoriesService.getCategories();
        const productCategory = categories.find(cat => cat.id === productData.category_id);
        setCategory(productCategory || null);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load product",
        variant: "destructive",
      });
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!product || !confirm('Are you sure you want to delete this product?')) return;

    try {
      await productsService.deleteProduct(product.id);
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      navigate('/products');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  const getModerationStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <Link to="/products">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <Link to="/products" className="flex items-center text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Link>
            <h1 className="text-3xl font-bold">{product.gpsr_identification_details || 'Untitled Product'}</h1>
          </div>
          <div className="flex space-x-2">
            <Link to={`/products/${product.id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Basic Information
                <div className="flex items-center space-x-2">
                  {getModerationStatusIcon(product.gpsr_moderation_status || 'PENDING')}
                  <Badge className={getModerationStatusColor(product.gpsr_moderation_status || 'PENDING')}>
                    {product.gpsr_moderation_status || 'PENDING'}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Product Identification</h3>
                <p className="text-muted-foreground">{product.gpsr_identification_details || 'Not specified'}</p>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Category</h3>
                <p className="text-muted-foreground">{category?.name || 'Uncategorized'}</p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Statement of Compliance</h3>
                <Badge variant={product.gpsr_statement_of_compliance ? "default" : "secondary"}>
                  {product.gpsr_statement_of_compliance ? 'Compliant' : 'Not Compliant'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Safety Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {product.gpsr_warning_phrases && product.gpsr_warning_phrases.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Warning Phrases</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {product.gpsr_warning_phrases.map((phrase, index) => (
                      <li key={index} className="text-muted-foreground">{phrase}</li>
                    ))}
                  </ul>
                </div>
              )}

              {product.gpsr_warning_text && (
                <div>
                  <h3 className="font-medium mb-2">Warning Text</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{product.gpsr_warning_text}</p>
                </div>
              )}

              {product.gpsr_pictograms && product.gpsr_pictograms.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Pictograms</h3>
                  <div className="space-y-2">
                    {product.gpsr_pictograms.map((pictogram, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <img 
                          src={pictogram} 
                          alt={`Pictogram ${index + 1}`} 
                          className="h-8 w-8 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <span className="text-sm text-muted-foreground">{pictogram}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {product.gpsr_additional_safety_info && (
                <div>
                  <h3 className="font-medium mb-2">Additional Safety Information</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{product.gpsr_additional_safety_info}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documentation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {product.gpsr_online_instructions_url && (
                <div>
                  <h3 className="font-medium mb-2">Online Instructions</h3>
                  <a 
                    href={product.gpsr_online_instructions_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {product.gpsr_online_instructions_url}
                  </a>
                </div>
              )}

              {product.gpsr_instructions_manual && (
                <div>
                  <h3 className="font-medium mb-2">Instructions Manual</h3>
                  <p className="text-muted-foreground">{product.gpsr_instructions_manual}</p>
                </div>
              )}

              {product.gpsr_declarations_of_conformity && (
                <div>
                  <h3 className="font-medium mb-2">Declarations of Conformity</h3>
                  <p className="text-muted-foreground">{product.gpsr_declarations_of_conformity}</p>
                </div>
              )}

              {product.gpsr_certificates && (
                <div>
                  <h3 className="font-medium mb-2">Certificates</h3>
                  <p className="text-muted-foreground">{product.gpsr_certificates}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Moderation Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {product.gpsr_moderation_comment && (
                <div>
                  <h3 className="font-medium mb-2">Moderation Comment</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{product.gpsr_moderation_comment}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {product.gpsr_last_submission_date && (
                  <div>
                    <h3 className="font-medium mb-2">Last Submission Date</h3>
                    <p className="text-muted-foreground">
                      {new Date(product.gpsr_last_submission_date).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {product.gpsr_last_moderation_date && (
                  <div>
                    <h3 className="font-medium mb-2">Last Moderation Date</h3>
                    <p className="text-muted-foreground">
                      {new Date(product.gpsr_last_moderation_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {product.gpsr_submitted_by_supplier_user && (
                <div>
                  <h3 className="font-medium mb-2">Submitted by Supplier User</h3>
                  <p className="text-muted-foreground">{product.gpsr_submitted_by_supplier_user}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}