import { useState, useEffect } from 'react';
import { AlertTriangle, Search } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { getLowStock, LowStockItem } from '@/services/inventory';

const LowStock = () => {
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchLowStock();
  }, []);

  const fetchLowStock = async () => {
    setLoading(true);
    try {
      const response = await getLowStock();
      // Handle both direct array and object with data property
      const data = Array.isArray(response) ? response : ((response as any)?.data || []);
      setLowStockItems(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch low stock items',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = lowStockItems.filter((item) =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockStatus = (stockCount: number) => {
    if (stockCount === 0) {
      return { label: 'Out of Stock', className: 'bg-red-100 text-red-700' };
    } else if (stockCount <= 10) {
      return { label: 'Low Stock', className: 'bg-yellow-100 text-yellow-700' };
    }
    return { label: 'In Stock', className: 'bg-green-100 text-green-700' };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Low Stock Alerts</h1>
            <p className="text-sm text-gray-500">Products that are running low and need restocking</p>
          </div>
        </div>
   {/* Summary Card */}
        {!loading && lowStockItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-700 mt-1">
                    {lowStockItems.filter(item => item.stock_count === 0).length}
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 font-medium">Low Stock</p>
                  <p className="text-2xl font-bold text-yellow-700 mt-1">
                    {lowStockItems.filter(item => item.stock_count > 0 && item.stock_count <= 10).length}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Items</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">
                    {lowStockItems.length}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Low Stock Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search low stock items..."
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
                  <TableHead>PRODUCT NAME</TableHead>
                  <TableHead>CURRENT STOCK</TableHead>
                  <TableHead>STATUS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      {searchTerm ? 'No matching items found' : 'No low stock items'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => {
                    const status = getStockStatus(item.stock_count);
                    return (
                      <TableRow key={item._id}>
                        <TableCell className="font-medium text-blue-600">
                          {item.title}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-orange-600">
                            {item.stock_count}
                          </span>
                          <span className="text-xs text-gray-500 ml-1">units left</span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${status.className}`}>
                            {status.label}
                          </span>
                        </TableCell>
            
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

     
      </div>
    </DashboardLayout>
  );
};

export default LowStock;
