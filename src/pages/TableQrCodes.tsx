import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  QrCode,
  Grid3x3,
  CheckCircle2,
  Clock,
  Printer,
  RefreshCw,
  Copy,
  Archive,
  ArchiveRestore,
  MoreVertical,
  LayoutGrid,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AddTableDialog from "@/components/AddTableDialog";
import BulkCreateTablesDialog from "@/components/BulkCreateTablesDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  getTables,
  deleteTable,
  toggleTableStatus,
  mintTableQr,
  mintAllTablesQr,
  RestaurantTable,
  TableStats,
} from "@/services/tables";

const TableQrCodes = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [stats, setStats] = useState<TableStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<RestaurantTable | null>(null);

  const [mintingId, setMintingId] = useState<string | null>(null);
  const [mintingAll, setMintingAll] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getTables();
      setTables(data.tables || []);
      setStats(data.stats || null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load tables",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(
    () =>
      tables.filter(
        (t) =>
          t.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.label || "").toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [tables, searchQuery]
  );

  const printable = useMemo(
    () => tables.filter((t) => t.status === "active" && t.qr_png_url),
    [tables]
  );

  const handleEdit = (t: RestaurantTable) => {
    setSelected(t);
    setAddOpen(true);
  };

  const handleDelete = async () => {
    if (!selected?._id) return;
    setDeleting(true);
    try {
      await deleteTable(selected._id);
      toast({ title: "Table deleted", description: `Table ${selected.number} was removed.` });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete table",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
      setSelected(null);
    }
  };

  const handleToggle = async (t: RestaurantTable) => {
    try {
      await toggleTableStatus(t._id);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleMint = async (t: RestaurantTable) => {
    setMintingId(t._id);
    try {
      await mintTableQr(t._id);
      toast({ title: "QR generated", description: `Table ${t.number} QR is ready.` });
      fetchData();
    } catch (error: any) {
      // Mint failures (not-configured / no_channel / rate_limited) are surfaced
      // as the server's message — not treated as a hard CRUD failure.
      toast({
        title: "Couldn't generate QR",
        description: error.response?.data?.message || "QR service is unavailable right now.",
        variant: "destructive",
      });
    } finally {
      setMintingId(null);
    }
  };

  const handleMintAll = async () => {
    setMintingAll(true);
    try {
      const res = await mintAllTablesQr();
      toast({ title: "QR codes generated", description: res?.message || "Done." });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Couldn't generate QR codes",
        description: error.response?.data?.message || "QR service is unavailable right now.",
        variant: "destructive",
      });
    } finally {
      setMintingAll(false);
    }
  };

  const copyLink = async (link?: string | null) => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      toast({ title: "Link copied", description: "WhatsApp link copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Could not copy the link.", variant: "destructive" });
    }
  };

  const handlePrint = () => window.print();

  const businessName = user?.business_name || "Scan to Order";

  return (
    <DashboardLayout>
      {/* ===================== SCREEN VIEW ===================== */}
      <div className="space-y-6 container max-w-7xl mx-auto py-6 print:hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <QrCode className="w-8 h-8 text-primary" /> Table QR Codes
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your dine-in tables and their scan-to-order WhatsApp QR codes.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button variant="outline" className="gap-2" onClick={() => setBulkOpen(true)}>
              <Grid3x3 className="w-4 h-4" /> Set Up Tables
            </Button>
            <Button
              className="gap-2"
              onClick={() => {
                setSelected(null);
                setAddOpen(true);
              }}
            >
              <Plus className="w-4 h-4" /> Add Table
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tables</CardTitle>
              <LayoutGrid className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Across your restaurant</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.active ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">{stats?.archived ?? 0} archived</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">QR Generated</CardTitle>
              <QrCode className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats?.qr_generated ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Ready to print</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">QR Pending</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats?.qr_pending ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting generation</p>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by number or label..."
              className="pl-10 h-10 bg-muted/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={handleMintAll} disabled={mintingAll}>
              <RefreshCw className={`w-4 h-4 ${mintingAll ? "animate-spin" : ""}`} />
              {mintingAll ? "Generating..." : "Generate All QR"}
            </Button>
            <Button
              className="gap-2"
              onClick={handlePrint}
              disabled={printable.length === 0}
              title={printable.length === 0 ? "No generated QR codes to print yet" : "Print QR sheet"}
            >
              <Printer className="w-4 h-4" /> Print Sheet ({printable.length})
            </Button>
          </div>
        </div>

        {/* Table list */}
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center min-h-[320px]">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 py-20 text-center">
                <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mb-6">
                  <QrCode className="w-10 h-10 text-muted-foreground opacity-50" />
                </div>
                <h3 className="text-xl font-bold mb-2">No tables yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  {searchQuery
                    ? "No tables match your search."
                    : "Declare your dine-in tables to generate scan-to-order QR codes for signage."}
                </p>
                {searchQuery ? (
                  <Button variant="outline" onClick={() => setSearchQuery("")}>
                    Clear search
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" className="gap-2" onClick={() => setBulkOpen(true)}>
                      <Grid3x3 className="w-4 h-4" /> Set Up Tables
                    </Button>
                    <Button className="gap-2" onClick={() => setAddOpen(true)}>
                      <Plus className="w-4 h-4" /> Add First Table
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-[90px] font-semibold">QR</TableHead>
                    <TableHead className="font-semibold">Table</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">WhatsApp Link</TableHead>
                    <TableHead className="font-semibold text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((t) => (
                    <TableRow key={t._id} className="hover:bg-muted/10 transition-colors">
                      <TableCell>
                        {t.qr_png_url ? (
                          <img
                            src={t.qr_png_url}
                            alt={`QR for table ${t.number}`}
                            className="w-12 h-12 rounded border border-border/60 bg-white object-contain"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded border border-dashed border-border flex items-center justify-center bg-muted/20">
                            <QrCode className="w-5 h-5 text-muted-foreground/50" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">Table {t.number}</span>
                          {t.label && (
                            <span className="text-xs text-muted-foreground">{t.label}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={t.status === "active" ? "default" : "secondary"}
                          className="uppercase text-[10px] tracking-wider"
                        >
                          {t.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {t.wa_link ? (
                          <button
                            onClick={() => copyLink(t.wa_link)}
                            className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors max-w-[260px]"
                          >
                            <span className="truncate font-mono text-xs">{t.wa_link}</span>
                            <Copy className="w-3.5 h-3.5 shrink-0 opacity-60 group-hover:opacity-100" />
                          </button>
                        ) : (
                          <span className="text-xs italic text-muted-foreground/70">
                            Not generated yet
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1">
                          {!t.qr_png_url && (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-8 gap-1.5"
                              onClick={() => handleMint(t)}
                              disabled={mintingId === t._id}
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              {mintingId === t._id ? "Generating..." : "Generate QR"}
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem onClick={() => handleEdit(t)}>
                                <Edit className="w-4 h-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              {t.qr_png_url && (
                                <DropdownMenuItem
                                  onClick={() => handleMint(t)}
                                  disabled={mintingId === t._id}
                                >
                                  <RefreshCw className="w-4 h-4 mr-2" /> Regenerate QR
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleToggle(t)}>
                                {t.status === "active" ? (
                                  <>
                                    <Archive className="w-4 h-4 mr-2" /> Archive
                                  </>
                                ) : (
                                  <>
                                    <ArchiveRestore className="w-4 h-4 mr-2" /> Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  setSelected(t);
                                  setDeleteOpen(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ===================== PRINT SHEET ===================== */}
      {/* Hidden on screen; rendered only by window.print(). One card per active,
          QR-generated table — a clean fold-and-stand signage grid. */}
      <div className="hidden print:block">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold tracking-tight">{businessName}</h2>
          <p className="text-sm text-gray-500">Scan to order from your table</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {printable.map((t) => (
            <div
              key={t._id}
              className="flex flex-col items-center justify-between border border-gray-300 rounded-xl p-4 break-inside-avoid"
              style={{ pageBreakInside: "avoid" }}
            >
              <div className="text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400">{businessName}</p>
                <p className="text-3xl font-black mt-1">Table {t.number}</p>
                {t.label && <p className="text-sm text-gray-500">{t.label}</p>}
              </div>
              <img
                src={t.qr_png_url || ""}
                alt={`QR for table ${t.number}`}
                className="w-40 h-40 my-3 object-contain"
              />
              <p className="text-sm font-semibold text-gray-700">Scan with your camera to order</p>
            </div>
          ))}
        </div>
      </div>

      {/* Dialogs */}
      <AddTableDialog
        open={addOpen}
        onOpenChange={(o) => {
          setAddOpen(o);
          if (!o) setSelected(null);
        }}
        editingTable={selected}
        onSuccess={fetchData}
      />
      <BulkCreateTablesDialog open={bulkOpen} onOpenChange={setBulkOpen} onSuccess={fetchData} />
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Table"
        description={`Are you sure you want to delete Table ${selected?.number ?? ""}? This cannot be undone.`}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </DashboardLayout>
  );
};

export default TableQrCodes;
