import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { AlertCircle, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="mx-auto w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-destructive" />
        </div>
        <div>
          <h1 className="text-4xl font-bold mb-2">404</h1>
          <p className="text-lg text-muted-foreground">Página no encontrada</p>
        </div>
        <Button asChild data-testid="button-home">
          <Link href="/">
            <Home className="h-4 w-4 mr-2" />
            Volver al inicio
          </Link>
        </Button>
      </div>
    </div>
  );
}
