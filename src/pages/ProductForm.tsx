import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { productsService, Product } from '@/services/products';
import { categoriesService, Category } from '@/services/categories';
import { useAuth } from '@/hooks/useAuth';
import { Upload, X } from 'lucide-react';

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [product, setProduct] = useState<Partial<Product>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [warningPhrases, setWarningPhrases] = useState<string[]>([]);
  const [pictograms, setPictograms] = useState<string[]>([]);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadCategories = async () => {
    try {
      const data = await categoriesService.getCategories();
      setCategories(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      });
    }
  };

  const loadProduct = async () => {
    if (!id) return;
    
    try {
      const data = await productsService.getProduct(id);
      setProduct(data);
      setWarningPhrases(data.gpsr_warning_phrases || []);
      setPictograms(data.gpsr_pictograms || []);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingFile(field);
    try {
      const fileName = await productsService.uploadFile(file, user.id);
      setProduct(prev => ({ ...prev, [field]: fileName }));
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploadingFile(null);
    }
  };

  const addWarningPhrase = () => {
    setWarningPhrases([...warningPhrases, '']);
  };

  const updateWarningPhrase = (index: number, value: string) => {
    const updated = [...warningPhrases];
    updated[index] = value;
    setWarningPhrases(updated);
  };

  const removeWarningPhrase = (index: number) => {
    setWarningPhrases(warningPhrases.filter((_, i) => i !== index));
  };

  const addPictogram = () => {
    setPictograms([...pictograms, '']);
  };

  const updatePictogram = (index: number, value: string) => {
    const updated = [...pictograms];
    updated[index] = value;
    setPictograms(updated);
  };

  const removePictogram = (index: number) => {
    setPictograms(pictograms.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    const productData = {
      ...product,
      gpsr_identification_details: formData.get('gpsr_identification_details') as string,
      gpsr_warning_phrases: warningPhrases.filter(p => p.trim()),
      gpsr_warning_text: formData.get('gpsr_warning_text') as string,
      gpsr_pictograms: pictograms.filter(p => p.trim()),
      gpsr_additional_safety_info: formData.get('gpsr_additional_safety_info') as string,
      gpsr_statement_of_compliance: formData.get('gpsr_statement_of_compliance') === 'on',
      gpsr_online_instructions_url: formData.get('gpsr_online_instructions_url') as string,
      gpsr_moderation_status: formData.get('gpsr_moderation_status') as 'PENDING' | 'APPROVED' | 'REJECTED',
      gpsr_moderation_comment: formData.get('gpsr_moderation_comment') as string,
      gpsr_last_submission_date: formData.get('gpsr_last_submission_date') as string,
      gpsr_last_moderation_date: formData.get('gpsr_last_moderation_date') as string,
      gpsr_submitted_by_supplier_user: formData.get('gpsr_submitted_by_supplier_user') as string,
      category_id: formData.get('category_id') as string || undefined,
    };

    try {
      if (id) {
        await productsService.updateProduct(id, productData);
        toast({
          title: "Success",
          description: "Product updated successfully",
        });
      } else {
        await productsService.createProduct(productData);
        toast({
          title: "Success",
          description: "Product created successfully",
        });
      }
      navigate('/products');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save product",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{id ? 'Edit Product' : 'Create Product'}</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gpsr_identification_details">Product Identification</Label>
                  <Input
                    id="gpsr_identification_details"
                    name="gpsr_identification_details"
                    defaultValue={product.gpsr_identification_details}
                    placeholder="Enter product identification details"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category_id">Category</Label>
                  <Select name="category_id" defaultValue={product.category_id}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Safety Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Warning Phrases</Label>
                  {warningPhrases.map((phrase, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={phrase}
                        onChange={(e) => updateWarningPhrase(index, e.target.value)}
                        placeholder="Enter warning phrase"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeWarningPhrase(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addWarningPhrase}>
                    Add Warning Phrase
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gpsr_warning_text">Warning Text</Label>
                  <Textarea
                    id="gpsr_warning_text"
                    name="gpsr_warning_text"
                    defaultValue={product.gpsr_warning_text}
                    placeholder="Enter detailed warning text"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pictogram URLs</Label>
                  {pictograms.map((pictogram, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={pictogram}
                        onChange={(e) => updatePictogram(index, e.target.value)}
                        placeholder="Enter pictogram URL"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removePictogram(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addPictogram}>
                    Add Pictogram URL
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gpsr_additional_safety_info">Additional Safety Information</Label>
                  <Textarea
                    id="gpsr_additional_safety_info"
                    name="gpsr_additional_safety_info"
                    defaultValue={product.gpsr_additional_safety_info}
                    placeholder="Enter additional safety information"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="gpsr_statement_of_compliance"
                    name="gpsr_statement_of_compliance"
                    defaultChecked={product.gpsr_statement_of_compliance}
                  />
                  <Label htmlFor="gpsr_statement_of_compliance">Statement of Compliance</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Documentation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gpsr_online_instructions_url">Online Instructions URL</Label>
                  <Input
                    id="gpsr_online_instructions_url"
                    name="gpsr_online_instructions_url"
                    type="url"
                    defaultValue={product.gpsr_online_instructions_url}
                    placeholder="https://example.com/instructions"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gpsr_instructions_manual">Instructions Manual</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      id="gpsr_instructions_manual"
                      onChange={(e) => handleFileUpload(e, 'gpsr_instructions_manual')}
                      disabled={uploadingFile === 'gpsr_instructions_manual'}
                    />
                    {uploadingFile === 'gpsr_instructions_manual' && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    )}
                  </div>
                  {product.gpsr_instructions_manual && (
                    <p className="text-sm text-muted-foreground">
                      Current file: {product.gpsr_instructions_manual}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gpsr_declarations_of_conformity">Declarations of Conformity</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      id="gpsr_declarations_of_conformity"
                      onChange={(e) => handleFileUpload(e, 'gpsr_declarations_of_conformity')}
                      disabled={uploadingFile === 'gpsr_declarations_of_conformity'}
                    />
                    {uploadingFile === 'gpsr_declarations_of_conformity' && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    )}
                  </div>
                  {product.gpsr_declarations_of_conformity && (
                    <p className="text-sm text-muted-foreground">
                      Current file: {product.gpsr_declarations_of_conformity}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gpsr_certificates">Certificates</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      id="gpsr_certificates"
                      onChange={(e) => handleFileUpload(e, 'gpsr_certificates')}
                      disabled={uploadingFile === 'gpsr_certificates'}
                    />
                    {uploadingFile === 'gpsr_certificates' && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    )}
                  </div>
                  {product.gpsr_certificates && (
                    <p className="text-sm text-muted-foreground">
                      Current file: {product.gpsr_certificates}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Moderation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gpsr_moderation_status">Moderation Status</Label>
                  <Select name="gpsr_moderation_status" defaultValue={product.gpsr_moderation_status || 'PENDING'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gpsr_moderation_comment">Moderation Comment</Label>
                  <Textarea
                    id="gpsr_moderation_comment"
                    name="gpsr_moderation_comment"
                    defaultValue={product.gpsr_moderation_comment}
                    placeholder="Enter moderation comments"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gpsr_last_submission_date">Last Submission Date</Label>
                    <Input
                      id="gpsr_last_submission_date"
                      name="gpsr_last_submission_date"
                      type="date"
                      defaultValue={product.gpsr_last_submission_date}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gpsr_last_moderation_date">Last Moderation Date</Label>
                    <Input
                      id="gpsr_last_moderation_date"
                      name="gpsr_last_moderation_date"
                      type="date"
                      defaultValue={product.gpsr_last_moderation_date}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gpsr_submitted_by_supplier_user">Submitted by Supplier User</Label>
                  <Input
                    id="gpsr_submitted_by_supplier_user"
                    name="gpsr_submitted_by_supplier_user"
                    defaultValue={product.gpsr_submitted_by_supplier_user}
                    placeholder="Enter supplier user ID"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => navigate('/products')}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : id ? 'Update Product' : 'Create Product'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}