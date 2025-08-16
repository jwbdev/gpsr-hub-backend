import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { suppliersService, Supplier } from '@/services/suppliers';
import { Plus, Building2, Edit, Trash2, Mail, Phone, MapPin, User } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const data = await suppliersService.getSuppliers();
      setSuppliers(data);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      toast({
        title: "Error",
        description: "Failed to load suppliers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await suppliersService.deleteSupplier(id);
      setSuppliers(suppliers.filter(s => s.id !== id));
      toast({
        title: "Success",
        description: "Supplier deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast({
        title: "Error",
        description: "Failed to delete supplier",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading suppliers...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Suppliers</h1>
          <p className="text-muted-foreground mt-2">
            Manage your supplier information and contacts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''}
          </Badge>
          <Link to="/suppliers/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </Link>
        </div>
      </div>

      {suppliers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No suppliers yet</h3>
            <p className="text-muted-foreground mb-4">
              Add suppliers to track your business relationships and product submissions.
            </p>
            <Link to="/suppliers/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add First Supplier
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{supplier.name}</div>
                          {supplier.address && (
                            <div className="text-sm text-muted-foreground flex items-center mt-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              {supplier.address}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {supplier.contact_person ? (
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-muted-foreground" />
                          {supplier.contact_person}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {supplier.email && (
                          <div className="text-sm flex items-center">
                            <Mail className="h-3 w-3 mr-1 text-muted-foreground" />
                            {supplier.email}
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="text-sm flex items-center">
                            <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
                            {supplier.phone}
                          </div>
                        )}
                        {!supplier.email && !supplier.phone && (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(supplier.created_at)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Link to={`/suppliers/${supplier.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{supplier.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(supplier.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}