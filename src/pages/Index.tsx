import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Package, FolderTree, Shield, Upload } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: <Shield className="h-8 w-8 mb-4 text-primary" />,
      title: "GPSR Compliance",
      description: "Manage product safety requirements and compliance documentation according to GPSR regulations."
    },
    {
      icon: <FolderTree className="h-8 w-8 mb-4 text-primary" />,
      title: "Category Management",
      description: "Organize your products with hierarchical categories for better structure and navigation."
    },
    {
      icon: <Package className="h-8 w-8 mb-4 text-primary" />,
      title: "Product Management",
      description: "Create, edit, and manage your products with comprehensive safety information and documentation."
    },
    {
      icon: <Upload className="h-8 w-8 mb-4 text-primary" />,
      title: "File Management",
      description: "Upload and manage product manuals, certificates, and compliance documentation securely."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">GPSR Hub</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Your comprehensive solution for GPSR compliance and product management
          </p>
          
          {!user ? (
            <Link to="/auth">
              <Button size="lg">
                Get Started
              </Button>
            </Link>
          ) : (
            <div className="flex justify-center space-x-4">
              <Link to="/products">
                <Button size="lg">
                  <Package className="h-4 w-4 mr-2" />
                  Manage Products
                </Button>
              </Link>
              <Link to="/categories">
                <Button variant="outline" size="lg">
                  <FolderTree className="h-4 w-4 mr-2" />
                  Manage Categories
                </Button>
              </Link>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex justify-center">
                  {feature.icon}
                </div>
                <CardTitle className="text-center">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {user && (
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-6">Quick Actions</h2>
            <div className="flex justify-center space-x-4">
              <Link to="/products/new">
                <Button>
                  <Package className="h-4 w-4 mr-2" />
                  Add New Product
                </Button>
              </Link>
              <Link to="/categories">
                <Button variant="outline">
                  <FolderTree className="h-4 w-4 mr-2" />
                  Create Category
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
