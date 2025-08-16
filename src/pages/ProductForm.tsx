import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { productsService, Product } from '@/services/products';
import { categoriesService, Category } from '@/services/categories';
import { useAuth } from '@/hooks/useAuth';
import { Upload, X, AlertCircle } from 'lucide-react';

// Validation schema
const productSchema = z.object({
  gpsr_identification_details: z.string().min(1, "Product identification is required").max(500, "Product identification must be less than 500 characters"),
  category_id: z.string().min(1, "Category is required"),
  gpsr_warning_text: z.string().max(1000, "Warning text must be less than 1000 characters").optional(),
  gpsr_additional_safety_info: z.string().max(1000, "Additional safety info must be less than 1000 characters").optional(),
  gpsr_statement_of_compliance: z.boolean().optional(),
  gpsr_online_instructions_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  gpsr_moderation_status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  gpsr_moderation_comment: z.string().max(500, "Moderation comment must be less than 500 characters").optional(),
  gpsr_last_submission_date: z.string().optional(),
  gpsr_last_moderation_date: z.string().optional(),
  gpsr_submitted_by_supplier_user: z.string().max(100, "Supplier user must be less than 100 characters").optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

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
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      gpsr_identification_details: "",
      category_id: "",
      gpsr_warning_text: "",
      gpsr_additional_safety_info: "",
      gpsr_statement_of_compliance: false,
      gpsr_online_instructions_url: "",
      gpsr_moderation_status: "PENDING",
      gpsr_moderation_comment: "",
      gpsr_last_submission_date: "",
      gpsr_last_moderation_date: "",
      gpsr_submitted_by_supplier_user: "",
    }
  });

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
      
      // Reset form with loaded data
      form.reset({
        gpsr_identification_details: data.gpsr_identification_details || "",
        category_id: data.category_id || "",
        gpsr_warning_text: data.gpsr_warning_text || "",
        gpsr_additional_safety_info: data.gpsr_additional_safety_info || "",
        gpsr_statement_of_compliance: data.gpsr_statement_of_compliance || false,
        gpsr_online_instructions_url: data.gpsr_online_instructions_url || "",
        gpsr_moderation_status: data.gpsr_moderation_status as "PENDING" | "APPROVED" | "REJECTED" || "PENDING",
        gpsr_moderation_comment: data.gpsr_moderation_comment || "",
        gpsr_last_submission_date: data.gpsr_last_submission_date || "",
        gpsr_last_moderation_date: data.gpsr_last_moderation_date || "",
        gpsr_submitted_by_supplier_user: data.gpsr_submitted_by_supplier_user || "",
      });
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

  const validateWarningPhrases = () => {
    const errors: string[] = [];
    warningPhrases.forEach((phrase, index) => {
      if (phrase.trim() && phrase.length > 200) {
        errors.push(`Warning phrase ${index + 1}: Must be less than 200 characters`);
      }
    });
    return errors;
  };

  const validatePictograms = () => {
    const errors: string[] = [];
    pictograms.forEach((pictogram, index) => {
      if (pictogram.trim()) {
        try {
          new URL(pictogram);
        } catch {
          errors.push(`Pictogram ${index + 1}: Must be a valid URL`);
        }
      }
    });
    return errors;
  };

  const handleSubmit = async (data: ProductFormData) => {
    setSaving(true);
    setValidationErrors([]);

    // Additional validation for dynamic arrays
    const warningErrors = validateWarningPhrases();
    const pictogramErrors = validatePictograms();
    const allErrors = [...warningErrors, ...pictogramErrors];

    if (allErrors.length > 0) {
      setValidationErrors(allErrors);
      setSaving(false);
      return;
    }

    const productData = {
      ...product,
      ...data,
      gpsr_warning_phrases: warningPhrases.filter(p => p.trim()),
      gpsr_pictograms: pictograms.filter(p => p.trim()),
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
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to save product";
      toast({
        title: "Error",
        description: errorMessage,
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="space-y-6">
              {validationErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <div className="font-medium">Please fix the following errors:</div>
                      <ul className="list-disc list-inside space-y-1">
                        {validationErrors.map((error, index) => (
                          <li key={index} className="text-sm">{error}</li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="gpsr_identification_details"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Identification *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter product identification details"
                            {...field}
                            className={form.formState.errors.gpsr_identification_details ? "border-destructive" : ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className={form.formState.errors.category_id ? "border-destructive" : ""}>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map(category => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                          placeholder="Enter warning phrase (max 200 characters)"
                          className={phrase.length > 200 ? "border-destructive" : ""}
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

                  <FormField
                    control={form.control}
                    name="gpsr_warning_text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Warning Text</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter detailed warning text"
                            {...field}
                            className={form.formState.errors.gpsr_warning_text ? "border-destructive" : ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <Label>Pictogram URLs</Label>
                    {pictograms.map((pictogram, index) => {
                      const isValidUrl = !pictogram.trim() || (() => {
                        try {
                          new URL(pictogram);
                          return true;
                        } catch {
                          return false;
                        }
                      })();

                      return (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={pictogram}
                            onChange={(e) => updatePictogram(index, e.target.value)}
                            placeholder="Enter pictogram URL (https://example.com/image.png)"
                            className={!isValidUrl ? "border-destructive" : ""}
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
                      );
                    })}
                    <Button type="button" variant="outline" onClick={addPictogram}>
                      Add Pictogram URL
                    </Button>
                  </div>

                  <FormField
                    control={form.control}
                    name="gpsr_additional_safety_info"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Safety Information</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter additional safety information"
                            {...field}
                            className={form.formState.errors.gpsr_additional_safety_info ? "border-destructive" : ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gpsr_statement_of_compliance"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Statement of Compliance</FormLabel>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Documentation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="gpsr_online_instructions_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Online Instructions URL</FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder="https://example.com/instructions"
                            {...field}
                            className={form.formState.errors.gpsr_online_instructions_url ? "border-destructive" : ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                  <FormField
                    control={form.control}
                    name="gpsr_moderation_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Moderation Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="APPROVED">Approved</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gpsr_moderation_comment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Moderation Comment</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter moderation comments"
                            {...field}
                            className={form.formState.errors.gpsr_moderation_comment ? "border-destructive" : ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="gpsr_last_submission_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Submission Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gpsr_last_moderation_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Moderation Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="gpsr_submitted_by_supplier_user"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Submitted by Supplier User</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter supplier user ID"
                            {...field}
                            className={form.formState.errors.gpsr_submitted_by_supplier_user ? "border-destructive" : ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
        </Form>
      </div>
    </div>
  );
}