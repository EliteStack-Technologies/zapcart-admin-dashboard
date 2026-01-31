import { useState, useEffect } from 'react';
import { TrendingDown, Package, Search } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { addStockOut, getStockOutHistory, StockOutEntry } from '@/services/inventory';
import { getProduct } from '@/services/product';

interface Product {
  _id: string;
  title: string;
  stock_count: number;
}

const StockOut = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stockHistory, setStockHistory] = useState<StockOutEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  
  const { toast } = useToast();

  useEffect(() => {
    fetchStockHistory();
    fetchProducts();
  }, []);

  const fetchStockHistory = async () => {
    try {
      const response = await getStockOutHistory();
      // Handle both direct array and object with data property
      const data = Array.isArray(response) ? response : ((response as any)?.data || []);
      setStockHistory(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch stock history',
        variant: 'destructive',
      });
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await getProduct(); // Fetch first 1000 products
      setProducts(response.products || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch products',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct || !quantity || !reason) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await addStockOut({
        product_id: selectedProduct,
        quantity: parseInt(quantity),
        reason,
      });

      toast({
        title: 'Success',
        description: 'Stock removal recorded successfully',
      });

      // Reset form
      setSelectedProduct('');
      setQuantity('');
      setReason('');
      setIsModalOpen(false);
      
      // Refresh history
      fetchStockHistory();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to record stock removal',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = stockHistory.filter((entry) =>
    entry.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Stock Out</h1>
            <p className="text-sm text-gray-500">Record outgoing inventory and sales.</p>
          </div>
        </div>
        {/* Stock Out History */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-gray-700" />
              <h2 className="text-lg font-semibold">Stock Out History</h2>
            </div>
            <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Record Stock Removal
          </Button>
            </div>
            <p className="text-sm text-gray-600 mb-4">Recent Stock Movements</p>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by product or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SI NO</TableHead>
                  <TableHead>DATE</TableHead>
                  <TableHead>PRODUCT</TableHead>
                  <TableHead>TYPE</TableHead>
                  <TableHead>QUANTITY</TableHead>
                  <TableHead>REASON</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No stock removals found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHistory.map((entry, index) => (
                    <TableRow key={entry._id}>
                      <TableCell className="text-sm text-gray-600">
                        {index + 1}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(entry.date)}
                      </TableCell>
                      <TableCell className="font-medium text-blue-600">
                        {entry.product_name}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          <TrendingDown className="w-3 h-3" />
                          OUT
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold">{entry.quantity}</TableCell>
                      <TableCell className="text-sm text-gray-600">{entry.reason}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Add Stock Out Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <DialogTitle className="text-xl">Stock Out</DialogTitle>
            </div>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="product">Select Product</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="-- Choose Product --" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product._id} value={product._id}>
                      {product.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="Enter quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                type="text"
                placeholder="e.g. Sales Order"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {loading ? 'Recording...' : 'Confirm Removal'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default StockOut;
