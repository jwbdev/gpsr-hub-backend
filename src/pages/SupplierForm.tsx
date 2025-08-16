import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { suppliersService, Supplier } from '@/services/suppliers';
import { Building2, ArrowLeft } from 'lucide-react';

const supplierSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  contact_person: z.string().max(100, "Contact person must be less than 100 characters").optional(),
  email: z.string().email("Must be a valid email").optional().or(z.literal("")),
  phone: z.string().max(20, "Phone must be less than 20 characters").optional(),
  address: z.string().max(500, "Address must be less than 500 characters").optional(),
  notes: z.string().max(1000, "Notes must be less than 1000 characters").optional(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

export default function SupplierForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (id) {
      loadSupplier();
    }
  }, [id]);

  const loadSupplier = async () => {
    if (!id) return;
    
    try {
      const supplier = await suppliersService.getSupplier(id);
      form.reset({
        name: supplier.name,
        contact_person: supplier.contact_person || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        notes: supplier.notes || '',
      });
    } catch (error) {
      console.error('Error loading supplier:', error);
      toast({
        title: "Error",
        description: "Failed to load supplier",
        variant: "destructive",
      });
      navigate('/suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: SupplierFormData) => {
    setSaving(true);
    try {
      // Convert empty strings to undefined for optional fields
      const supplierData = {
        name: data.name,
        contact_person: data.contact_person || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
        notes: data.notes || undefined,
      };

      if (id) {
        await suppliersService.updateSupplier(id, supplierData);
        toast({
          title: "Success",
          description: "Supplier updated successfully",
        });
      } else {
        await suppliersService.createSupplier(supplierData);
        toast({
          title: "Success",
          description: "Supplier created successfully",
        });
      }
      navigate('/suppliers');
    } catch (error) {
      console.error('Error saving supplier:', error);
      toast({
        title: "Error",
        description: `Failed to ${id ? 'update' : 'create'} supplier`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading supplier...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/suppliers')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Suppliers
        </Button>
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">
              {id ? 'Edit Supplier' : 'Add New Supplier'}
            </h1>
            <p className="text-muted-foreground">
              {id ? 'Update supplier information' : 'Add a new supplier to your database'}
            </p>
          </div>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Supplier Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter company name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact_person"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter contact person name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter company address" 
                        className="min-h-[80px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter any additional notes about this supplier" 
                        className="min-h-[100px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/suppliers')}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : (id ? 'Update Supplier' : 'Create Supplier')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}